import React from 'react';
import { useVoiceStore } from '../../store/voiceStore';
import { Mic, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VoiceIndicator = () => {
  const { status, transcript, intent } = useVoiceStore();

  // Passive behavior: Only show up when something is happening
  if (status === 'idle') return null;

  const statusConfig = {
    listening: {
      icon: <Mic className="w-5 h-5 text-blue-500 animate-pulse" />,
      text: 'Listening...',
      color: 'border-blue-500 bg-blue-50 shadow-[0_0_15px_rgba(59,130,246,0.3)]',
    },
    processing: {
      icon: <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />,
      text: 'Thinking...',
      color: 'border-purple-500 bg-purple-50',
    },
    confirmed: {
      icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      text: 'Confirmed',
      color: 'border-green-500 bg-green-50',
    },
    error: {
      icon: <AlertCircle className="w-5 h-5 text-red-500" />,
      text: 'Error',
      color: 'border-red-500 bg-red-50',
    }
  };

  const config = statusConfig[status] || statusConfig.listening;

  return (
    <div className="fixed top-20 right-6 z-50 pointer-events-none">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.8, x: 20 }}
          className="flex flex-col items-end space-y-2"
        >
          {/* Status Pill */}
          <div className={`flex items-center space-x-3 px-4 py-2 rounded-full border shadow-lg ${config.color} backdrop-blur-sm`}>
            {config.icon}
            <span className="font-semibold text-gray-700 text-sm whitespace-nowrap uppercase tracking-widest">
              {config.text}
            </span>
          </div>

          {/* Transcript / Intent Bubble */}
          {(transcript || intent) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border-2 border-[#2D2D2D] p-3 rounded-2xl rounded-tr-none shadow-[4px_4px_0px_rgba(0,0,0,1)] max-w-xs text-right mr-2"
            >
              {transcript && (
                <p className="text-xs text-gray-600 italic leading-snug font-serif">
                  "{transcript}"
                </p>
              )}
              {intent && (
                <div className="mt-1">
                  <span className="text-[9px] uppercase font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                    Action: {intent.action.replace('_', ' ')}
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default VoiceIndicator;
