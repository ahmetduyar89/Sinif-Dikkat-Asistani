import React, { useRef, useState, useEffect } from 'react';
import { RefreshCw, XCircle, Loader2, SwitchCamera } from 'lucide-react';
import { analyzeImage } from '../services/geminiService';
import { ClassroomMetrics } from '../types';

interface CameraAnalyzerProps {
  onMetricsUpdate: (metrics: Partial<ClassroomMetrics>) => void;
  isActive: boolean;
  autoCaptureInterval?: number; // in ms, if provided, enables auto capture
}

export const CameraAnalyzer: React.FC<CameraAnalyzerProps> = ({ 
  onMetricsUpdate, 
  isActive,
  autoCaptureInterval
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [countdown, setCountdown] = useState(0);

  // List cameras
  useEffect(() => {
    const getDevices = async () => {
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
        
        const backCamera = videoDevices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
        if (backCamera && !selectedDeviceId) {
            setSelectedDeviceId(backCamera.deviceId);
        } else if (videoDevices.length > 0 && !selectedDeviceId) {
            setSelectedDeviceId(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error("Error listing devices:", err);
      }
    };

    if (isActive) {
      getDevices();
    }
  }, [isActive]);

  // Handle camera stream
  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isActive, selectedDeviceId]);

  // Auto Capture Logic
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    
    if (isActive && autoCaptureInterval && autoCaptureInterval > 0) {
       // Initial capture after short delay
       const initialTimeout = setTimeout(() => {
           captureAndAnalyze();
       }, 2000);

       intervalId = setInterval(() => {
           captureAndAnalyze();
       }, autoCaptureInterval);

       // Visual countdown logic (optional but nice)
       const timerId = setInterval(() => {
           setCountdown(prev => prev > 0 ? prev - 1 : (autoCaptureInterval/1000));
       }, 1000);

       return () => {
           clearTimeout(initialTimeout);
           clearInterval(intervalId);
           clearInterval(timerId);
       };
    }
  }, [isActive, autoCaptureInterval]);

  const startCamera = async () => {
    stopCamera();
    try {
      setError(null);
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          facingMode: !selectedDeviceId ? 'environment' : undefined
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setError("Kameraya erişilemedi. Lütfen izin verin.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzing) return;

    setIsAnalyzing(true);
    try {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        
        const base64Image = canvasRef.current.toDataURL('image/jpeg', 0.6); // Slightly lower quality for speed
        const metrics = await analyzeImage(base64Image);
        
        onMetricsUpdate(metrics);
      }
    } catch (err) {
      console.error("Analysis failed:", err);
      // Silent fail in auto mode, or show toast
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isActive) return null;

  return (
    <div className="bg-black rounded-2xl overflow-hidden shadow-lg relative aspect-video flex flex-col group border-4 border-gray-800">
      {error ? (
        <div className="flex-1 flex items-center justify-center text-white p-4 text-center bg-gray-800">
          <XCircle className="mb-2 mx-auto text-red-500" size={32} />
          <p>{error}</p>
        </div>
      ) : (
        <div className="relative flex-1 bg-gray-900">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover opacity-90"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Camera Switcher */}
          {devices.length > 1 && (
              <div className="absolute top-4 right-4 z-10">
                  <div className="flex items-center bg-black/40 backdrop-blur-sm rounded-full p-1.5 border border-white/20">
                        <SwitchCamera size={14} className="text-white ml-1" />
                        <select 
                            value={selectedDeviceId}
                            onChange={(e) => setSelectedDeviceId(e.target.value)}
                            className="bg-transparent text-white text-xs py-1 pl-2 pr-1 rounded focus:outline-none appearance-none cursor-pointer max-w-[100px]"
                        >
                            {devices.map(device => (
                                <option key={device.deviceId} value={device.deviceId} className="text-black">
                                    {device.label || `Kamera`}
                                </option>
                            ))}
                        </select>
                  </div>
              </div>
          )}

          {/* Status Overlays */}
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
             <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 bg-red-600/80 backdrop-blur-sm px-3 py-1 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                    <span className="text-white text-[10px] font-bold tracking-wider">CANLI YAYIN</span>
                </div>
             </div>

             <div className="self-center mb-2">
                {isAnalyzing && (
                    <div className="bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full flex items-center gap-3 text-sm shadow-lg animate-pulse border border-white/10">
                         <Loader2 size={16} className="animate-spin text-indigo-400" />
                         Yapay zeka sınıfı analiz ediyor...
                    </div>
                )}
             </div>
          </div>
          
          {/* Scan Line Effect when analyzing */}
          {isAnalyzing && (
             <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-indigo-500/10 to-transparent w-full h-full animate-scan"></div>
          )}
        </div>
      )}
    </div>
  );
};