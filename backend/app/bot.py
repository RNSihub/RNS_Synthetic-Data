import json
import logging
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import google.generativeai as genai

# Configure logging
logger = logging.getLogger(__name__)

# Initialize Gemini model
genai.configure(api_key="AIzaSyB8gETGUcZwHqUmF1dJIm_MYbeWjWBup3M")
model = genai.GenerativeModel('gemini-1.5-pro')

@csrf_exempt
def generate_synthetic_data(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid request method'}, status=405)

    try:
        # Log the raw request body
        logger.info(f"Raw request body: {request.body}")

        # Ensure Content-Type is JSON
        if request.content_type != 'application/json':
            logger.error("Invalid Content-Type. Expected 'application/json'.")
            return JsonResponse({'error': 'Invalid Content-Type. Expected application/json.'}, status=400)

        # Parse incoming JSON
        data = json.loads(request.body)
        prompt = data.get('prompt', '')
        rows = data.get('rows', 100)
        data_format = data.get('format', 'json')
        batch_size = data.get('batchSize', 1000)
        schema = data.get('schema', [])

        if not schema or not isinstance(schema, list):
            return JsonResponse({'error': 'Invalid or missing schema field'}, status=400)

        # Format the schema for prompt
        schema_description = ", ".join([f"{field['name']} ({field['type']})" for field in schema])
        full_prompt = (
            f"Generate {rows} rows of synthetic data with the following schema: {schema_description}. "
            f"Output format should be a JSON array."
        )

        if prompt:
            full_prompt += f"\nAdditional instructions: {prompt}"

        # Log the final prompt
        logger.info(f"Prompt to Gemini model: {full_prompt}")

        # Send prompt to Gemini
        response = model.generate_content(full_prompt)
        generated_text = response.text.strip()

        # Clean any Markdown-style code blocks
        if generated_text.startswith("```json"):
            generated_text = generated_text[7:].strip()
        if generated_text.startswith("```"):
            generated_text = generated_text[3:].strip()
        if generated_text.endswith("```"):
            generated_text = generated_text[:-3].strip()

        # Attempt to parse generated JSON
        generated_data = json.loads(generated_text)

        # Log a success message
        logger.info("Successfully parsed generated data.")

        return JsonResponse(generated_data, safe=False, status=200)

    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON received: {e}")
        return JsonResponse({'error': 'Invalid JSON in request or model response'}, status=400)
    except Exception as e:
        logger.exception("Unexpected error occurred.")
        return JsonResponse({'error': str(e)}, status=500)
