
import React, { useRef, useState, useEffect } from 'react';
import { ShieldCheck, XCircle, Loader2, SwitchCamera, Lock } from 'lucide-react';
import { analyzeImage } from '../services/geminiService';
import { ClassroomMetrics } from '../types';

interface CameraAnalyzerProps {
  onMetricsUpdate: (metrics: Partial<ClassroomMetrics>) => void;
  isActive: boolean;
  autoCaptureInterval?: number;
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

  useEffect(() => {
    const getDevices = async () => {
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
        if (videoDevices.length > 0 && !selectedDeviceId) setSelectedDeviceId(videoDevices[0].deviceId);
      } catch (err) { console.error(err); }
    };
    if (isActive) getDevices();
  }, [isActive]);

  useEffect(() => {
    if (isActive) startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [isActive, selectedDeviceId]);

  useEffect(() => {
    if (isActive && autoCaptureInterval) {
      const interval = setInterval(() => captureAndAnalyze(), autoCaptureInterval);
      return () => clearInterval(interval);
    }
  }, [isActive, autoCaptureInterval]);

  const startCamera = async () => {
    stopCamera();
    try {
      const constraints = { video: { deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined } };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) { setError("Kameraya erişilemedi."); }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
  };

  const applyPrivacyFilter = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // 1. Çok düşük çözünürlüğe ölçekle (Kimlikleri belirsizleştirir)
    const smallWidth = 160;
    const smallHeight = 90;
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = smallWidth;
    tempCanvas.height = smallHeight;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (tempCtx && videoRef.current) {
      tempCtx.drawImage(videoRef.current, 0, 0, smallWidth, smallHeight);
      
      // 2. Hafif bir bulanıklık (blur) ekle
      ctx.filter = 'blur(1px)';
      ctx.drawImage(tempCanvas, 0, 0, width, height);
      ctx.filter = 'none';
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        canvasRef.current.width = 640;
        canvasRef.current.height = 360;
        // Gizlilik Filtresi Uygula
        applyPrivacyFilter(ctx, 640, 360);
        
        const base64 = canvasRef.current.toDataURL('image/jpeg', 0.5);
        const metrics = await analyzeImage(base64);
        onMetricsUpdate(metrics);
      }
    } catch (err) { console.error(err); }
    finally { setIsAnalyzing(false); }
  };

  if (!isActive) return null;

  return (
    <div className="bg-black rounded-2xl overflow-hidden shadow-lg relative aspect-video border-4 border-gray-800">
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover grayscale opacity-50" />
      <canvas ref={canvasRef} className="hidden" />
      
      <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none">
        <div className="flex justify-between items-start">
           <div className="flex items-center gap-1.5 bg-green-600/90 px-2.5 py-1 rounded-full text-white text-[10px] font-bold">
              <ShieldCheck size={12} /> ANONİMİZASYON AKTİF
           </div>
           <Lock size={16} className="text-white/40" />
        </div>

        <div className="self-center">
          {isAnalyzing && (
            <div className="bg-indigo-600 text-white px-3 py-1.5 rounded-full flex items-center gap-2 text-xs animate-pulse">
              <Loader2 size={12} className="animate-spin" /> Analiz Ediliyor...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
