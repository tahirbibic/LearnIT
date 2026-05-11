import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { generateContentProxy } from '../lib/ai';
import { Message, SessionRecord } from '../App';
import { Trophy, Target, AlertTriangle, ArrowLeft, BarChart3 } from 'lucide-react';

interface AnalyticsProps {
  transcript: Message[];
  confusion: number;
  lessonText: string;
  onBack: () => void;
  onSave: (record: SessionRecord) => void;
}

interface AnalysisResult {
  score: number;
  goodPoints: string[];
  badPoints: string[];
  summary: string;
}

export function Analytics({ transcript, confusion, lessonText, onBack, onSave }: AnalyticsProps) {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    const generateReport = async () => {
      try {
        const chatText = transcript.map(m => `${m.sender}: ${m.text}`).join('\n');
        const prompt = `
          Analiziraj sesiju predavanja koristeći Feynmanovu tehniku.

          TRANSKRIPT:
          ${chatText}

          NIVO ZBUNJENOSTI UČENIKA: ${confusion}%

          Vrati ISKLJUČIVO validan JSON objekat na SRPSKOM jeziku:
          {
            "score": 1-100 (pedagoški skor),
            "goodPoints": ["lista pozitivnih stvari"],
            "badPoints": ["stvari za poboljšanje"],
            "summary": "kratak zaključak od 3 rečenice"
          }
        `;

        const response = await generateContentProxy({
          model: 'gemini-2.0-flash',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });

        let text = response.text || "{}";
        if (text.includes("```json")) {
          text = text.split("```json")[1].split("```")[0];
        } else if (text.includes("```")) {
          text = text.split("```")[1].split("```")[0];
        }

        const result = JSON.parse(text) as AnalysisResult;
        setData(result);

        if (!hasSaved) {
          const record: SessionRecord = {
            id: Date.now().toString(),
            date: new Date().toLocaleDateString('sr-RS'),
            topic: lessonText.substring(0, 50) || "Opšta tema",
            confusion,
            report: result.summary,
            grade: result.score
          };
          onSave(record);
          setHasSaved(true);
        }
      } catch (err) {
        console.error(err);
        setData({
          score: Math.max(0, 100 - confusion),
          goodPoints: ["Predavanje je završeno."],
          badPoints: ["Greška pri AI analizi."],
          summary: "Analiza trenutno nije dostupna, ali vaš napredak je sačuvan."
        });
      }
      setIsLoading(false);
    };

    generateReport();
  }, []);

  return (
    <div className="w-full h-full bg-[#0f172a] text-white flex flex-col font-pixel overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-4xl mx-auto w-full">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-lg shadow-[4px_4px_0_#1e3a8a]">
              <BarChart3 size={32} />
            </div>
            <h1 className="text-4xl font-silkscreen tracking-tighter">ANALITIKA PREDAVANJA</h1>
          </div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 bg-gray-800 border-4 border-gray-700 hover:bg-gray-700 transition-all shadow-[4px_4px_0_#000]"
          >
            <ArrowLeft size={20} /> NAZAD
          </button>
        </header>

        {isLoading ? (
          <div className="h-[60vh] flex flex-col items-center justify-center gap-6">
            <div className="w-20 h-20 border-8 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-2xl animate-pulse text-blue-400">AI PIŠE IZVEŠTAJ...</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-12"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-[#1e293b] border-4 border-[#334155] p-8 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Trophy size={120} />
                </div>
                <h2 className="text-xl text-blue-400 mb-2 uppercase">Pedagoški Rejting</h2>
                <div className="flex items-baseline gap-4">
                  <span className="text-8xl font-silkscreen text-white">{data?.score}</span>
                  <span className="text-2xl text-gray-400">/ 100</span>
                </div>
                <p className="mt-4 text-gray-300 text-lg leading-relaxed max-w-lg">{data?.summary}</p>
              </div>

              <div className="bg-[#1e293b] border-4 border-[#334155] p-8 rounded-2xl flex flex-col justify-center items-center text-center">
                <div className={`p-4 rounded-full mb-4 ${confusion > 50 ? 'bg-red-900/50 text-red-400' : 'bg-green-900/50 text-green-400'}`}>
                  <AlertTriangle size={48} />
                </div>
                <h3 className="text-lg text-gray-400 uppercase mb-1">Zbunjenost</h3>
                <span className={`text-6xl font-silkscreen ${confusion > 50 ? 'text-red-500' : 'text-green-500'}`}>{confusion}%</span>
                <p className="mt-2 text-sm text-gray-500">Krajnji rezultat seanse</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#064e3b]/30 border-4 border-[#065f46] p-6 rounded-2xl">
                <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
                  <Target className="text-green-500" /> ŠTA JE BILO DOBRO
                </h3>
                <ul className="space-y-3">
                  {data?.goodPoints.map((p, i) => (
                    <li key={i} className="flex gap-3 text-gray-200">
                      <span className="text-green-500">►</span> {p}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#450a0a]/30 border-4 border-[#7f1d1d] p-6 rounded-2xl">
                <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
                  <AlertTriangle className="text-red-500" /> ZA POBOLJŠANJE
                </h3>
                <ul className="space-y-3">
                  {data?.badPoints.map((p, i) => (
                    <li key={i} className="flex gap-3 text-gray-200">
                      <span className="text-red-500">►</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex justify-center pt-6">
              <button
                onClick={onBack}
                className="px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white font-silkscreen text-2xl border-b-8 border-blue-900 shadow-2xl active:border-b-0 active:translate-y-2 transition-all flex items-center gap-4"
              >
                <ArrowLeft /> NAZAD U ŠKOLU
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
