# YouTube Downloader via yt-dlp — Phase 1
# Downloads videos and searches YouTube without API keys

import yt_dlp
import os

# Downloading the video from the URL.
def video_downloader(url: str):
    print(f"📥 Starting YouTube download for: {url}")

    # Options for downloading video
    ydl_opts = {
        'format' : 'best[ext=mp4]/best',
        'outtmpl' : 'uploads/%(id)s.%(ext)s',
        'quiet': False
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        # Extracting information for the video wihtout downloading it.
        info = ydl.extract_info(url, download=True)
        
        absolute_file_path = ydl.prepare_filename(info)
        filename = os.path.basename(absolute_file_path)

        print(f"✅ Download complete: {filename}")
        return {
            "filename": filename, 
            "title": info.get("title", "Unknown Title"), 
            "duration": info.get("duration", 0)
        }