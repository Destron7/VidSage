# Speech-to-Text via faster-whisper — Phase 1
# CTranslate2 backend, 4x faster than openai-whisper

from faster_whisper import WhisperModel

# Lazy singleton — model is loaded on first use, not at import time.
# This prevents cold-start crashes if CUDA is unavailable at startup.
_model = None

def get_model() -> WhisperModel:
    global _model
    if _model is None:
        print("[Whisper] Loading model on first use...")
        _model = WhisperModel("base", device="cuda", compute_type="float16")
        print("[Whisper] Model loaded and ready (CUDA float16)")
    return _model

def extract_text(file_path: str) -> str:
    """Returns the full transcription text."""
    result = extract_text_with_timestamps(file_path)
    return result["text"]


def extract_text_with_timestamps(file_path: str) -> dict:
    """Returns full text AND timestamped segments for term matching."""
    print(f"🧠 AI is listening to {file_path}...")
    
    model = get_model()

    # VAD filter removes silence, word_timestamps for future frontend sync
    segments, info = model.transcribe(
        file_path,
        beam_size=5,
        word_timestamps=True,
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=500)
    )
    print(f"Detected Language: {info.language}")

    # Collect segments with timestamps
    timed_segments = []
    texts = []
    for segment in segments:
        texts.append(segment.text)
        timed_segments.append({
            "start": round(segment.start, 2),
            "end": round(segment.end, 2),
            "text": segment.text.strip()
        })

    full_text = " ".join(texts)
    print("✅ Done!")
    return {
        "text": full_text.strip(),
        "segments": timed_segments
    }