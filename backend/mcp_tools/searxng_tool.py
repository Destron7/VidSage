# SearXNG Web Search Tool — Phase 3
# Self-hosted meta-search, no API key, no rate limits

import os
import httpx
from dotenv import load_dotenv

load_dotenv()

SEARXNG_URL = os.getenv("SEARXNG_URL", "http://localhost:18080")


def web_search(query: str, max_results: int = 3) -> list[dict]:
    """Search the web via self-hosted SearXNG for general explainers and tutorials.
    Requires the SearXNG Docker container to be running.
    """
    print(f"🌐 Web searching for: {query}")

    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.get(
                f"{SEARXNG_URL}/search",
                params={"q": query, "format": "json"}
            )
            response.raise_for_status()
            data = response.json()

        return [
            {
                "source": "web",
                "title": result.get("title", ""),
                "url": result.get("url", ""),
                "snippet": result.get("content", "")[:200]
            }
            for result in data.get("results", [])[:max_results]
        ]
    except Exception as e:
        print(f"⚠️ SearXNG unavailable: {e}")
        return []
