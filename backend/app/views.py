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

def sanitize_table_name(table_name):
    """Sanitize table name to prevent SQL injection"""
    if not re.match(r'^[a-zA-Z0-9_]+$', table_name):
        raise ValueError('Invalid table name')
    return table_name

def get_column_info(file):
    """Extract column information from a file"""
    if file.name.endswith('.csv'):
        df = pd.read_csv(file)
    elif file.name.endswith('.xlsx') or file.name.endswith('.xls'):
        df = pd.read_excel(file)
    else:
        raise ValueError('Unsupported file format')

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

    return column_info, df

def get_table_columns_info(table_name):
    """Get columns from database table"""
    with connection.cursor() as cursor:
        # Check if table exists
        cursor.execute(f"""
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_name = %s
        """, [table_name])
        if cursor.fetchone()[0] == 0:
            raise ValueError(f'Table {table_name} does not exist')

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

    sample_data = [{col: row[i] for i, col in enumerate(column_names)} for row in sample_rows]
    return column_info, sample_data

def generate_column_recommendations(columns, sample_data):
    """Generate recommendations for additional columns based on existing columns and sample data"""
    column_names = [col['name'] for col in columns]
    column_types = {col['name']: col['type'] for col in columns}

    recommendations = []

    # Check for name-related columns
    name_columns = [col for col in column_names if 'name' in col.lower()]
    if any('first' in col.lower() for col in name_columns) and not any('last' in col.lower() for col in name_columns):
        recommendations.append({'name': 'last_name', 'type': 'string', 'description': 'Last name of the person'})
    elif any('last' in col.lower() for col in name_columns) and not any('first' in col.lower() for col in name_columns):
        recommendations.append({'name': 'first_name', 'type': 'string', 'description': 'First name of the person'})
    elif not any(col.lower() in ['name', 'full_name', 'first_name', 'last_name'] for col in column_names):
        if any(col.lower() in ['user_id', 'customer_id', 'employee_id'] for col in column_names):
            recommendations.append({'name': 'full_name', 'type': 'string', 'description': 'Full name of the person'})

    # Check for address-related columns
    address_columns = [col for col in column_names if any(addr in col.lower() for addr in ['address', 'street', 'city', 'state', 'zip', 'postal'])]
    if address_columns:
        if not any('city' in col.lower() for col in column_names):
            recommendations.append({'name': 'city', 'type': 'string', 'description': 'City name'})
        if not any('state' in col.lower() for col in column_names):
            recommendations.append({'name': 'state', 'type': 'string', 'description': 'State or province'})
        if not any(zip_code in col.lower() for col in column_names for zip_code in ['zip', 'postal_code', 'zip_code']):
            recommendations.append({'name': 'zip_code', 'type': 'string', 'description': 'Postal or ZIP code'})

    # Check for contact information
    if any(col.lower() in ['email', 'email_address'] for col in column_names) and not any(col.lower() in ['phone', 'phone_number', 'telephone'] for col in column_names):
        recommendations.append({'name': 'phone_number', 'type': 'string', 'description': 'Contact phone number'})
    elif any(col.lower() in ['phone', 'phone_number', 'telephone'] for col in column_names) and not any(col.lower() in ['email', 'email_address'] for col in column_names):
        recommendations.append({'name': 'email', 'type': 'email', 'description': 'Email address'})

    # Check for date-related columns
    date_columns = [col for col in column_names if any(date_term in col.lower() for date_term in ['date', 'created', 'modified', 'updated', 'timestamp'])]
    if date_columns and not any('updated' in col.lower() or 'modified' in col.lower() for col in column_names):
        recommendations.append({'name': 'updated_at', 'type': 'date', 'description': 'Last update timestamp'})

    # Check for ID columns
    id_columns = [col for col in column_names if '_id' in col.lower() or col.lower() == 'id']
    if not id_columns:
        recommendations.append({'name': 'id', 'type': 'integer', 'description': 'Unique identifier'})

    # Add domain-specific recommendations based on column patterns
    if any(col.lower() in ['product_name', 'product_id', 'item_name', 'item_id'] for col in column_names):
        if not any(col.lower() in ['price', 'amount', 'cost'] for col in column_names):
            recommendations.append({'name': 'price', 'type': 'float', 'description': 'Product price'})
        if not any(col.lower() in ['quantity', 'qty', 'stock'] for col in column_names):
            recommendations.append({'name': 'quantity', 'type': 'integer', 'description': 'Quantity in stock'})

    # Use Gemini to generate additional recommendations if needed
    if len(recommendations) < 3:
        recommendations = augment_recommendations_with_gemini(columns, sample_data, recommendations)

    return recommendations[:5]

