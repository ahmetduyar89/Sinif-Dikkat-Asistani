
import React, { useState, useEffect, useRef } from 'react';
import { ActivityType, ClassroomMetrics, TrendType, AIAdviceResponse } from './types';
import { generateAdvice } from './services/geminiService';
import { AdviceCard } from './components/AdviceCard';
import { MetricCard } from './components/MetricCard';
import { CameraAnalyzer } from './components/CameraAnalyzer';
import { AudioMonitor } from './components/AudioMonitor';
import { BrainCircuit, ShieldCheck, Power, Share2, Copy, ExternalLink, Code2, MousePointer2 } from 'lucide-react';
import { LineChart as ReLineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

const INITIAL_METRICS: ClassroomMetrics = {
  focus_score: 0,
  gaze_board_percentage: 0,
  heads_down_percentage: 0,
  fidgeting_level: 0,
  noise_level: 0,
  lesson_minute: 0,
  activity_type: ActivityType.LECTURE,
  trend_last_5_min: TrendType.STABLE
};

const ADVICE_COOLDOWN_MS = 45000;

const App: React.FC = () => {
  const [metrics, setMetrics] = useState<ClassroomMetrics>(INITIAL_METRICS);
  const [advice, setAdvice] = useState<AIAdviceResponse | null>(null);
  const [lastAdviceTime, setLastAdviceTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{time: string, score: number}[]>([]);
  const [isSystemActive, setIsSystemActive] = useState(false);
  const [showIntegration, setShowIntegration] = useState(false);
  
  const lastRequestTimestamp = useRef<number>(0);

  useEffect(() => {
    (window as any).classroom_data = {
      ...metrics,
      is_active: isSystemActive,
      last_update: new Date().toISOString()
    };
  }, [metrics, isSystemActive]);

  useEffect(() => {
    const now = new Date();
    setHistory(Array.from({ length: 10 }).map((_, i) => ({
        time: new Date(now.getTime() - (10 - i) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'}),
        score: 0
    })));
  }, []);

  const handleAutoAnalysisUpdate = async (analyzedMetrics: Partial<ClassroomMetrics>) => {
    setMetrics(prev => {
        const updated = { ...prev, ...analyzedMetrics };
        const now = Date.now();
        if (isSystemActive && (now - lastRequestTimestamp.current) > ADVICE_COOLDOWN_MS) {
            generateAdviceFromMetrics(updated);
        }
        return updated;
    });
  };

  const generateAdviceFromMetrics = async (currentMetrics: ClassroomMetrics) => {
    if (!isSystemActive || loading) return;
    setLoading(true);
    lastRequestTimestamp.current = Date.now();
    try {
      setHistory(prev => [...prev.slice(-14), { 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'}), 
        score: currentMetrics.focus_score 
      }]);
      const result = await generateAdvice(currentMetrics);
      setAdvice(result);
      setLastAdviceTime(new Date());
    } catch (error) { 
      console.error(error); 
    } finally { 
      setLoading(false); 
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Veri paketi kopyalandı! Scratch JSON bloklarında kullanabilirsiniz.");
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-12">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrainCircuit size={28} className="text-indigo-600" />
            <h1 className="text-xl font-black text-gray-900">Sınıf Dikkat Asistanı</h1>
          </div>
          <div className="flex items-center gap-3">
             <button 
                onClick={() => setShowIntegration(!showIntegration)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${showIntegration ? 'bg-indigo-600 text-white shadow-md' : 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100'}`}
             >
                <Code2 size={14} />
                SCRATCH BAĞLANTISI
             </button>
             <button 
                onClick={() => setIsSystemActive(!isSystemActive)} 
                className={`px-5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${isSystemActive ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'}`}
              >
                <Power size={18} /> {isSystemActive ? "Sistemi Durdur" : "Sistemi Başlat"}
              </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sol Kolon */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-6">
           <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-1">
                 <ShieldCheck size={18} /> KVKK Koruması Aktif
              </div>
              <p className="text-[10px] text-emerald-600 leading-tight">
                Görüntüler buluta gönderilmeden önce yerel cihazda mozaiklenir ve çözünürlüğü düşürülür. Kişisel veri asla kaydedilmez.
              </p>
           </div>
           
           <AudioMonitor 
             isActive={isSystemActive} 
             onToggle={() => setIsSystemActive(!isSystemActive)} 
             onLevelChange={(l) => setMetrics(p => ({...p, noise_level: l}))} 
           />
           
           <CameraAnalyzer 
             isActive={isSystemActive} 
             onMetricsUpdate={handleAutoAnalysisUpdate} 
             autoCaptureInterval={60000}
           />
        </div>

        {/* Orta Kolon */}
        <div className="lg:col-span-8 xl:col-span-5 space-y-6">
           {showIntegration && (
             <div className="bg-indigo-900 text-white p-6 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-center mb-6">
                   <div>
                      <h3 className="font-bold flex items-center gap-2 text-indigo-200 text-lg">
                        <Code2 size={20} /> Scratch / TurboWarp Entegrasyonu
                      </h3>
                      <p className="text-indigo-400 text-xs mt-1">Sınıf verilerini kodlama projelerine bağlayın.</p>
                   </div>
                   <button onClick={() => setShowIntegration(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20">
                      <Share2 size={16} />
                   </button>
                </div>
                
                <div className="space-y-6">
                   {/* JSON Preview */}
                   <div className="bg-black/40 p-4 rounded-2xl border border-indigo-500/30">
                      <div className="flex justify-between items-center mb-2">
                         <span className="text-[10px] uppercase font-bold text-indigo-400">Canlı JSON Paketi</span>
                         <button 
                            onClick={() => copyToClipboard(JSON.stringify((window as any).classroom_data))}
                            className="text-[10px] bg-indigo-600 hover:bg-indigo-500 px-2 py-1 rounded-md flex items-center gap-1 transition-colors"
                         >
                            <Copy size={10} /> Veriyi Kopyala
                         </button>
                      </div>
                      <code className="block font-mono text-[11px] text-green-400 break-all leading-relaxed">
                         {JSON.stringify((window as any).classroom_data)}
                      </code>
                   </div>

                   {/* Visual Scratch Guide */}
                   <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                      <h4 className="text-xs font-bold text-indigo-200 mb-4 flex items-center gap-2">
                        <MousePointer2 size={14} /> TurboWarp Blok Taslağı (Rehber)
                      </h4>
                      <div className="space-y-2">
                         {/* Fake Scratch Blocks */}
                         <div className="bg-orange-500 p-2 rounded-md text-[11px] font-bold w-fit shadow-sm border-b-4 border-orange-700">Tıklandığında</div>
                         <div className="bg-amber-500 p-3 rounded-md text-[11px] font-bold border-b-4 border-amber-700 ml-2">
                            Sürekli Tekrarla
                            <div className="bg-blue-500 p-2 rounded-md mt-1 mb-1 border-b-2 border-blue-700">Fetch [Bu Uygulamanın URL'si]</div>
                            <div className="bg-red-500 p-2 rounded-md mt-1 mb-1 border-b-2 border-red-700">Set [Veri] to (Response)</div>
                            <div className="bg-purple-500 p-2 rounded-md mt-1 border-b-2 border-purple-700">Set [Odak] to (JSON Get "focus_score")</div>
                         </div>
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-3">
                      <a 
                        href="https://turbowarp.org/" 
                        target="_blank" 
                        className="flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 p-3 rounded-2xl text-xs font-bold transition-all"
                      >
                         <ExternalLink size={14} /> TurboWarp'ı Aç
                      </a>
                      <div className="text-[10px] text-indigo-300 leading-tight bg-white/5 p-3 rounded-2xl border border-white/5">
                         <strong>İpucu:</strong> "JSON" ve "Network" eklentilerini TurboWarp içinden yüklemeyi unutmayın.
                      </div>
                   </div>
                </div>
             </div>
           )}

           <div className="grid grid-cols-2 gap-4">
              <MetricCard label="Odak Skoru" value={Math.round(metrics.focus_score)} max={100} colorClass="bg-indigo-500" />
              <MetricCard label="Gürültü" value={metrics.noise_level} max={10} colorClass="bg-amber-500" />
           </div>
           
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ReLineChart data={history}>
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={4} dot={false} animationDuration={1000} />
                </ReLineChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Sağ Kolon */}
        <div className="lg:col-span-12 xl:col-span-4">
           <AdviceCard advice={advice} loading={loading} lastUpdateTime={lastAdviceTime} />
        </div>
      </main>
    </div>
  );
};

export default App;
