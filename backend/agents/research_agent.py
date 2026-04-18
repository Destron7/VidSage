# Research Agent — Phase 3
# Uses Ollama function calling to fetch references for detected terms
import wikipediaapi
import arxiv
import os

from dotenv import load_dotenv
from agents.inference_router import ask_llm

load_dotenv()

def search_wikipedia(term: str) -> dict:
    print(f"📖 Searching Wikipedia for: {term}")
    wiki = wikipediaapi.Wikipedia(
        'VidSageBot/1.0(test@example.com)',
        'en'
    )

    page = wiki.page(term)

    if not page.exists():
        return {"error": "Page not found"}

    return {
        "title": page.title,
        "url": page.fullurl,
        "summary": page.summary[:500] + "...",
        "content": page.text[:1000] + "..."
    }

def search_arxiv(query: str, max_results: int = 2) -> list:
    """Search ArXiv for academic papers on scientific/technical terms."""
    print(f"🔬 Searching ArXiv for: {query}")
    client = arxiv.Client()
    search = arxiv.Search(
        query=query,
        max_results=max_results,
        sort_by=arxiv.SortCriterion.Relevance
    )
    results = []
    for paper in client.results(search):
        results.append({
            "source": "arxiv",
            "title": paper.title,
            "url": paper.entry_id,
            "authors": [a.name for a in paper.authors[:3]],
            "summary": paper.summary[:300] + "..."
        })
    return results

def run_research(query: str):
    print(f"🧠 Research Agent activated for: {query}")

    messages = [
        {
            "role": "user", "content": f"""
        Please research this concept and write a 2-sentence summary. 
        Use Wikipedia for general definitions, and ArXiv for scientific/technical topics.
        If you already know the answer confidently, you may respond directly.
        
        Concept: {query}"""
        }
    ]

    print("🤖 Letting AI decide which tools to use...")
    # Expose both tools — LLM picks the right one per query type
    response = ask_llm(
        messages=messages,
        tools=[search_wikipedia, search_arxiv]
    )
    
    if response.message.tool_calls:
        for tool in response.message.tool_calls:
            tool_name = tool.function.name
            args = tool.function.arguments

            # Execute whichever tool the LLM chose
            if tool_name == 'search_wikipedia':
                result = search_wikipedia(args.get('term', query))
            elif tool_name == 'search_arxiv':
                result = search_arxiv(args.get('query', query), args.get('max_results', 2))
            else:
                result = {"error": f"Unknown tool: {tool_name}"}

            # Feed the tool result back into the conversation
            messages.append(response.message)
            messages.append({
                "role": "tool",
                "name": tool_name,
                "content": str(result)
            })

            # Final response after tool execution
            print("🧠 Facts retrieved. AI is writing final answer...")
            final_response = ask_llm(messages=messages)
            return final_response.message.content

    # If no tool calls were made, AI answered from its own knowledge
    return response.message.content

