import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Trophy, X } from 'lucide-react';

interface StartMenuProps {
  onEnterProfessor: () => void;
  onEnterStudent: () => void;
  onStore: () => void;
  onLeaderboard: () => void;
}

export function StartMenu({ onEnterProfessor, onEnterStudent, onStore, onLeaderboard }: StartMenuProps) {
  const [fade, setFade] = useState(false);
  const [showBoard, setShowBoard] = useState(false);
  const [showProfessorPrompt, setShowProfessorPrompt] = useState(false);
  const [showStudentPrompt, setShowStudentPrompt] = useState(false);
  const [currentBg, setCurrentBg] = useState('/assets/menu-bg-open.jpg');

  const handleProfessorDoorClick = () => {
    setCurrentBg('/assets/menu-bg-professor-open.jpg');
    setTimeout(() => {
      setShowProfessorPrompt(true);
    }, 500);
  };

  const handleStudentDoorClick = () => {
    setCurrentBg('/assets/menu-bg-student-open.jpg');
    setTimeout(() => {
      setShowStudentPrompt(true);
    }, 500);
  };

  const handleProfessorContinue = () => {
    setShowProfessorPrompt(false);
    setFade(true);
    setTimeout(() => {
      onEnterProfessor();
    }, 1000);
  };

  const handleStudentContinue = () => {
    setShowStudentPrompt(false);
    setFade(true);
    setTimeout(() => {
      onEnterStudent();
    }, 1000);
  };

  const handleBack = () => {
    setShowProfessorPrompt(false);
    setShowStudentPrompt(false);
    setCurrentBg('/assets/menu-bg-open.jpg');
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black font-silkscreen overflow-hidden">
      <div className="relative w-full max-w-6xl aspect-video bg-[#3a2818] shadow-2xl">
        <img 
          src={currentBg} 
          alt="School Hallway" 
          className="w-full h-full object-cover transition-all duration-500"
        />
        
        {/* PROFESOR DOOR (Left) */}
        {!showProfessorPrompt && (
          <button 
             onClick={handleProfessorDoorClick}
             className="absolute left-[7%] top-[25%] w-[19%] h-[65%] bg-transparent hover:bg-white/5 cursor-pointer transition-colors border-2 border-transparent hover:border-yellow-400/30 rounded-sm z-10"
             title="Uđi kao Profesor"
          >
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity bg-black/80 text-white p-2 text-xs font-pixel whitespace-nowrap pointer-events-none">
               UĐI KAO PROFESOR
            </div>
          </button>
        )}

        {/* Professor Continuation Prompt (Metal Sign Style) */}
        <AnimatePresence>
          {showProfessorPrompt && (
            <div className="absolute inset-0 flex items-center justify-center z-[60] bg-black/40">
              <motion.div 
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="relative bg-gradient-to-b from-gray-300 to-gray-500 p-1 border-4 border-gray-600 shadow-[8px_8px_0_rgba(0,0,0,0.4)]"
              >
                {/* Rivets for metal look */}
                <div className="absolute top-2 left-2 w-2 h-2 bg-gray-700 rounded-full" />
                <div className="absolute top-2 right-2 w-2 h-2 bg-gray-700 rounded-full" />
                <div className="absolute bottom-2 left-2 w-2 h-2 bg-gray-700 rounded-full" />
                <div className="absolute bottom-2 right-2 w-2 h-2 bg-gray-700 rounded-full" />

                <div className="bg-[#1a2c21] border-2 border-gray-600 p-8 flex flex-col items-center gap-6">
                   <h2 className="text-4xl font-silkscreen text-white border-b-4 border-white/20 pb-4 w-full text-center">
                     PROFESOR
                   </h2>
                   
                   <p className="text-xl font-pixel text-green-400 text-center max-w-sm leading-relaxed">
                     UKOLIKO ŽELIŠ DA USAVRŠIŠ ZNANJE, NASTAVI
                   </p>

                   <div className="flex gap-4">
                     <button 
                       onClick={handleProfessorContinue}
                       className="px-10 py-4 bg-green-600 text-white border-4 border-green-800 hover:bg-green-500 shadow-[4px_4px_0_rgba(0,0,0,0.3)] text-2xl transition-all"
                     >
                       NASTAVI
                     </button>
                     <button 
                       onClick={handleBack}
                       className="px-6 py-4 bg-red-600 text-white border-4 border-red-800 hover:bg-red-500 shadow-[4px_4px_0_rgba(0,0,0,0.3)] text-xl transition-all"
                     >
                       NAZAD
                     </button>
                   </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Student Continuation Prompt (Metal Sign Style) */}
        <AnimatePresence>
          {showStudentPrompt && (
            <div className="absolute inset-0 flex items-center justify-center z-[60] bg-black/40">
              <motion.div 
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="relative bg-gradient-to-b from-gray-300 to-gray-500 p-1 border-4 border-gray-600 shadow-[8px_8px_0_rgba(0,0,0,0.4)]"
              >
                {/* Rivets */}
                <div className="absolute top-2 left-2 w-2 h-2 bg-gray-700 rounded-full" />
                <div className="absolute top-2 right-2 w-2 h-2 bg-gray-700 rounded-full" />
                <div className="absolute bottom-2 left-2 w-2 h-2 bg-gray-700 rounded-full" />
                <div className="absolute bottom-2 right-2 w-2 h-2 bg-gray-700 rounded-full" />

                <div className="bg-[#1a2c21] border-2 border-gray-600 p-8 flex flex-col items-center gap-6">
                   <h2 className="text-4xl font-silkscreen text-white border-b-4 border-white/20 pb-4 w-full text-center">
                     UČENIK
                   </h2>
                   
                   <p className="text-xl font-pixel text-green-400 text-center max-w-sm leading-relaxed">
                     UKOLIKO ŽELIŠ DA NAUČIŠ NEŠTO NOVO, NASTAVI
                   </p>

                   <div className="flex gap-4">
                     <button 
                       onClick={handleStudentContinue}
                       className="px-10 py-4 bg-green-600 text-white border-4 border-green-800 hover:bg-green-500 shadow-[4px_4px_0_rgba(0,0,0,0.3)] text-2xl transition-all"
                     >
                       NASTAVI
                     </button>
                     <button 
                       onClick={handleBack}
                       className="px-6 py-4 bg-red-600 text-white border-4 border-red-800 hover:bg-red-500 shadow-[4px_4px_0_rgba(0,0,0,0.3)] text-xl transition-all"
                     >
                       NAZAD
                     </button>
                   </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* UČENIK DOOR (Right) */}
        {!showProfessorPrompt && !showStudentPrompt && (
          <button 
             onClick={handleStudentDoorClick}
             className="absolute right-[7%] top-[25%] w-[19%] h-[65%] bg-transparent hover:bg-white/5 cursor-pointer transition-colors border-2 border-transparent hover:border-yellow-400/30 rounded-sm z-10"
             title="Uđi kao Učenik"
          >
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity bg-black/80 text-white p-2 text-xs font-pixel whitespace-nowrap pointer-events-none">
               UĐI KAO UČENIK
            </div>
          </button>
        )}

        {/* Notice Board (Pano) - Interactive Area */}
        {!showProfessorPrompt && !showStudentPrompt && (
          <button 
            onClick={() => setShowBoard(true)}
            className="absolute left-[40%] top-[35%] w-[21%] h-[28%] bg-transparent hover:bg-yellow-400/10 cursor-pointer transition-all border-2 border-transparent hover:border-yellow-400/50 rounded-sm z-10"
            title="Pogledaj oglasnu tablu"
          >
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity bg-black/80 text-white p-2 text-xs font-pixel whitespace-nowrap pointer-events-none">
               POGLEDAJ OBAVEŠTENJA
            </div>
          </button>
        )}

        {/* Notice Board Popup */}
        <AnimatePresence>
          {showBoard && (
            <div className="absolute inset-0 flex items-center justify-center z-[110] p-4 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-4xl aspect-[1.8/1] shadow-2xl"
              >
                {/* Close Button */}
                <button 
                  onClick={() => setShowBoard(false)}
                  className="absolute -top-4 -right-4 bg-red-600 p-3 text-white border-4 border-red-900 hover:bg-red-500 z-50 shadow-xl transition-all hover:scale-110 active:scale-95"
                >
                  <X size={32} strokeWidth={3} />
                </button>

                {/* The Image */}
                <img 
                  src="/assets/pano-meni.jpg" 
                  alt="Pano Menu" 
                  className="w-full h-full object-contain pointer-events-none"
                  style={{ imageRendering: 'pixelated' }}
                />

                {/* Interactive Hotspots for Prodavnica (Left Note) */}
                <button 
                  onClick={() => {
                    setShowBoard(false);
                    onStore();
                  }}
                  className="absolute left-[8%] top-[10%] w-[40%] h-[80%] bg-transparent hover:bg-yellow-400/5 cursor-pointer transition-colors border-2 border-transparent hover:border-yellow-400/20 group"
                >
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-black/60 text-white px-4 py-2 font-pixel text-sm whitespace-nowrap transition-opacity">
                      OTVORI PRODAVNICU
                   </div>
                </button>

                {/* Interactive Hotspots for Leaderboard (Right Note) */}
                <button 
                  onClick={() => {
                    setShowBoard(false);
                    onLeaderboard();
                  }}
                  className="absolute right-[8%] top-[10%] w-[40%] h-[80%] bg-transparent hover:bg-green-400/5 cursor-pointer transition-colors border-2 border-transparent hover:border-green-400/20 group"
                >
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-black/60 text-white px-4 py-2 font-pixel text-sm whitespace-nowrap transition-opacity">
                      POGLEDAJ TOP LISTU
                   </div>
                </button>
              </motion.div>
              
              {/* Clicking outside also closes */}
              <div 
                className="absolute inset-0 -z-10" 
                onClick={() => setShowBoard(false)}
              />
            </div>
          )}
        </AnimatePresence>

        {/* Black fade overlay */}
        <div 
           className={`absolute inset-0 bg-black pointer-events-none transition-opacity duration-1000 z-[100] ${
             fade ? 'opacity-100' : 'opacity-0'
           }`}
        ></div>
      </div>
    </div>
  );
}
