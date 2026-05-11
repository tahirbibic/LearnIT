import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Send, Volume2, VolumeX, ArrowLeft } from 'lucide-react';
import { Message } from '../App';
import { Student } from '../data/students';
import { generateContentProxy, generateTTS } from '../lib/ai';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

interface TeachingModeProps {
  lessonText: string;
  activeStudent: Student;
  onEndTeaching: (finalConfusion: number, transcript: Message[]) => void;
}

interface ApiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export function TeachingMode({ lessonText, activeStudent, onEndTeaching }: TeachingModeProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [apiHistory, setApiHistory] = useState<ApiMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [confusion, setConfusion] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedLang, setSelectedLang] = useState('sr-RS');
  const [studentState, setStudentState] = useState<'neutral' | 'thinking' | 'talking'>('neutral');
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [sttSupported, setSttSupported] = useState(true);

  const isListeningRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  const speak = async (text: string) => {
    if (!isTtsEnabled) return;
    const cleanedText = text.replace(/\[CONFUSION:\s*\d+\]/g, '').trim();
    if (!cleanedText) return;

    isSpeakingRef.current = true;
    if (isListeningRef.current) recognitionRef.current?.stop();

    try {
      if (studentState === 'neutral') setStudentState('thinking');
      const base64Audio = await generateTTS(cleanedText, activeStudent.voice);
      setStudentState('talking');
      await playMp3Audio(base64Audio);
      setStudentState('neutral');
    } catch (err) {
      console.error("TTS Error:", err);
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanedText);
        utterance.lang = 'sr-RS';
        utterance.onstart = () => setStudentState('talking');
        utterance.onend = () => {
          setStudentState('neutral');
          isSpeakingRef.current = false;
          if (isListeningRef.current) { try { recognitionRef.current?.start(); } catch (_) {} }
        };
        window.speechSynthesis.speak(utterance);
        return;
      }
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

  const getSystemInstruction = () =>
    `Ti si virtualni učenik ${activeStudent.name.toUpperCase()} u edukativnoj video igri.
${activeStudent.prompt}
Tvoj zadatak je da naučiš novu temu od profesora.
Materijal koji profesor treba da ti objasni je:
"""
${lessonText || '(Materijal nije učitan, pretvaraj se da ne znaš ništa i pitaj osnovna pitanja o temi koju profesor pomene)'}
"""

Pravila ponašanja:
1. Na početku budi zbunjen ili radoznao.
2. Na kraju SVAKE poruke obavezno uključi ovaj tag: [CONFUSION: X] gde je X broj od 0 do 100.
3. Ako je profesorovo objašnjenje komplikovano, povećaj zbunjenost (npr. [CONFUSION: 85]).
4. Ako profesor koristi jednostavan jezik i analogije, smanji zbunjenost (npr. [CONFUSION: 15]).
5. Odgovori moraju biti kratki (1-3 rečenice), na SRPSKOM jeziku.
6. Začni razgovor pitanjem o temi lekcije.
7. Težina razumevanja je: ${activeStudent.difficulty}.`;

  useEffect(() => {
    window.speechSynthesis?.getVoices();
    if (initialized.current) return;
    initialized.current = true;

    const startChat = async () => {
      const initialGreeting = activeStudent.id === 'marko'
        ? "Zdravo profesore! Baš sam uzbuđen zbog današnjeg časa. Šta ćemo to lepo naučiti?"
        : `Zdravo profesore! Ja sam ${activeStudent.name}. O čemu ćemo danas pričati?`;

      setMessages([{ sender: 'student', text: initialGreeting }]);
      setApiHistory([{ role: 'model', parts: [{ text: `${initialGreeting} [CONFUSION: 40]` }] }]);
      speak(initialGreeting);
      setIsReady(true);
    };

    startChat();

    return () => {
      isListeningRef.current = false;
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
      try { activeSourceRef.current?.stop(); } catch (_) {}
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setSttSupported(false); return; }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = selectedLang;

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
  }, []);

  useEffect(() => {
    if (recognitionRef.current) recognitionRef.current.lang = selectedLang;
  }, [selectedLang]);

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
    setMessages(prev => [...prev, { sender: 'teacher', text: userMessage }]);
    setIsLoading(true);
    setStudentState('thinking');

    try {
      const newHistory = [...apiHistory, { role: 'user' as const, parts: [{ text: userMessage }] }];
      setApiHistory(newHistory);

      const result = await generateContentProxy({
        model: 'gemini-2.0-flash',
        systemInstruction: getSystemInstruction(),
        contents: newHistory
      });

      let aiText = result.text || '';
      const match = aiText.match(/\[CONFUSION:\s*(\d+)\]/);
      if (match) {
        setConfusion(parseInt(match[1]));
        aiText = aiText.replace(/\[CONFUSION:\s*\d+\]/, '').trim();
      }

      setApiHistory([...newHistory, { role: 'model' as const, parts: [{ text: result.text }] }]);
      setMessages(prev => [...prev, { sender: 'student', text: aiText }]);
      speak(aiText);
    } catch (err) {
      console.error(err);
      setStudentState('neutral');
    }

    setIsLoading(false);
  };

  const confusionColor = confusion < 30 ? '#4ade80' : confusion < 70 ? '#facc15' : '#ef4444';

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden font-sans">
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.img
            key={studentState}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            src={
              studentState === 'thinking' ? '/assets/kid_teach_thinking.jpg'
              : studentState === 'talking' ? '/assets/kid_teach_talking.jpg'
              : '/assets/kid_teach.jpg'
            }
            alt="Student"
            className="w-full h-full object-cover"
          />
        </AnimatePresence>
      </div>

      <div className="absolute top-4 left-4 z-20 flex gap-3">
        <button
          onClick={() => onEndTeaching(confusion, messages)}
          className="px-5 py-2.5 bg-red-600/80 hover:bg-red-600 text-white border-2 border-red-900 shadow-lg flex items-center gap-2 transition-all active:scale-95 rounded-lg text-sm font-semibold"
        >
          <ArrowLeft size={16} /> Završi Predavanje
        </button>
        <button
          onClick={() => setIsTtsEnabled(!isTtsEnabled)}
          className={`px-4 py-2.5 border-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all active:scale-95 ${isTtsEnabled ? 'bg-blue-600/80 border-blue-800 text-white' : 'bg-black/40 border-white/20 text-white/50'}`}
        >
          {isTtsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          {isTtsEnabled ? 'Glas UKL.' : 'Glas ISKL.'}
        </button>
      </div>

      <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-sm border-2 border-white/20 rounded-xl p-3 w-40">
        <p className="text-yellow-300 text-xs text-center mb-2 font-semibold uppercase tracking-wider">Zbunjenost</p>
        <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden border border-white/10">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${confusion}%`, backgroundColor: confusionColor }}
          />
        </div>
        <p className="text-center text-white text-sm font-bold mt-1.5">{confusion}%</p>
      </div>

      <div className="absolute bottom-0 inset-x-0 z-20" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95) 60%, rgba(0,0,0,0.7) 80%, transparent)' }}>
        <div className="max-w-5xl mx-auto px-6 pt-4 pb-6 flex flex-col gap-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-yellow-400 text-xs font-semibold uppercase tracking-wider">
              Učenik: {activeStudent.name}
            </span>
            {isLoading && (
              <span className="text-yellow-300 text-xs animate-pulse font-medium">
                {activeStudent.name} razmišlja...
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1">
            <AnimatePresence mode="popLayout">
              {messages.slice(-6).map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: m.sender === 'student' ? -8 : 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex ${m.sender === 'student' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`px-3 py-2 rounded-lg text-sm max-w-[85%] leading-snug ${m.sender === 'student' ? 'bg-green-900/80 text-green-100' : 'bg-blue-900/80 text-blue-100'}`}>
                    {m.text}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>

          <div className="flex gap-3 items-center bg-white/10 backdrop-blur-md p-3 border border-white/20 rounded-xl">
            {sttSupported ? (
              <div className="flex flex-col items-center gap-1 shrink-0">
                <button
                  onClick={toggleListening}
                  disabled={!isReady || isLoading}
                  className={`p-3 rounded-lg transition-all active:scale-95 disabled:opacity-40 ${isListening ? 'bg-red-600 animate-pulse' : 'bg-white/10 hover:bg-white/20'}`}
                >
                  {isListening ? <MicOff size={20} className="text-white" /> : <Mic size={20} className="text-white" />}
                </button>
                <div className="flex gap-1">
                  {(['sr-RS', 'en-US'] as const).map(lang => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLang(lang)}
                      className={`px-1.5 py-0.5 text-[10px] font-semibold rounded border ${selectedLang === lang ? 'bg-yellow-500 border-yellow-600 text-black' : 'bg-white/10 border-white/20 text-white/60'}`}
                    >
                      {lang === 'sr-RS' ? 'SR' : 'EN'}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 opacity-30 shrink-0">
                <MicOff size={20} className="text-white" />
              </div>
            )}

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder={isListening ? "Slušam..." : "Predaj lekciju..."}
              disabled={!isReady || isLoading}
              rows={2}
              className="flex-1 bg-transparent border-none focus:ring-0 text-white text-sm placeholder:text-white/30 resize-none outline-none"
            />

            <button
              onClick={handleSend}
              disabled={!isReady || isLoading || !inputText.trim()}
              className="p-3 bg-yellow-500 hover:bg-yellow-400 rounded-lg disabled:opacity-30 transition-all active:scale-95 shrink-0"
            >
              <Send size={18} className="text-black" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
