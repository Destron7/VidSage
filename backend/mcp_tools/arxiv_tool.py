# ArXiv Academic Paper Search Tool — Phase 3
# Searches academic papers on ArXiv for scientific terms

import arxiv


def search_arxiv(query: str, max_results: int = 2) -> list[dict]:
    """Search ArXiv for academic papers. Use for scientific and technical terms."""
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
