import React, { useState, useCallback, useEffect } from 'react';
import { ActivityType, ClassroomMetrics, TrendType, AIAdviceResponse } from './types';
import { generateAdvice } from './services/geminiService';
import { AdviceCard } from './components/AdviceCard';
import { MetricCard } from './components/MetricCard';
import { ActivityBadge } from './components/ActivityBadge';
import { CameraAnalyzer } from './components/CameraAnalyzer';
import { AudioMonitor } from './components/AudioMonitor';
import { BrainCircuit, LineChart, Users, Eye, Power, Activity } from 'lucide-react';
import { LineChart as ReLineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

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

const App: React.FC = () => {
  const [metrics, setMetrics] = useState<ClassroomMetrics>(INITIAL_METRICS);
  const [advice, setAdvice] = useState<AIAdviceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{time: string, score: number}[]>([]);
  
  // Master toggle for the entire system
  const [isSystemActive, setIsSystemActive] = useState(false);

  // Initialize history
  useEffect(() => {
    const now = new Date();
    const initialHistory = Array.from({ length: 10 }).map((_, i) => ({
        time: new Date(now.getTime() - (10 - i) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'}),
        score: 0
    }));
    setHistory(initialHistory);
  }, []);

  // This function is called automatically when CameraAnalyzer finishes a cycle
  const handleAutoAnalysisUpdate = async (analyzedMetrics: Partial<ClassroomMetrics>) => {
    // 1. Update local state with visual metrics
    let updatedMetrics = { ...metrics };
    
    setMetrics(prev => {
        const newTrend = analyzedMetrics.focus_score && analyzedMetrics.focus_score > prev.focus_score 
            ? TrendType.INCREASING 
            : analyzedMetrics.focus_score && analyzedMetrics.focus_score < prev.focus_score
            ? TrendType.DECREASING
            : TrendType.STABLE;

        updatedMetrics = {
            ...prev,
            ...analyzedMetrics,
            trend_last_5_min: newTrend,
            // Keep the real-time noise level from the AudioMonitor, ignore camera's estimated noise
            noise_level: prev.noise_level 
        };
        return updatedMetrics;
    });

    // 2. Immediately generate advice using the combined data
    await generateAdviceFromMetrics(updatedMetrics);
  };

  const handleAudioLevelChange = (level: number) => {
      // Continuously update noise level in state without triggering advice yet
      setMetrics(prev => ({
          ...prev,
          noise_level: level
      }));
  };

  const generateAdviceFromMetrics = async (currentMetrics: ClassroomMetrics) => {
    if (!process.env.API_KEY || !isSystemActive) return;
    
    setLoading(true);
    try {
      // Update history chart
      setHistory(prev => {
          const newHistory = [...prev, {
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'}),
              score: currentMetrics.focus_score
          }];
          return newHistory.slice(-15);
      });

      const result = await generateAdvice(currentMetrics);
      setAdvice(result);
    } catch (error) {
      console.error("Error analyzing classroom:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSystem = () => {
      setIsSystemActive(!isSystemActive);
      if (!isSystemActive) {
          // Reset visuals when starting fresh
          setAdvice(null);
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-12">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg text-white transition-colors ${isSystemActive ? 'bg-green-600' : 'bg-indigo-600'}`}>
               <BrainCircuit size={24} className={isSystemActive ? "animate-pulse" : ""} />
            </div>
            <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Sınıf Dikkat Asistanı</h1>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 hidden sm:block">Powered by Gemini 2.5 Flash</span>
                    {isSystemActive && (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            CANLI İZLEME
                        </span>
                    )}
                </div>
            </div>
          </div>
          
          <button
            onClick={toggleSystem}
            className={`px-6 py-2 rounded-lg font-bold transition-all shadow-sm flex items-center gap-2 text-sm sm:text-base ${
                isSystemActive 
                ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
            }`}
          >
            <Power size={18} />
            {isSystemActive ? "Sistemi Durdur" : "Sistemi Başlat"}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input Source */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-6">
             
             {/* Audio Monitor - Always active if system is active */}
             <AudioMonitor 
                isActive={isSystemActive} 
                onToggle={() => {}} // Controlled by parent now
                onLevelChange={handleAudioLevelChange}
             />

             <div className={`space-y-4 transition-opacity duration-500 ${isSystemActive ? 'opacity-100' : 'opacity-70'}`}>
                 <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                     <Activity className={isSystemActive ? "text-green-600" : "text-gray-400"} size={20} />
                     Sınıf Görsel Analizi
                 </h2>
                 
                 <CameraAnalyzer 
                    isActive={isSystemActive} 
                    onMetricsUpdate={handleAutoAnalysisUpdate} 
                    autoCaptureInterval={15000} // Capture every 15 seconds
                 />
                 
                 {!isSystemActive ? (
                     <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 text-gray-500 text-sm text-center">
                        Sistem şu an beklemede. Başlamak için yukarıdaki "Sistemi Başlat" butonuna basın.
                     </div>
                 ) : (
                     <div className="bg-green-50 p-3 rounded-lg border border-green-100 flex gap-2 animate-in fade-in duration-700">
                        <div className="mt-1 w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0"></div>
                        <p className="text-xs text-green-800 leading-relaxed">
                            Sistem <b>asla kayıt almaz</b>. Sadece anlık görüntü ve ses seviyesini işleyip siler. Her 15 saniyede bir yapay zeka yeni öneriler sunar.
                        </p>
                     </div>
                 )}
             </div>
             
             {/* Mini Stat Panel */}
             {isSystemActive && (
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm animate-in slide-in-from-left-4 fade-in duration-700">
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Algılanan Ortam</h3>
                    <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Aktivite</span>
                            <ActivityBadge type={metrics.activity_type} />
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Trend</span>
                            <span className={`text-sm font-medium ${
                                metrics.trend_last_5_min === TrendType.INCREASING ? 'text-green-600' : 
                                metrics.trend_last_5_min === TrendType.DECREASING ? 'text-red-600' : 'text-gray-600'
                            }`}>
                                {metrics.trend_last_5_min.toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>
             )}
          </div>

          {/* Center Column: Visual Dashboard */}
          <div className="lg:col-span-8 xl:col-span-5 space-y-6">
             <div className="grid grid-cols-2 gap-4">
                <MetricCard 
                    label="Genel Dikkat" 
                    value={Math.round(metrics.focus_score)} 
                    max={100} 
                    colorClass={metrics.focus_score > 70 ? "bg-emerald-500" : metrics.focus_score < 40 ? "bg-rose-500" : "bg-amber-500"} 
                />
                <MetricCard 
                    label="Gürültü" 
                    value={metrics.noise_level} 
                    max={10} 
                    colorClass="bg-slate-500" 
                />
                <MetricCard 
                    label="Tahtaya Bakış" 
                    value={metrics.gaze_board_percentage} 
                    max={100} 
                    unit="%"
                    colorClass="bg-blue-500" 
                />
                <MetricCard 
                    label="Kıpırdanma" 
                    value={metrics.fidgeting_level} 
                    max={10} 
                    colorClass="bg-orange-400" 
                />
             </div>

             {/* Chart Area */}
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-64">
                 <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <LineChart size={18} />
                        Dikkat Seviyesi Geçmişi
                    </h3>
                    <span className="text-xs text-gray-400">Son 15 veri noktası</span>
                 </div>
                 <ResponsiveContainer width="100%" height="100%">
                    <ReLineChart data={history}>
                        <XAxis dataKey="time" hide />
                        <YAxis domain={[0, 100]} hide />
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ color: '#4f46e5', fontWeight: 'bold' }}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="score" 
                            stroke="#4f46e5" 
                            strokeWidth={3} 
                            dot={false} 
                            activeDot={{ r: 6 }}
                            animationDuration={500}
                        />
                    </ReLineChart>
                 </ResponsiveContainer>
             </div>

             <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4">
                     <div className="bg-blue-50 p-3 rounded-full text-blue-600">
                         <Eye size={24} />
                     </div>
                     <div>
                         <p className="text-sm text-gray-500">Göz Teması</p>
                         <p className="text-xl font-bold text-gray-800">{metrics.gaze_board_percentage}%</p>
                     </div>
                 </div>
                 <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4">
                     <div className="bg-purple-50 p-3 rounded-full text-purple-600">
                         <Users size={24} />
                     </div>
                     <div>
                         <p className="text-sm text-gray-500">Baş Aşağıda</p>
                         <p className="text-xl font-bold text-gray-800">{metrics.heads_down_percentage}%</p>
                     </div>
                 </div>
             </div>
          </div>

          {/* Right Column: AI Advisor */}
          <div className="lg:col-span-12 xl:col-span-4">
             <div className="sticky top-24 h-[calc(100vh-8rem)]">
                <AdviceCard advice={advice} loading={loading} />
             </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;