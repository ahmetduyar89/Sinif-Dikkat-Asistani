import React from 'react';

interface MetricCardProps {
  label: string;
  value: number;
  min?: number;
  max: number;
  unit?: string;
  colorClass?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  min = 0,
  max,
  unit = '',
  colorClass = 'bg-blue-500'
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between">
      <div className="flex justify-between items-end mb-2">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <span className="text-2xl font-bold text-gray-800">
          {value}
          <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};
