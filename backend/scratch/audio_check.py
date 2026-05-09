import os
import json
import pyaudio
import audioop
from vosk import Model, KaldiRecognizer

def audio_test():
    """
    Diagnostic script to check:
    1. Microphone Signal (Volume Bar)
    2. Transcription (What the AI hears)
    """
    model_path = os.path.join(os.path.dirname(__file__), "..", "models", "vosk-model-small-en-us-0.15")
    model_path = os.path.abspath(model_path)
    
    print("--- VIDSAGE AUDIO DIAGNOSTIC ---")
    print(f"Loading Model: {model_path}")
    
    try:
        model = Model(model_path)
        rec = KaldiRecognizer(model, 16000)
        
        p = pyaudio.PyAudio()
        stream = p.open(rate=16000, channels=1, format=pyaudio.paInt16, input=True, frames_per_buffer=4000)
        stream.start_stream()

        print("\n🎤 MIC IS LIVE. Speak now.")
        print("Type Ctrl+C to stop.\n")
        
        while True:
            data = stream.read(2000, exception_on_overflow=False)
            
            # 1. Volume Check (RMS)
            rms = audioop.rms(data, 2)
            # Create a simple ASCII volume bar
            bar_len = int(rms / 200)
            bar = "█" * min(bar_len, 50)
            
            # 2. Transcription
            text = ""
            if rec.AcceptWaveform(data):
                res = json.loads(rec.Result())
                text = res.get("text", "")
            else:
                partial = json.loads(rec.PartialResult())
                text = partial.get("partial", "")

            # Clear line and print volume + text
            print(f"\r[{bar:<50}] {text}", end="")

    except KeyboardInterrupt:
        print("\n\n--- Diagnostic Finished ---")
    except Exception as e:
        print(f"\n❌ Error: {e}")
    finally:
        if 'stream' in locals():
            stream.stop_stream()
            stream.close()
        if 'p' in locals():
            p.terminate()

if __name__ == "__main__":
    audio_test()
