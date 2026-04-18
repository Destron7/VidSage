# Voice Command Agent — Phase 5
# Parses voice commands into structured intents using LLaMA 3.1 8B

import json
from agents.inference_router import chat_local  # Fast: no network latency for voice UX

def parse_intent(command_text: str) -> dict:
    print(f"🎙️ AI parsing voice command: '{command_text}'")
    
    prompt = f"""
    You are an intent classification system. Read the user's voice command and categorize what they want to do.
    You must strictly return a raw JSON object. Do not include markdown blocks like ```json.
    
    Choose exactly one of these actions:
    - "generate_summary" (User wants a short summary of the video)
    - "detect_terms" (User wants a glossary, definitions, or hard words found)
    - "research_concept" (User wants to look something up on Wikipedia or research a topic)
    - "unknown" (Command does not match the others)
    
    Example output format:
    {{"action": "generate_summary"}}
    
    User Command:\n{command_text}
    
    Return only the JSON object.
    """
    
    # LOCAL GPU — sub-3s response, perfect for voice UX (no Cloud network latency)
    response = chat_local(
        messages=[{"role": "user", "content": prompt}]
    )
    
    raw_json = response['message']['content']
    
    try:
        intent_data = json.loads(raw_json)
        return intent_data
    except json.JSONDecodeError:
        print(f"❌ Intent parser failed to return valid JSON. Output: {raw_json}")
        return {"action": "unknown"}
