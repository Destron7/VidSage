# Inference Router — THE MOST IMPORTANT FILE
# Routes LLM calls to local GPU (LLaMA 3.2 3B) or Ollama Cloud (LLaMA 3.3 70B)
# All agents import this — never call Ollama directly from agent files
# Implements automatic fallback: Cloud → Local if Cloud is unavailable

import os
from ollama import Client
from dotenv import load_dotenv

load_dotenv()

def _get_cloud_client() -> Client:
    return Client(
        host=os.getenv("OLLAMA_CLOUD_HOST"),
        headers={"Authorization": f"Bearer {os.getenv('OLLAMA_API_KEY')}"}
    )

def _get_local_client() -> Client:
    return Client(host=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"))


def chat_cloud(messages: list, tools=None):
    """
    Routes to Ollama Cloud (heavy 70B model).
    Use for: term detection, research agent, summarization, long context analysis.
    Automatically falls back to local GPU if Cloud is unavailable.
    """
    try:
        client = _get_cloud_client()
        return client.chat(
            model=os.getenv("OLLAMA_MODEL"),
            messages=messages,
            tools=tools
        )
    except Exception as e:
        print(f"❌ Cloud Error: {e}. Falling back to Local GPU...")
        return chat_local(messages, tools)


def chat_local(messages: list, tools=None):
    """
    Routes to local Ollama GPU (fast 3B model).
    Use for: voice intent classification — needs sub-3s response, no network latency.
    Raises if local is also unavailable.
    """
    try:
        client = _get_local_client()
        return client.chat(
            model=os.getenv("OLLAMA_LOCAL_MODEL", "llama3.2:3b"),
            messages=messages,
            tools=tools
        )
    except Exception as e:
        print(f"❌ Local GPU Error: {e}")
        raise Exception("Both Cloud and Local Ollama are unavailable. Please check your connection.")


# Backwards-compatible alias — defaults to Cloud with automatic local fallback.
# Old agents that already use ask_llm() continue to work without any changes.
def ask_llm(messages: list, tools=None):
    return chat_cloud(messages, tools)