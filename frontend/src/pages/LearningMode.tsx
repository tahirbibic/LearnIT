import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Send, Volume2, VolumeX, ArrowLeft } from 'lucide-react';
import { generateContentProxy, generateTTS } from '../lib/ai';

interface LearningModeProps {
  lessonText: string;
  onEndLearning: () => void;
  learningLevel: 'basic' | 'medium' | 'advanced';
}

interface ApiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export function LearningMode({ lessonText, onEndLearning, learningLevel }: LearningModeProps) {
  const [messages, setMessages] = useState<{ sender: 'teacher' | 'student'; text: string }[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [teacherState, setTeacherState] = useState<'neutral' | 'pointing' | 'talking'>('neutral');
  const [sttSupported, setSttSupported] = useState(true);
  const [lectureTitle, setLectureTitle] = useState('');
  const [lectureBullets, setLectureBullets] = useState<string[]>([]);

  const recognitionRef = useRef<any>(null);
  const chatHistoryRef = useRef<ApiMessage[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const initialized = useRef(false);
  const isListeningRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const isMutedRef = useRef(false);

  const speak = async (text: string) => {
    if (isMutedRef.current) return;

    const cleanedText = text.replace(/\[.*?\]/g, '').trim();
    if (!cleanedText) return;

    isSpeakingRef.current = true;
    if (isListeningRef.current) recognitionRef.current?.stop();

    try {
      setTeacherState('pointing');
      const base64Audio = await generateTTS(cleanedText, 'onyx');
      setTeacherState('talking');
      await playMp3Audio(base64Audio);
      setTeacherState('neutral');
    } catch (err) {
      console.error("TTS Error:", err);
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanedText);
        utterance.lang = 'sr-RS';
        utterance.onstart = () => setTeacherState('talking');
        utterance.onend = () => {
          setTeacherState('neutral');
          isSpeakingRef.current = false;
          if (isListeningRef.current) { try { recognitionRef.current?.start(); } catch (_) {} }
        };
        window.speechSynthesis.speak(utterance);
        return;
      }
      setTeacherState('neutral');
    }

    isSpeakingRef.current = false;
    if (isListeningRef.current) {
      try { recognitionRef.current?.start(); } catch (_) {}
    }
  };

