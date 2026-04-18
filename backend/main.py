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

@app.get("/")
async def read_root():
    return {"message":"Welcome to VidSage API!!"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="localhost", port=8000, reload=True)
