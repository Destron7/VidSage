import os
import json
import pyaudio
from vosk import Model, KaldiRecognizer

# This script helps us see exactly what Vosk 'hears' when you say VidSage.
# Run this and say 'VidSage' several times to check the transcription.

def debug_listener():
    model_path = os.path.join(os.path.dirname(__file__), "..", "models", "vosk-model-small-en-us-0.15")
    model_path = os.path.abspath(model_path)
    
    if not os.path.exists(model_path):
        print(f"Error: Model not found at {model_path}")
        return

    print("Loading model...")
    model = Model(model_path)
    rec = KaldiRecognizer(model, 16000)
    
    p = pyaudio.PyAudio()
    stream = p.open(rate=16000, channels=1, format=pyaudio.paInt16, input=True, frames_per_buffer=8000)
    stream.start_stream()

    print("\n--- DEBUG LISTENER START ---")
    print("Speak 'VidSage' now. Press Ctrl+C to stop.")
    
    try:
        while True:
            data = stream.read(4000, exception_on_overflow=False)
            if rec.AcceptWaveform(data):
                res = json.loads(rec.Result())
                print(f"Final: '{res.get('text', '')}'")
            else:
                partial = json.loads(rec.PartialResult())
                p_text = partial.get("partial", "")
                if p_text:
                    print(f"Partial: '{p_text}'")
    except KeyboardInterrupt:
        pass
    finally:
        stream.stop_stream()
        stream.close()
        p.terminate()

if __name__ == "__main__":
    debug_listener()
