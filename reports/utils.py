import os
os.environ["PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION"] = "python"

import json
import base64
import fitz  # PyMuPDF for rendering PDFs to images
from openai import OpenAI
from dotenv import load_dotenv

# Initialize the new SDK Client
load_dotenv()
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

def extract_text_from_pdf(file_path):
    """Converts PDF pages into base64 images so the AI can 'see' scanned reports."""
    base64_images = []
    try:
        doc = fitz.open(file_path)
        # Limit to the first 3 pages to prevent token limit errors on free models
        for page_num in range(min(3, len(doc))):
            page = doc.load_page(page_num)
            # Zoom in 2x for better image resolution (helps AI read small test values)
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            img_bytes = pix.tobytes("jpeg")
            base64_str = base64.b64encode(img_bytes).decode("utf-8")
            base64_images.append(base64_str)
        return base64_images
    except Exception as e:
        print(f"PDF Image Conversion Error: {e}", flush=True)
        return []

def parse_medical_data(base64_images):
    if not base64_images:
        return []

    # 1. Build the prompt text for the AI
    content_list = [
        {
            "type": "text",
            "text": """You are an expert medical data extractor. I have attached images of a lab report.
            Extract all standard test results from these images.
            Return ONLY a raw JSON array of objects. Do NOT wrap the JSON in markdown blocks or backticks.
            Required JSON Format: [{"test_name": "Hemoglobin", "value": "12.5", "unit": "g/dL", "reference_range": "12.0 - 15.5", "is_uncertain": false}]"""
        }
    ]

    # 2. Attach every page image to the OpenAI request payload
    for b64_img in base64_images:
        content_list.append({
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{b64_img}"}
        })

    try:
        # We must use Gemini Flash here because it natively supports Vision (reading images)
        response = client.chat.completions.create(
            model='openrouter/free', 
            messages=[{"role": "user", "content": content_list}],
            temperature=0.1
        )
        
        output = response.choices[0].message.content.strip()
        
        # Clean up any formatting the AI stubbornly leaves behind
        if output.startswith("```json"):
            output = output[7:-3].strip()
        elif output.startswith("```"):
            output = output[3:-3].strip()
            
        extracted_results = json.loads(output)
        return extracted_results
        
    except Exception as e:
        print(f"Vision Data Extraction Error: {e}", flush=True)
        return []



def generate_medical_explanation(extracted_results, target_language="Hindi"):
    data_text = ""
    for item in extracted_results:
        data_text += f"- {item.test_name}: {item.value} {item.unit}\n"
    
    prompt = f"""
    You are a helpful medical assistant explaining a lab report to a patient.
    Here is the extracted data from the user's report:
    {data_text}
    
    RULES:
    1. Write the explanation entirely in {target_language}.
    2. Use simple, everyday, conversational {target_language} that an elderly person can understand.
    3. Explain what these tests measure.
    4. DO NOT diagnose any diseases or recommend medications.
    5. Keep the explanation to 3 or 4 short paragraphs.
    6. Always advise the patient to consult their doctor for clinical advice.
    """
    
    try:
        # NEW SYNTAX
        response = client.chat.completions.create(
            model='openrouter/free', # Replace with any OpenRouter model string
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"\n--- AI ERROR ---")
        print(str(e))
        print("----------------\n")
        return "Sorry, we could not generate an explanation at this time. Please try again."


def generate_doctor_questions(extracted_results, target_language="Hindi"):
    data_text = ""
    for item in extracted_results:
        data_text += f"- {item.test_name}: {item.value} {item.unit}\n"
    
    prompt = f"""
    Based on the following medical test results:
    {data_text}
    
    Please generate 3 to 4 specific, polite questions the patient should ask their doctor during their next visit.
    
    RULES:
    1. Write the questions entirely in {target_language}.
    2. Format it as a simple bulleted list.
    3. Do NOT diagnose the patient. 
    4. Focus on asking the doctor about what specific values mean or what next steps should be taken.
    """
    
    try:
        # NEW SYNTAX
        response = client.chat.completions.create(
            model='openrouter/free', # Replace with any OpenRouter model string
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        return "Sorry, we could not generate questions at this time."

def generate_chat_response(extracted_results, explanation_text, user_question, target_language="Hindi"):
    data_text = ""
    for item in extracted_results:
        data_text += f"- {item.test_name}: {item.value} {item.unit}\n"
    
    prompt = f"""
    You are a helpful medical assistant. A patient is asking a question about their lab report.
    
    Report Data:
    {data_text}
    
    Original AI Explanation given to patient:
    {explanation_text}
    
    Patient's Question:
    {user_question}
    
    RULES:
    1. Answer entirely in {target_language}.
    2. Base your answer ONLY on the provided report data and standard medical reference information.
    3. DO NOT diagnose the patient, prescribe treatments, or suggest medication.
    4. If the question requires unavailable clinical information (like "Why am I feeling dizzy?"), decline politely and advise them to ask their doctor.
    5. Keep the answer to 1 or 2 short paragraphs.
    """
    
    try:
        # NEW SYNTAX
        response = client.chat.completions.create(
            model='openrouter/free', # Replace with any OpenRouter model string
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        return "Sorry, I could not process your question right now."