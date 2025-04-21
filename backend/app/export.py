import json
import csv
import io
import zipfile
import tempfile
import os
import pandas as pd
import numpy as np
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_POST
import pyarrow as pa
import pyarrow.parquet as pq
# import tensorflow as tf
import pickle
from django.core.files.uploadedfile import UploadedFile

@csrf_protect
@require_POST
def export_data(request):
    """Handle various export formats for synthetic data"""
    try:
        # Parse the incoming JSON data
        data = json.loads(request.body.decode('utf-8'))
        export_format = data.get('format')
        dataset = data.get('data', [])
        options = data.get('options', {})

        if not dataset:
            return JsonResponse({'error': 'No data to export'}, status=400)

        # Convert to pandas DataFrame for easier manipulation
        df = pd.DataFrame(dataset)

        # Validate DataFrame
        if df.empty:
            return JsonResponse({'error': 'Empty dataset provided'}, status=400)

        # Handle different export formats
        export_functions = {
            'json': export_json,
            'jsonl': export_jsonl,
            'csv': export_csv,
            'excel': export_excel,
            'sql': export_sql,
            'parquet': export_parquet,
            # 'tfrecord': export_tfrecord,
            'pickle': export_pickle,
            'train_test_split': export_train_test_split,
            'bundle': export_bundle,
        }

        if export_format not in export_functions:
            return JsonResponse({'error': f'Unsupported export format: {export_format}'}, status=400)

        return export_functions[export_format](df, options)

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON payload'}, status=400)
    except Exception as e:
        return JsonResponse({'error': f'Export error: {str(e)}'}, status=500)

@csrf_protect
@require_POST
def import_data(request):
    """Handle file import for synthetic data"""
    try:
        if 'file' not in request.FILES:
            return JsonResponse({'error': 'No file provided'}, status=400)

        file: UploadedFile = request.FILES['file']
        file_type = file.name.rsplit('.', 1)[-1].lower()

        # Validate file size (e.g., max 100MB)
        max_size = 100 * 1024 * 1024  # 100MB
        if file.size > max_size:
            return JsonResponse({'error': 'File size exceeds 100MB limit'}, status=400)

        # Read file based on type
        try:
            if file_type == 'csv':
                df = pd.read_csv(file)
            elif file_type == 'json':
                df = pd.read_json(file)
            elif file_type in ['xlsx', 'xls']:
                df = pd.read_excel(file)
            else:
                return JsonResponse({'error': f'Unsupported file format: {file_type}'}, status=400)
        except Exception as e:
            return JsonResponse({'error': f'Failed to parse file: {str(e)}'}, status=400)

        # Convert DataFrame to list of dictionaries
        data = df.replace({np.nan: None}).to_dict(orient='records')
        return JsonResponse({'data': data})

    except Exception as e:
        return JsonResponse({'error': f'Import error: {str(e)}'}, status=500)

def export_json(df, options=None):
    """Export data as JSON"""
    try:
        json_data = df.to_json(orient='records', date_format='iso')
        response = HttpResponse(json_data, content_type='application/json')
        response['Content-Disposition'] = 'attachment; filename="synthetic_data.json"'
        return response
    except Exception as e:
        return JsonResponse({'error': f'JSON export failed: {str(e)}'}, status=500)

def export_jsonl(df, options=None):
    """Export data as JSONL (JSON Lines)"""
    try:
        jsonl_data = df.to_json(orient='records', lines=True)
        response = HttpResponse(jsonl_data, content_type='application/x-jsonlines')
        response['Content-Disposition'] = 'attachment; filename="synthetic_data.jsonl"'
        return response
    except Exception as e:
        return JsonResponse({'error': f'JSONL export failed: {str(e)}'}, status=500)

