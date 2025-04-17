import os
import pandas as pd
import uuid
import json
import re
import logging
import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

# Configure logging
logger = logging.getLogger(__name__)

# Gemini API key
GEMINI_API_KEY = "AIzaSyAaCLSYx0cwiGp5Eq4N3FkylX8H6dXCAzo"
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"

@csrf_exempt
def merge_csv(request):
    """
    View for merging multiple CSV files with the same structure.
    Features:
    - Validates that all CSV files have the same structure
    - Removes duplicate rows
    - Cleans data (handles missing values)
    - Uses Gemini API for data validation and transformation suggestions
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method is allowed'}, status=405)

    # Check if files were provided
    if 'csv_files' not in request.FILES:
        return JsonResponse({'error': 'No files were provided'}, status=400)

    csv_files = request.FILES.getlist('csv_files')

    # Check if we have at least 2 files
    if len(csv_files) < 2:
        return JsonResponse({'error': 'At least 2 CSV files are required'}, status=400)

    try:
        # Process each file and store in a list
        dataframes = []
        columns = None

        for csv_file in csv_files:
            try:
                # Validate file extension
                if not csv_file.name.lower().endswith('.csv'):
                    return JsonResponse({
                        'error': f"Invalid file format: {csv_file.name}",
                        'details': "Only CSV files are allowed"
                    }, status=400)

                # Read the CSV file with error handling for different encodings
                try:
                    df = pd.read_csv(csv_file)
                except UnicodeDecodeError:
                    # Try different encodings if UTF-8 fails
                    for encoding in ['latin1', 'ISO-8859-1', 'cp1252']:
                        try:
                            csv_file.seek(0)  # Reset file pointer
                            df = pd.read_csv(csv_file, encoding=encoding)
                            break
                        except:
                            continue
                    else:
                        return JsonResponse({
                            'error': f"Encoding issue with file: {csv_file.name}",
                            'details': "Could not determine the file encoding"
                        }, status=400)

                # Check if dataframe is empty
                if df.empty:
                    return JsonResponse({
                        'error': f"Empty file: {csv_file.name}",
                        'details': "The CSV file does not contain any data"
                    }, status=400)

                # Check if columns are consistent across files
                if columns is None:
                    columns = set(df.columns)
                elif set(df.columns) != columns:
                    return JsonResponse({
                        'error': 'CSV files have different structures',
                        'details': f"File '{csv_file.name}' has different columns than previous files"
                    }, status=400)

                dataframes.append(df)
            except pd.errors.ParserError as e:
                return JsonResponse({
                    'error': f"Error parsing file: {csv_file.name}",
                    'details': f"CSV parsing error: {str(e)}"
                }, status=400)
            except Exception as e:
                return JsonResponse({
                    'error': f"Error reading file: {csv_file.name}",
                    'details': str(e)
                }, status=400)

        # Check if any dataframes were successfully loaded
        if not dataframes:
            return JsonResponse({
                'error': 'Failed to process any files',
                'details': 'None of the uploaded files could be processed as CSV'
            }, status=400)

        # Combine all dataframes
        combined_df = pd.concat(dataframes, ignore_index=True)

        # Count rows before cleaning
        total_rows = len(combined_df)

        # Convert DataFrame to dictionary with native Python types (with error handling)
        try:
            # Convert all columns to string to ensure JSON serialization
            data_sample = combined_df.head(10).astype(str).to_dict(orient="records")
            gemini_insights = get_gemini_insights(data_sample, list(columns))
        except Exception as e:
            logger.warning(f"Error getting Gemini insights: {str(e)}")
            gemini_insights = {"analysis": "Failed to get insights", "transformations": []}

        # Clean data - handle missing values
        try:
            cleaning_stats = clean_data(combined_df, gemini_insights)
        except Exception as e:
            logger.warning(f"Error during data cleaning: {str(e)}")
            cleaning_stats = {'missing_values': 0, 'cleaned_columns': []}

        # Remove duplicates
        combined_df_no_duplicates = combined_df.drop_duplicates()
        duplicates_removed = len(combined_df) - len(combined_df_no_duplicates)

        # Generate a unique filename for the merged file
        output_filename = f"merged_csv_{uuid.uuid4().hex}.csv"

        # Define the directory path
        directory_path = 'csv_outputs'
        file_path = os.path.join(directory_path, output_filename)

        # Ensure the directory exists
        try:
            os.makedirs(directory_path, exist_ok=True)
        except Exception as e:
            logger.error(f"Failed to create directory {directory_path}: {str(e)}")
            # Fall back to settings.MEDIA_ROOT
            directory_path = getattr(settings, 'MEDIA_ROOT', 'media')
            os.makedirs(directory_path, exist_ok=True)
            file_path = os.path.join(directory_path, output_filename)

        # Save the file
        try:
            # Ensure the file path is relative to MEDIA_ROOT if using default_storage
            relative_path = os.path.join('csv_outputs', output_filename)

            # Convert to CSV string first to avoid file handling issues
            csv_content = combined_df_no_duplicates.to_csv(index=False)

            # Save using default_storage
            default_storage.save(relative_path, ContentFile(csv_content))

            # Generate download URL (without duplicate slashes)
            media_url = getattr(settings, 'MEDIA_URL', '/media/').rstrip('/')
            download_url = f"{media_url}/{relative_path}"

        except Exception as e:
            logger.error(f"Error saving CSV file: {str(e)}")

            # Fallback: save to filesystem directly
            try:
                combined_df_no_duplicates.to_csv(file_path, index=False)
                download_url = f"/media/csv_outputs/{output_filename}"
            except Exception as inner_e:
                logger.error(f"Fallback save also failed: {str(inner_e)}")
                return JsonResponse({
                    'error': 'Failed to save the merged file',
                    'details': str(e)
                }, status=500)

        # Preview of the merged DataFrame
        preview_data = combined_df_no_duplicates.head(10).astype(str).to_dict(orient="records")

        # Return success response
        return JsonResponse({
            'success': True,
            'rows_processed': total_rows,
            'duplicates_removed': duplicates_removed,
            'output_filename': output_filename,
            'download_url': download_url,
            'cleaned_data': cleaning_stats,
            'preview': preview_data  # Include preview in the response
        })

    except MemoryError:
        logger.critical("Memory error while processing CSV files")
        return JsonResponse({
            'error': 'Out of memory',
            'details': 'The CSV files are too large to process with available memory'
        }, status=500)
    except Exception as e:
        # Log the error for further investigation
        logger.exception(f"Unexpected error processing request: {str(e)}")
        return JsonResponse({
            'error': 'An error occurred during processing',
            'details': str(e)
        }, status=500)


def clean_data(df, gemini_insights=None):
    """
    Clean the dataframe by handling missing values and applying transformations
    Returns stats about cleaning operations
    """
    # Initial stats
    missing_values_count = df.isna().sum().sum()
    cleaned_columns = []

    # Safety check
    if df is None or df.empty:
        return {'missing_values': 0, 'cleaned_columns': []}

    # Apply insights from Gemini API if available
    if gemini_insights and 'transformations' in gemini_insights:
        for transform in gemini_insights['transformations']:
            column = transform.get('column')
            action = transform.get('action')

            if column and action and column in df.columns:
                try:
                    if action == 'fill_mean' and pd.api.types.is_numeric_dtype(df[column]):
                        if not df[column].empty and not df[column].isna().all():
                            df[column].fillna(df[column].mean(), inplace=True)
                            cleaned_columns.append(column)
                    elif action == 'fill_median' and pd.api.types.is_numeric_dtype(df[column]):
                        if not df[column].empty and not df[column].isna().all():
                            df[column].fillna(df[column].median(), inplace=True)
                            cleaned_columns.append(column)
                    elif action == 'fill_mode':
                        if not df[column].empty and not df[column].mode().empty:
                            df[column].fillna(df[column].mode()[0], inplace=True)
                            cleaned_columns.append(column)
                        else:
                            df[column].fillna("", inplace=True)
                            cleaned_columns.append(column)
                    elif action == 'fill_zero' and pd.api.types.is_numeric_dtype(df[column]):
                        df[column].fillna(0, inplace=True)
                        cleaned_columns.append(column)
                    elif action == 'fill_empty':
                        df[column].fillna("", inplace=True)
                        cleaned_columns.append(column)
                except Exception as e:
                    logger.warning(f"Error applying transformation to column {column}: {str(e)}")
                    continue

    # Standard cleaning for remaining missing values
    try:
        # For numeric columns, fill with mean
        for column in df.select_dtypes(include=['number']).columns:
            if df[column].isna().any() and column not in cleaned_columns:
                if not df[column].empty and not df[column].isna().all():
                    df[column].fillna(df[column].mean(), inplace=True)
                else:
                    df[column].fillna(0, inplace=True)
                cleaned_columns.append(column)
    except Exception as e:
        logger.warning(f"Error cleaning numeric columns: {str(e)}")

    try:
        # For categorical/object columns, fill with mode or empty string
        for column in df.select_dtypes(exclude=['number']).columns:
            if df[column].isna().any() and column not in cleaned_columns:
                if not df[column].empty and not df[column].mode().empty:
                    df[column].fillna(df[column].mode()[0], inplace=True)
                else:
                    df[column].fillna("", inplace=True)
                cleaned_columns.append(column)
    except Exception as e:
        logger.warning(f"Error cleaning non-numeric columns: {str(e)}")

    # Return statistics about the cleaning
    return {
        'missing_values': missing_values_count,
        'cleaned_columns': cleaned_columns
    }

def get_gemini_insights(data_sample, columns):
    """
    Use Gemini API to get insights about the data and suggestions for cleaning
    """
    try:
        headers = {
            "Content-Type": "application/json",
        }

        # Limit the size of the data sample to avoid request limits
        max_sample_size = 10
        if len(data_sample) > max_sample_size:
            data_sample = data_sample[:max_sample_size]

        # Try to sanitize the data for JSON serialization
        safe_data = []
        for row in data_sample:
            safe_row = {}
            for k, v in row.items():
                if pd.isna(v):
                    safe_row[k] = None
                elif isinstance(v, (str, int, float, bool, type(None))):
                    safe_row[k] = v
                else:
                    safe_row[k] = str(v)
            safe_data.append(safe_row)

        prompt = f"""
        I have a CSV dataset with the following columns: {', '.join(columns)}
        Here's a sample of the data: {json.dumps(safe_data)}

        Please analyze this data and suggest:
        1. What cleaning operations should be applied to each column with missing values
        2. How to handle duplicates
        3. Any transformations that would improve data quality

        Format your response as JSON with the following structure:
        {{
            "analysis": "brief description of data issues",
            "transformations": [
                {{"column": "column_name", "action": "fill_mean|fill_median|fill_mode|fill_zero|fill_empty"}}
            ]
        }}
        Return ONLY the JSON without any explanations or markdown.
        """

        # Ensure payload size is reasonable
        if len(prompt) > 30000:  # Arbitrary limit to avoid API issues
            prompt = prompt[:30000]

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "topP": 0.8,
                "topK": 40
            }
        }

        # Add timeout to avoid hanging
        url = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"
        response = requests.post(url, headers=headers, json=payload, timeout=30)

        if response.status_code == 200:
            response_data = response.json()
            if 'candidates' in response_data and len(response_data['candidates']) > 0:
                text = response_data['candidates'][0]['content']['parts'][0]['text']
                # Find valid JSON in the response
                try:
                    # Extract JSON if it's wrapped in code blocks or has extra text
                    json_match = re.search(r'({[\s\S]*})', text)
                    if json_match:
                        json_str = json_match.group(1)
                        return json.loads(json_str)
                    return json.loads(text)
                except json.JSONDecodeError:
                    return {"analysis": "Could not parse Gemini response", "transformations": []}
        else:
            logger.warning(f"Gemini API returned status code {response.status_code}")
            return {"analysis": f"API error: {response.status_code}", "transformations": []}

    except requests.exceptions.Timeout:
        logger.warning("Gemini API request timed out")
        return {"analysis": "API request timed out", "transformations": []}
    except requests.exceptions.RequestException as e:
        logger.warning(f"Request error with Gemini API: {str(e)}")
        return {"analysis": "API request failed", "transformations": []}
    except Exception as e:
        logger.exception(f"Error using Gemini API: {str(e)}")
        return {"analysis": f"Error: {str(e)}", "transformations": []}
