# Reports API Routes — Phase 5
# PDF export endpoint

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import VideoDB

from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

import json
import os

router = APIRouter()

@router.get("/pdf/{video_id}")
async def generate_pdf_report(video_id: int, db: Session = Depends(get_db)):
    video = db.query(VideoDB).filter(VideoDB.id == video_id).first()
    
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
        
    # We will save the PDF inside our existing uploads folder
    pdf_path = f"uploads/report_{video.id}.pdf"
    
    # Setup the empty Document
    doc = SimpleDocTemplate(pdf_path, pagesize=letter)
    styles = getSampleStyleSheet()
    story = [] # This list holds all the paragraphs we want to draw
    
    # 1. Draw the Title
    title = video.title or video.filename
    story.append(Paragraph(f"VidSage AI Report: {title}", styles['Title']))
    story.append(Spacer(1, 12))
    
    # 2. Draw the Summary
    story.append(Paragraph("Video Summary", styles['Heading2']))
    if video.summary:
        # Replace python newlines with HTML breaks for the PDF drawer
        formatted_summary = video.summary.replace('\n', '<br/>')
        story.append(Paragraph(formatted_summary, styles['BodyText']))
    else:
        story.append(Paragraph("No summary generated yet.", styles['BodyText']))
    story.append(Spacer(1, 12))
    
    # 3. Draw the Glossary
    story.append(Paragraph("Technical Glossary", styles['Heading2']))
    if video.glossary:
        glossary_data = json.loads(video.glossary)
        for term in glossary_data:
            # We use <b> HTML tags to make the term strictly bold!
            term_string = f"<b>{term['term']}:</b> {term['definition']}"
            story.append(Paragraph(term_string, styles['BodyText']))
            story.append(Spacer(1, 6))
    else:
        story.append(Paragraph("No glossary generated yet.", styles['BodyText']))
        
    # Compile all the paragraphs and draw the actual PDF file to the hard drive!
    doc.build(story)
    
    # Tell FastAPI to return a downloadable file!
    return FileResponse(
        path=pdf_path, 
        filename=f"{title}_Report.pdf", 
        media_type='application/pdf'
    )