def augment_recommendations_with_gemini(columns, sample_data, recommendations):
    """Use Gemini to generate additional recommendations"""
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
            json_match = re.search(r'\[\s*\{.*\}\s*\]', ai_suggestions, re.DOTALL)
            if json_match:
                ai_suggestions = json_match.group(0)

            ai_recommendations = json.loads(ai_suggestions)
            for rec in ai_recommendations:
                if all(key in rec for key in ['name', 'type', 'description']):
                    if rec['name'] not in [col['name'] for col in columns] and not any(r['name'] == rec['name'] for r in recommendations):
                        if rec['type'] in ['string', 'integer', 'float', 'boolean', 'date', 'email', 'phone', 'address', 'name']:
                            recommendations.append(rec)
        except Exception:
            pass

    except Exception:
        pass

    return recommendations

def generate_column_recommendations_for_table(table_name, columns, sample_data):
    """Generate recommendations specific to the given table"""
    recommendations = generate_column_recommendations(columns, sample_data)
    table_name_lower = table_name.lower()

    potential_additions = []

    # For users or customers tables
    if any(user_term in table_name_lower for user_term in ['user', 'customer', 'client', 'person', 'employee']):
        potential_additions = [
            {'name': 'birthdate', 'type': 'date', 'description': 'Date of birth'},
            {'name': 'gender', 'type': 'string', 'description': 'Gender identification'},
            {'name': 'active', 'type': 'boolean', 'description': 'Whether the account is active'}
        ]

    # For orders or transactions tables
    elif any(order_term in table_name_lower for order_term in ['order', 'transaction', 'purchase', 'sale']):
        potential_additions = [
            {'name': 'total_amount', 'type': 'float', 'description': 'Total order amount'},
            {'name': 'payment_status', 'type': 'string', 'description': 'Status of payment (paid, pending, canceled)'},
            {'name': 'order_date', 'type': 'date', 'description': 'Date when the order was placed'}
        ]

    # For products or inventory tables
    elif any(product_term in table_name_lower for product_term in ['product', 'inventory', 'item', 'stock']):
        potential_additions = [
            {'name': 'category', 'type': 'string', 'description': 'Product category'},
            {'name': 'in_stock', 'type': 'boolean', 'description': 'Whether the product is in stock'},
            {'name': 'description', 'type': 'string', 'description': 'Product description'}
        ]

    column_names = [col['name'] for col in columns]
    recommendation_names = [rec['name'] for rec in recommendations]

    for addition in potential_additions:
        if addition['name'] not in column_names and addition['name'] not in recommendation_names:
            recommendations.append(addition)

    return recommendations[:5]

