import { create } from 'zustand';

export const useSessionStore = create((set) => ({
  mode: 'viewer', // 'viewer' | 'scientist'
  jobId: null,

  setMode: (mode) => set({ mode }),
  setJobId: (jobId) => set({ jobId }),
  clearSession: () => set({ mode: 'viewer', jobId: null }),
}));
