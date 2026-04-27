import React from 'react';
import { motion } from 'motion/react';
import { getIqLevel } from './IqLevel';

interface LeaderboardProps {
  onBack: () => void;
  iqPoints: number;
}

export function Leaderboard({ onBack, iqPoints }: LeaderboardProps) {
  // Generate dummy accounts
  const accounts = [
    { name: 'Ti', score: iqPoints, isMe: true },
    { name: 'Marko M.', score: 120 },
    { name: 'Ana S.', score: 115 },
    { name: 'Jovan T.', score: 110 },
    { name: 'Milica K.', score: 105 },
    { name: 'Nikola P.', score: 100 },
    { name: 'Jelena R.', score: 95 },
    { name: 'Stefan V.', score: 90 },
    { name: 'Bojana D.', score: 85 },
    { name: 'Luka J.', score: 80 }
  ];

  // Sort them dynamically (take top 9 since image only has 9 slots labelled 1 to 10)
  const sortedAccounts = [...accounts].sort((a, b) => b.score - a.score).slice(0, 9);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-[#29221c] font-silkscreen"
    >
      <div className="absolute left-[3%] top-[3%] z-50">
         <button 
           onClick={onBack} 
           className="px-6 py-3 bg-red-600 text-white font-pixel text-xl border-4 border-[#593922] shadow-[4px_4px_0_rgba(0,0,0,0.5)] hover:bg-red-500 hover:translate-y-[2px] transition-all"
         >
           Nazad
         </button>

      </div>

      {/* Container that matches typical square-ish image ratio for 'leaderboard-bg.jpg' */}
      <div className="relative w-full max-w-[800px] h-[95%] max-h-[800px] aspect-square mx-auto">
         {/* The image itself */}
         <img 
           src="/assets/leaderboard-bg.jpg" 
           alt="Ranga Lista" 
           className="absolute inset-0 w-full h-full object-contain" 
           style={{ pointerEvents: 'none' }}
         />
         
         {/* Text Overlay relative to the image bounds */}
         <div className="absolute inset-0 w-full h-full pointer-events-auto">
            {sortedAccounts.map((acc, idx) => {
               // Exactly 9 slots mapped mathematically.
               const topPositions = [26.0, 33.0, 40.0, 47.0, 54.0, 61.0, 68.0, 75.0, 82.0];
               const topPos = (topPositions[idx] || 0) - 1.4; // Pomereno gore za dodatnu preciznost
               
               return (
                  <div 
                    key={idx} 
                    className="absolute inset-x-0 flex items-center"
                    style={{ 
                      top: `${topPos}%`, 
                      height: '4.0%' 
                    }} 
                  >
                      <span className={`absolute left-[34%] text-[10px] md:text-xs lg:text-[14px] uppercase whitespace-nowrap overflow-hidden text-ellipsis flex flex-col ${acc.isMe ? 'text-black' : 'text-[#3e2723]'}`}>
                          <span className="text-[8px] opacity-70 leading-none">{getIqLevel(acc.score)}</span>
                          <span className="font-extrabold">{acc.name}</span>
                      </span>
                      <span className={`absolute right-[26%] text-[12px] md:text-sm lg:text-[18px] uppercase tracking-widest ${acc.isMe ? 'text-yellow-400 font-extrabold drop-shadow-[2px_2px_0_rgba(0,0,0,1)] z-10' : 'text-[#f5e6ce] font-bold drop-shadow-[2px_2px_0_rgba(0,0,0,1)] z-10'}`}>
                          {acc.score} IQ
                      </span>
                  </div>
               );
            })}
         </div>
      </div>
    </motion.div>
  );
}
