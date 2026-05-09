# Reports API Routes — Phase 5
# PDF export endpoint

import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import VideoDB, NoteDB
from reports.pdf_generator import generate_session_report

import os

router = APIRouter()

@router.get("/pdf/{video_id}")
async def generate_pdf_report(video_id: int, db: Session = Depends(get_db)):
    video = db.query(VideoDB).filter(VideoDB.id == video_id).first()
    
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
        
    # Gather glossary/terms
    terms = []
    if video.glossary:
        terms_data = json.loads(video.glossary)
        for t in terms_data:
            terms.append({
                "term": t.get("term", ""),
                "summary": t.get("definition", t.get("summary", "")),  # handle both 'definition' or 'summary'
                "first_timestamp": 0,  # add actual parsed data later if available
                "domain": "general"
            })
            
    # Gather notes from the database
    db_notes = db.query(NoteDB).filter(NoteDB.video_id == video_id).all()
    notes = []
    for n in db_notes:
        notes.append({
            "text": getattr(n, "content", ""),
            "timestamp": getattr(n, "timestamp", 0),
            "note_type": getattr(n, "note_type", "general")
        })

    session_data = {
        "terms": terms,
        "notes": notes
    }

    pdf_path = f"uploads/report_{video.id}.pdf"
    os.makedirs("uploads", exist_ok=True)
    
    # Generate the beautiful format utilizing our new ReportLab generator
    generate_session_report(session_data, pdf_path)
    
    title = video.title or video.filename or f"Video_{video.id}"
    return FileResponse(
        path=pdf_path, 
        filename=f"{title}_Report.pdf", 
        media_type='application/pdf'
    )
