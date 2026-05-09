import asyncio
import os
import httpx
from dotenv import load_dotenv

# Path: backend/test_llm.py
async def main():
    load_dotenv()
    
    url = os.getenv("OLLAMA_CLOUD_HOST")
    key = os.getenv("OLLAMA_API_KEY")
    model = os.getenv("OLLAMA_MODEL")
    
    print(f"Testing connectivity to {url} with model {model}...")
    
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": "Say 'Ollama Cloud is working'"}],
        "stream": False
    }
    
    headers = {"Authorization": f"Bearer {key}"}
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(f"{url}/api/chat", json=payload, headers=headers)
            print(f"Status: {resp.status_code}")
            if resp.status_code == 200:
                print("Success!")
                print(resp.json()['message']['content'])
            else:
                print(f"Failed: {resp.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
