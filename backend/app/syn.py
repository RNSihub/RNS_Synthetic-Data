import json
import uuid
import csv
import pandas as pd
import random
import string
from datetime import datetime, timedelta
import requests
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.cache import cache

GEMINI_API_KEY = 'AIzaSyBfI_d7lPwtklSbmIkTUCnldpDeKnmwD70'
GEMINI_API_URL = 'https://gemini.api.example.com/generate'  # Replace with the actual Gemini API URL

class SyntheticDataGenerator:
    def __init__(self, columns, temperature=0.7):
        self.columns = columns
        self.temperature = temperature
        self.generated_values = {col['name']: set() for col in columns}

    def generate_value(self, column_type, options=None):
        """Generate a value based on column type and options"""
        if options is None:
            options = {}

        headers = {
            'Authorization': f'Bearer {GEMINI_API_KEY}',
            'Content-Type': 'application/json'
        }

        payload = {
            'type': column_type,
            'options': options,
            'temperature': self.temperature
        }

        response = requests.post(GEMINI_API_URL, headers=headers, json=payload)
        if response.status_code == 200:
            value = response.json().get('value')
            # Ensure uniqueness
            while value in self.generated_values[column_type]:
                response = requests.post(GEMINI_API_URL, headers=headers, json=payload)
                value = response.json().get('value')
            self.generated_values[column_type].add(value)
            return value
        else:
            raise Exception(f"Error generating value: {response.status_code} - {response.text}")

    def generate_row(self):
        """Generate a single row of data"""
        row = {}
        for column in self.columns:
            row[column['name']] = self.generate_value(column['type'], column.get('options', {}))
        return row

    def generate_data(self, num_rows):
        """Generate multiple rows of data"""
        return [self.generate_row() for _ in range(num_rows)]

@csrf_exempt
@require_http_methods(["POST"])
def generate_preview(request):
    """Generate a preview of synthetic data"""
    try:
        data = json.loads(request.body)
        columns = data.get('columns', [])
        rows = min(data.get('rows', 5), 10)  # Limit preview to 10 rows max
        temperature = data.get('temperature', 0.7)

        # Generate preview data
        generator = SyntheticDataGenerator(columns, temperature)
        preview_data = generator.generate_data(rows)

        return JsonResponse({
            'success': True,
            'preview': preview_data
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def generate_data(request):
    """Generate full dataset and store in cache"""
    try:
        data = json.loads(request.body)
        columns = data.get('columns', [])
        rows = data.get('rows', 100)
        temperature = data.get('temperature', 0.7)

        # Generate full dataset
        generator = SyntheticDataGenerator(columns, temperature)
        dataset = generator.generate_data(rows)

        # Store in cache with a unique ID
        data_id = str(uuid.uuid4())
        cache.set(f"synthetic_data_{data_id}", {
            'columns': columns,
            'data': dataset,
            'created_at': datetime.now().isoformat()
        }, timeout=3600)  # Cache for 1 hour

        return JsonResponse({
            'success': True,
            'id': data_id,
            'rows': len(dataset)
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)

def export_data(request, data_id):
    """Export data in various formats"""
    format_type = request.GET.get('format', 'csv').lower()

    # Retrieve data from cache
    cached_data = cache.get(f"synthetic_data_{data_id}")
    if not cached_data:
        return JsonResponse({
            'success': False,
            'error': 'Data not found or expired'
        }, status=404)

    data = cached_data['data']
    columns = cached_data['columns']
    column_names = [col['name'] for col in columns]

    # Export as CSV
    if format_type == 'csv':
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="synthetic_data_{data_id}.csv"'

        writer = csv.DictWriter(response, fieldnames=column_names)
        writer.writeheader()
        for row in data:
            writer.writerow(row)

        return response

    # Export as JSON
    elif format_type == 'json':
        response = HttpResponse(
            json.dumps({'data': data}, indent=2),
            content_type='application/json'
        )
        response['Content-Disposition'] = f'attachment; filename="synthetic_data_{data_id}.json"'
        return response

    # Export as Excel
    elif format_type == 'xlsx':
        df = pd.DataFrame(data)
        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename="synthetic_data_{data_id}.xlsx"'

        df.to_excel(response, index=False)
        return response

    # Export as SQL INSERT statements
    elif format_type == 'sql':
        table_name = 'synthetic_data'
        sql_statements = [f"CREATE TABLE {table_name} ("]

        # Create table definition
        column_defs = []
        for col in columns:
            data_type = 'TEXT'  # Default type
            if col['type'] in ['number', 'id']:
                data_type = 'INTEGER'
            elif col['type'] in ['decimal']:
                data_type = 'REAL'
            elif col['type'] in ['boolean']:
                data_type = 'BOOLEAN'
            elif col['type'] in ['date', 'time', 'datetime']:
                data_type = 'TIMESTAMP'

            column_defs.append(f"    {col['name']} {data_type}")

        sql_statements.append(',\n'.join(column_defs))
        sql_statements.append(');')

        # Generate INSERT statements
        for row in data:
            values = []
            for col_name in column_names:
                value = row.get(col_name, '')

                # Format value based on type
                if isinstance(value, str):
                    value = f"'{value}'"
                elif value is None:
                    value = 'NULL'
                elif isinstance(value, bool):
                    value = '1' if value else '0'
                else:
                    value = str(value)

                values.append(value)

            sql_statements.append(
                f"INSERT INTO {table_name} ({', '.join(column_names)}) VALUES ({', '.join(values)});"
            )

        response = HttpResponse('\n'.join(sql_statements), content_type='text/plain')
        response['Content-Disposition'] = f'attachment; filename="synthetic_data_{data_id}.sql"'
        return response

    # Export as XML
    elif format_type == 'xml':
        xml = ['<?xml version="1.0" encoding="UTF-8"?>']
        xml.append('<dataset>')

        for row in data:
            xml.append('  <row>')
            for col_name in column_names:
                value = row.get(col_name, '')
                # Replace special characters in XML
                if isinstance(value, str):
                    value = value.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
                xml.append(f'    <{col_name}>{value}</{col_name}>')
            xml.append('  </row>')

        xml.append('</dataset>')

        response = HttpResponse('\n'.join(xml), content_type='application/xml')
        response['Content-Disposition'] = f'attachment; filename="synthetic_data_{data_id}.xml"'
        return response

    else:
        return JsonResponse({
            'success': False,
            'error': f'Unsupported format: {format_type}'
        }, status=400)
