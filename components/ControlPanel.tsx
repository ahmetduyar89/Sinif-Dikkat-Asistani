import React from 'react';
import { ClassroomMetrics, ActivityType, TrendType } from '../types';
import { RefreshCcw, Sliders } from 'lucide-react';

interface ControlPanelProps {
  metrics: ClassroomMetrics;
  onChange: (newMetrics: ClassroomMetrics) => void;
  onRandomize: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ metrics, onChange, onRandomize }) => {
  const handleChange = (key: keyof ClassroomMetrics, value: any) => {
    onChange({ ...metrics, [key]: value });
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sliders className="text-indigo-600" size={20} />
          <h2 className="text-lg font-bold text-gray-800">Veri Simülasyonu</h2>
        </div>
        <button
          onClick={onRandomize}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          title="Rastgele Veri"
        >
          <RefreshCcw size={18} />
        </button>
      </div>

      <div className="space-y-5">
        {/* Lesson Minute */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <label className="font-medium text-gray-700">Ders Dakikası</label>
            <span className="text-gray-500">{metrics.lesson_minute}. dk</span>
          </div>
          <input
            type="range"
            min="0"
            max="45"
            value={metrics.lesson_minute}
            onChange={(e) => handleChange('lesson_minute', Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>

        {/* Focus Score */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <label className="font-medium text-gray-700">Odak Skoru</label>
            <span className={`font-bold ${metrics.focus_score < 40 ? 'text-red-500' : metrics.focus_score > 75 ? 'text-green-500' : 'text-yellow-600'}`}>
              {metrics.focus_score}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={metrics.focus_score}
            onChange={(e) => handleChange('focus_score', Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>

        {/* Noise Level */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <label className="font-medium text-gray-700">Gürültü Seviyesi</label>
            <span className="text-gray-500">{metrics.noise_level}/10</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            value={metrics.noise_level}
            onChange={(e) => handleChange('noise_level', Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>

        {/* Fidgeting Level */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <label className="font-medium text-gray-700">Hareketlilik (Kıpırdanma)</label>
            <span className="text-gray-500">{metrics.fidgeting_level}/10</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            value={metrics.fidgeting_level}
            onChange={(e) => handleChange('fidgeting_level', Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>

        {/* Activity Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Etkinlik Tipi</label>
          <select
            value={metrics.activity_type}
            onChange={(e) => handleChange('activity_type', e.target.value as ActivityType)}
            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {Object.values(ActivityType).map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Trend */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Son 5 Dk Eğilimi</label>
          <div className="flex gap-2">
            {Object.values(TrendType).map((trend) => (
              <button
                key={trend}
                onClick={() => handleChange('trend_last_5_min', trend)}
                className={`flex-1 py-1.5 text-xs rounded-md border transition-colors ${
                  metrics.trend_last_5_min === trend
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-medium'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {trend}
              </button>
            ))}
          </div>
        </div>

         {/* Detailed Percentages */}
         <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
            <div>
                <label className="text-xs text-gray-500 block">Tahtaya Bakış %</label>
                <input 
                    type="number" 
                    min="0" max="100" 
                    value={metrics.gaze_board_percentage}
                    onChange={(e) => handleChange('gaze_board_percentage', Number(e.target.value))}
                    className="w-full mt-1 p-1 border rounded text-sm"
                />
            </div>
            <div>
                <label className="text-xs text-gray-500 block">Baş Aşağı %</label>
                <input 
                    type="number" 
                    min="0" max="100" 
                    value={metrics.heads_down_percentage}
                    onChange={(e) => handleChange('heads_down_percentage', Number(e.target.value))}
                    className="w-full mt-1 p-1 border rounded text-sm"
                />
            </div>
         </div>
      </div>
    </div>
  );
};
