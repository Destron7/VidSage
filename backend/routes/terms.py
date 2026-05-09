# Terms API Routes — Phase 2 & 3
# Term detection SSE endpoint, references fetching
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import VideoDB
from agents.term_detector import extract_glossary
from agents.research_agent import run_research

import json
import urllib.parse

router = APIRouter()


def match_terms_to_timestamps(glossary: list, timed_segments: list) -> list:
    """Match each glossary term to its first occurrence in the timed transcript segments."""
    if not timed_segments:
        return glossary

    for term_entry in glossary:
        term_lower = term_entry["term"].lower()
        best_timestamp = None

        for seg in timed_segments:
            if term_lower in seg["text"].lower():
                best_timestamp = seg["start"]
                break  # first occurrence

        if best_timestamp is not None:
            term_entry["first_timestamp"] = best_timestamp
        elif "first_timestamp" not in term_entry:
            term_entry["first_timestamp"] = 0

    return glossary


@router.get("/{video_id}")
async def get_video_gloassary(
    video_id: int, 
    db: Session = Depends(get_db),
    refresh: bool = False
):
    video = db.query(VideoDB).filter(VideoDB.id == video_id).first()

    if not video or not video.transcription:
        raise HTTPException(status_code=400, detail="Transcription or Video not found")

    # Load timed segments for timestamp matching
    timed_segments = []
    if video.timed_segments:
        try:
            timed_segments = json.loads(video.timed_segments)
        except json.JSONDecodeError:
            timed_segments = []

    if video.glossary and not refresh:
        print("⚡ Fast load! Loading glossary directly from SQLite.")
        cached_glossary = json.loads(video.glossary)
        # Re-match timestamps in case segments were added after the glossary was cached
        cached_glossary = match_terms_to_timestamps(cached_glossary, timed_segments)
        return {"video_id": video.id, "glossary": cached_glossary}

    existing_terms_string = ""
    if video.glossary:
        existing_terms = json.loads(video.glossary)
        existing_terms_string = str([t['term'] for t in existing_terms])

    new_glossary = await extract_glossary(video.transcription)

    if video.glossary:
        final_glossary = json.loads(video.glossary) + new_glossary
    else:
        final_glossary = new_glossary

    # Match terms to their first occurrence timestamps
    final_glossary = match_terms_to_timestamps(final_glossary, timed_segments)

    video.glossary = json.dumps(final_glossary)
    db.commit()

    return {
        "video_id": video_id,
        "glossary": final_glossary
    }

@router.get("/research/{term_name}")
async def research_specific_term(term_name : str):
    # Explicitly decode to handle browser encoding differences (%20, %27 etc)
    term_name = urllib.parse.unquote(term_name)
    print(f"📡 API requested research for: {term_name}")
    
    # Run your agent!
    try:
        research_summary = await run_research(term_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Research failed: {str(e)}")
        
    # Return the LLM's final answer to the frontend
    return {
        "term": term_name,
        "research_summary": research_summary
    }


@router.get("/web/{term_name}")
async def web_search_term(term_name: str, max_results: int = 5):
    """Return raw web search results (title, url, snippet) for a term."""
    from mcp_tools.searxng_tool import web_search

    term_name = urllib.parse.unquote(term_name)
    print(f"🌐 API web search for: {term_name}")

    try:
        results = web_search(term_name, max_results=max_results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Web search failed: {str(e)}")

    return {
        "term": term_name,
        "results": results
    }