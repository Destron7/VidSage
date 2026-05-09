import { useEffect } from 'react';
import { useVoiceStore } from '../store/voiceStore';

/**
 * useSSE Hook
 * Connects to the backend EventStream for real-time updates.
 * @param {Object} options 
 * @param {Function} options.onJobComplete - Callback when a video processing job finishes
 */
const useSSE = (options = {}) => {
  const { onJobComplete } = options;
  const { setStatus, setTranscript, setIntent, reset } = useVoiceStore();

  useEffect(() => {
    // Connect to the backend SSE endpoint
    const eventSource = new EventSource('http://localhost:8000/api/v1/voice/stream');

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const { type, data } = payload;

        switch (type) {
          case 'voice_status':
            setStatus(data);
            if (data === 'idle') {
              setTimeout(reset, 3000);
            }
            break;
          
          case 'voice_command':
            setTranscript(data.text);
            break;
          
          case 'voice_intent':
            setIntent(data);
            break;

          case 'job_status':
            // If a job completes, notify the listener
            if (data.status === 'completed' && onJobComplete) {
              onJobComplete(data.id);
            }
            break;
          
          default:
            console.log('[SSE] Unknown event:', type, data);
        }
      } catch (err) {
        console.error('[SSE] Failed to parse event data:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('[SSE] Connection error:', err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [setStatus, setTranscript, setIntent, reset, onJobComplete]);
};

export default useSSE;
