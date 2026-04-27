import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Send, MessageSquare, Volume2, VolumeX, ArrowLeft, GraduationCap, X } from 'lucide-react';
import { Message } from './App';
import { generateContentProxy } from './lib/ai';

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
  const [messages, setMessages] = useState<{sender: 'teacher'|'student', text: string}[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [teacherState, setTeacherState] = useState<'neutral' | 'pointing' | 'talking'>('neutral');
  const [boardText, setBoardText] = useState('');

  const recognitionRef = useRef<any>(null);
  const chatHistoryRef = useRef<ApiMessage[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const initialized = useRef(false);
  const isListeningRef = useRef(false);

  const speak = async (text: string) => {
    if (isMuted) return;
    
    const sentences = text.match(/[^.!?\n]+[.!?\n]+/g) ?? [];
    const summary = sentences.length > 0
      ? sentences.slice(0, 2).join(' ').trim()
      : text.slice(0, 180).trim() + (text.length > 180 ? '…' : '');
    setBoardText(summary);
    const cleanedText = text.replace(/\[.*?\]/g, '').trim();
    if (!cleanedText) return;

    try {
      setTeacherState('pointing');

      const result = await generateContentProxy({
        model: "gemini-2.0-flash-preview-tts",
        contents: [{ role: 'user', parts: [{ text: `Govori kao vrlo stari, mudar i strog ali dobrodušan profesor na srpskom jeziku. Glas treba da bude dubok i smiren: ${cleanedText}` }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Charon' },
            },
          },
        },
      });

      const base64Audio = result.response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      if (base64Audio) {
        setTeacherState('talking');
        await playBase64Audio(base64Audio);
        setTeacherState('neutral');
      } else {
        setTeacherState('neutral');
      }
    } catch (err) {
      console.error("TTS Error:", err);
      setTeacherState('neutral');
    }
  };

  const playBase64Audio = async (base64Data: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const audioCtx = audioContextRef.current;
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768;
      }
      
      const buffer = audioCtx.createBuffer(1, float32.length, 24000);
      buffer.getChannelData(0).set(float32);
      
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.start(0);
      
      return new Promise((resolve) => {
        source.onended = resolve;
      });
    } catch (err) {
      console.error("Audio playback error:", err);
    }
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
1. Objanjavaj lekciju deo po deo. Koristi Feynmanovu tehniku (jednostavno, analogije).
2. Svakih par poruka postavi pitanje da proveriš znanje korisnika.
3. Ako korisnik ne razume, pokušaj na drugi način.
4. Budi ohrabrujuć i pozitivan.
5. Odgovori moraju biti kratki i jasni (2-3 rečenice), na SRPSKOM jeziku.
6. Započni razgovor toplim pozdravom i najavom teme.`;
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const startChat = async () => {
      const initialGreeting = "Dobar dan! Danas cemo obraditi lekciju koju si pripremio. Jesi li spreman?";
      setMessages([{ sender: 'teacher', text: initialGreeting }]);
      chatHistoryRef.current = [{ role: 'model', parts: [{ text: initialGreeting }] }];
      setIsReady(true);
      speak(initialGreeting);
    };

    startChat();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setInputText(prev => prev + (prev.length > 0 ? ' ' : '') + finalTranscript);
        }
      };

      recognitionRef.current.onend = () => {
        if (isListeningRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            setIsListening(false);
            isListeningRef.current = false;
          }
        } else {
          setIsListening(false);
        }
      };
    }

    return () => {
      isListeningRef.current = false;
      recognitionRef.current?.stop();
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

    if (isListening) {
      isListeningRef.current = false;
      recognitionRef.current?.stop();
    }
    
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
      speak(text);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { sender: 'teacher', text: "Oprosti, zamislio sam se. Možeš li ponoviti?" }]);
    }
    setIsLoading(false);
  };

  return (
    <div className="w-full h-full bg-black flex overflow-hidden relative font-sans">
      {/* Background Images Layer */}
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

      {/* Chalkboard Display Area */}
      <div className="absolute top-[10%] left-[12%] w-[73%] h-[53%] z-10 flex items-center justify-center pointer-events-none px-10 py-6">
        <motion.div
          key={boardText}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white text-lg md:text-2xl lg:text-3xl font-medium tracking-tight text-center leading-relaxed drop-shadow-lg font-sans line-clamp-5 overflow-hidden"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {boardText}
        </motion.div>
      </div>

      {/* Top Bar - Exit */}
      <div className="absolute top-6 left-6 z-20">
        <button 
          onClick={onEndLearning}
          className="px-6 py-3 bg-red-600/80 hover:bg-red-600 text-white font-silkscreen border-4 border-red-900 shadow-lg flex items-center gap-2 transition-all active:scale-95"
        >
          <ArrowLeft size={20} /> IZAĐI
        </button>
      </div>

      {/* Bottom Chat / Interaction Area */}
      <div className="absolute bottom-0 inset-x-0 h-1/3 z-20 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col justify-end p-8">
        <div className="max-w-6xl mx-auto w-full flex flex-col gap-4">
           {/* Messages Overlay (Small) */}
           <div className="flex-1 overflow-y-auto pointer-events-none mb-2 max-h-28 flex flex-col gap-1">
              <AnimatePresence mode="popLayout">
                {messages.slice(-3).map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: m.sender === 'teacher' ? -10 : 10 }}
                    animate={{ opacity: 0.75, x: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex ${m.sender === 'teacher' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`px-3 py-1 rounded-lg text-xs font-pixel max-w-[85%] line-clamp-2 ${
                      m.sender === 'teacher' ? 'bg-yellow-900/60 text-yellow-100' : 'bg-blue-900/60 text-blue-100'
                    }`}>
                      {m.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
           </div>

           {/* Input Controls */}
           <div className="flex gap-4 items-center bg-white/10 backdrop-blur-md p-4 border-2 border-white/20 rounded-xl">
             <button 
               onClick={toggleListening}
               className={`p-4 rounded-lg transition-all ${
                 isListening ? 'bg-red-600 animate-pulse' : 'bg-white/10 hover:bg-white/20'
               }`}
             >
               {isListening ? <MicOff className="text-white" /> : <Mic className="text-white" />}
             </button>

             <div className="flex-1">
               <input 
                 type="text"
                 value={inputText}
                 onChange={(e) => setInputText(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                 placeholder="Pitaj profesora nešto..."
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
               onClick={() => setIsMuted(!isMuted)}
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
