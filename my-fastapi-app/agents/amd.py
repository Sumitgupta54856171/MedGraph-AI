from config import API_KEY,APP_BASE_URL
from openai import OpenAI

client = OpenAI(
    api_key=API_KEY,
    base_url='https://developer.amd.com.cn/radeon/api/v1',
)

resp = client.chat.completions.create(
    model='Gemma-4-31B-IT',
messages=[{"role": "user", "content": "Reply in 5 words: Is AMD ROCm working?"}]
)
print("Model response : ",resp.choices[0].message.content)
