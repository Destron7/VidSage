import { create } from 'zustand';

export const useVoiceStore = create((set) => ({
  // Status: 'idle' | 'listening' | 'processing' | 'confirmed' | 'error'
  status: 'idle',
  transcript: '',
  intent: null,
  
  setStatus: (status) => set({ status }),
  setTranscript: (text) => set({ transcript: text, status: 'confirmed' }),
  setIntent: (intent) => set({ intent }),
  
  reset: () => set({
    status: 'idle',
    transcript: '',
    intent: null
  })
}));
