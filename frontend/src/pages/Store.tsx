import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import { STUDENTS } from '../data/students';
import { useLanguage } from '../lib/language';

interface StoreProps {
  onBack: () => void;
  iqPoints: number;
  setIqPoints: React.Dispatch<React.SetStateAction<number>>;
  unlockedStudents: string[];
  setUnlockedStudents: React.Dispatch<React.SetStateAction<string[]>>;
  activeStudentId: string;
  setActiveStudentId: React.Dispatch<React.SetStateAction<string>>;
}

// The 3 students shown in the shop slots, in order
const SLOT_IDS = ['stefan', 'jovana', 'viktor'];

// Per-slot: image hitbox, name label, kupi button
const SLOTS = [
  { imgLeft: 18.25, nameLeft: 18.25, btnLeft: 19.5, btnWidth: 11 },
  { imgLeft: 31,    nameLeft: 31,    btnLeft: 32,   btnWidth: 11 },
  { imgLeft: 43,    nameLeft: 43,    btnLeft: 44.5, btnWidth: 11 },
];

export function Store({
  onBack,
  iqPoints,
  setIqPoints,
  unlockedStudents,
  setUnlockedStudents,
  activeStudentId,
  setActiveStudentId,
}: StoreProps) {
  const { t } = useLanguage();
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [unequipped, setUnequipped] = useState(false);
  const [shake, setShake] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const shopStudents = SLOT_IDS.map(id => STUDENTS.find(s => s.id === id)!).filter(Boolean);

  const handleBuy = (student: typeof STUDENTS[0]) => {
    if (activeStudentId === student.id) {
      // unequip — fall back to default student marko
      setActiveStudentId('marko');
      setUnequipped(true);
      setTimeout(() => setUnequipped(false), 2000);
      return;
    }
    if (unlockedStudents.includes(student.id)) {
      setActiveStudentId(student.id);
      return;
    }
    if (iqPoints >= student.cost) {
      setIqPoints(prev => prev - student.cost);
      setUnlockedStudents(prev => [...prev, student.id]);
      setActiveStudentId(student.id);
      setPurchaseSuccess(student.name);
      setTimeout(() => setPurchaseSuccess(null), 2500);
    } else {
      setShake(student.id);
      setTimeout(() => setShake(null), 400);
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full font-silkscreen overflow-hidden">
      <img
        src="/assets/shop.jpeg"
        alt="Shop"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ pointerEvents: 'none' }}
      />

      {/* Purchase success toast */}
      <AnimatePresence>
        {purchaseSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-green-600 text-white px-8 py-4 border-4 border-green-900 shadow-xl flex items-center gap-3 whitespace-nowrap"
          >
            <CheckCircle2 className="animate-bounce" />
            <span>{purchaseSuccess.toUpperCase()} {t('isNowYourStudent')}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unequip toast */}
      <AnimatePresence>
        {unequipped && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-orange-600 text-white px-8 py-4 border-4 border-orange-900 shadow-xl flex items-center gap-3 whitespace-nowrap"
          >
            <span>MARKO {t('isNowYourStudent')}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Student slots */}
      {shopStudents.map((student, idx) => {
        const slot = SLOTS[idx];
        const isUnlocked = unlockedStudents.includes(student.id);
        const isActive = activeStudentId === student.id;
        const canAfford = iqPoints >= student.cost;
        const isShaking = shake === student.id;
        const isHovered = hoveredId === student.id;

        return (
          <div key={student.id}>
            {/* Hover tooltip */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute z-50 bg-[#2d1b0d] text-[#f9f2e3] p-3 border-2 border-[#c2964e] shadow-2xl pointer-events-none"
                  style={{ left: `${slot.imgLeft}%`, top: '14%', width: '17%' }}
                >
                  <p className="font-bold text-[#ffca28] text-xs mb-1">{student.name.toUpperCase()}</p>
                  <p className="leading-snug text-[10px] opacity-90">{student.description}</p>
                  <p className="mt-1 text-[10px] text-orange-300">{t('priceLabel')} {student.cost} IQ</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Invisible hitbox — hover detection at exact size */}
            <div
              className="absolute cursor-help z-10"
              style={{ left: `${slot.imgLeft}%`, top: '34%', width: '14%', height: '29%' }}
              onMouseEnter={() => setHoveredId(student.id)}
              onMouseLeave={() => setHoveredId(null)}
            />

            {/* Visually larger image — centered on hitbox, no pointer events */}
            <motion.img
              src={student.avatar}
              alt={student.name}
              animate={isShaking ? { x: [0, -6, 6, -6, 6, 0] } : {}}
              transition={isShaking ? { duration: 0.35 } : {}}
              className={`absolute object-contain
                ${!isUnlocked ? 'grayscale brightness-50' : ''}
                ${isActive ? 'drop-shadow-[0_0_14px_rgba(255,193,7,0.7)]' : ''}
              `}
              style={{
                left: `calc(${slot.imgLeft}% - 7%)`,
                top: '20%',
                width: '28%',
                height: '55%',
                imageRendering: 'pixelated',
                pointerEvents: 'none',
              }}
            />

            {/* Price label (over the drawn label bar) */}
            <div
              className="absolute flex flex-col items-center justify-center"
              style={{ left: `${slot.nameLeft}%`, top: '61%', width: '14%', height: '9%' }}
            >
              {!isUnlocked && (
                <span className="text-black font-bold" style={{ fontSize: '0.75rem' }}>
                  {student.cost} IQ
                </span>
              )}
              {isActive && (
                <span
                  className="text-green-800 font-bold hover:text-red-700 transition-colors cursor-pointer"
                  style={{ fontSize: '0.6rem' }}
                  title={t('unequipStudent')}
                >
                  {hoveredId === student.id ? t('unequipStudent') : t('activeStudent')}
                </span>
              )}
              {isUnlocked && !isActive && (
                <span className="text-blue-800 font-bold" style={{ fontSize: '0.6rem' }}>
                  {t('purchasedStudent')}
                </span>
              )}
            </div>

            {/* Transparent Kupi button overlay */}
            <button
              onClick={() => handleBuy(student)}
              className={`absolute border-none cursor-pointer transition-colors
                ${!canAfford && !isUnlocked ? 'bg-red-500/0 hover:bg-red-500/10' : 'bg-transparent hover:bg-white/5'}
              `}
              style={{
                left: `${slot.btnLeft}%`,
                top: '71%',
                width: `${slot.btnWidth}%`,
                height: '10%',
                              }}
              aria-label={isActive ? t('unequipStudent') : isUnlocked ? t('activeStudent') : `${student.cost} IQ`}
            />
          </div>
        );
      })}

      {/* Transparent VRATI SE NAZAD button */}
      <button
        onClick={onBack}
        className="absolute cursor-pointer bg-transparent border-none"
        style={{ left: '30%', top: '82%', width: '40%', height: '12%' }}
        aria-label="Vrati se nazad"
      />
    </div>
  );
}
