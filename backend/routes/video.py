from fastapi import APIRouter, UploadFile, File, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db.database import get_db, sessionLocal
from db.models import VideoDB

from processing.whisper_stt import extract_text
from processing.ytdlp_downloader import video_downloader

from agents.inference_router import ask_llm
from agents.voice_agent import parse_intent

from dotenv import load_dotenv

import shutil
import time
import ffmpeg
import os

# Loading .env file
load_dotenv()

# Initialising the router
router = APIRouter()

# Video route testing API.
@router.get("/test")
async def test_video_route():
    return {"message":"Video route is working!!"}

# URL upload Schema
class YoutubeRequest(BaseModel):
    url: str

# API for uploading Youtube Video URL.
@router.post("/youtube")
async def upload_video_from_youtube(
    request: YoutubeRequest,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db)
):
    
    # Downloading the Video using processing.ytdl_downloader
    video_data = video_downloader(request.url)

    # getting object for VideoDB
    new_video = VideoDB(
        filename=video_data["filename"],
        title=video_data["title"],
        duration=video_data["duration"],
        youtube_url=request.url,
        status="processing",
    )

    db.add(new_video)
    db.commit()
    db.refresh(new_video)

    background_tasks.add_task(transcribe_video_task, new_video.id, video_data["filename"])

    return {"message": f"Successfully received youtube URL: {request.url}", "DB_id": new_video.id}


# Time simulation function
def transcribe_video_task(video_id: int, filename: str):
    print(f"🤖 AI: Starting transcription for {filename}...")

    # Construct the exact path where we saved the video
    file_path = f"uploads/{filename}"

    # Run the AI! 
    # (This might take a few seconds depending on the computer)
    transcribed_text = extract_text(file_path)

    # Opening the fresh session for background task.
    db = sessionLocal()
    try:
        video = db.query(VideoDB).filter(VideoDB.id == video_id).first()
    
        if video:
            video.status = "completed"
            video.transcription = transcribed_text
            db.commit()
            print(f"✅ AI: Database updated! {filename} is ready for chat.")
    finally:
        db.close()


# API for uploading local video file.
@router.post("/local")
async def upload_video_from_local(
    file: UploadFile = File(...), 
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db)
    ):
    # Path to store the video at location.
    file_location = f"uploads/{file.filename}"

    # Write the file to the disk
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Get duration using ffmpeg
    try:
        probe = ffmpeg.probe(file_location)
        duration = float(probe['format']['duration'])
    except Exception as e:
        print("Failed to read video duration:", e)
        duration = 0

    clean_title = file.filename.rsplit('.', 1)[0]

    new_video = VideoDB(filename=file.filename, title=clean_title, duration=duration, status="processing")

    db.add(new_video)
    db.commit()
    db.refresh(new_video)

    background_tasks.add_task(transcribe_video_task, new_video.id, file.filename)

    return {
        "message": f"file uploaded successfully",
        "filename": file.filename,
        "content_type": file.content_type,
        "size": file.size,
        "file_location": file_location,
        "DB_id": new_video.id
    }

# Endpoint to check the status of the video being uploaded
@router.get("/status/{video_id}")
async def get_video_status(video_id: int, db: Session = Depends(get_db)):
    video = db.query(VideoDB).filter(VideoDB.id == video_id).first()

    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    return {
        "id": video.id,
        "filename": video.filename,
        "status": video.status
    }

@router.get("/data/{video_id}")
async def get_video_data(video_id: int, db: Session = Depends(get_db)):
    video = db.query(VideoDB).filter(VideoDB.id == video_id).first()

    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    return {
        "id": video.id,
        "title": video.title,
        "duration": video.duration,
        "filename": video.filename,
        "youtube_url": video.youtube_url,
        "status": video.status,
        "transcription": video.transcription
    }

# Converting Seconds to human readable timestamp string format
def format_duration(seconds) -> str:
    seconds = int(seconds or 0)
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    secs = seconds % 60
    
    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    else:
        return f"{minutes:02d}:{secs:02d}"


@router.get("/all")
async def get_all_videos(db: Session = Depends(get_db)):
    videos = db.query(VideoDB).all()
    video_list = []
    for v in videos:
        video_list.append({
            "id": v.id,
            "filename": v.filename,
            "status": v.status,
            "title": v.title,
            "duration": format_duration(v.duration),
            "youtube_url": v.youtube_url,
            "transcription": v.transcription
        })
    return {"videos": video_list}

@router.get("/summary/{video_id}")
async def get_video_summary(
    video_id: int,
    db: Session = Depends(get_db)
):
    video = db.query(VideoDB).filter(VideoDB.id == video_id).first()

    if not video or not video.transcription:
        raise HTTPException(status_code=400, detail="Transcription or Video not found")

    # ⚡ Cache hit: return existing summary without calling Cloud LLM
    if video.summary:
        print("⚡ Fast load! Returning cached summary from DB.")
        return {"summary": video.summary}

    # Build the prompt
    prompt = f"""
    You are a video summarization expert.
    Summarize the following video transcription in bullet points.
    
    Transcription:\n{video.transcription}
    
    Summary:\n
    """

    # Generate summary
    response = ask_llm(
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ]
    )

    summary = response['message']['content']

    # Update video with summary
    video.summary = summary
    db.commit()

    return {
        "summary": summary
    }
    

class VoiceCommand(BaseModel):
    command: str

@router.post("/voice")
async def handle_voice_command(request: VoiceCommand):
    # This takes the text from React, passes it to your LLM agent, and returns the strict JSON Intent!
    intent_json = parse_intent(request.command)
    return intent_json