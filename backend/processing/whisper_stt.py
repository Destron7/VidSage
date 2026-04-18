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

    # Join all segment texts
    full_text = " ".join(segment.text for segment in segments)

    print("✅ Done!")
    return full_text.strip()