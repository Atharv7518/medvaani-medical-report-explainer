import os
os.environ["PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION"] = "python"

import pdfplumber
import re
from openai import OpenAI  # <-- NEW PACKAGE IMPORT
from dotenv import load_dotenv

def extract_text_from_pdf(file_path):
    extracted_text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
        return extracted_text
    except Exception as e:
        return f"Error reading PDF: {str(e)}"

def parse_medical_data(raw_text):
    extracted_results = []
    lines = raw_text.split('\n')
    
    for line in lines:
        match = re.search(r'([A-Za-z\s]+)\s+(\d+\.?\d*)\s+([A-Za-z/%]+)', line)
        
        if match:
            test_name = match.group(1).strip()
            value = match.group(2).strip()
            unit = match.group(3).strip()
            
            if len(test_name) > 3:
                is_uncertain = False
                if not value.replace('.', '', 1).isdigit() or len(value) > 6:
                    is_uncertain = True
                
                extracted_results.append({
                    'test_name': test_name,
                    'value': value,
                    'unit': unit,
                    'reference_range': 'Not found',
                    'is_uncertain': is_uncertain
                })
                
    return extracted_results


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