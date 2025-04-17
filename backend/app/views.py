import os
import pandas as pd
import uuid
import json
import re
import io
import logging
import requests
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings

# Configure logging
logger = logging.getLogger(__name__)

# Gemini API key and URL
GEMINI_API_KEY = "AIzaSyB8gETGUcZwHqUmF1dJIm_MYbeWjWBup3M"
GEMINI_API_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
)
@csrf_exempt
def merge_csv(request):
    """
    API view for merging multiple CSV files.
    Handles file upload, parsing, merging, cleaning with Gemini API insights,
    and provides a downloadable result.
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST requests are allowed'}, status=405)

    # Check if files are provided
    if 'csv_files' not in request.FILES:
        return JsonResponse({'error': 'No files were uploaded'}, status=400)

    files = request.FILES.getlist('csv_files')

    # Ensure we have at least 2 files
    if len(files) < 2:
        return JsonResponse({'error': 'Please upload at least 2 CSV files to merge'}, status=400)

    try:
        # Extract settings from the request
        merge_type = request.POST.get('mergeType', 'inner')
        column_match = request.POST.get('columnMatch', 'auto')
        match_column = request.POST.get('matchColumn', '')
        remove_empty_rows = request.POST.get('removeEmptyRows', 'true').lower() == 'true'
        trim_whitespace = request.POST.get('trimWhitespace', 'true').lower() == 'true'
        case_insensitive = request.POST.get('caseInsensitiveMatch', 'true').lower() == 'true'

        # Read all CSV files into pandas DataFrames
        dataframes = []
        file_names = []

        for file in files:
            try:
                df = pd.read_csv(file)

                # Apply initial cleaning based on settings
                if trim_whitespace:
                    for col in df.select_dtypes(include=['object']).columns:
                        df[col] = df[col].str.strip() if isinstance(df[col], pd.Series) else df[col]

                if case_insensitive and column_match == 'specific' and match_column:
                    if match_column in df.columns and df[match_column].dtype == 'object':
                        df[match_column] = df[match_column].str.lower() if isinstance(df[match_column], pd.Series) else df[match_column]

                # Normalize 'Age' column if present
                if 'Age' in df.columns:
                    try:
                        # Convert 'Age' to numeric, coercing errors to NaN
                        df['Age'] = pd.to_numeric(df['Age'], errors='coerce')
                        # Optionally fill NaN with a default value (e.g., mean or 0)
                        if df['Age'].isna().any():
                            df['Age'] = df['Age'].fillna(df['Age'].mean() if not df['Age'].isna().all() else 0)
                        # Ensure int64 type
                        df['Age'] = df['Age'].astype('int64')
                    except Exception as e:
                        logger.warning(f"Error normalizing 'Age' in file {file.name}: {str(e)}")
                        return JsonResponse({
                            'error': f"Invalid data in 'Age' column of file {file.name}",
                            'details': str(e)
                        }, status=400)

                dataframes.append(df)
                file_names.append(file.name)
            except Exception as e:
                return JsonResponse({
                    'error': f'Error parsing file {file.name}',
                    'details': str(e)
                }, status=400)

        # Check that all DataFrames have data
        if any(df.empty for df in dataframes):
            return JsonResponse({
                'error': 'One or more CSV files are empty',
                'details': 'Please ensure all uploaded files contain data'
            }, status=400)

        # Collect a sample of data for Gemini API
        sample_data = []
        for df in dataframes:
            if not df.empty:
                sample_data.extend(df.head(3).to_dict('records'))

        # Get column metadata
        all_columns = set()
        for df in dataframes:
            all_columns.update(df.columns)

        # Get insights from Gemini API
        gemini_insights = get_gemini_insights(sample_data, list(all_columns))

        # Perform the merge operation
        if merge_type == 'concat':
            # Use pd.concat for vertical stacking
            merged_df = pd.concat(dataframes, ignore_index=True)
        else:
            # For merge operations
            if column_match == 'specific' and match_column:
                if not all(match_column in df.columns for df in dataframes):
                    return JsonResponse({
                        'error': f'Match column "{match_column}" not found in all files',
                        'details': 'Please select a column that exists in all CSV files'
                    }, status=400)

                # Start with the first DataFrame
                merged_df = dataframes[0]

                # Merge with each remaining DataFrame
                for i in range(1, len(dataframes)):
                    try:
                        merged_df = pd.merge(
                            merged_df,
                            dataframes[i],
                            on=match_column,
                            how=merge_type
                        )
                    except Exception as e:
                        logger.error(f"Error merging on column {match_column}: {str(e)}")
                        return JsonResponse({
                            'error': f'Failed to merge on column "{match_column}"',
                            'details': str(e)
                        }, status=400)
            else:
                # Auto-match based on common columns
                columns_sets = [set(df.columns) for df in dataframes]
                common_columns = set.intersection(*columns_sets)

                if not common_columns:
                    return JsonResponse({
                        'error': 'CSV files have no common columns',
                        'details': 'The uploaded files must share at least one column name for merging'
                    }, status=400)

                # Normalize data types for common columns (especially 'Age')
                for col in common_columns:
                    if col == 'Age':
                        # Already normalized above
                        continue
                    for df in dataframes:
                        try:
                            if df[col].dtype == 'object':
                                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(df[col])
                        except:
                            pass  # Skip if conversion fails

                # Start with the first DataFrame
                merged_df = dataframes[0]

                # Merge with each remaining DataFrame
                for i in range(1, len(dataframes)):
                    try:
                        merged_df = pd.merge(
                            merged_df,
                            dataframes[i],
                            on=list(common_columns),
                            how=merge_type
                        )
                    except Exception as e:
                        logger.error(f"Error merging on columns {common_columns}: {str(e)}")
                        return JsonResponse({
                            'error': f'Failed to merge on common columns',
                            'details': str(e)
                        }, status=400)

        # Clean the merged DataFrame
        cleaning_stats = clean_data(merged_df, gemini_insights)

        # Remove empty rows if requested
        if remove_empty_rows:
            initial_rows = len(merged_df)
            merged_df.dropna(how='all', inplace=True)
            cleaning_stats['empty_rows_removed'] = initial_rows - len(merged_df)

        # Remove duplicates
        total_rows = len(merged_df)
        merged_df.drop_duplicates(inplace=True)
        duplicates_removed = total_rows - len(merged_df)
        cleaning_stats['duplicates_removed'] = duplicates_removed

        # Create a unique filename
        unique_id = str(uuid.uuid4())
        output_filename = f"merged_csv_{unique_id}.csv"

        # Save to CSV buffer
        csv_buffer = io.StringIO()
        merged_df.to_csv(csv_buffer, index=False)
        csv_content = csv_buffer.getvalue()

        # Create response
        response = HttpResponse(csv_content, content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{output_filename}"'

        # Add metadata
        response['X-Processing-Stats'] = json.dumps({
            'input_files': len(files),
            'input_files_names': file_names,
            'output_rows': len(merged_df),
            'output_columns': len(merged_df.columns),
            'cleaning_stats': cleaning_stats,
            'merge_type': merge_type
        })

        return response

    except Exception as e:
        logger.exception(f"Error in merge_csv: {str(e)}")
        return JsonResponse({
            'error': 'An error occurred during processing',
            'details': str(e)
        }, status=500)

def clean_data(df, gemini_insights=None):
    """
    Clean the DataFrame by handling missing values and applying transformations
    based on Gemini API insights.
    """
    if df is None or df.empty:
        return {'missing_values': 0, 'cleaned_columns': []}

    # Initial stats
    missing_values_count = df.isna().sum().sum()
    cleaned_columns = []

    # Apply Gemini insights
    if gemini_insights and 'transformations' in gemini_insights:
        for transform in gemini_insights['transformations']:
            column = transform.get('column')
            action = transform.get('action')

            if column and action and column in df.columns:
                try:
                    missing_before = df[column].isna().sum()

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

                    missing_after = df[column].isna().sum()
                    if missing_before > missing_after:
                        logger.info(f"Cleaned column {column} using {action}: filled {missing_before - missing_after} values")

                except Exception as e:
                    logger.warning(f"Error applying transformation to column {column}: {str(e)}")
                    continue

    # Standard cleaning
    try:
        for column in df.select_dtypes(include=['number']).columns:
            if df[column].isna().any() and column not in cleaned_columns:
                missing_before = df[column].isna().sum()
                if not df[column].empty and not df[column].isna().all():
                    df[column].fillna(df[column].mean(), inplace=True)
                else:
                    df[column].fillna(0, inplace=True)
                cleaned_columns.append(column)
                missing_after = df[column].isna().sum()
                logger.info(f"Cleaned numeric column {column}: filled {missing_before - missing_after} values")
    except Exception as e:
        logger.warning(f"Error cleaning numeric columns: {str(e)}")

    try:
        for column in df.select_dtypes(exclude=['number']).columns:
            if df[column].isna().any() and column not in cleaned_columns:
                missing_before = df[column].isna().sum()
                if not df[column].empty and not df[column].mode().empty:
                    df[column].fillna(df[column].mode()[0], inplace=True)
                else:
                    df[column].fillna("", inplace=True)
                cleaned_columns.append(column)
                missing_after = df[column].isna().sum()
                logger.info(f"Cleaned non-numeric column {column}: filled {missing_before - missing_after} values")
    except Exception as e:
        logger.warning(f"Error cleaning non-numeric columns: {str(e)}")

    # Final stats
    final_missing = df.isna().sum().sum()
    values_filled = missing_values_count - final_missing

    return {
        'initial_missing_values': int(missing_values_count),
        'values_filled': int(values_filled),
        'remaining_missing': int(final_missing),
        'cleaned_columns': cleaned_columns
    }

def get_gemini_insights(data_sample, columns):
    """
    Use Gemini API to get insights and cleaning suggestions.
    """
    try:
        headers = {"Content-Type": "application/json"}

        max_sample_size = 10
        if len(data_sample) > max_sample_size:
            data_sample = data_sample[:max_sample_size]

        # Sanitize data
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

        # Determine column types
        column_types = {}
        for column in columns:
            column_values = [row.get(column) for row in safe_data if column in row]
            column_values = [v for v in column_values if v is not None]
            if not column_values:
                column_types[column] = "unknown"
            elif all(isinstance(v, (int, float)) for v in column_values):
                column_types[column] = "numeric"
            else:
                column_types[column] = "text/categorical"

        column_type_info = "\n".join([f"- {col}: {typ}" for col, typ in column_types.items()])

        prompt = f"""
        I need to clean and merge CSV files with the following columns: {', '.join(columns)}

        Column types I've detected:
        {column_type_info}

        Here's a sample of the data (showing up to {len(safe_data)} rows):
        {json.dumps(safe_data, indent=2)}

        As a data cleaning expert, please analyze this data and provide recommendations for:
        1. How to handle missing values in each column
        2. What transformations would improve data quality
        3. How to handle duplicates

        Format your response as JSON:
        {{
            "analysis": "brief description of data issues",
            "transformations": [
                {{"column": "column_name", "action": "fill_mean|fill_median|fill_mode|fill_zero|fill_empty", "reason": "explanation"}}
            ]
        }}
        """

        if len(prompt) > 30000:
            prompt = prompt[:30000]

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.2, "topP": 0.8, "topK": 40}
        }

        url = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"
        response = requests.post(url, headers=headers, json=payload, timeout=30)

        if response.status_code == 200:
            response_data = response.json()
            if 'candidates' in response_data and response_data['candidates']:
                text = response_data['candidates'][0]['content']['parts'][0]['text']
                try:
                    return json.loads(text)
                except:
                    json_match = re.search(r'({[\s\S]*})', text)
                    if json_match:
                        return json.loads(json_match.group(1))
                    return {"analysis": "Could not parse Gemini response", "transformations": []}
            return {"analysis": "No candidates in response", "transformations": []}
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
