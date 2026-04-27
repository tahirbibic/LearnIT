import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Send, MessageSquare, Volume2, VolumeX, ArrowLeft, GraduationCap, X } from 'lucide-react';
import { Message } from './App';
import { Student } from './students';
import { generateContentProxy } from './lib/ai';

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
  const [messages, setMessages] = useState<{sender: 'teacher'|'student', text: string}[]>([]);
  const [apiHistory, setApiHistory] = useState<ApiMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [confusion, setConfusion] = useState(50); // 0 to 100
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const isListeningRef = useRef(false);
  const [selectedLang, setSelectedLang] = useState('sr-RS');
  const [studentState, setStudentState] = useState<'neutral' | 'thinking' | 'talking'>('neutral');
  
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const talkingTimerRef = useRef<any>(null);

  const speak = async (text: string) => {
    if (!isTtsEnabled) return;
    
    // Clean text from confusion tags
    const cleanedText = text.replace(/\[CONFUSION:\s*\d+\]/g, '').trim();
    if (!cleanedText) return;

    try {
      // Only show thinking if we are already in neutral, to avoid flashing or repeating states
      if (studentState === 'neutral') setStudentState('thinking');

      const result = await generateContentProxy({
        model: "gemini-2.0-flash-preview-tts",
        contents: [{ role: 'user', parts: [{ text: `Izgovori ovo na prirodnom srpskom jeziku, kao ${activeStudent.name}: ${cleanedText}` }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: activeStudent.voice },
            },
          },
        },
      });

      const base64Audio = result.response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      if (base64Audio) {
        setStudentState('talking');
        await playPcmAudio(base64Audio);
        setStudentState('neutral');
      } else {
        throw new Error("No audio data returned from Gemini TTS");
      }
    } catch (err) {
      console.error("Gemini TTS Error:", err);
      // Fallback to basic speech if Gemini TTS fails
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanedText);
        utterance.lang = 'sr-RS';
        utterance.onstart = () => setStudentState('talking');
        utterance.onend = () => setStudentState('neutral');
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const playPcmAudio = async (base64Data: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const audioCtx = audioContextRef.current;
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      
      // Decode base64 to ArrayBuffer
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Convert 16-bit PCM to Float32
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768; // Normalize to [-1, 1]
      }
      
      const buffer = audioCtx.createBuffer(1, float32.length, 24000);
      buffer.getChannelData(0).set(float32);
      
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      
      return new Promise<void>((resolve) => {
        source.onended = () => resolve();
        source.start();
      });
    } catch (err) {
      console.error("Error playing PCM audio:", err);
    }
  };

  const getSystemInstruction = () => `Ti si virtualni učenik ${activeStudent.name.toUpperCase()} u edukativnoj video igri. 
${activeStudent.prompt}
Tvoj zadatak je da naučiš novu temu od profesora. 
Materijal koji profesor treba da ti objasni je:
"""
${lessonText || '(Materijal nije učitan, pretvaraj se da ne znaš ništa i pitaj osnovna pitanja o temi koju profesor pomene)'}
"""

Pravila ponašanja:
1. Na početku budi zbunjen ili radoznao. Pitaj stvari poput "A zašto je to tako?" ili "Kako to funkcioniše?".
2. Na kraju SVAKE poruke obavezno uključi ovaj tag: [CONFUSION: X] gde je X broj od 0 do 100.
3. Ako je profesorovo objašnjenje komplikovano, koristi stručne termine bez objašnjenja ili je dosadno, povećaj zbunjenost (npr. [CONFUSION: 85]).
4. Ako profesor koristi jednostavan jezik, analogije i objašnjava "kao detetu" (Feynmanova tehnika), smanji zbunjenost (npr. [CONFUSION: 15]).
5. Odgovori moraju biti kratki (1-3 rečenice), na SRPSKOM jeziku.
6. Započni razgovor pitanjem o temi lekcije.
7. Težina razumevanja je: ${activeStudent.difficulty}. (Ako je Hard ili Extreme, budi mnogo kritičniji prema objašnjenjima).`;

  useEffect(() => {
    // Pre-load voices for Chrome and other browsers
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    if (initialized.current) return;
    initialized.current = true;

    const startChat = async () => {
      const initialGreeting = activeStudent.id === 'marko' 
        ? "Zdravo profesore! Baš sam uzbuđen zbog današnjeg časa. Šta ćemo to lepo naučiti?"
        : `Zdravo profesore! Ja sam ${activeStudent.name}. Čula sam da ste najbolji u objašnjavanju teških stvari. O čemu ćemo danas pričati?`;
      
      setMessages([{ sender: 'student', text: initialGreeting }]);
      setApiHistory([{ role: 'model', parts: [{ text: `${initialGreeting} [CONFUSION: 40]` }] }]);
      
      // Start talking immediately
      speak(initialGreeting);
      
      setIsReady(true);
    };

    startChat();

    return () => {
      if (talkingTimerRef.current) clearTimeout(talkingTimerRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [lessonText]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
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

        recognitionRef.current.onerror = (event: any) => {
          if (event.error === 'no-speech') return; // Ignore harmless silence errors
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          // Auto-restart if we are supposed to be listening
          if (isListeningRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.error("Failed to restart recognition:", e);
              setIsListening(false);
              isListeningRef.current = false;
            }
          } else {
            setIsListening(false);
          }
        };
      }
    }
  }, []);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = selectedLang;
    }
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

    if (isListening) {
      isListeningRef.current = false;
      recognitionRef.current?.stop();
    }
    if (talkingTimerRef.current) clearTimeout(talkingTimerRef.current);
    
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

  const latestStudentMsg = [...messages].reverse().find(m => m.sender === 'student')?.text || '';

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="w-full h-full bg-[#1c3829] relative font-silkscreen flex flex-col p-8 border-16 border-[#5c3a21] shadow-inner"
    >
      <div className="absolute top-4 right-8 bg-[#8b2626] border-4 border-black p-4 text-white shadow-lg w-48 font-pixel">
        <h3 className="text-xl mb-2 text-center text-yellow-300 shadow-black uppercase tracking-tighter">Zbunjenost</h3>
        <div className="w-full h-6 bg-black p-1 border-2 border-white/20">
          <div 
            className="h-full transition-all duration-500 shadow-[0_0_8px_rgba(255,255,255,0.5)]"
            style={{ 
              width: `${confusion}%`,
              backgroundColor: confusion < 30 ? '#4ade80' : confusion < 70 ? '#facc15' : '#ef4444' 
            }}
          ></div>
        </div>
        <p className="text-center mt-2 text-2xl font-silkscreen">{confusion}%</p>
      </div>

      <div className="flex-1 flex w-full max-w-6xl mx-auto mt-8 gap-8 items-stretch overflow-hidden">
        
        {/* Student Avatar Area */}
        <div className="w-1/2 flex flex-col items-center justify-center relative">
          <div className="relative w-full aspect-square max-w-[500px] border-8 border-[#3d2616] bg-black shadow-2xl rounded-lg overflow-hidden">
             {/* Dynamic Image Swapping */}
             <img 
               src={
                 studentState === 'thinking' ? '/assets/kid_teach_thinking.jpg' : 
                 studentState === 'talking' ? '/assets/kid_teach_talking.jpg' : 
                 '/assets/kid_teach.jpg'
               } 
               alt="Student Kid" 
               className="w-full h-full object-cover transition-all duration-300"
             />
             
             {/* Confusion Overlay */}
             <div className="absolute inset-0 bg-red-500/10 pointer-events-none transition-opacity duration-500" style={{ opacity: confusion / 100 }}></div>
             
             {/* Speech Bubble text - matching the white bubble area in kid_teach_talking.jpg */}
             {studentState === 'talking' && (
               <div className="absolute top-[11%] right-[3%] w-[35%] h-[20%] p-2 flex items-center justify-center z-20">
                 <p className="text-black font-pixel text-[9px] md:text-sm lg:text-lg leading-relaxed text-center w-full max-h-full overflow-y-auto custom-scrollbar">
                   {latestStudentMsg}
                 </p>
               </div>
             )}
          </div>
          <div className="mt-4 bg-[#3d2616] p-2 border-2 border-yellow-600 rounded">
            <p className="text-yellow-400 text-sm uppercase">TVOJ UČENIK: {activeStudent.name}</p>
          </div>
        </div>

        {/* Controls Area (Simplified) */}
        <div className="w-1/2 flex flex-col items-center justify-center p-6 gap-8">
          <div className="w-full bg-black/60 border-4 border-[#3d2616] p-8 rounded-2xl shadow-2xl backdrop-blur-sm">
             <p className="text-white/60 mb-6 font-pixel text-center text-lg italic">
               {isListening ? "Učenik te pažljivo sluša..." : "Spreman za tvoje predavanje."}
             </p>
             
             <div className="flex gap-4">
                <button 
                  onClick={toggleListening}
                  className={`w-28 h-28 border-8 transition-all flex flex-col items-center justify-center rounded-2xl ${isListening ? 'bg-red-600 border-red-400 animate-pulse' : 'bg-gray-800 border-gray-600 hover:bg-gray-700 shadow-[0_8px_0_rgba(0,0,0,0.5)] active:translate-y-[4px] active:shadow-none'}`}
                  title="Voice Recognition"
                  disabled={!isReady || isLoading}
                >
                  {isListening ? <MicOff size={40} className="text-white" /> : <Mic size={40} className="text-white" />}
                  <span className="text-white text-[10px] mt-2 font-pixel">{isListening ? 'STOP' : 'PRIČAJ'}</span>
                </button>
                
                <div className="flex-1 flex flex-col gap-4">
                  <div className="relative flex-1">
                    <textarea 
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                      className="w-full h-full bg-white text-black border-4 border-black p-4 text-xl font-pixel focus:outline-none focus:ring-4 focus:ring-blue-500/50 resize-none min-h-[110px]"
                      placeholder={isListening ? "Slušam..." : "Predaj lekciju..."}
                      disabled={!isReady || isLoading}
                    />
                    <button 
                      onClick={handleSend}
                      disabled={!isReady || isLoading || !inputText.trim()}
                      className="absolute right-3 bottom-3 bg-blue-600 text-white p-4 border-4 border-blue-900 shadow-[2px_2px_0_rgba(0,0,0,0.3)] hover:translate-y-[1px] disabled:opacity-50"
                    >
                      <Send size={24} />
                    </button>
                  </div>
                </div>
             </div>
          </div>

          {isLoading && (
            <div className="bg-yellow-400 text-black px-6 py-3 border-4 border-black font-pixel animate-bounce">
               MARKO RAZMIŠLJA O TVOJOJ LEKCIJI...
            </div>
          )}
        </div>
      </div>

      <div className="absolute top-4 left-4 flex gap-4">
        <button 
          onClick={() => onEndTeaching(confusion, messages)} 
          className="px-6 py-3 bg-red-600 text-white font-silkscreen hover:bg-red-500 border-4 border-red-800 shadow-[4px_4px_0_#4a0000] text-xl"
        >
          Završi Predavanje
        </button>

        <button 
          onClick={() => setIsTtsEnabled(!isTtsEnabled)}
          className={`px-6 py-3 border-4 font-silkscreen text-xl flex items-center gap-3 transition-all ${isTtsEnabled ? 'bg-blue-600 border-blue-800 text-white shadow-[4px_4px_0_#1e3a8a]' : 'bg-gray-700 border-gray-900 text-gray-400 shadow-[4px_4px_0_#000]'}`}
          title="Uključi/Isključi Glas"
        >
          {isTtsEnabled ? <Volume2 /> : <VolumeX />}
          {isTtsEnabled ? 'SLUŠAJ' : 'GLAS ISKLJ.'}
        </button>
      </div>
    </motion.div>
  );
}
