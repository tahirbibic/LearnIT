import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { generateContentProxy } from '../lib/ai';
import { Message } from '../App';

interface ExamModeProps {
  lessonText: string;
  transcript: Message[];
  confusionScore: number;
  studentLevel: number;
  onFinish: (iqPointsEarned: number, passed: boolean) => void;
}

interface Question {
  q: string;
  options: string[];
  correctIndex: number;
}

interface StudentAnswer {
  questionIndex: number;
  chosenIndex: number;
  isCorrect: boolean;
}

export function ExamMode({ lessonText, transcript, confusionScore, studentLevel, onFinish }: ExamModeProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [studentAnswers, setStudentAnswers] = useState<StudentAnswer[]>([]);
  const [stage, setStage] = useState<'generating' | 'taking' | 'smoke' | 'results'>('generating');
  const [grade, setGrade] = useState<{ score: number; letter: string; iqEarned: number } | null>(null);

  useEffect(() => {
    const generateQuiz = async () => {
      try {
        const chatHistory = transcript.map(m => `${m.sender}: ${m.text}`).join('\n');
        const prompt = `Na osnovu sledećeg teksta lekcije i transkripta predavanja, napravi kviz od tačno 8 pitanja sa više ponuđenih odgovora (a, b, c, d).
Pitanja treba da budu fokusirana na ono što je zapravo predavano u transkriptu.

Težina studenta: Nivo ${studentLevel} (Veći nivo znači kompleksnija pitanja).

Vrati ISKLJUČIVO validan JSON u sledećem formatu (niz objekata):
[
  {
    "q": "Tekst pitanja ovde",
    "options": ["A odgovor", "B odgovor", "C odgovor", "D odgovor"],
    "correctIndex": 0
  }
]

TEKST LEKCIJE:
"${lessonText || 'Opšte znanje'}"

TRANSKRIPT PREDAVANJA:
${chatHistory || 'Nema transkripta, koristi samo tekst lekcije.'}`;

        const response = await generateContentProxy({
          model: 'gemini-2.0-flash',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });

        let jsonText = (response.text || '[]').trim();
        if (jsonText.startsWith('```json')) jsonText = jsonText.replace(/^```json/, '').replace(/```$/, '').trim();
        else if (jsonText.startsWith('```')) jsonText = jsonText.replace(/^```/, '').replace(/```$/, '').trim();

        let parsedQuestions: Question[] = [];
        try {
          parsedQuestions = JSON.parse(jsonText);
          if (!Array.isArray(parsedQuestions)) parsedQuestions = [];
        } catch (_) {}

        const finalQuestions = parsedQuestions.slice(0, 8);
        while (finalQuestions.length < 8) {
          finalQuestions.push({
            q: "Koja je glavna tema ove lekcije?",
            options: ["Zavisi od unosa", "Nije poznato", "Sve od navedenog", "Ništa"],
            correctIndex: 2
          });
        }

        setQuestions(finalQuestions);
        setStage('taking');

        setTimeout(() => {
          const generatedAnswers: StudentAnswer[] = finalQuestions.map((q, idx) => {
            const chanceToGetRight = 95 - (confusionScore * 0.75);
            const isCorrect = (Math.random() * 100) <= chanceToGetRight;
            let chosenIndex = q.correctIndex;
            if (!isCorrect) {
              const wrongOptions = [0, 1, 2, 3].filter(i => i !== q.correctIndex);
              chosenIndex = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
            }
            return { questionIndex: idx, chosenIndex, isCorrect };
          });

          setStudentAnswers(generatedAnswers);
          setStage('smoke');

          setTimeout(() => {
            setStage('results');
            const correctCount = generatedAnswers.filter(a => a.isCorrect).length;
            let letter = 'F';
            if (correctCount === 8) letter = 'A+';
            else if (correctCount === 7) letter = 'A';
            else if (correctCount >= 5) letter = 'B';
            else if (correctCount >= 4) letter = 'C';
            else if (correctCount >= 3) letter = 'D';
            setGrade({ score: correctCount, letter, iqEarned: correctCount * 10 });
          }, 2000);
        }, 3000);
      } catch (error) {
        console.error("Greška pri generisanju kviza", error);
        setStage('taking');
      }
    };

    generateQuiz();
  }, []);

  return (
    <div className="w-full h-full bg-black relative flex items-center justify-center font-pixel overflow-hidden">
      <div className="relative w-full max-w-6xl aspect-video bg-[#3a2818] shadow-2xl overflow-hidden">
        <img
          src="/assets/exam-bg.jpg"
          alt="Exam Background"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            document.getElementById('exam-fallback')!.style.display = 'flex';
          }}
        />
        <div id="exam-fallback" className="absolute inset-0 hidden flex-col items-center justify-center text-white text-center p-8 bg-[#8b5a2b]" />

        {stage === 'generating' && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
            <h2 className="text-4xl text-white animate-pulse font-silkscreen">AI Sastavlja Test na osnovu lekcije...</h2>
          </div>
        )}

        {stage === 'taking' && (
          <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-yellow-400 text-black border-4 border-black p-4 z-40 shadow-xl text-center">
            <h2 className="text-2xl font-bold font-silkscreen">Učenik popunjava test...</h2>
            <p className="font-pixel text-sm mt-1">Status studenta: Nivo {studentLevel}</p>
          </div>
        )}

        <AnimatePresence>
          {stage === 'smoke' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
            >
              <div className="relative flex items-center justify-center">
                <motion.div initial={{ scale: 0.2, opacity: 0.8 }} animate={{ scale: 4, opacity: 0 }} transition={{ duration: 1.5, ease: "easeOut" }} className="absolute w-64 h-64 bg-gray-300 rounded-full blur-2xl" />
                <motion.div initial={{ scale: 0.2, opacity: 0.9, x: -20, y: -20 }} animate={{ scale: 3.5, opacity: 0, x: -150, y: -100 }} transition={{ duration: 1.3, ease: "easeOut" }} className="absolute w-48 h-48 bg-white rounded-full blur-xl" />
                <motion.div initial={{ scale: 0.2, opacity: 0.8, x: 20, y: 20 }} animate={{ scale: 3.2, opacity: 0, x: 150, y: 100 }} transition={{ duration: 1.4, ease: "easeOut" }} className="absolute w-56 h-56 bg-gray-400 rounded-full blur-2xl" />
                <motion.div initial={{ scale: 0.2, opacity: 0.9, x: 40, y: -10 }} animate={{ scale: 3.8, opacity: 0, x: 180, y: -80 }} transition={{ duration: 1.5, ease: "easeOut" }} className="absolute w-52 h-52 bg-gray-200 rounded-full blur-xl" />
                <motion.div initial={{ scale: 0.2, opacity: 0.8, x: -30, y: 40 }} animate={{ scale: 3.6, opacity: 0, x: -180, y: 120 }} transition={{ duration: 1.2, ease: "easeOut" }} className="absolute w-60 h-60 bg-gray-300 rounded-full blur-3xl" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {(stage === 'smoke' || stage === 'results' || stage === 'taking') && questions.length > 0 && (
          <div className="absolute top-[8.5%] left-[31.6%] w-[36.7%] h-[83%] z-30 pointer-events-none">
            <div className="flex w-full h-full">
              <div className="w-1/2 h-full flex flex-col pr-[6%]">
                {questions.slice(0, 4).map((q, rawIndex) => {
                  const ans = studentAnswers.find(a => a.questionIndex === rawIndex);
                  return (
                    <div key={rawIndex} className="relative h-1/4 w-full">
                      <div className="absolute top-[2%] left-[15%] right-[2%] h-[31%] flex items-start overflow-hidden leading-[1.6]">
                        <span className="font-silkscreen text-[7px] md:text-[8px] lg:text-[10px] text-black/80">{q.q}</span>
                      </div>
                      {q.options.map((opt, optIndex) => {
                        const isCorrectAnswer = q.correctIndex === optIndex;
                        const didStudentChooseThis = ans?.chosenIndex === optIndex;
                        const topPos = [34, 50, 67, 83][optIndex];
                        return (
                          <div key={optIndex} className="absolute left-[15%] right-[2%] h-[16%]" style={{ top: `${topPos}%` }}>
                            <span className={`absolute bottom-[2px] left-0 font-silkscreen text-[6.5px] md:text-[7.5px] lg:text-[9.5px] leading-none whitespace-nowrap overflow-hidden text-ellipsis max-w-full ${stage === 'results' && didStudentChooseThis ? 'font-bold text-black' : 'text-black/80'} ${stage === 'results' && isCorrectAnswer ? 'underline decoration-2 text-green-700' : ''} ${stage === 'results' && didStudentChooseThis && !ans?.isCorrect ? 'text-red-700' : ''}`}>
                              {['A', 'B', 'C', 'D'][optIndex]}. {opt.replace(/^[a-d]\s*[.)]\s*/i, '')}
                            </span>
                          </div>
                        );
                      })}
                      {stage === 'results' && ans && (
                        <div className="absolute right-[0%] top-[10%] text-sm md:text-xl font-bold opacity-90" style={{ transform: 'rotate(15deg)' }}>
                          {ans.isCorrect ? <span className="text-green-600">✓</span> : <span className="text-red-600">✗</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="w-1/2 h-full flex flex-col pl-[3%] pr-[3%]">
                {questions.slice(4, 8).map((q, rawIndex) => {
                  const qIndex = rawIndex + 4;
                  const ans = studentAnswers.find(a => a.questionIndex === qIndex);
                  return (
                    <div key={qIndex} className="relative h-1/4 w-full">
                      <div className="absolute top-[2%] left-[15%] right-[2%] h-[31%] flex items-start overflow-hidden leading-[1.6]">
                        <span className="font-silkscreen text-[7px] md:text-[8px] lg:text-[10px] text-black/80">{q.q}</span>
                      </div>
                      {q.options.map((opt, optIndex) => {
                        const isCorrectAnswer = q.correctIndex === optIndex;
                        const didStudentChooseThis = ans?.chosenIndex === optIndex;
                        const topPos = [34, 50, 67, 83][optIndex];
                        return (
                          <div key={optIndex} className="absolute left-[15%] right-[2%] h-[16%]" style={{ top: `${topPos}%` }}>
                            <span className={`absolute bottom-[2px] left-0 font-silkscreen text-[6.5px] md:text-[7.5px] lg:text-[9.5px] leading-none whitespace-nowrap overflow-hidden text-ellipsis max-w-full ${stage === 'results' && didStudentChooseThis ? 'font-bold text-black' : 'text-black/80'} ${stage === 'results' && isCorrectAnswer ? 'underline decoration-2 text-green-700' : ''} ${stage === 'results' && didStudentChooseThis && !ans?.isCorrect ? 'text-red-700' : ''}`}>
                              {['A', 'B', 'C', 'D'][optIndex]}. {opt.replace(/^[a-d]\s*[.)]\s*/i, '')}
                            </span>
                          </div>
                        );
                      })}
                      {stage === 'results' && ans && (
                        <div className="absolute right-[0%] top-[10%] text-sm md:text-xl font-bold opacity-90" style={{ transform: 'rotate(15deg)' }}>
                          {ans.isCorrect ? <span className="text-green-600">✓</span> : <span className="text-red-600">✗</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {stage === 'results' && grade && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-10 right-10 bg-[#f4e4c4] border-8 border-[#8b5a2b] p-8 text-black z-50 shadow-2xl rotate-2"
          >
            <h2 className="text-4xl font-silkscreen mb-4 border-b-4 border-black pb-2 text-center">REZULTATI</h2>
            <p className="text-2xl mb-2">Tačno: <span className="font-bold text-green-700">{grade.score} / 8</span></p>
            <p className="text-3xl mt-4">Ocena:</p>
            <p className="text-8xl font-silkscreen text-red-600 text-center my-4 drop-shadow-md">{grade.letter}</p>
            <p className="text-xl bg-yellow-200 p-2 font-bold text-center border-l-4 border-yellow-500">
              Zaradjeni IQ Poeni: +{grade.iqEarned}
            </p>
            <button
              onClick={() => onFinish(grade.iqEarned, grade.score >= 5)}
              className="mt-8 w-full px-6 py-4 bg-[#8b5a2b] text-white font-silkscreen text-xl hover:bg-[#a67139] border-4 border-[#593922] shadow-[4px_4px_0_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none transition-all"
            >
              Završi test
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
