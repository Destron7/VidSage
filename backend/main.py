from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import db.database
import uvicorn

# Importing routers
from routes.video import router as video_router
from routes.terms import router as term_router
from routes.notes import router as note_router
from routes.reports import router as report_router
from utils.sse_manager import sse_manager
# from processing.wake_word import WakeWordEngine
# from agents.voice_agent import parse_intent
from fastapi.responses import StreamingResponse
import asyncio

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(video_router, prefix="/api/v1/video", tags=["Video"])
app.include_router(term_router, prefix="/api/v1/terms", tags=["Terms"])
app.include_router(note_router, prefix="/api/v1/notes", tags=["Notes"])
app.include_router(report_router, prefix="/api/v1/reports", tags=["Reports"])

# Make the uploads folder publicly accessible via static files
import os
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# SSE Hub for real-time voice & job updates
@app.get("/api/v1/voice/stream")
async def voice_stream():
    return StreamingResponse(sse_manager.subscribe(), media_type="text/event-stream")

# Voice Command Callback
# def handle_voice_command(text: str):
#     """
#     Called from the WakeWordEngine thread.
#     Bridges to the main async loop to parse intent and broadcast.
#     """
#     if not hasattr(app.state, 'voice_engine'): return
#     
#     # Get the main event loop we captured at startup
#     loop = sse_manager.loop
#     if not loop: return
# 
#     # Run the async parser in the main loop and handle completion
#     async def process():
#         intent = await parse_intent(text)
#         sse_manager.broadcast("voice_intent", intent)
#         
#     asyncio.run_coroutine_threadsafe(process(), loop)

# Startup: Initialize background WakeWord listener
@app.on_event("startup")
async def startup_event():
    # Capture the running loop for thread-safe SSE broadcasts
    loop = asyncio.get_running_loop()
    sse_manager.set_loop(loop)
    
    # app.state.voice_engine = WakeWordEngine(trigger_callback=handle_voice_command)
    # app.state.voice_engine.start()

@app.on_event("shutdown")
async def shutdown_event():
    if hasattr(app.state, 'voice_engine'):
        app.state.voice_engine.stop()

@app.get("/")
async def read_root():
    return {"message":"Welcome to VidSage API!!"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="localhost", port=8000, reload=True)