def generate_synthetic_data(columns, row_count, input_method, table_name, original_row_count):
    """Generate synthetic data using the Gemini API with batching and merging technique"""
    try:
        batch_size = 5000
        synthetic_data = []
        column_info = "\n".join([f"- {col['name']} ({col['type']}): {col['description']}" for col in columns])

        context = ""
        if input_method == 'table':
            context = f"This data is for a database table named '{table_name}'."
        elif input_method == 'file' and original_row_count > 0:
            context = f"This data should follow the pattern of the original data file which had {original_row_count} rows."

        prompt_template = f"""
        Generate {{batch_size}} rows of UNIQUE synthetic data for the following columns:

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

        remaining_rows = row_count
        while remaining_rows > 0:
            current_batch_size = min(batch_size, remaining_rows)
            prompt = prompt_template.replace("{batch_size}", str(current_batch_size))

            response = model.generate_content(prompt)
            generated_text = response.text

            try:
                cleaned_text = generated_text.strip()
                if cleaned_text.startswith("```json"):
                    cleaned_text = cleaned_text[7:].strip()
                if cleaned_text.startswith("```"):
                    cleaned_text = cleaned_text[3:].strip()
                if cleaned_text.endswith("```"):
                    cleaned_text = cleaned_text[:-3].strip()

                batch_data = json.loads(cleaned_text)

                for row in batch_data:
                    for col in columns:
                        col_name = col['name']
                        col_type = col['type']

                        if col_name not in row:
                            continue

                        if col_type == 'integer':
                            try:
                                row[col_name] = int(float(str(row[col_name]).replace(',', '')))
                            except (ValueError, TypeError):
                                row[col_name] = np.random.randint(1, 15000)

                        elif col_type == 'float':
                            try:
                                row[col_name] = float(str(row[col_name]).replace(',', ''))
                            except (ValueError, TypeError):
                                row[col_name] = round(np.random.uniform(1, 15000), 2)

                        elif col_type == 'boolean':
                            if isinstance(row[col_name], str):
                                row[col_name] = row[col_name].lower() in ['true', 'yes', 'y', '1']
                            else:
                                row[col_name] = bool(row[col_name])

                        elif col_type == 'date':
                            try:
                                date_obj = pd.to_datetime(row[col_name])
                                row[col_name] = date_obj.strftime('%Y-%m-%d')
                            except:
                                row[col_name] = datetime.now().strftime('%Y-%m-%d')

                synthetic_data.extend(batch_data)
                remaining_rows -= current_batch_size

            except json.JSONDecodeError:
                return generate_fallback_data(columns, row_count)

        unique_data = {tuple(sorted(row.items())) for row in synthetic_data}
        synthetic_data = [dict(row) for row in unique_data]

        if len(synthetic_data) < row_count:
            additional_needed = row_count - len(synthetic_data)
            synthetic_data.extend(generate_fallback_data(columns, additional_needed))

        if len(synthetic_data) > row_count:
            synthetic_data = synthetic_data[:row_count]

        return synthetic_data[:row_count]
    except Exception:
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
                row[col_name] = np.random.randint(1, 15000)
            elif col_type == 'float':
                row[col_name] = round(np.random.uniform(1, 15000), 2)
            elif col_type == 'boolean':
                row[col_name] = bool(np.random.randint(0, 2))
            elif col_type == 'date':
                days = np.random.randint(0, 365)
                row[col_name] = (datetime.now() - pd.Timedelta(days=days)).strftime('%Y-%m-%d')
            elif col_type == 'email':
                row[col_name] = f"user{i}_{uuid.uuid4().hex[:8]}@example.com"
            elif col_type == 'phone':
                row[col_name] = f"+1-555-{np.random.randint(100, 999)}-{np.random.randint(15000, 9999)}"
            elif col_type == 'name':
                first_names = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth"]
                last_names = ["Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor"]
                row[col_name] = f"{np.random.choice(first_names)} {np.random.choice(last_names)}"
            elif col_type == 'address':
                streets = ["Main St", "Oak Ave", "Maple Rd", "Cedar Ln", "Pine Dr"]
                cities = ["Springfield", "Rivertown", "Lakeside", "Hillcrest", "Meadowbrook"]
                states = ["CA", "NY", "TX", "FL", "IL"]
                row[col_name] = f"{np.random.randint(100, 9999)} {np.random.choice(streets)}, {np.random.choice(cities)}, {np.random.choice(states)} {np.random.randint(150000, 99999)}"
            else:
                row[col_name] = f"{col_name}_{i}_{uuid.uuid4().hex[:8]}"

        synthetic_data.append(row)

    return synthetic_data

@csrf_exempt
def preview_file(request):
    """Process uploaded file and return preview data"""
    if request.method == 'POST':
        file = request.FILES.get('file')
        if not file:
            return JsonResponse({'error': 'No file provided'}, status=400)

        try:
            column_info, df = get_column_info(file)
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
            table_name = sanitize_table_name(data.get('table_name'))

            column_info, sample_data = get_table_columns_info(table_name)
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

            if row_count <= 0 or row_count > 15000:
                return JsonResponse({'error': 'Invalid row count (must be between 1 and 15000)'}, status=400)

            synthetic_data = generate_synthetic_data(columns, row_count, input_method, table_name, original_row_count)

            return JsonResponse({
                'generated_data': synthetic_data
            })

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request method'}, status=405)
