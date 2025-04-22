# data_generator/views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import google.generativeai as genai
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
import logging

API_KEY = "AIzaSyB8gETGUcZwHqUmF1dJIm_MYbeWjWBup3M"  # Replace with your actual Google API key

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize the Gemini model
genai.configure(api_key=API_KEY)
model = genai.GenerativeModel('gemini-1.5-pro')

@csrf_exempt
@api_view(['POST'])
def generate_data_view(request):
    prompt = request.data.get('prompt')
    rows = request.data.get('rows')
    data_format = request.data.get('format')
    batch_size = request.data.get('batchSize')
    schema = request.data.get('schema')

    # Log the request data
    logger.info(f"Received request with prompt: {prompt}, rows: {rows}, format: {data_format}, batchSize: {batch_size}, schema: {schema}")

    try:
        # Generate synthetic data using the Gemini model
        response = model.generate(
            prompt=prompt,
            max_output_tokens=rows,
            format=data_format,
            batch_size=batch_size,
            schema=schema
        )
        data = response.text  # Assuming the response contains the generated data in text format
        logger.info(f"Successfully generated data: {data}")
        return Response({'data': data}, status=status.HTTP_200_OK)
    except Exception as err:
        logger.error(f"An error occurred: {err}")
        return Response({'error': f"An error occurred: {err}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
