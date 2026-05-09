# Research Agent — Phase 3
# Uses Ollama function calling to fetch references for detected terms
# Tools live in mcp_tools/ — this agent just orchestrates them

import os
from dotenv import load_dotenv

from agents.inference_router import chat_cloud
from mcp_tools.wikipedia_tool import search_wikipedia
from mcp_tools.arxiv_tool import search_arxiv
from mcp_tools.searxng_tool import web_search

load_dotenv()

# In-Memory Cache (Cleared on backend restart)
RESEARCH_CACHE = {}


# Strict Persona Instructions
SYSTEM_PROMPT = """
You are a Technical Reference Agent for VidSage. 
Your goal is to provide deep, factual research for a specific concept.

CRITICAL GUIDELINES:
1. PERSONA: Be objective, academic, and technical. 
2. NO CHATBOT FLUFF: Do not use greetings, concluding remarks, emojis, or conversational fillers (e.g., "Here is what I found", "Let me know if you need more").
3. FORMAT: Use structured Markdown headers.
4. ACCURACY: Prioritize information retrieved from tools (Wikipedia, ArXiv, Web).

REQUIRED STRUCTURE:
### Technical Definition
[One-paragraph technical definition of the concept]

### Context & Mechanics
[One-paragraph explaining the underlying mechanics, math, or logic behind the concept]

### Academic & Documentation Resources
- [Title](URL) - Brief 1-sentence significance of this source.
"""

async def run_research(query: str):
    # Normalize query for cache keys (ensure no extra encoding artifacts)
    cache_key = query.strip().lower()
    
    if cache_key in RESEARCH_CACHE:
        print(f"✅ [CACHE HIT] Serving research for: '{cache_key}'")
        return RESEARCH_CACHE[cache_key]

    print(f"🔍 [CACHE MISS] Researching new term: '{cache_key}'")

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user", "content": f"Please research and provide a technical reference for: {query}"
        }
    ]

    # Tool Schemas for Ollama/OpenAI Tool-calling
    tools = [
        {
            "type": "function",
            "function": {
                "name": "search_wikipedia",
                "description": "Get a Wikipedia summary and article URL for a term. Use for general definitions and history.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "term": {"type": "string", "description": "The term to search for"},
                        "language": {"type": "string", "description": "en or hi"}
                    },
                    "required": ["term"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "search_arxiv",
                "description": "Search academic papers on ArXiv. Use for scientific and technical terms.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "The search query"},
                        "max_results": {"type": "integer", "description": "Maximum papers to return"}
                    },
                    "required": ["query"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "web_search",
                "description": "Search the web for general explainers, recent news, and tutorials.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "The search query"},
                        "max_results": {"type": "integer", "description": "Maximum links to return"}
                    },
                    "required": ["query"]
                }
            }
        }
    ]

    # Cloud Route: Expose research tools to the high-reasoning model
    response = await chat_cloud(
        messages=messages,
        tools=tools
    )
    
    if response.get('message', {}).get('tool_calls'):
        for tool in response['message']['tool_calls']:
            tool_name = tool['function']['name']
            args = tool['function']['arguments']

            # Execute whichever tool the LLM chose
            if tool_name == 'search_wikipedia':
                result = search_wikipedia(
                    args.get('term', query),
                    args.get('language', 'en')
                )
            elif tool_name == 'search_arxiv':
                result = search_arxiv(
                    args.get('query', query),
                    args.get('max_results', 2)
                )
            elif tool_name == 'web_search':
                result = web_search(
                    args.get('query', query),
                    args.get('max_results', 3)
                )
            else:
                result = {"error": f"Unknown tool: {tool_name}"}

            # Feed the tool result back into the conversation
            messages.append(response['message'])
            messages.append({
                "role": "tool",
                "name": tool_name,
                "content": str(result)
            })

            # Final response after tool execution using the Cloud model
            print("🧠 Facts retrieved. AI is writing final answer...")
            
            # Final structural reminder to prevent chatbot drift during synthesis
            messages.append({
                "role": "user", 
                "content": "Now synthesize the retrieved facts into the required 3-section technical reference format. Remember: No fluff, no emojis, no greetings."
            })
            
            final_response = await chat_cloud(messages=messages)
            
            answer = final_response['message']['content']
            RESEARCH_CACHE[cache_key] = answer
            return answer

    # If no tool calls were made, AI answered from its own knowledge
    answer = response['message']['content']
    RESEARCH_CACHE[cache_key] = answer
    return answer
