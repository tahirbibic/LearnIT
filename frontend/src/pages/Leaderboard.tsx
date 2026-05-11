import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { getIqLevel } from '../components/IqLevel';
import { supabase } from '../lib/supabase';

interface LeaderboardEntry {
  name: string;
  score: number;
  isMe?: boolean;
}

interface LeaderboardProps {
  onBack: () => void;
  iqPoints: number;
  username: string;
}


// vertical center of each row in the leaderboard image (% of image height)
const ROW_TOPS = [20, 27.5, 35, 42.5, 50, 57.5, 65, 72.5, 80];

export function Leaderboard({ onBack, iqPoints, username }: LeaderboardProps) {
  const [apiEntries, setApiEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    supabase
      .from('leaderboard')
      .select('username, score')
      .order('score', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setApiEntries(data.map((d: any) => ({ name: d.username, score: d.score })));
        }
      });
  }, []);

  const myEntry: LeaderboardEntry = { name: username || 'Ti', score: iqPoints, isMe: true };
  const merged = [myEntry, ...apiEntries.filter(e => e.name !== myEntry.name)];
  const sortedAccounts = merged.sort((a, b) => b.score - a.score).slice(0, 9);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 w-full h-full font-silkscreen"
    >
      {/* Background */}
      <img
        src="/assets/leaderboard.jpeg"
        alt="Rang Lista"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ pointerEvents: 'none' }}
      />

      {/* Row data overlaid on the drawn leaderboard rows */}
      <div className="absolute inset-0">
        {sortedAccounts.map((acc, idx) => (
          <div
            key={idx}
            className="absolute inset-x-0 flex items-center"
            style={{ top: `${ROW_TOPS[idx]}%`, height: '6%' }}
          >
            {/* IQ Score */}
            <span
              className="absolute text-[10px] md:text-xs font-bold"
              style={{ left: '39.25%', color: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : '#f5e6ce' }}
            >
              {acc.score}
            </span>

            {/* Name */}
            <span
              className="absolute text-[10px] md:text-xs font-bold uppercase truncate"
              style={{ left: '44%', maxWidth: '14%', color: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : '#f5e6ce' }}
            >
              {acc.name}
            </span>

            {/* Rank title */}
            <span
              className="absolute text-[9px] md:text-[11px] font-bold uppercase"
              style={{ left: '58%', color: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : '#f5e6ce' }}
            >
              {getIqLevel(acc.score)}
            </span>
          </div>
        ))}
      </div>

      {/* Transparent button over drawn "VRATI SE NAZAD" */}
      <button
        onClick={onBack}
        className="absolute cursor-pointer bg-transparent border-none"
        style={{ left: '37%', top: '88%', width: '26%', height: '9%' }}
        aria-label="Vrati se nazad"
      />
    </motion.div>
  );
}
