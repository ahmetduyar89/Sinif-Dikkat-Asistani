
import React from 'react';
import { AIAdviceResponse } from '../types';
import { Sparkles, Lightbulb, MessageSquare, Quote, CheckCircle2, AlertCircle, Clock, Loader2 } from 'lucide-react';

interface AdviceCardProps {
  advice: AIAdviceResponse | null;
  loading: boolean;
  lastUpdateTime?: Date | null;
}

export const AdviceCard: React.FC<AdviceCardProps> = ({ advice, loading, lastUpdateTime }) => {
  // Eğer hiç veri yoksa ve yükleniyorsa ilk skeleton'ı göster
  if (loading && !advice) {
    return (
      <div className="h-full min-h-[450px] bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center animate-pulse">
        <Sparkles className="text-indigo-300 mb-4 animate-spin-slow" size={48} />
        <h3 className="text-lg font-medium text-gray-400 text-center">Sınıf verileri ilk kez analiz ediliyor...</h3>
        <p className="text-sm text-gray-300 mt-2">Gemini pedagojik strateji hazırlıyor</p>
      </div>
    );
  }

  if (!advice) {
    return (
      <div className="h-full min-h-[450px] bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
        <div className="bg-gray-50 p-4 rounded-full mb-4">
           <Sparkles className="text-gray-300" size={32} />
        </div>
        <h3 className="text-lg font-medium text-gray-500">Analiz Bekleniyor</h3>
        <p className="text-sm text-gray-400 mt-2 max-w-xs">Sistemi başlattığınızda sınıfınız analiz edilecek ve buraya özel tavsiyeler gelecektir.</p>
      </div>
    );
  }

  const statusColors = {
    "yüksek_dikkat": "bg-green-50 border-green-200 text-green-800",
    "orta_dikkat": "bg-yellow-50 border-yellow-200 text-yellow-800",
    "düşük_dikkat": "bg-red-50 border-red-200 text-red-800"
  };

  const statusIcons = {
     "yüksek_dikkat": <CheckCircle2 size={20} className="text-green-600"/>,
     "orta_dikkat": <AlertCircle size={20} className="text-yellow-600"/>,
     "düşük_dikkat": <AlertCircle size={20} className="text-red-600"/>
  };

  const formattedTime = lastUpdateTime ? lastUpdateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className={`bg-white rounded-2xl shadow-xl border border-indigo-50 overflow-hidden flex flex-col transition-all duration-500 relative ${loading ? 'opacity-80' : 'opacity-100'}`}>
      
      {/* Loading Overlay Indicator */}
      {loading && (
        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-100 overflow-hidden z-20">
          <div className="h-full bg-indigo-600 animate-[loading_1.5s_infinite] w-1/3"></div>
        </div>
      )}

      {/* Header Section */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50">
        <div className="flex justify-between items-start mb-4">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-bold capitalize ${statusColors[advice.genel_durum]}`}>
            {statusIcons[advice.genel_durum]}
            {advice.genel_durum.replace('_', ' ')}
          </div>
          
          <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-medium bg-gray-50 px-2 py-1 rounded-md">
            {loading ? (
              <><Loader2 size={10} className="animate-spin text-indigo-500" /> Analiz Güncelleniyor</>
            ) : (
              <><Clock size={10} /> Son Güncelleme: {formattedTime}</>
            )}
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{advice.ogretmene_kisa_mesaj}</h2>
        <p className="text-gray-600 leading-relaxed text-sm">{advice.durum_ozeti}</p>
      </div>

      {/* Action Section */}
      <div className="p-6 bg-indigo-50/30 flex-grow">
        <div className="mb-6">
           <div className="flex items-center gap-2 mb-2">
               <MessageSquare size={16} className="text-indigo-600" />
               <h4 className="font-semibold text-gray-700 text-[11px] uppercase tracking-wider">Öğretmen Replik Önerisi</h4>
           </div>
           <div className="bg-white p-4 rounded-xl border-l-4 border-indigo-500 shadow-sm relative">
             <Quote size={20} className="text-indigo-50/50 absolute right-4 bottom-4" />
             <p className="text-md text-indigo-900 font-medium italic leading-snug">"{advice.ogretmenin_soyleyebilecegi_cumle}"</p>
           </div>
        </div>

        <div className="space-y-4">
           <div>
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={16} className="text-amber-500" />
                <h4 className="font-semibold text-gray-700 text-[11px] uppercase tracking-wider">Önerilen Eylem</h4>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium capitalize">
                {advice.onerilen_eylem_turu.replace(/_/g, ' ')}
              </div>
           </div>
           
           <div>
             <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-purple-500" />
                <h4 className="font-semibold text-gray-700 text-[11px] uppercase tracking-wider">Alternatif Etkinlikler</h4>
             </div>
             <ul className="space-y-1.5">
               {advice.alternatif_etkinlik_fikirleri.map((fikir, index) => (
                 <li key={index} className="bg-white p-2.5 rounded-lg border border-gray-100 text-[13px] text-gray-600 flex items-start gap-2 shadow-sm">
                    <span className="bg-purple-50 text-purple-600 rounded-full w-4 h-4 flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5 font-bold">{index + 1}</span>
                    {fikir}
                 </li>
               ))}
             </ul>
           </div>
        </div>
      </div>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
};
