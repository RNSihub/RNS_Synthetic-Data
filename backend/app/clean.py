# views.py

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
import pandas as pd
import numpy as np
import re
import os
from datetime import datetime
import google.generativeai as genai
from django.conf import settings
import logging
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, JSONParser

# Set up logging
logger = logging.getLogger(__name__)

# Configure Gemini API
GEMINI_API_KEY = "AIzaSyB8gETGUcZwHqUmF1dJIm_MYbeWjWBup3M"
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-pro')

def allowed_file(filename):
    """Check if file type is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'csv', 'json', 'xlsx', 'xls'}

def detect_data_types(data):
    """Detect data types for each column"""
    if not data or len(data) == 0:
        return {}
    
    column_types = {}
    for column in data[0].keys():
        values = [row[column] for row in data if row[column] not in [None, '']]
        sample = values[:100] if len(values) > 100 else values
        
        # Default type
        column_type = 'string'
        
        # Check numeric
        numeric_count = sum(1 for val in sample if isinstance(val, (int, float)) or 
                          (isinstance(val, str) and val.replace('.', '', 1).isdigit()))
        
        # Check date
        date_pattern = re.compile(r'^\d{1,4}[-./]\d{1,2}[-./]\d{1,4}$')
        date_count = sum(1 for val in sample if isinstance(val, str) and date_pattern.match(val))
        
        # Check email
        email_pattern = re.compile(r'\S+@\S+\.\S+')
        email_count = sum(1 for val in sample if isinstance(val, str) and email_pattern.match(val))
        
        # Determine most likely type
        if len(sample) > 0:
            if numeric_count / len(sample) > 0.8:
                column_type = 'numeric'
            elif date_count / len(sample) > 0.8:
                column_type = 'date'
            elif email_count / len(sample) > 0.8:
                column_type = 'email'
        
        column_types[column] = column_type
    
    return column_types

def identify_outliers(data, column_types):
    """Identify outliers in numeric columns using IQR method"""
    outliers = {}
    
    for column, col_type in column_types.items():
        if col_type == 'numeric':
            values = [float(row[column]) for row in data if row[column] not in [None, '']]
            if not values:
                continue
                
            q1 = np.percentile(values, 25)
            q3 = np.percentile(values, 75)
            iqr = q3 - q1
            lower_bound = q1 - (1.5 * iqr)
            upper_bound = q3 + (1.5 * iqr)
            
            outlier_indices = [i for i, row in enumerate(data) 
                              if row[column] not in [None, ''] 
                              and (float(row[column]) < lower_bound or float(row[column]) > upper_bound)]
            
            if outlier_indices:
                outliers[column] = outlier_indices
    
    return outliers

def impute_missing_values(data, column_types):
    """Impute missing values based on column type"""
    for column, col_type in column_types.items():
        non_empty_values = [row[column] for row in data if row[column] not in [None, '']]
        if not non_empty_values:
            continue
            
        if col_type == 'numeric':
            # Use median for numeric data
            try:
                median_value = np.median([float(val) for val in non_empty_values])
                for row in data:
                    if row[column] in [None, '']:
                        row[column] = str(median_value)
            except:
                pass
        else:
            # Use mode for categorical data
            from collections import Counter
            most_common = Counter(non_empty_values).most_common(1)
            if most_common:
                mode_value = most_common[0][0]
                for row in data:
                    if row[column] in [None, '']:
                        row[column] = mode_value
    
    return data

def standardize_formats(data, column_types):
    """Standardize formats based on column type"""
    for column, col_type in column_types.items():
        if col_type == 'date':
            # Standardize date format to YYYY-MM-DD
            date_pattern = re.compile(r'^(\d{1,4})[-./](\d{1,2})[-./](\d{1,4})$')
            for row in data:
                if row[column] and isinstance(row[column], str):
                    match = date_pattern.match(row[column])
                    if match:
                        parts = [match.group(1), match.group(2), match.group(3)]
                        # Determine which part is year
                        if len(parts[0]) == 4:  # yyyy-mm-dd
                            year, month, day = parts
                        elif len(parts[2]) == 4:  # dd-mm-yyyy
                            day, month, year = parts
                        else:  # mm-dd-yyyy or best guess
                            month, day, year = parts
                            
                        try:
                            # Try to create a valid date
                            formatted_date = f"{year}-{int(month):02d}-{int(day):02d}"
                            row[column] = formatted_date
                        except:
                            pass
        
        elif col_type == 'email':
            # Standardize email to lowercase
            for row in data:
                if row[column] and isinstance(row[column], str):
                    row[column] = row[column].strip().lower()
    
    return data

def clean_with_gemini(data, data_report):
    """Use Gemini API to clean and enhance data"""
    if not data:
        return data
    
    # Sample a few rows to send to Gemini
    sample_size = min(10, len(data))
    sample_data = data[:sample_size]
    
    # Prepare prompt for Gemini
    prompt = f"""
    I have a dataset with the following issues:
    - {data_report.get('totalMissingValues', 0)} missing values
    - {data_report.get('totalInvalidValues', 0)} invalid values
    - Overall quality score: {data_report.get('completeness', 0) + data_report.get('accuracy', 0) / 2}%
    
    Here's a sample of the data:
    {json.dumps(sample_data, indent=2)}
    
    Based on this sample and the issues, provide me with:
    1. Data cleaning suggestions in JSON format
    2. Function transformations for each column (if needed)
    3. Recommended validation rules
    
    Format your response as a valid JSON like this:
    {{
        "cleaning_suggestions": {{
            "column_name": "suggestion"
        }},
        "transformations": {{
            "column_name": "transformation function"
        }},
        "validation_rules": {{
            "column_name": "validation rule"
        }}
    }}
    
    Note: Only provide the JSON in your response, no other text.
    """
    
    try:
        response = model.generate_content(prompt)
        result = response.text
        
        # Extract JSON from response (in case there's additional text)
        json_match = re.search(r'```json(.*?)```', result, re.DOTALL)
        if json_match:
            result = json_match.group(1)
        else:
            # Try to find JSON without code blocks
            json_match = re.search(r'({.*})', result, re.DOTALL)
            if json_match:
                result = json_match.group(1)
        
        cleaning_instructions = json.loads(result)
        
        # Apply Gemini's suggestions
        for row in data:
            for column, transformation in cleaning_instructions.get('transformations', {}).items():
                if column in row and row[column]:
                    if 'lowercase' in transformation.lower():
                        row[column] = str(row[column]).lower()
                    elif 'uppercase' in transformation.lower():
                        row[column] = str(row[column]).upper()
                    elif 'capitalize' in transformation.lower():
                        row[column] = str(row[column]).capitalize()
                    elif 'trim' in transformation.lower():
                        row[column] = str(row[column]).strip()
        
        logger.info("Successfully applied Gemini cleaning suggestions")
        return data
        
    except Exception as e:
        logger.error(f"Error using Gemini API: {str(e)}")
        # Fall back to basic cleaning if Gemini fails
        return data

@api_view(['POST'])
@parser_classes([MultiPartParser])
def import_data(request):
    """Import data from uploaded file"""
    if 'file' not in request.FILES:
        return JsonResponse({'error': 'No file uploaded'}, status=400)
    
    file = request.FILES['file']
    if not allowed_file(file.name):
        return JsonResponse({'error': 'File type not allowed'}, status=400)
    
    try:
        filename = secure_filename(file.name)
        file_path = os.path.join('temp', filename)
        
        # Ensure the directory exists
        os.makedirs('temp', exist_ok=True)
        
        # Save the file temporarily
        with open(file_path, 'wb+') as destination:
            for chunk in file.chunks():
                destination.write(chunk)
        
        # Process the file based on its type
        file_extension = filename.rsplit('.', 1)[1].lower()
        
        if file_extension == 'csv':
            df = pd.read_csv(file_path)
        elif file_extension == 'json':
            df = pd.read_json(file_path)
        elif file_extension in ['xlsx', 'xls']:
            df = pd.read_excel(file_path)
        else:
            return JsonResponse({'error': 'Unsupported file type'}, status=400)
        
        # Convert DataFrame to list of dicts
        data = df.replace({np.nan: None}).to_dict('records')
        
        # Delete the temporary file
        os.remove(file_path)
        
        return JsonResponse({'data': data}, status=200)
        
    except Exception as e:
        logger.error(f"Error importing data: {str(e)}")
        return JsonResponse({'error': f'Import failed: {str(e)}'}, status=500)

@api_view(['POST'])
@parser_classes([JSONParser])
def process_data(request):
    """Process and clean data"""
    try:
        data = request.data.get('data', [])
        report = request.data.get('report', {})
        
        if not data:
            return JsonResponse({'error': 'No data provided'}, status=400)
        
        # Step 1: Detect data types
        column_types = detect_data_types(data)
        
        # Step 2: Identify outliers
        outliers = identify_outliers(data, column_types)
        
        # Step 3: Standardize formats
        data = standardize_formats(data, column_types)
        
        # Step 4: Impute missing values
        data = impute_missing_values(data, column_types)
        
        # Step 5: Advanced cleaning with Gemini API
        data = clean_with_gemini(data, report)
        
        return JsonResponse({'processed_data': data}, status=200)
        
    except Exception as e:
        logger.error(f"Error processing data: {str(e)}")
        return JsonResponse({'error': f'Processing failed: {str(e)}'}, status=500)

def secure_filename(filename):
    """Secure a filename to prevent path traversal attacks"""
    return os.path.basename(filename)