# FFmpeg Audio Extractor — Phase 1
# Extracts audio from video files for transcription

import os
import ffmpeg
from pathlib import Path


def extract_audio(video_path: str, output_dir: str = "./uploads") -> str:
    """
    Extracts 16kHz mono WAV audio from an MP4 file using FFmpeg.
    This format is optimized for Whisper's transcription pipeline.
    """
    video_path = Path(video_path)
    output_path = Path(output_dir) / (video_path.stem + ".wav")
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"🎵 Extracting audio from: {video_path.name}")
    
    (
        ffmpeg.input(str(video_path))
        .output(str(output_path), acodec='pcm_s16le', ac=1, ar='16000')
        .overwrite_output()
        .run(quiet=True)
    )
    
    return str(output_path)
