import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Coins, UserCheck, Lock, CheckCircle2 } from 'lucide-react';
import { STUDENTS, Student } from './students';

interface StoreProps {
  onBack: () => void;
  iqPoints: number;
  setIqPoints: React.Dispatch<React.SetStateAction<number>>;
  unlockedStudents: string[];
  setUnlockedStudents: React.Dispatch<React.SetStateAction<string[]>>;
  activeStudentId: string;
  setActiveStudentId: React.Dispatch<React.SetStateAction<string>>;
}

export function Store({ 
  onBack, 
  iqPoints, 
  setIqPoints, 
  unlockedStudents, 
  setUnlockedStudents,
  activeStudentId,
  setActiveStudentId
}: StoreProps) {
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  
  const handleBuy = (student: Student) => {
    if (unlockedStudents.includes(student.id)) {
      setActiveStudentId(student.id);
      return;
    }

    if (iqPoints >= student.cost) {
      setIqPoints(prev => prev - student.cost);
      setUnlockedStudents(prev => [...prev, student.id]);
      setActiveStudentId(student.id);
      setPurchaseSuccess(student.name);
      setTimeout(() => setPurchaseSuccess(null), 2000);
    } else {
      // Small shake or red color feedback could be added here
    }
  };

  return (
    <div className="w-full h-full relative font-silkscreen overflow-hidden">
      <img src="/assets/store.jpg" alt="Store" className="w-full h-full object-cover" />
      
      {/* Overlay for transparency/readability if needed */}
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />

      {/* IQ Balance */}
      <div className="absolute top-8 right-12 flex items-center gap-3 bg-[#fbc02d] border-4 border-[#f57f17] px-5 py-2 shadow-[8px_8px_0_rgba(0,0,0,0.3)] z-50">
        <Coins className="text-orange-900 w-8 h-8" />
        <div className="flex flex-col">
          <span className="text-xs text-orange-800 -mb-1">TVOJ IQ NOVAC</span>
          <span className="text-3xl text-orange-900 leading-none">{iqPoints}</span>
        </div>
      </div>

      {/* Success Notification */}
      <AnimatePresence>
        {purchaseSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 z-[100] bg-green-500 text-white px-8 py-4 border-4 border-green-800 shadow-[4px_4px_0_rgba(0,0,0,0.4)] flex items-center gap-3"
          >
            <CheckCircle2 className="animate-bounce" />
            <span className="text-xl">{purchaseSuccess} JE SADA TVOJ STUDENT!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shop Items Grid aligned to background image slots */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none pt-16">
        <div className="grid grid-cols-4 gap-x-14 gap-y-12 pointer-events-auto">
          {Array.from({ length: 8 }).map((_, idx) => {
            const student = STUDENTS[idx];
            
            if (!student) {
              return (
                <div key={`lock-${idx}`} className="h-[210px] w-[185px] flex flex-col items-center opacity-40">
                  <div className="h-36 w-full flex items-center justify-center">
                    <Lock className="text-gray-400 w-12 h-12" />
                  </div>
                  <div className="w-full h-12 flex items-end">
                    <div className="w-full py-2 bg-gray-700 border-2 border-gray-900 text-gray-500 shadow-[2px_2px_0_rgba(0,0,0,0.5)] flex items-center justify-center gap-1 grayscale font-pixel text-xs">
                      <Lock size={12} /><span>KUPI</span>
                    </div>
                  </div>
                </div>
              );
            }

            const isUnlocked = unlockedStudents.includes(student.id);
            const isActive = activeStudentId === student.id;
            const canAfford = iqPoints >= student.cost;
            
            return (
              <motion.div 
                key={student.id}
                whileHover={{ scale: 1.05 }}
                className="relative group h-[210px] w-[185px] flex flex-col items-center"
              >
                {/* Info area - visible on hover */}
                <div className="opacity-0 group-hover:opacity-100 absolute -top-28 left-1/2 -translate-x-1/2 w-64 bg-[#2d1b0d] text-[#f9f2e3] p-4 text-xs font-pixel rounded-none z-50 border-2 border-[#c2964e] shadow-2xl transition-opacity pointer-events-none">
                  <p className="font-bold text-[#ffca28] text-sm mb-1">{student.name.toUpperCase()}</p>
                  <p className="leading-tight mb-2 opacity-90">{student.description}</p>
                  <div className="flex justify-between border-t border-[#c2964e]/30 pt-1">
                    <span>TEŽINA:</span>
                    <span className={`font-bold ${
                      student.difficulty === 'Easy' ? 'text-green-400' :
                      student.difficulty === 'Medium' ? 'text-yellow-400' :
                      student.difficulty === 'Hard' ? 'text-orange-400' : 'text-red-500 animate-pulse'
                    }`}>
                      {student.difficulty.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Avatar Display */}
                <div className="h-36 w-full flex items-center justify-center relative cursor-help">
                  <img 
                    src={student.avatar} 
                    alt={student.name} 
                    className={`w-32 h-32 object-contain transition-all duration-300 ${
                      isActive ? 'scale-110 drop-shadow-[0_0_15px_rgba(255,193,7,0.4)]' : 
                      !isUnlocked ? 'grayscale brightness-50 opacity-80' : 'hover:scale-110'
                    }`} 
                    style={{ imageRendering: 'pixelated' }}
                  />
                  
                  {!isUnlocked && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="text-white/20 w-8 h-8" />
                    </div>
                  )}

                  {isActive && (
                    <motion.div 
                      layoutId="active-indicator"
                      className="absolute -bottom-2 px-3 py-0.5 bg-green-500 border-2 border-green-800 text-[10px] text-white z-10"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      IZABRAN
                    </motion.div>
                  )}
                </div>

                {/* Button Area */}
                <div className="w-full h-12 flex items-end px-2">
                  <button
                    onClick={() => handleBuy(student)}
                    className={`w-full py-2.5 flex items-center justify-center gap-1 border-4 shadow-[4px_4px_0_rgba(0,0,0,0.5)] transition-all font-pixel text-xs active:translate-y-1 active:shadow-none
                      ${isActive ? 'bg-[#4caf50] border-[#2e7d32] text-white' : 
                        isUnlocked ? 'bg-[#1976d2] border-[#0d47a1] text-white hover:bg-[#2196f3]' : 
                        canAfford ? 'bg-[#ffca28] border-[#ff8f00] text-[#5d4037] hover:bg-[#ffd54f]' : 'bg-gray-600 border-gray-800 text-gray-400 cursor-not-allowed'}
                    `}
                  >
                    {isActive ? (
                      <><UserCheck size={14} /><span>AKTUELAN</span></>
                    ) : isUnlocked ? (
                      <span>IZABERI</span>
                    ) : (
                      <><Coins size={14} /><span>{student.cost} IQ</span></>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Back button */}
      <button 
        onClick={onBack}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 px-12 py-5 bg-red-600 text-white border-4 border-red-900 hover:bg-red-500 shadow-[8px_8px_0_rgba(0,0,0,0.6)] text-2xl transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none z-50 flex items-center gap-4 group"
      >
        <span className="group-hover:-translate-x-2 transition-transform">←</span>
        <span>NAZAD U ŠKOLU</span>
      </button>
    </div>
  );
}
