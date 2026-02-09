import React from 'react';
import { AIAdviceResponse } from '../types';
import { Sparkles, Lightbulb, MessageSquare, Quote, CheckCircle2, AlertCircle } from 'lucide-react';

interface AdviceCardProps {
  advice: AIAdviceResponse | null;
  loading: boolean;
}

export const AdviceCard: React.FC<AdviceCardProps> = ({ advice, loading }) => {
  if (loading) {
    return (
      <div className="h-full min-h-[400px] bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center animate-pulse">
        <Sparkles className="text-indigo-300 mb-4 animate-spin-slow" size={48} />
        <h3 className="text-lg font-medium text-gray-400">Sınıf verileri analiz ediliyor...</h3>
        <p className="text-sm text-gray-300 mt-2">Gemini pedagojik öneriler hazırlıyor</p>
      </div>
    );
  }

  if (!advice) {
    return (
      <div className="h-full min-h-[400px] bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
        <div className="bg-gray-50 p-4 rounded-full mb-4">
           <Sparkles className="text-gray-300" size={32} />
        </div>
        <h3 className="text-lg font-medium text-gray-500">Henüz Analiz Yapılmadı</h3>
        <p className="text-sm text-gray-400 mt-2 max-w-xs">Sol taraftaki kontrolleri kullanarak sınıf durumunu simüle edin ve "Analiz Et" butonuna basın.</p>
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
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-indigo-50 overflow-hidden flex flex-col">
      {/* Header Section */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50">
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-bold mb-4 capitalize ${statusColors[advice.genel_durum]}`}>
          {statusIcons[advice.genel_durum]}
          {advice.genel_durum.replace('_', ' ')}
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{advice.ogretmene_kisa_mesaj}</h2>
        <p className="text-gray-600 leading-relaxed">{advice.durum_ozeti}</p>
      </div>

      {/* Action Section */}
      <div className="p-6 bg-indigo-50/30 flex-grow">
        <div className="mb-6">
           <div className="flex items-center gap-2 mb-2">
               <MessageSquare size={18} className="text-indigo-600" />
               <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Öğretmen Replik Önerisi</h4>
           </div>
           <div className="bg-white p-4 rounded-xl border-l-4 border-indigo-500 shadow-sm relative">
             <Quote size={20} className="text-indigo-100 absolute right-4 top-4" />
             <p className="text-lg text-indigo-900 font-medium italic">"{advice.ogretmenin_soyleyebilecegi_cumle}"</p>
           </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
           <div>
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={18} className="text-amber-500" />
                <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Eylem Türü</h4>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200 text-gray-700 font-medium capitalize">
                {advice.onerilen_eylem_turu.replace(/_/g, ' ')}
              </div>
           </div>
           
           <div>
             <div className="flex items-center gap-2 mb-2">
                <Sparkles size={18} className="text-purple-500" />
                <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Alternatifler</h4>
             </div>
             <ul className="space-y-2">
               {advice.alternatif_etkinlik_fikirleri.map((fikir, index) => (
                 <li key={index} className="bg-white p-3 rounded-lg border border-gray-200 text-sm text-gray-600 flex items-start gap-2">
                    <span className="bg-purple-100 text-purple-600 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">{index + 1}</span>
                    {fikir}
                 </li>
               ))}
             </ul>
           </div>
        </div>
      </div>
    </div>
  );
};
