# Terms API Routes — Phase 2 & 3
# Term detection SSE endpoint, references fetching
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import VideoDB
from agents.term_detector import extract_glossary
from agents.research_agent import run_research

import json

router = APIRouter()

@router.get("/{video_id}")
async def get_video_gloassary(
    video_id: int, 
    db: Session = Depends(get_db),
    refresh: bool = False
):
    video = db.query(VideoDB).filter(VideoDB.id == video_id).first()

    if not video or not video.transcription:
        raise HTTPException(status_code=400, detail="Transcription or Video not found")

    if video.glossary and not refresh:
        print("⚡ Fast load! Loading glossary directly from SQLite.")
        # We saved it as a string, so we convert it back to python lists to return it nicely
        return {"video_id": video.id, "glossary": json.loads(video.glossary)}

    existing_terms_string = ""
    if video.glossary:
        existing_terms = json.loads(video.glossary)
        existing_terms_string = str([t['term'] for t in existing_terms])

    new_glossary = extract_glossary(video.transcription)

    if video.glossary:
        final_glossary = json.loads(video.glossary) + new_glossary
    else:
        final_glossary = new_glossary

    video.glossary = json.dumps(final_glossary)
    db.commit()

    return {
        "video_id": video_id,
        "glossary": final_glossary
    }

@router.get("/research/{term_name}")
async def research_specific_term(term_name : str):
    print(f"📡 API requested research for: {term_name}")
    
    # Run your agent!
    try:
        research_summary = run_research(term_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Research failed: {str(e)}")
        
    # Return the LLM's final answer to the frontend
    return {
        "term": term_name,
        "research_summary": research_summary
    }