  const playMp3Audio = async (base64Data: string): Promise<void> => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const audioCtx = audioContextRef.current;
    if (audioCtx.state === 'suspended') await audioCtx.resume();

    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);

    const audioBuffer = await audioCtx.decodeAudioData(bytes.buffer);
    const source = audioCtx.createBufferSource();
    activeSourceRef.current = source;
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);

    return new Promise<void>((resolve) => {
      source.onended = () => { activeSourceRef.current = null; resolve(); };
      source.start();
    });
  };

  const getSystemInstruction = () => {
    let modeText = '';
    if (learningLevel === 'basic') modeText = 'Objasni sve što jednostavnije, izbegavaj teške reči, koristi puno analogija (OSNOVNI NIVO).';
    if (learningLevel === 'medium') modeText = 'Objasni balansirano, koristi stručne termine ali ih objasni (SREDNJI NIVO).';
    if (learningLevel === 'advanced') modeText = 'Objasni detaljno i duboko, sa fokusom na kompleksne delove materijala (NAPREDNI NIVO).';

    return `Ti si PROFESOR u edukativnoj video igri.
Tvoj zadatak je da naučiš studenta (korisnika) lekciju.
Nivo težine koji moraš pratiti je: ${modeText}

Materijal za lekciju je:
"""
${lessonText}
"""

PRAVILA ZA PROFESORA:
1. Objašnjavaj lekciju deo po deo. Koristi Feynmanovu tehniku (jednostavno, analogije).
2. Svakih par poruka postavi pitanje da proveriš znanje korisnika.
3. Ako korisnik ne razume, pokušaj na drugi način.
4. Budi ohrabrujuć i pozitivan.
5. Nakon svakog objašnjenja, dodaj 1-3 bullet pointe koji sažimaju ključne tačke. Format: svaki bullet počinje sa "- " na novom redu. Svaki bullet mora biti KRATAK — maksimalno 5-6 reči, kao brza napomena, ne cela rečenica.
6. NIKADA ne koristi Markdown simbole: bez **, bez ->, bez *, bez #, bez _. Samo čist tekst i "- " za bullet pointe.
7. Odgovori moraju biti kratki i jasni, na SRPSKOM jeziku.
8. Započni razgovor toplim pozdravom i najavom teme.`;
  };

  useEffect(() => {
    if (!lessonText) return;
    const firstLine = lessonText.split('\n').find(l => l.trim().length > 2)?.trim() ?? '';
    const words = firstLine.split(/\s+/).slice(0, 3).join(' ').toUpperCase();
    setLectureTitle(words);
  }, [lessonText]);

  const extractBullets = (text: string): string[] => {
    return text.split('\n')
      .filter(l => l.trim().startsWith('- '))
      .map(l => l.trim().slice(2).trim())
      .filter(l => l.length > 0);
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const startChat = async () => {
      const initialGreeting = "Dobar dan! Danas ćemo obraditi lekciju koju si pripremio. Jesi li spreman?";
      setMessages([{ sender: 'teacher', text: initialGreeting }]);
      chatHistoryRef.current = [{ role: 'model', parts: [{ text: initialGreeting }] }];
      setIsReady(true);
      speak(initialGreeting);
    };

    startChat();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setSttSupported(false); return; }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'sr-RS';

    recognitionRef.current.onresult = (event: any) => {
      if (isSpeakingRef.current) return;
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
      }
      if (finalTranscript) setInputText(prev => prev + (prev.length > 0 ? ' ' : '') + finalTranscript);
    };

    recognitionRef.current.onerror = (event: any) => {
      if (event.error === 'no-speech') return;
      console.error('STT error:', event.error);
      setIsListening(false);
      isListeningRef.current = false;
    };

    recognitionRef.current.onend = () => {
      if (isListeningRef.current && !isSpeakingRef.current) {
        try { recognitionRef.current.start(); } catch (_) { setIsListening(false); isListeningRef.current = false; }
      } else {
        setIsListening(false);
      }
    };

    return () => {
      isListeningRef.current = false;
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
      try { activeSourceRef.current?.stop(); } catch (_) {}
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      isListeningRef.current = false;
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      isListeningRef.current = true;
      recognitionRef.current?.start();
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    if (isListening) { isListeningRef.current = false; recognitionRef.current?.stop(); }

    const userMessage = inputText;
    setInputText('');
    setMessages(prev => [...prev, { sender: 'student', text: userMessage }]);
    setIsLoading(true);

    try {
      chatHistoryRef.current.push({ role: 'user', parts: [{ text: userMessage }] });
      const result = await generateContentProxy({
        model: 'gemini-2.0-flash',
        systemInstruction: getSystemInstruction(),
        contents: chatHistoryRef.current
      });
      const text = result.text;
      chatHistoryRef.current.push({ role: 'model', parts: [{ text }] });
      setMessages(prev => [...prev, { sender: 'teacher', text }]);
      const newBullets = extractBullets(text);
      if (newBullets.length > 0) setLectureBullets(prev => [...prev, ...newBullets]);
      speak(text);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { sender: 'teacher', text: "Oprosti, zamislio sam se. Možeš li ponoviti?" }]);
    }
    setIsLoading(false);
  };

  return (
    <div className="w-full h-full bg-black flex overflow-hidden relative font-sans">
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.img
            key={teacherState}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            src={`/assets/professor-${teacherState === 'pointing' ? 'point' : teacherState === 'talking' ? 'talk' : 'neutral'}.jpg`}
            alt="Profesor"
            className="w-full h-full object-cover"
          />
        </AnimatePresence>
      </div>


      {lectureBullets.length > 0 && (
        <div className="absolute top-6 z-20 w-56 max-h-80 overflow-y-auto p-3"
          style={{ left: '40%' }}
        >
          {lectureTitle && (
            <p className="text-center text-white text-xs font-bold uppercase tracking-widest mb-3"
              style={{ fontFamily: 'monospace', textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}
            >
              {lectureTitle}
            </p>
          )}
          <ul className="space-y-1.5">
            <AnimatePresence initial={false}>
              {lectureBullets.map((bullet, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex gap-2 leading-snug"
                  style={{ color: 'rgba(255,255,255,0.92)', fontSize: '0.7rem', fontFamily: 'monospace', textShadow: '1px 1px 4px rgba(0,0,0,0.9)' }}
                >
                  <span className="shrink-0 mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>–</span>
                  <span>{bullet}</span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      )}

      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={onEndLearning}
          className="px-6 py-3 bg-red-600/80 hover:bg-red-600 text-white font-silkscreen border-4 border-red-900 shadow-lg flex items-center gap-2 transition-all active:scale-95"
        >
          <ArrowLeft size={20} /> IZAĐI
        </button>
      </div>

      <div className="absolute bottom-0 inset-x-0 h-1/3 z-20 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col justify-end p-8">
        <div className="max-w-6xl mx-auto w-full flex flex-col gap-4">
          <div className="overflow-y-auto mb-2 max-h-36 flex flex-col gap-2 pr-1">
            <AnimatePresence mode="popLayout">
              {messages.slice(-6).map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: m.sender === 'teacher' ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex ${m.sender === 'teacher' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`px-3 py-2 rounded-lg text-sm max-w-[85%] leading-snug ${m.sender === 'teacher' ? 'bg-yellow-900/80 text-yellow-100' : 'bg-blue-900/80 text-blue-100'}`}>
                    {m.text}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="flex gap-4 items-center bg-white/10 backdrop-blur-md p-4 border-2 border-white/20 rounded-xl">
            {sttSupported ? (
              <button
                onClick={toggleListening}
                className={`p-4 rounded-lg transition-all ${isListening ? 'bg-red-600 animate-pulse' : 'bg-white/10 hover:bg-white/20'}`}
              >
                {isListening ? <MicOff className="text-white" /> : <Mic className="text-white" />}
              </button>
            ) : (
              <div className="p-4 opacity-40">
                <MicOff className="text-white" />
              </div>
            )}

            <div className="flex-1">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={sttSupported ? "Pitaj profesora nešto..." : "Pitaj profesora nešto... (mikrofon nije dostupan)"}
                className="w-full bg-transparent border-none focus:ring-0 text-white font-pixel text-lg placeholder:text-white/30"
              />
            </div>

            <button
              onClick={handleSend}
              disabled={isLoading || !inputText.trim()}
              className="p-4 bg-yellow-500 rounded-lg hover:bg-yellow-400 disabled:opacity-30 transition-all active:scale-95"
            >
              <Send className="text-black" />
            </button>

            <button
              onClick={() => {
                const next = !isMuted;
                isMutedRef.current = next;
                setIsMuted(next);
                if (next) {
                  try { activeSourceRef.current?.stop(); } catch (_) {}
                  window.speechSynthesis?.cancel();
                  setTeacherState('neutral');
                  isSpeakingRef.current = false;
                }
              }}
              className="p-4 bg-white/10 rounded-lg text-white hover:bg-white/20"
            >
              {isMuted ? <VolumeX /> : <Volume2 />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
