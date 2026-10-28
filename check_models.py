import os
from google import genai
from dotenv import load_dotenv

# Fix for the Python 3.14 Protobuf issue
os.environ["PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION"] = "python"

load_dotenv() 
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

print("\n--- AVAILABLE MODELS FOR YOUR API KEY ---")
try:
    for model in client.models.list():
        print(model.name)
except Exception as e:
    print("Error connecting to Google:", e)
print("-----------------------------------------\n")