def export_csv(df, options=None):
    """Export data as CSV"""
    try:
        csv_data = df.to_csv(index=False)
        response = HttpResponse(csv_data, content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="synthetic_data.csv"'
        return response
    except Exception as e:
        return JsonResponse({'error': f'CSV export failed: {str(e)}'}, status=500)

def export_excel(df, options=None):
    """Export data as Excel file"""
    try:
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Synthetic Data')
            # Create metadata sheet
            metadata = pd.DataFrame({
                'Column': df.columns,
                'Data Type': [str(dtype) for dtype in df.dtypes],
                'Sample Values': [str(df[col].iloc[0]) if not df.empty else '' for col in df.columns],
                'Null Count': [df[col].isna().sum() for col in df.columns],
            })
            metadata.to_excel(writer, index=False, sheet_name='Metadata')

        output.seek(0)
        response = HttpResponse(
            output.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="synthetic_data.xlsx"'
        return response
    except Exception as e:
        return JsonResponse({'error': f'Excel export failed: {str(e)}'}, status=500)

def export_sql(df, options=None):
    """Export data as SQL INSERT statements"""
    try:
        table_name = options.get('table_name', 'synthetic_data')
        output = io.StringIO()

        # Write CREATE TABLE statement
        columns = []
        for col, dtype in zip(df.columns, df.dtypes):
            col = col.replace('`', '``')  # Escape backticks
            sql_type = "TEXT"  # Default to TEXT for safety
            if pd.api.types.is_integer_dtype(dtype):
                sql_type = "INTEGER"
            elif pd.api.types.is_float_dtype(dtype):
                sql_type = "REAL"
            elif pd.api.types.is_datetime64_any_dtype(dtype):
                sql_type = "TIMESTAMP"
            elif pd.api.types.is_bool_dtype(dtype):
                sql_type = "BOOLEAN"
            columns.append(f"`{col}` {sql_type}")

        create_table = f"CREATE TABLE IF NOT EXISTS `{table_name}` (\n  "
        create_table += ",\n  ".join(columns)
        create_table += "\n);\n\n"
        output.write(create_table)

        # Write INSERT statements
        for _, row in df.iterrows():
            values = []
            for val in row:
                if pd.isna(val):
                    values.append("NULL")
                elif isinstance(val, (int, float)):
                    values.append(str(val))
                elif isinstance(val, bool):
                    values.append("TRUE" if val else "FALSE")
                else:
                    val_str = str(val).replace("'", "''")
                    values.append(f"'{val_str}'")

            output.write(f"INSERT INTO `{table_name}` VALUES ({', '.join(values)});\n")

        response = HttpResponse(output.getvalue(), content_type='text/sql')
        response['Content-Disposition'] = 'attachment; filename="synthetic_data.sql"'
        return response
    except Exception as e:
        return JsonResponse({'error': f'SQL export failed: {str(e)}'}, status=500)

def export_parquet(df, options=None):
    """Export data as Parquet file"""
    try:
        output = io.BytesIO()
        table = pa.Table.from_pandas(df)
        pq.write_table(table, output)
        output.seek(0)

        response = HttpResponse(output.read(), content_type='application/x-parquet')
        response['Content-Disposition'] = 'attachment; filename="synthetic_data.parquet"'
        return response
    except Exception as e:
        return JsonResponse({'error': f'Parquet export failed: {str(e)}'}, status=500)

def export_tfrecord(df, options=None):
    """Export data as TFRecord file (TensorFlow format)"""
    try:
        output = io.BytesIO()

        with tf.io.TFRecordWriter(output) as writer:
            for _, row in df.iterrows():
                feature_dict = {}
                for col, val in row.items():
                    if pd.isna(val):
                        continue
                    try:
                        if isinstance(val, (int, np.integer)):
                            feature_dict[col] = tf.train.Feature(int64_list=tf.train.Int64List(value=[int(val)]))
                        elif isinstance(val, (float, np.floating)):
                            feature_dict[col] = tf.train.Feature(float_list=tf.train.FloatList(value=[float(val)]))
                        else:
                            val_str = str(val).encode('utf-8')
                            feature_dict[col] = tf.train.Feature(bytes_list=tf.train.BytesList(value=[val_str]))
                    except (ValueError, TypeError) as e:
                        return JsonResponse({'error': f'TFRecord conversion error for column {col}: {str(e)}'}, status=500)

                example = tf.train.Example(features=tf.train.Features(feature=feature_dict))
                writer.write(example.SerializeToString())

        output.seek(0)
        response = HttpResponse(output.read(), content_type='application/x-tfrecord')
        response['Content-Disposition'] = 'attachment; filename="synthetic_data.tfrecord"'
        return response
    except Exception as e:
        return JsonResponse({'error': f'TFRecord export failed: {str(e)}'}, status=500)

def export_pickle(df, options=None):
    """Export data as Python pickle file"""
    try:
        output = io.BytesIO()
        pickle.dump(df, output)
        output.seek(0)

        response = HttpResponse(output.read(), content_type='application/x-pickle')
        response['Content-Disposition'] = 'attachment; filename="synthetic_data.pkl"'
        return response
    except Exception as e:
        return JsonResponse({'error': f'Pickle export failed: {str(e)}'}, status=500)

def export_train_test_split(df, options=None):
    """Export data as train/test split CSV files"""
    try:
        split_ratio = float(options.get('splitRatio', 0.8))
        if not 0.5 <= split_ratio <= 0.9:
            return JsonResponse({'error': 'Split ratio must be between 0.5 and 0.9'}, status=400)

        # Shuffle the DataFrame
        df_shuffled = df.sample(frac=1.0, random_state=42)

        # Calculate split index
        split_idx = int(len(df_shuffled) * split_ratio)

        # Split into train and test sets
        train_df = df_shuffled.iloc[:split_idx]
        test_df = df_shuffled.iloc[split_idx:]

        # Create a ZIP file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.zip') as temp_file:
            with zipfile.ZipFile(temp_file, 'w', compression=zipfile.ZIP_DEFLATED) as zip_file:
                # Add train.csv
                train_csv = io.StringIO()
                train_df.to_csv(train_csv, index=False)
                zip_file.writestr('train.csv', train_csv.getvalue())

                # Add test.csv
                test_csv = io.StringIO()
                test_df.to_csv(test_csv, index=False)
                zip_file.writestr('test.csv', test_csv.getvalue())

                # Add metadata.json
                metadata = {
                    'total_samples': len(df),
                    'train_samples': len(train_df),
                    'test_samples': len(test_df),
                    'split_ratio': split_ratio,
                    'columns': list(df.columns),
                    'data_types': {col: str(df[col].dtype) for col in df.columns}
                }
                zip_file.writestr('metadata.json', json.dumps(metadata, indent=2))

                # Add README.md
                readme = f"""# Synthetic Dataset - Train/Test Split

## Dataset Information
- Total samples: {len(df)}
- Training set: {len(train_df)} samples ({split_ratio*100:.0f}%)
- Test set: {len(test_df)} samples ({(1-split_ratio)*100:.0f}%)
- Generated on: {pd.Timestamp.now().strftime('%Y-%m-%d')}

## File Description
- `train.csv`: Training dataset ({len(train_df)} samples)
- `test.csv`: Test dataset ({len(test_df)} samples)
- `metadata.json`: Dataset metadata and column information

## Columns
{pd.DataFrame({'Column': df.columns, 'Type': [str(df[col].dtype) for col in df.columns]}).to_markdown(index=False)}
"""
                zip_file.writestr('README.md', readme)

        # Read the ZIP file
        with open(temp_file.name, 'rb') as f:
            content = f.read()

        # Clean up
        os.unlink(temp_file.name)

        response = HttpResponse(content, content_type='application/zip')
        response['Content-Disposition'] = 'attachment; filename="synthetic_data_train_test_split.zip"'
        return response
    except ValueError as e:
        return JsonResponse({'error': f'Invalid split ratio: {str(e)}'}, status=400)
    except Exception as e:
        return JsonResponse({'error': f'Train/test split export failed: {str(e)}'}, status=500)

def export_bundle(df, options=None):
    """Export complete bundle with multiple formats and documentation"""
    try:
        split_ratio = float(options.get('splitRatio', 0.8))
        if not 0.5 <= split_ratio <= 0.9:
            return JsonResponse({'error': 'Split ratio must be between 0.5 and 0.9'}, status=400)

        # Create a ZIP file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.zip') as temp_file:
            with zipfile.ZipFile(temp_file, 'w', compression=zipfile.ZIP_DEFLATED) as zip_file:
                # Add various data formats
                # CSV
                csv_data = io.StringIO()
                df.to_csv(csv_data, index=False)
                zip_file.writestr('data/synthetic_data.csv', csv_data.getvalue())

                # JSON
                json_data = df.to_json(orient='records', indent=2)
                zip_file.writestr('data/synthetic_data.json', json_data)

                # JSONL
                jsonl_data = df.to_json(orient='records', lines=True)
                zip_file.writestr('data/synthetic_data.jsonl', jsonl_data)

                # Excel
                excel_buffer = io.BytesIO()
                with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
                    df.to_excel(writer, index=False)
                excel_buffer.seek(0)
                zip_file.writestr('data/synthetic_data.xlsx', excel_buffer.getvalue())

                # Train/test split
                df_shuffled = df.sample(frac=1.0, random_state=42)
                split_idx = int(len(df_shuffled) * split_ratio)
                train_df = df_shuffled.iloc[:split_idx]
                test_df = df_shuffled.iloc[split_idx:]

                train_csv = io.StringIO()
                train_df.to_csv(train_csv, index=False)
                zip_file.writestr('ml_ready/train.csv', train_csv.getvalue())

                test_csv = io.StringIO()
                test_df.to_csv(test_csv, index=False)
                zip_file.writestr('ml_ready/test.csv', test_csv.getvalue())

                # Generate data dictionary
                data_dict = []
                for col in df.columns:
                    col_info = {
                        'name': col,
                        'type': str(df[col].dtype),
                        'unique_values': df[col].nunique(),
                        'missing_values': df[col].isna().sum(),
                    }
                    sample_values = df[col].dropna().unique()[:5].tolist()
                    col_info['sample_values'] = [str(v) for v in sample_values]
                    data_dict.append(col_info)

                zip_file.writestr('metadata/data_dictionary.json', json.dumps(data_dict, indent=2))

        # Read the ZIP file
        with open(temp_file.name, 'rb') as f:
            content = f.read()

        # Clean up
        os.unlink(temp_file.name)

        response = HttpResponse(content, content_type='application/zip')
        response['Content-Disposition'] = 'attachment; filename="synthetic_data_bundle.zip"'
        return response
    except ValueError as e:
        return JsonResponse({'error': f'Invalid split ratio: {str(e)}'}, status=400)
    except Exception as e:
        return JsonResponse({'error': f'Bundle export failed: {str(e)}'}, status=500)