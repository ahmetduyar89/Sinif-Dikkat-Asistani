import React, { useState, useRef } from 'react';
import { UploadCloud, X, Aperture, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { analyzeImage } from '../services/geminiService';
import { ClassroomMetrics } from '../types';

interface ImageUploaderProps {
  onMetricsUpdate: (metrics: Partial<ClassroomMetrics>) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onMetricsUpdate }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Lütfen geçerli bir resim dosyası yükleyin.');
      return;
    }
    
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSelectedImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const triggerAnalysis = async () => {
    if (!selectedImage || isAnalyzing) return;

    setIsAnalyzing(true);
    setError(null);
    try {
      const metrics = await analyzeImage(selectedImage);
      onMetricsUpdate(metrics);
    } catch (err) {
      console.error("Analysis failed:", err);
      setError("Analiz başarısız oldu. Lütfen tekrar deneyin.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h3 className="font-bold text-gray-700 flex items-center gap-2">
          <ImageIcon size={18} className="text-indigo-600" />
          Fotoğraf Analizi
        </h3>
      </div>

      <div className="p-6">
        {!selectedImage ? (
          <div 
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <UploadCloud className="text-indigo-500" size={32} />
            </div>
            <h4 className="text-gray-700 font-semibold mb-1">Fotoğraf Yükle</h4>
            <p className="text-sm text-gray-500 mb-4">Sınıf fotoğrafını buraya sürükleyin veya tıklayıp seçin</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              accept="image/*" 
              className="hidden" 
            />
            <button className="text-xs bg-white border border-gray-300 px-3 py-1.5 rounded-md text-gray-600 font-medium hover:text-indigo-600">
              Dosya Seç
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-black aspect-video group">
              <img 
                src={selectedImage} 
                alt="Classroom Preview" 
                className="w-full h-full object-contain"
              />
              <button 
                onClick={clearImage}
                className="absolute top-2 right-2 bg-black/50 hover:bg-red-500 text-white p-1.5 rounded-full transition-colors backdrop-blur-sm"
                title="Fotoğrafı Kaldır"
              >
                <X size={16} />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                {error}
              </div>
            )}

            <button
              onClick={triggerAnalysis}
              disabled={isAnalyzing}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-white transition-all shadow-md ${
                isAnalyzing 
                  ? 'bg-gray-400 cursor-wait' 
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Görüntü İşleniyor...
                </>
              ) : (
                <>
                  <Aperture size={18} />
                  Analiz Et
                </>
              )}
            </button>
          </div>
        )}
        
        <div className="mt-4 text-xs text-gray-400 text-center px-4">
          Yüklenen fotoğraflar kaydedilmez, sadece anlık analiz için Google Gemini AI servisine gönderilir.
        </div>
      </div>
    </div>
  );
};