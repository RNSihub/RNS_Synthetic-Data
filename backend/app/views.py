import json
import os
import pandas as pd
import numpy as np
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import connection
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
import uuid
import re
from datetime import datetime

# Configure Gemini API
API_KEY = "AIzaSyB8gETGUcZwHqUmF1dJIm_MYbeWjWBup3M"
genai.configure(api_key=API_KEY)

# Safety settings to ensure appropriate content generation
safety_settings = {
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
}

# Initialize the model
model = genai.GenerativeModel(
    model_name="gemini-1.5-pro",
    safety_settings=safety_settings,
    generation_config={"temperature": 0.7, "max_output_tokens": 8192}
)

@csrf_exempt
def preview_file(request):
    """Process uploaded file and return preview data"""
    if request.method == 'POST':
        file = request.FILES.get('file')
        if not file:
            return JsonResponse({'error': 'No file provided'}, status=400)

        try:
            # Determine file type and read
            if file.name.endswith('.csv'):
                df = pd.read_csv(file)
            elif file.name.endswith('.xlsx') or file.name.endswith('.xls'):
                df = pd.read_excel(file)
            else:
                return JsonResponse({'error': 'Unsupported file format'}, status=400)

            # Get column info
            column_info = []
            for col in df.columns:
                column_type = str(df[col].dtype)
                if column_type == 'object':
                    column_type = 'string'
                elif 'int' in column_type:
                    column_type = 'integer'
                elif 'float' in column_type:
                    column_type = 'float'
                elif 'date' in column_type:
                    column_type = 'date'
                elif 'bool' in column_type:
                    column_type = 'boolean'

                column_info.append({
                    'name': col,
                    'type': column_type,
                    'description': f'Data column: {col}'
                })

            # Create preview of data
            preview_data = df.head(5).to_dict('records')

            return JsonResponse({
                'columns': column_info,
                'preview': preview_data,
                'row_count': len(df)
            })

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request method'}, status=405)

@csrf_exempt
def get_table_columns(request):
    """Get columns from database table"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            table_name = data.get('table_name')
            
            if not table_name:
                return JsonResponse({'error': 'Table name is required'}, status=400)
            
            # Sanitize table name to prevent SQL injection
            if not re.match(r'^[a-zA-Z0-9_]+$', table_name):
                return JsonResponse({'error': 'Invalid table name'}, status=400)
            
            # Get column information from the database
            with connection.cursor() as cursor:
                # Check if table exists
                cursor.execute(f"""
                    SELECT COUNT(*) 
                    FROM information_schema.tables 
                    WHERE table_name = %s
                """, [table_name])
                if cursor.fetchone()[0] == 0:
                    return JsonResponse({'error': f'Table {table_name} does not exist'}, status=404)
                
                # Get column information
                cursor.execute(f"""
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = %s
                """, [table_name])
                columns = cursor.fetchall()
                
                # Get sample data for better description
                cursor.execute(f"SELECT * FROM {table_name} LIMIT 5")
                sample_rows = cursor.fetchall()
                column_names = [desc[0] for desc in cursor.description]
                
            column_info = []
            for col_name, data_type in columns:
                # Map database types to simplified types
                mapped_type = 'string'
                if 'int' in data_type or 'serial' in data_type:
                    mapped_type = 'integer'
                elif 'float' in data_type or 'double' in data_type or 'numeric' in data_type:
                    mapped_type = 'float'
                elif 'date' in data_type or 'time' in data_type:
                    mapped_type = 'date'
                elif 'bool' in data_type:
                    mapped_type = 'boolean'
                
                column_info.append({
                    'name': col_name,
                    'type': mapped_type,
                    'description': f'Database column: {col_name} ({data_type})'
                })
            
            # Generate sample data for recommendations
            sample_data = []
            for row in sample_rows:
                sample_row = {}
                for i, col in enumerate(column_names):
                    sample_row[col] = row[i]
                sample_data.append(sample_row)
            
            # Generate recommendations based on table structure
            recommendations = generate_column_recommendations_for_table(table_name, column_info, sample_data)
            
            return JsonResponse({
                'columns': column_info,
                'recommendations': recommendations
            })
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Invalid request method'}, status=405)

@csrf_exempt
def column_recommendations(request):
    """Generate additional column recommendations based on existing columns"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            columns = data.get('columns', [])
            sample_data = data.get('sample_data', [])
            
            if not columns:
                return JsonResponse({'error': 'No columns provided'}, status=400)
            
            recommendations = generate_column_recommendations(columns, sample_data)
            
            return JsonResponse({
                'recommendations': recommendations
            })
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Invalid request method'}, status=405)

