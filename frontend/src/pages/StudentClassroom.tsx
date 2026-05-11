import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, HelpCircle, ArrowLeft, GraduationCap, X, Library, FileText, Loader } from 'lucide-react';
import { generateContentProxy } from '../lib/ai';

interface BibliotekaDoc {
  id: string;
  name: string;
  subject: string;
  storage_path: string;
  extracted_text: string;
  file_size: number;
  created_at: string;
}

interface StudentClassroomProps {
  onBack: () => void;
  onStartLearning: () => void;
  lessonText: string;
  setLessonText: React.Dispatch<React.SetStateAction<string>>;
  learningLevel: 'basic' | 'medium' | 'advanced';
  setLearningLevel: (level: 'basic' | 'medium' | 'advanced') => void;
}

export function StudentClassroom({ onBack, onStartLearning, lessonText, setLessonText, learningLevel, setLearningLevel }: StudentClassroomProps) {
  const [activePopup, setActivePopup] = useState<'material' | null>(null);
  const [popupTab, setPopupTab] = useState<'upload' | 'biblioteka'>('upload');
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<BibliotekaDoc[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    try {
      if (file.type === 'text/plain') {
        setLessonText(await file.text());
      } else if (file.type === 'application/pdf') {
        const base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        const base64 = base64Data.split(',')[1];
        const res = await fetch('/api/extract-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64Data: base64 }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        setLessonText((await res.json()).text || '');
      } else {
        const base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        const base64 = base64Data.split(',')[1];
        const mimeType = file.type || 'application/octet-stream';
        const result = await generateContentProxy({
          model: 'gpt-4o',
          contents: [{
            role: 'user',
            parts: [
              { inlineData: { data: base64, mimeType } },
              { text: "Izvuci sav tekst iz ove slike koji bi bio koristan za lekciju. Vrati isključivo čitak tekst lekcije, bez dodatnih komentara." }
            ]
          }]
        });
        setLessonText(result.text || '');
      }
    } catch (error) {
      console.error(error);
      alert("Greška pri čitanju fajla.");
    }
    setIsExtracting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const fetchDocuments = useCallback(async () => {
    setIsLoadingDocs(true);
    try {
      const res = await fetch('/api/documents');
      if (res.ok) setDocuments(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    if (popupTab === 'biblioteka') fetchDocuments();
  }, [popupTab, fetchDocuments]);

  const loadFromBiblioteka = async (doc: BibliotekaDoc) => {
    if (doc.extracted_text) { setLessonText(doc.extracted_text); setActivePopup(null); return; }
    setIsExtracting(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}/load`, { method: 'POST' });
      if (!res.ok) throw new Error((await res.json()).error);
      const { text } = await res.json();
      setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, extracted_text: text } : d));
      setLessonText(text);
      setActivePopup(null);
    } catch (err: any) {
      alert('Greška pri učitavanju: ' + err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="w-full h-full relative font-silkscreen overflow-hidden bg-[#88a898]">
      <img src="/assets/desk-student.jpg" alt="Student Desk" className="w-full h-full object-contain" />

      <button
        onClick={() => setActivePopup('material')}
        className="absolute top-[18%] left-[37%] w-[26%] h-[34%] bg-transparent hover:bg-yellow-400/5 cursor-pointer transition-all border-4 border-transparent hover:border-yellow-400/40 rounded-xl z-10 group"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white p-2 text-[10px] font-pixel whitespace-nowrap mb-2">
          KLIKNI DA POSTAVIŠ MATERIJAL
        </div>
      </button>

      {lessonText && (
        <div className="absolute top-[28%] left-[37%] w-[26%] h-[24%] pointer-events-none opacity-40 overflow-hidden">
          <p className="text-[8px] font-pixel text-[#5d4037] text-center line-clamp-6 leading-tight">{lessonText}</p>
        </div>
      )}

      <div className="absolute top-10 right-10 flex gap-6 z-20">
        <button onClick={onBack} className="px-6 py-4 bg-red-600 text-white border-4 border-red-800 hover:bg-red-500 shadow-[4px_4px_0_rgba(0,0,0,0.5)] flex items-center gap-2 transition-all hover:translate-y-1 hover:shadow-none">
          <ArrowLeft size={20} /> NAZAD
        </button>
        <button
          onClick={onStartLearning}
          disabled={!lessonText}
          className={`px-8 py-4 border-4 shadow-[4px_4px_0_rgba(0,0,0,0.5)] flex items-center gap-2 transition-all hover:translate-y-1 hover:shadow-none ${lessonText ? 'bg-green-600 border-green-800 text-white hover:bg-green-500' : 'bg-gray-400 border-gray-600 text-gray-300 opacity-50 cursor-not-allowed'}`}
        >
          <GraduationCap size={20} /> NAUČI ME
        </button>
      </div>

      <AnimatePresence>
        {activePopup === 'material' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 flex items-center justify-center z-[100] p-4 sm:p-8"
          >
            <motion.div
              initial={{ y: 50, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              className="bg-[#f2e6d9] border-8 border-[#5d4037] w-full max-w-5xl rounded-sm shadow-[16px_16px_0_rgba(0,0,0,0.6)] flex flex-col md:flex-row overflow-hidden max-h-[90vh]"
            >
              <div className="hidden md:flex flex-col justify-around py-8 px-2 bg-[#d7c4b1] border-r-4 border-[#5d4037] w-12">
                {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 border-2 border-gray-600 shadow-inner" />)}
              </div>

              <div className="flex-1 flex flex-col p-6 md:p-10 font-pixel overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6 border-b-4 border-[#5d4037] pb-4">
                  <div className="flex gap-2">
                    <button onClick={() => setPopupTab('upload')} className={`px-6 py-3 font-silkscreen text-lg flex items-center gap-2 border-4 transition-all ${popupTab === 'upload' ? 'bg-[#5d4037] border-[#3d2b1f] text-white' : 'bg-white/40 border-[#5d4037]/30 text-[#5d4037] hover:bg-white/70'}`}>
                      <BookOpen size={18} /> UPLOAD
                    </button>
                    <button onClick={() => setPopupTab('biblioteka')} className={`px-6 py-3 font-silkscreen text-lg flex items-center gap-2 border-4 transition-all ${popupTab === 'biblioteka' ? 'bg-[#5d4037] border-[#3d2b1f] text-white' : 'bg-white/40 border-[#5d4037]/30 text-[#5d4037] hover:bg-white/70'}`}>
                      <Library size={18} /> BIBLIOTEKA
                    </button>
                  </div>
                  <button onClick={() => setActivePopup(null)} className="bg-[#5d4037] text-white p-2 hover:bg-red-700 transition-colors"><X size={32} /></button>
                </div>

                {popupTab === 'upload' && (
                  <div className="flex flex-col lg:flex-row gap-8 flex-1">
                    <div className="flex-[2] flex flex-col gap-6">
                      <div className="flex gap-4">
                        <button onClick={() => fileInputRef.current?.click()} className="flex-1 px-6 py-4 bg-[#3498db] text-white font-silkscreen hover:bg-[#2980b9] border-4 border-[#1a5276] transition-all shadow-[4px_4px_0_#1a5276] active:shadow-none active:translate-y-1 flex items-center justify-center gap-3" disabled={isExtracting}>
                          {isExtracting ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><GraduationCap size={24} /></motion.div> : <BookOpen size={24} />}
                          {isExtracting ? 'ANALIZIRAM...' : 'OTPREMI PDF / SLIKU'}
                        </button>
                        <input type="file" className="hidden" ref={fileInputRef} accept="application/pdf,image/*,text/plain" onChange={handleFileUpload} />
                      </div>
                      <div className="flex-1 flex flex-col min-h-[300px]">
                        <div className="flex justify-between items-end mb-2">
                          <label className="text-sm font-bold text-[#5d4037] uppercase tracking-widest flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-600 rounded-full" /> SADRŽAJ DNEVNIKA
                          </label>
                          <span className="text-[10px] text-gray-500">{lessonText.length} KARAKTERA</span>
                        </div>
                        <textarea value={lessonText} onChange={(e) => setLessonText(e.target.value)} className="w-full flex-1 bg-[#fffcf5] border-4 border-[#5d4037] p-6 text-lg md:text-xl text-[#3d2b1f] resize-none focus:outline-none focus:border-[#d35400] transition-colors leading-relaxed custom-scrollbar shadow-inner" placeholder="Ovdje nalepi tekst lekcije..." />
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col gap-8">
                      <div className="bg-[#e8decb] border-4 border-[#5d4037] p-6 shadow-md">
                        <h3 className="font-silkscreen text-xl mb-4 text-[#5d4037] border-b-2 border-[#5d4037]/20 pb-2">NIVO PREDAVANJA</h3>
                        <div className="flex flex-col gap-3">
                          {(['basic', 'medium', 'advanced'] as const).map((level) => (
                            <button key={level} onClick={() => setLearningLevel(level)} className={`w-full px-4 py-3 border-4 font-silkscreen text-sm transition-all text-left flex justify-between items-center ${learningLevel === level ? 'bg-[#5d4037] border-[#3d2b1f] text-white translate-x-2' : 'bg-white/50 border-[#5d4037]/30 text-[#5d4037]/60 hover:bg-white/80'}`}>
                              {level === 'basic' ? 'OSNOVNI' : level === 'medium' ? 'SREDNJI' : 'NAPREDNI'}
                              {learningLevel === level && <GraduationCap size={16} />}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="bg-[#d4e6f1] border-4 border-[#2e86c1] p-6 shadow-md">
                        <div className="flex items-center gap-2 mb-3 text-[#1b4f72]"><HelpCircle size={20} /><h4 className="font-silkscreen text-sm">UPUTSTVO:</h4></div>
                        <ul className="text-[10px] font-pixel text-[#1b4f72] space-y-2">
                          <li>• Otpremi PDF lekcije ili napiši tekst.</li>
                          <li>• AI će analizirati materijal i objasniti ga.</li>
                          <li>• Odaberi nivo težine pre nego kreneš.</li>
                        </ul>
                      </div>
                      <div className="mt-auto pt-6">
                        <button onClick={() => setActivePopup(null)} className="w-full px-8 py-5 bg-[#27ae60] text-white font-silkscreen text-2xl hover:bg-[#2ecc71] border-4 border-[#1e8449] shadow-[6px_6px_0_#1e8449] active:shadow-none active:translate-y-1 transition-all">
                          SAČUVAJ I KRENI
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {popupTab === 'biblioteka' && (
                  <div className="flex flex-col flex-1">
                    {isLoadingDocs ? (
                      <div className="flex-1 flex items-center justify-center text-[#5d4037]">
                        <Loader size={40} className="animate-spin mr-3" />
                        <span className="font-silkscreen text-xl">UČITAVANJE...</span>
                      </div>
                    ) : documents.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-[#5d4037] opacity-50">
                        <Library size={64} className="mb-4" />
                        <p className="font-silkscreen text-xl">Biblioteka je prazna.</p>
                        <p className="font-pixel text-sm mt-2">Profesor treba da doda PDFove u biblioteku.</p>
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                        {documents.map((doc) => (
                          <button key={doc.id} onClick={() => loadFromBiblioteka(doc)} disabled={isExtracting} className="w-full text-left bg-[#fffcf5] border-4 border-[#5d4037] p-5 hover:border-[#d35400] hover:bg-[#fff8ee] transition-all flex items-center gap-4 group disabled:opacity-50">
                            <FileText size={32} className="text-[#8b5a33] flex-shrink-0 group-hover:text-[#d35400]" />
                            <div className="flex-1 min-w-0">
                              <p className="font-silkscreen text-xl text-[#5d4037] truncate">{doc.name}</p>
                              <p className="text-xs font-pixel text-[#8b5a33] mt-1">{doc.subject} · {Math.round(doc.file_size / 1024)} KB</p>
                            </div>
                            <span className="font-silkscreen text-sm text-[#27ae60] flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">UČITAJ →</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
