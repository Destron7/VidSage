# Inference Router — THE MOST IMPORTANT FILE
# Routes LLM calls to local GPU (LLaMA 3.2 3B) or Ollama Cloud (LLaMA 3.3 70B)
# All agents import this — never call Ollama directly from agent files
# Implements automatic fallback: Cloud → Local if Cloud is unavailable

import os
import httpx
import json
from dotenv import load_dotenv

load_dotenv()

OLLAMA_CLOUD_HOST = os.getenv("OLLAMA_CLOUD_HOST", "https://api.ollama.com")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_API_KEY = os.getenv("OLLAMA_API_KEY")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.3:70b")
OLLAMA_LOCAL_MODEL = os.getenv("OLLAMA_LOCAL_MODEL", "llama3.2:3b")

async def chat_cloud(messages: list, tools=None, format=None):
    """
    Routes to Ollama Cloud (heavy 70B model).
    Use for: term detection, research agent, summarization, long context analysis.
    Automatically falls back to local GPU if Cloud is unavailable.
    """
    try:
        payload = {
            "model": OLLAMA_MODEL,
            "messages": messages,
            "stream": False
        }
        if tools:
            payload["tools"] = tools
        if format:
            payload["format"] = format

        headers = {"Authorization": f"Bearer {OLLAMA_API_KEY}"}
        
        # 120s timeout is critical for long tasks like summarization
        async with httpx.AsyncClient(timeout=120.0) as client:
            print(f"[Router] Sending cloud request to {OLLAMA_MODEL}...")
            response = await client.post(f"{OLLAMA_CLOUD_HOST}/api/chat", json=payload, headers=headers)
            response.raise_for_status()
            return response.json()
            
    except Exception as e:
        print(f"❌ Cloud Error: {e}. Falling back to Local GPU...")
        return await chat_local(messages, tools, format)


async def chat_local(messages: list, tools=None, format=None):
    """
    Routes to local Ollama GPU (fast 3B model).
    Use for: voice intent classification — needs sub-3s response, no network latency.
    """
    try:
        payload = {
            "model": OLLAMA_LOCAL_MODEL,
            "messages": messages,
            "stream": False
        }
        if tools:
            payload["tools"] = tools
        if format:
            payload["format"] = format

        async with httpx.AsyncClient(timeout=60.0) as client:
            print(f"[Router] Sending local request to {OLLAMA_LOCAL_MODEL}...")
            response = await client.post(f"{OLLAMA_BASE_URL}/api/chat", json=payload)
            response.raise_for_status()
            return response.json()
            
    except Exception as e:
        print(f"❌ Local GPU Error: {e}")
        raise Exception("Both Cloud and Local Ollama are unavailable. Please check your connection.")


async def ask_llm(messages: list, tools=None, format=None):
    """
    Backwards-compatible alias — defaults to Cloud with automatic local fallback.
    """
    return await chat_cloud(messages, tools, format)