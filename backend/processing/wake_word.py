import os
import time
import wave
import tempfile
import threading
import json
import pyaudio
import audioop
from vosk import Model, KaldiRecognizer
from processing.whisper_stt import get_model as get_whisper
from utils.sse_manager import sse_manager

class WakeWordEngine:
    def __init__(self, trigger_callback=None):
        """
        Initialize the Wake Word Engine using Vosk (Windows-native version).
        Refactored for Robust (Fuzzy) Keyword Spotting.
        """
        self.trigger_callback = trigger_callback
        self.running = False
        self.pa = pyaudio.PyAudio()
        
        # Load local Vosk model
        model_path = os.path.join(os.path.dirname(__file__), "..", "models", "vosk-model-small-en-us-0.15")
        model_path = os.path.abspath(model_path)
        
        print(f"[WakeWord] Loading Vosk model from: {model_path}")
        if not os.path.exists(model_path):
            print(f"❌ Error: Vosk model not found at {model_path}")
            return

        self.model = Model(model_path)
        self.recognizer = KaldiRecognizer(self.model, 16000)
        
        # FUZZY KEYWORDS: List of variations to account for mishearings or spacing
        self.trigger_keywords = [
            "vidsage", 
            "vid sage", 
            "message", 
            "bit sage", 
            "feed sage", 
            "vids age", 
            "fit sage"
        ]
        
        print(f"[WakeWord] Robust Engine Monitoring for: {self.trigger_keywords}")
        print(f"[WakeWord] Listening... (Mic Volume Monitoring Enabled)")

    def _get_rms(self, data):
        """Calculate Root Mean Square (volume) of audio chunk."""
        return audioop.rms(data, 2)

    def _record_audio(self, stream, duration=5):
        """Record audio for a fixed duration after wake word detection."""
        print(f"🚀 [WakeWord] Trigger Hit! Listening for command...")
        sse_manager.broadcast("voice_status", "listening")
        
        frames = []
        start_time = time.time()
        while time.time() - start_time < duration:
            data = stream.read(4000, exception_on_overflow=False)
            frames.append(data)
            
        sse_manager.broadcast("voice_status", "processing")
        
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            temp_path = f.name
            wf = wave.open(temp_path, 'wb')
            wf.setnchannels(1)
            wf.setsampwidth(self.pa.get_sample_size(pyaudio.paInt16))
            wf.setframerate(16000)
            wf.writeframes(b''.join(frames))
            wf.close()
            
        return temp_path

    def _transcribe_and_trigger(self, audio_path):
        """Transcribe using Whisper and trigger intent logic."""
        try:
            whisper = get_whisper()
            segments, _ = whisper.transcribe(audio_path, beam_size=5)
            command = " ".join(segment.text for segment in segments).strip()
            
            if command:
                print(f"🤖 [WakeWord] Command: '{command}'")
                sse_manager.broadcast("voice_command", {"text": command, "status": "confirmed"})
                if self.trigger_callback:
                    self.trigger_callback(command)
            else:
                print("😶 [WakeWord] No command heard.")
                sse_manager.broadcast("voice_status", "idle")
                
        except Exception as e:
            print(f"❌ [WakeWord] Transcription error: {e}")
            sse_manager.broadcast("voice_status", "idle")
        finally:
            if os.path.exists(audio_path):
                os.remove(audio_path)

    def start(self):
        self.running = True
        self.thread = threading.Thread(target=self._run_loop, daemon=True)
        self.thread.start()

    def stop(self):
        self.running = False

    def _run_loop(self):
        """Main listening loop with volume diagnostics."""
        stream = self.pa.open(
            rate=16000,
            channels=1,
            format=pyaudio.paInt16,
            input=True,
            frames_per_buffer=8000
        )
        stream.start_stream()
        
        last_volume_check = time.time()
        avg_rms = 0
        
        while self.running:
            try:
                data = stream.read(4000, exception_on_overflow=False)
                if len(data) == 0: continue

                # Volume Monitoring
                rms = self._get_rms(data)
                avg_rms = (avg_rms * 0.9) + (rms * 0.1) # Smoothing
                
                # Diagnostic log if mic is dead (less than 1% of max)
                if time.time() - last_volume_check > 5:
                    if avg_rms < 50: # Threshold for 'Too Quiet'
                        print("⚠️ [WakeWord] Mic volume is very low. Please speak up or check Mic settings.")
                    last_volume_check = time.time()

                # Speech Recognition
                if self.recognizer.AcceptWaveform(data):
                    result = json.loads(self.recognizer.Result())
                    text = result.get("text", "").lower()
                else:
                    partial = json.loads(self.recognizer.PartialResult())
                    text = partial.get("partial", "").lower()

                # FUZZY KEYWORD CHECK
                # If any of our variations are found in the string
                if any(kw in text for kw in self.trigger_keywords):
                    self.recognizer.Reset()
                    audio_file = self._record_audio(stream)
                    self._transcribe_and_trigger(audio_file)
                    
            except Exception as e:
                print(f"❌ [WakeWord] Error: {e}")
                time.sleep(1)
        
        stream.stop_stream()
        stream.close()

if __name__ == "__main__":
    def mock_cb(t): print(f"Trigger: {t}")
    engine = WakeWordEngine(trigger_callback=mock_cb)
    engine.start()
    try:
        while True: time.sleep(1)
    except KeyboardInterrupt: engine.stop()