@csrf_exempt
def generate_data(request):
    """Generate synthetic data using Gemini API"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            columns = data.get('columns', [])
            row_count = data.get('row_count', 0)
            input_method = data.get('input_method')
            table_name = data.get('table_name')
            original_row_count = data.get('original_row_count', 0)
            
            if not columns:
                return JsonResponse({'error': 'No columns provided'}, status=400)
            
            if row_count <= 0 or row_count > 1000:  # Maximum limit based on API constraints
                return JsonResponse({'error': 'Invalid row count (must be between 1 and 1000)'}, status=400)
            
            # Generate synthetic data
            synthetic_data = generate_synthetic_data(columns, row_count, input_method, table_name, original_row_count)
            
            return JsonResponse({
                'generated_data': synthetic_data
            })
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Invalid request method'}, status=405)

def generate_column_recommendations(columns, sample_data):
    """Generate recommendations for additional columns based on existing columns and sample data"""
    # Extract column names and types
    column_names = [col['name'] for col in columns]
    column_types = {col['name']: col['type'] for col in columns}
    
    # Define common column recommendations based on patterns
    recommendations = []
    
    # Check for name-related columns
    name_columns = [col for col in column_names if 'name' in col.lower()]
    if any('first' in col.lower() for col in name_columns) and not any('last' in col.lower() for col in name_columns):
        recommendations.append({
            'name': 'last_name',
            'type': 'string',
            'description': 'Last name of the person'
        })
    elif any('last' in col.lower() for col in name_columns) and not any('first' in col.lower() for col in name_columns):
        recommendations.append({
            'name': 'first_name',
            'type': 'string',
            'description': 'First name of the person'
        })
    elif not any(col.lower() in ['name', 'full_name', 'first_name', 'last_name'] for col in column_names):
        if any(col.lower() in ['user_id', 'customer_id', 'employee_id'] for col in column_names):
            recommendations.append({
                'name': 'full_name',
                'type': 'string',
                'description': 'Full name of the person'
            })
    
    # Check for address-related columns
    address_columns = [col for col in column_names if any(addr in col.lower() for addr in ['address', 'street', 'city', 'state', 'zip', 'postal'])]
    if address_columns:
        if not any('city' in col.lower() for col in column_names):
            recommendations.append({
                'name': 'city',
                'type': 'string',
                'description': 'City name'
            })
        if not any('state' in col.lower() for col in column_names):
            recommendations.append({
                'name': 'state',
                'type': 'string',
                'description': 'State or province'
            })
        if not any(zip_code in col.lower() for col in column_names for zip_code in ['zip', 'postal_code', 'zip_code']):
            recommendations.append({
                'name': 'zip_code',
                'type': 'string',
                'description': 'Postal or ZIP code'
            })
    
    # Check for contact information
    if any(col.lower() in ['email', 'email_address'] for col in column_names) and not any(col.lower() in ['phone', 'phone_number', 'telephone'] for col in column_names):
        recommendations.append({
            'name': 'phone_number',
            'type': 'string',
            'description': 'Contact phone number'
        })
    elif any(col.lower() in ['phone', 'phone_number', 'telephone'] for col in column_names) and not any(col.lower() in ['email', 'email_address'] for col in column_names):
        recommendations.append({
            'name': 'email',
            'type': 'email',
            'description': 'Email address'
        })
    
    # Check for date-related columns
    date_columns = [col for col in column_names if any(date_term in col.lower() for date_term in ['date', 'created', 'modified', 'updated', 'timestamp'])]
    if date_columns and not any('updated' in col.lower() or 'modified' in col.lower() for col in column_names):
        recommendations.append({
            'name': 'updated_at',
            'type': 'date',
            'description': 'Last update timestamp'
        })
    
    # Check for ID columns
    id_columns = [col for col in column_names if '_id' in col.lower() or col.lower() == 'id']
    if not id_columns:
        recommendations.append({
            'name': 'id',
            'type': 'integer',
            'description': 'Unique identifier'
        })
    
    # Add domain-specific recommendations based on column patterns
    if any(col.lower() in ['product_name', 'product_id', 'item_name', 'item_id'] for col in column_names):
        if not any(col.lower() in ['price', 'amount', 'cost'] for col in column_names):
            recommendations.append({
                'name': 'price',
                'type': 'float',
                'description': 'Product price'
            })
        if not any(col.lower() in ['quantity', 'qty', 'stock'] for col in column_names):
            recommendations.append({
                'name': 'quantity',
                'type': 'integer',
                'description': 'Quantity in stock'
            })
    
    # Use Gemini to generate additional recommendations if needed
    if len(recommendations) < 3:
        try:
            column_info = "\n".join([f"- {col['name']} ({col['type']}): {col['description']}" for col in columns])
            sample_data_str = ""
            if sample_data and len(sample_data) > 0:
                sample_data_str = "Sample data (first row):\n" + json.dumps(sample_data[0], indent=2)
            
            prompt = f"""
            Based on the following column information for a database table:
            {column_info}
            
            {sample_data_str}
            
            Suggest 2-3 additional columns that would complement this dataset. For each suggestion, provide:
            1. Column name (snake_case)
            2. Data type (string, integer, float, boolean, date, email, phone, address, or name)
            3. A brief description of what the column represents
            
            Format your response as a JSON array like this:
            [
              {{"name": "column_name", "type": "data_type", "description": "Description of the column"}},
              ...
            ]
            Only provide the JSON array, no additional text.
            """
            
            response = model.generate_content(prompt)
            ai_suggestions = response.text
            
            # Try to extract and parse the JSON from the response
            try:
                # Find JSON array in response
                json_match = re.search(r'\[\s*\{.*\}\s*\]', ai_suggestions, re.DOTALL)
                if json_match:
                    ai_suggestions = json_match.group(0)
                
                ai_recommendations = json.loads(ai_suggestions)
                # Validate and add AI recommendations
                for rec in ai_recommendations:
                    if all(key in rec for key in ['name', 'type', 'description']):
                        # Skip if we already have this column or recommendation
                        if rec['name'] not in column_names and not any(r['name'] == rec['name'] for r in recommendations):
                            # Ensure type is valid
                            valid_types = ['string', 'integer', 'float', 'boolean', 'date', 'email', 'phone', 'address', 'name']
                            if rec['type'] in valid_types:
                                recommendations.append(rec)
            except Exception as e:
                # Fall back to predefined recommendations if AI parsing fails
                pass
                
        except Exception as e:
            # If Gemini API fails, proceed with only the rule-based recommendations
            pass
    
    # Limit to a reasonable number of recommendations
    return recommendations[:5]

def generate_column_recommendations_for_table(table_name, columns, sample_data):
    """Generate recommendations specific to the given table"""
    # Start with general recommendations
    recommendations = generate_column_recommendations(columns, sample_data)
    
    # Add table-specific recommendations based on table name
    table_name_lower = table_name.lower()
    
    # For users or customers tables
    if any(user_term in table_name_lower for user_term in ['user', 'customer', 'client', 'person', 'employee']):
        potential_additions = [
            {
                'name': 'birthdate',
                'type': 'date',
                'description': 'Date of birth'
            },
            {
                'name': 'gender',
                'type': 'string',
                'description': 'Gender identification'
            },
            {
                'name': 'active',
                'type': 'boolean',
                'description': 'Whether the account is active'
            }
        ]
        
        # Only add if not already a column or recommendation
        column_names = [col['name'] for col in columns]
        recommendation_names = [rec['name'] for rec in recommendations]
        
        for addition in potential_additions:
            if (addition['name'] not in column_names and 
                addition['name'] not in recommendation_names):
                recommendations.append(addition)
    
    # For orders or transactions tables
    elif any(order_term in table_name_lower for order_term in ['order', 'transaction', 'purchase', 'sale']):
        potential_additions = [
            {
                'name': 'total_amount',
                'type': 'float',
                'description': 'Total order amount'
            },
            {
                'name': 'payment_status',
                'type': 'string',
                'description': 'Status of payment (paid, pending, canceled)'
            },
            {
                'name': 'order_date',
                'type': 'date',
                'description': 'Date when the order was placed'
            }
        ]
        
        column_names = [col['name'] for col in columns]
        recommendation_names = [rec['name'] for rec in recommendations]
        
        for addition in potential_additions:
            if (addition['name'] not in column_names and 
                addition['name'] not in recommendation_names):
                recommendations.append(addition)
    
    # For products or inventory tables
    elif any(product_term in table_name_lower for product_term in ['product', 'inventory', 'item', 'stock']):
        potential_additions = [
            {
                'name': 'category',
                'type': 'string',
                'description': 'Product category'
            },
            {
                'name': 'in_stock',
                'type': 'boolean',
                'description': 'Whether the product is in stock'
            },
            {
                'name': 'description',
                'type': 'string',
                'description': 'Product description'
            }
        ]
        
        column_names = [col['name'] for col in columns]
        recommendation_names = [rec['name'] for rec in recommendations]
        
        for addition in potential_additions:
            if (addition['name'] not in column_names and 
                addition['name'] not in recommendation_names):
                recommendations.append(addition)
    
    # Limit to top 5 recommendations
    return recommendations[:5]

def generate_synthetic_data(columns, row_count, input_method, table_name, original_row_count):
    """Generate synthetic data using the Gemini API"""
    try:
        # Create a structured prompt for Gemini
        column_info = "\n".join([f"- {col['name']} ({col['type']}): {col['description']}" for col in columns])
        
        context = ""
        if input_method == 'table':
            context = f"This data is for a database table named '{table_name}'."
        elif input_method == 'file' and original_row_count > 0:
            context = f"This data should follow the pattern of the original data file which had {original_row_count} rows."
        
        prompt = f"""
        Generate {row_count} rows of UNIQUE synthetic data for the following columns:
        
        {column_info}
        
        {context}
        
        Important requirements:
        1. Each row must be completely UNIQUE - no duplicates across any rows
        2. Data should be realistic and consistent
        3. Follow the appropriate data types exactly
        4. For 'string' types, generate appropriate text for the field name
        5. For 'integer' types, generate appropriate numeric values
        6. For 'float' types, use decimal values appropriate for the field
        7. For 'boolean' types, use true/false values
        8. For 'date' types, use ISO format dates (YYYY-MM-DD)
        9. For 'email' types, generate realistic email addresses
        10. For 'phone' types, generate phone numbers in standard format
        11. For 'address' types, generate realistic addresses
        12. For 'name' types, generate realistic person names
        
        Return ONLY a properly formatted JSON array where each object represents one row of data.
        Format each field according to its correct data type. Do not include any explanations or comments.
        """
        
        # Call Gemini API
        response = model.generate_content(prompt)
        generated_text = response.text
        
        # Process response to extract JSON data
        try:
            # Clean the response by removing markdown code blocks and cleaning extra text
            cleaned_text = generated_text.strip()
            
            # Remove markdown code blocks if present
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:].strip()
            if cleaned_text.startswith("```"):
                cleaned_text = cleaned_text[3:].strip()
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3].strip()
            
            # Try to parse the JSON
            synthetic_data = json.loads(cleaned_text)
            
            # Clean data & enforce types
            for row in synthetic_data:
                for col in columns:
                    col_name = col['name']
                    col_type = col['type']
                    
                    # Skip if column is missing (will be filled later)
                    if col_name not in row:
                        continue
                    
                    # Clean and convert data based on type
                    if col_type == 'integer':
                        try:
                            row[col_name] = int(float(str(row[col_name]).replace(',', '')))
                        except (ValueError, TypeError):
                            # If conversion fails, generate a random integer
                            row[col_name] = np.random.randint(1, 1000)
                    
                    elif col_type == 'float':
                        try:
                            row[col_name] = float(str(row[col_name]).replace(',', ''))
                        except (ValueError, TypeError):
                            # If conversion fails, generate a random float
                            row[col_name] = round(np.random.uniform(1, 1000), 2)
                    
                    elif col_type == 'boolean':
                        if isinstance(row[col_name], str):
                            row[col_name] = row[col_name].lower() in ['true', 'yes', 'y', '1']
                        else:
                            row[col_name] = bool(row[col_name])
                    
                    elif col_type == 'date':
                        # Ensure date is in correct format
                        try:
                            # Try to parse and standardize date format
                            date_obj = pd.to_datetime(row[col_name])
                            row[col_name] = date_obj.strftime('%Y-%m-%d')
                        except:
                            # If date parsing fails, generate current date
                            row[col_name] = datetime.now().strftime('%Y-%m-%d')
            
            # Fill in any missing columns with defaults
            for row in synthetic_data:
                for col in columns:
                    if col['name'] not in row:
                        # Generate defaults based on type
                        if col['type'] == 'integer':
                            row[col['name']] = np.random.randint(1, 1000)
                        elif col['type'] == 'float':
                            row[col['name']] = round(np.random.uniform(1, 1000), 2)
                        elif col['type'] == 'boolean':
                            row[col['name']] = bool(np.random.randint(0, 2))
                        elif col['type'] == 'date':
                            row[col['name']] = datetime.now().strftime('%Y-%m-%d')
                        else:
                            row[col['name']] = f"Default for {col['name']}"
            
            # If we didn't get enough data, pad with additional generated rows
            if len(synthetic_data) < row_count:
                additional_needed = row_count - len(synthetic_data)
                
                # Create template for random data generation based on existing rows
                if len(synthetic_data) > 0:
                    template = synthetic_data[0].copy()
                else:
                    template = {col['name']: None for col in columns}
                
                # Generate additional rows
                for i in range(additional_needed):
                    new_row = {}
                    for col in columns:
                        if col['type'] == 'integer':
                            new_row[col['name']] = np.random.randint(1, 1000)
                        elif col['type'] == 'float':
                            new_row[col['name']] = round(np.random.uniform(1, 1000), 2)
                        elif col['type'] == 'boolean':
                            new_row[col['name']] = bool(np.random.randint(0, 2))
                        elif col['type'] == 'date':
                            new_row[col['name']] = (datetime.now() + pd.Timedelta(days=i)).strftime('%Y-%m-%d')
                        elif col['type'] == 'email':
                            new_row[col['name']] = f"user{i}_{uuid.uuid4().hex[:8]}@example.com"
                        elif col['type'] == 'phone':
                            new_row[col['name']] = f"+1-555-{np.random.randint(100, 999)}-{np.random.randint(1000, 9999)}"
                        else:
                            new_row[col['name']] = f"{col['name']}_{i}_{uuid.uuid4().hex[:8]}"
                    
                    synthetic_data.append(new_row)
            
            # Remove any extra rows if we got too many
            if len(synthetic_data) > row_count:
                synthetic_data = synthetic_data[:row_count]
            
            return synthetic_data
        
        except json.JSONDecodeError as e:
            # If JSON parsing fails, generate fallback data
            return generate_fallback_data(columns, row_count)
    
    except Exception as e:
        # If anything fails, generate fallback data
        return generate_fallback_data(columns, row_count)

def generate_fallback_data(columns, row_count):
    """Generate fallback data if the Gemini API fails"""
    synthetic_data = []
    
    for i in range(row_count):
        row = {}
        for col in columns:
            col_name = col['name']
            col_type = col['type']
            
            if col_type == 'integer':
                row[col_name] = np.random.randint(1, 1000)
            elif col_type == 'float':
                row[col_name] = round(np.random.uniform(1, 1000), 2)
            elif col_type == 'boolean':
                row[col_name] = bool(np.random.randint(0, 2))
            elif col_type == 'date':
                # Generate a random date in the last year
                days = np.random.randint(0, 365)
                row[col_name] = (datetime.now() - pd.Timedelta(days=days)).strftime('%Y-%m-%d')
            elif col_type == 'email':
                row[col_name] = f"user{i}_{uuid.uuid4().hex[:8]}@example.com"
            elif col_type == 'phone':
                row[col_name] = f"+1-555-{np.random.randint(100, 999)}-{np.random.randint(1000, 9999)}"
            elif col_type == 'name':
                first_names = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth"]
                last_names = ["Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor"]
                row[col_name] = f"{np.random.choice(first_names)} {np.random.choice(last_names)}"
            elif col_type == 'address':
                streets = ["Main St", "Oak Ave", "Maple Rd", "Cedar Ln", "Pine Dr"]
                cities = ["Springfield", "Rivertown", "Lakeside", "Hillcrest", "Meadowbrook"]
                states = ["CA", "NY", "TX", "FL", "IL"]
                row[col_name] = f"{np.random.randint(100, 9999)} {np.random.choice(streets)}, {np.random.choice(cities)}, {np.random.choice(states)} {np.random.randint(10000, 99999)}"
            else:
                # Default string type
                row[col_name] = f"{col_name}_{i}_{uuid.uuid4().hex[:8]}"
        
        synthetic_data.append(row)
    
    return synthetic_data