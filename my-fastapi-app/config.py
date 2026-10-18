import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

API_KEY = os.getenv("AMD_API_KEY")
APP_BASE_URL = os.getenv("AMD_BASE_URL")
