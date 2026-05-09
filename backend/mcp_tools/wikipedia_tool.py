# Wikipedia Search Tool — Phase 3
# Fetches Wikipedia summaries (EN + HI)

import wikipediaapi


def search_wikipedia(term: str, language: str = "en") -> dict | None:
    """Get a Wikipedia summary and article URL for a term.
    Supports English and Hindi. Falls back to English if term not found in Hindi.
    """
    print(f"📖 Searching Wikipedia for: {term} ({language})")

    wiki = wikipediaapi.Wikipedia(
        'VidSageBot/1.0 (test@example.com)',
        language
    )
    page = wiki.page(term)

    # Fallback: try English if the requested language page doesn't exist
    if not page.exists() and language != "en":
        wiki_en = wikipediaapi.Wikipedia('VidSageBot/1.0 (test@example.com)', 'en')
        page = wiki_en.page(term)

    # Fallback: try just the first word (handles multi-word queries)
    if not page.exists():
        wiki_en = wikipediaapi.Wikipedia('VidSageBot/1.0 (test@example.com)', 'en')
        page = wiki_en.page(term.split()[0])

    if not page.exists():
        return None

    return {
        "source": "wikipedia",
        "title": page.title,
        "url": page.fullurl,
        "summary": page.summary[:500] + "...",
        "content": page.text[:1000] + "..."
    }
