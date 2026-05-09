"""Quick test for SearXNG web search tool."""
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("SEARXNG_URL", "http://localhost:18080")
print(f"Testing SearXNG at: {url}")

try:
    with httpx.Client(timeout=5.0) as client:
        response = client.get(f"{url}/search", params={"q": "What is F35-A!?", "format": "json"})
        response.raise_for_status()
        data = response.json()
    
    results = data.get("results", [])[:5]
    print(f"\n✅ Got {len(results)} results:\n")
    for i, r in enumerate(results, 1):
        print(f"  {i}. {r.get('title', 'No title')}")
        print(f"     URL: {r.get('url', '')}")
        print(f"     Snippet: {r.get('content', '')[:100]}...")
        print()
        
except httpx.ConnectError:
    print("\n❌ SearXNG is NOT running. Start it with:")
    print("   docker-compose up -d")
except Exception as e:
    print(f"\n❌ Error: {e}")
