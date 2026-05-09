# Term Detection Agent — Phase 2
# Detects complex/technical terms in transcripts using LLaMA 3.1 8B

from ollama import Client
from dotenv import load_dotenv
from agents.inference_router import chat_cloud  # Use heavy Cloud model for extraction

import os
import json

load_dotenv()

async def extract_glossary(transcription: str):
    print("🧠 AI: Extracting glossary from transcript...")

    prompt = f"""
    You are a expert technical glossary creator.
    Find the complex or technical terms in the following transcript and define them.

    you must strictly return a JSON format array of objects. Do not include markdown blocks like ```json.
    Example format:
    [
        {{
            "term": "Quantum",
            "definition": "A physics term..."
        }},
        {{
            "term": "Photosynthesis",
            "definition": "Plants respiration system"
        }}
    ]

    Transcript:\n{transcription}

    Return only the JSON array.
    """

    # Cloud Route: Uses Reasoning model (No tools required for detection)
    response = await chat_cloud(
        messages = [
            {
                'role':'user',
                'content':prompt
            }
        ],
        tools=None
    )

    raw_json_output = response['message']['content']

    # Cleaning up the JSON output
    try:
        glossary = json.loads(raw_json_output)
    except json.JSONDecodeError:
        print("❌ AI returned invalid JSON. Retrying...")
        return []

    return glossary