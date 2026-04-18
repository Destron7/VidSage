# Notes API Routes — Phase 5
# CRUD for voice-created notes and reminders
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from db.database import get_db
from db.models import NoteDB

router = APIRouter()

class NoteCreate(BaseModel):
    video_id: int
    content: str

@router.post("/{video_id}")
async def create_note(
    request: NoteCreate,
    db: Session = Depends(get_db)
):
    new_note = NoteDB(
        video_id = request.video_id,
        content = request.content
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    
    return {"message": "Note created successfully", "note_id": new_note.id} 

@router.get("/{video_id}")
async def get_notes_for_video(video_id: int, db: Session = Depends(get_db)):
    # Fetch an array of all notes where the video_id matches
    notes = db.query(NoteDB).filter(NoteDB.video_id == video_id).all()
    return {"notes": [{"id": n.id, "content": n.content} for n in notes]}

class NoteUpdate(BaseModel):
    content: str
    
@router.put("/{note_id}")
async def update_note(
    note_id: int,
    request: NoteUpdate,
    db: Session = Depends(get_db)
):
    note = db.query(NoteDB).filter(NoteDB.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    note.content = request.content
    db.commit()
    db.refresh(note)
    return {"message": "Note updated successfully", "note_id": note.id}

@router.delete("/{note_id}")
async def delete_note(note_id: int, db: Session = Depends(get_db)):
    note = db.query(NoteDB).filter(NoteDB.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(note)
    db.commit()
    return {"message": "Note deleted successfully"}