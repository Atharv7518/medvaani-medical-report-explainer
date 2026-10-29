import os
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv

# Load the environment variables to get OPENROUTER_API_KEY
env_path = Path('.env')
load_dotenv(dotenv_path=env_path)

# Initialize the OpenRouter client
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

try:
    print("Fetching available models from OpenRouter...\n")
    models = client.models.list()
    
    # Print the ID of every available model
    for model in models.data:
        print(f"- {model.id}")
        
except Exception as e:
    print(f"Error connecting to OpenRouter: {e}")