import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Activity } from 'lucide-react';

interface AudioMonitorProps {
  onLevelChange: (level: number) => void;
  isActive: boolean;
  onToggle: () => void;
}

export const AudioMonitor: React.FC<AudioMonitorProps> = ({ onLevelChange, isActive, onToggle }) => {
  const [visualLevel, setVisualLevel] = useState(0); // For the smooth UI bar (0-100)
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isActive) {
      startListening();
    } else {
      stopListening();
    }

    return () => {
      stopListening();
    };
  }, [isActive]);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      analyzeAudio();
    } catch (error) {
      console.error("Microphone access denied:", error);
      onToggle(); // Turn off if failed
    }
  };

  const stopListening = () => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    
    setVisualLevel(0);
  };

  const analyzeAudio = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average volume
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const average = sum / bufferLength;

    // Normalize for UI (0-100) and for App Logic (0-10)
    // Assuming average ~10-20 is quiet, ~50-60 is talking, ~100+ is loud
    // We multiply by a factor to make it sensitive enough for a classroom
    const amplified = average * 1.5; 
    
    const level0to10 = Math.min(10, Math.floor(amplified / 10));
    const level0to100 = Math.min(100, amplified);

    setVisualLevel(level0to100);
    
    // Throttle updates to parent to avoid excessive re-renders if needed, 
    // but React handles this okay. Let's update continuously.
    onLevelChange(level0to10);

    rafIdRef.current = requestAnimationFrame(analyzeAudio);
  };

  return (
    <div className={`bg-white p-4 rounded-xl border transition-all ${isActive ? 'border-indigo-500 shadow-md' : 'border-gray-200 shadow-sm'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-full ${isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
            {isActive ? <Activity size={18} className="animate-pulse" /> : <MicOff size={18} />}
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-700">Gürültü Monitörü</h3>
            <p className="text-xs text-gray-500">{isActive ? 'Mikrofon dinleniyor...' : 'Kapalı'}</p>
          </div>
        </div>
        
        <button
          onClick={onToggle}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            isActive 
              ? 'bg-red-100 text-red-600 hover:bg-red-200' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {isActive ? 'Durdur' : 'Başlat'}
        </button>
      </div>

      {/* Visualizer Bar */}
      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden relative">
        {/* Ticks for reference */}
        <div className="absolute top-0 bottom-0 left-[30%] w-0.5 bg-white z-10 opacity-50"></div>
        <div className="absolute top-0 bottom-0 left-[70%] w-0.5 bg-white z-10 opacity-50"></div>
        
        <div 
          className={`h-full transition-all duration-100 ease-out rounded-full ${
            visualLevel > 70 ? 'bg-red-500' : visualLevel > 30 ? 'bg-amber-400' : 'bg-green-500'
          }`}
          style={{ width: `${visualLevel}%` }}
        ></div>
      </div>
      
      <div className="flex justify-between text-xs text-gray-400 mt-1 font-mono">
        <span>Sessiz</span>
        <span>Orta</span>
        <span>Gürültülü</span>
      </div>
    </div>
  );
};