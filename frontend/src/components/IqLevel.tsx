import React from 'react';
import { Brain } from 'lucide-react';

interface IqLevelProps {
  iqPoints: number;
  className?: string;
}

export const getIqLevel = (points: number) => {
  if (points < 100) return "POČETNIK";
  if (points < 115) return "RAZUMAN";
  if (points < 135) return "PAMETAN";
  if (points < 155) return "GENIJE";
  if (points < 180) return "EKSTREMAN";
  return "MISTERIJA";
};

export function IqLevel({ iqPoints, className = "" }: IqLevelProps) {
  const level = getIqLevel(iqPoints);

  return (
    <div className={`flex items-center ${className}`}>
      <div className="relative flex items-center bg-white border-[3px] border-black rounded-xl px-3 py-1 shadow-[2px_2px_0_rgba(0,0,0,0.2)]">
        <div className="mr-3 bg-pink-100 p-1 rounded-lg border-2 border-pink-300">
          <Brain size={24} className="text-pink-500 fill-pink-200" />
        </div>
        <div className="flex flex-col pr-2">
          <span className="font-silkscreen text-[10px] text-gray-500 leading-none mb-1">NIVO IQ:</span>
          <div className="flex items-baseline space-x-2">
            <span className="font-silkscreen text-black text-sm md:text-base font-bold">{level}</span>
            <span className="font-silkscreen text-blue-600 text-xs md:text-sm font-bold">({iqPoints})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
