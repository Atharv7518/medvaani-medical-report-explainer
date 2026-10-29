import os
os.environ["PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION"] = "python"

import json
import re
import pdfplumber
from openai import OpenAI
from dotenv import load_dotenv

def extract_text_from_pdf(file_path):
    extracted_text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
        
        # --- NEW DEBUG PRINTS ---
        print(f"\n--- DEBUG: Extracted {len(extracted_text)} characters from PDF ---")
        print(f"--- DEBUG TEXT PREVIEW: {extracted_text[:200]} ---\n")
        # ------------------------
        
        return extracted_text
    except Exception as e:
        print(f"PDF Error: {str(e)}")
        return f"Error reading PDF: {str(e)}"

def parse_medical_data(raw_text):
    # Failsafe for empty or heavily scanned images
    if not raw_text or len(raw_text.strip()) < 15:
        return [] 

    prompt = f"""
    You are a medical data extractor. Extract all test results from this messy OCR text.
    Return ONLY a raw JSON array of objects. Do not include markdown formatting, backticks, or explanations.
    
    Required JSON Format: 
    [{{"test_name": "Hemoglobin", "value": "12.5", "unit": "g/dL", "reference_range": "12.0 - 15.5", "is_uncertain": false}}]

    Lab Report Text:
    {raw_text}
    """
    
    try:
        response = client.chat.completions.create(
            # Using a highly capable model for data extraction
            model='openrouter/auto:free', 
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1 # Low temperature for strict factual extraction
        )
        
        output = response.choices[0].message.content.strip()
        
        # Clean up any markdown blocks the AI might accidentally wrap the JSON in
        if output.startswith("```json"):
            output = output[7:-3].strip()
        elif output.startswith("```"):
            output = output[3:-3].strip()
            
        extracted_results = json.loads(output)
        return extracted_results
        
    except Exception as e:
        print(f"Data Extraction Error: {e}")
        return []


# Initialize the new SDK Client
load_dotenv()
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

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