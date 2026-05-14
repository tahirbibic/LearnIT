import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, FolderOpen, ScrollText, History, FileText, Library, Loader2 } from 'lucide-react';
import { generateContentProxy } from '../lib/ai';
import { getIqLevel } from '../components/IqLevel';
import { SessionRecord } from '../App';
import { Student } from '../data/students';
import { useLanguage } from '../lib/language';

interface ContentPdf {
  filename: string;
  name: string;
}

interface ClassroomProps {
  onBack: () => void;
  onGoToGreenboard: () => void;
  onHandOutExam: () => void;
  lessonText: string;
  setLessonText: React.Dispatch<React.SetStateAction<string>>;
  iqPoints: number;
  studentLevel: number;
  history: SessionRecord[];
  activeStudent: Student;
}

export function Classroom({ onBack, onGoToGreenboard, onHandOutExam, lessonText, setLessonText, iqPoints, studentLevel, history, activeStudent }: ClassroomProps) {
  const { lang, t } = useLanguage();
  const [activePopup, setActivePopup] = useState<'folder' | 'report' | null>(null);
  const [folderTab, setFolderTab] = useState<'new' | 'library' | 'history'>('new');
  const [isExtracting, setIsExtracting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [contentPdfs, setContentPdfs] = useState<ContentPdf[]>([]);
  const [presetLoading, setPresetLoading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (folderTab === 'library' && contentPdfs.length === 0) {
      fetch('/api/content-pdfs')
        .then(r => r.json())
        .then(data => setContentPdfs(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [folderTab]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);

    try {
      if (file.type === 'text/plain') {
        const text = await file.text();
        setLessonText(prev => prev + (prev ? '\n\n' : '') + text);
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
        const { text } = await res.json();
        setLessonText(prev => prev + (prev ? '\n\n' : '') + (text || ''));
      } else {
        const base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        const base64 = base64Data.split(',')[1];
        const mimeType = file.type || 'application/octet-stream';
        const result = await generateContentProxy({
          model: 'gemini-1.5-flash-latest',
          contents: [{
            role: 'user',
            parts: [
              { inlineData: { data: base64, mimeType } },
              { text: "Izvuci sav tekst iz ovog dokumenta/slike koji bi bio koristan za lekciju. Vrati isključivo čitak tekst lekcije, bez dodatnih komentara." }
            ]
          }]
        });
        setLessonText(prev => prev + (prev ? '\n\n' : '') + (result.text || ''));
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Greška pri ekstrakciji:", error);
      alert("Došlo je do greške pri čitanju fajla.");
    }

    setIsExtracting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLoadPreset = async (pdf: ContentPdf) => {
    setPresetLoading(pdf.filename);
    try {
      const res = await fetch(`/api/content-pdfs/${encodeURIComponent(pdf.filename)}`);
      if (!res.ok) throw new Error((await res.json()).error);
      const { text } = await res.json();
      setLessonText(prev => prev + (prev ? '\n\n' : '') + (text || ''));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Greška pri učitavanju:", error);
      alert("Nije moguće učitati ovaj PDF.");
    }
    setPresetLoading(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="w-full h-full bg-black relative flex items-center justify-center font-silkscreen"
    >
      <div className="relative w-full max-w-6xl aspect-video shadow-2xl overflow-hidden bg-[#76a5af]">
        <img
          src="/assets/classroom-bg.jpg"
          alt="Classroom Desk"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            document.getElementById('classroom-fallback')!.style.display = 'flex';
          }}
        />
        <div id="classroom-fallback" className="absolute inset-0 hidden flex-col items-center justify-center text-white text-center p-8 bg-[#3a2818]">
          <div className="mt-8 flex gap-4">
            <button onClick={onBack} className="px-4 py-2 bg-red-600 text-white">{t('goBack')}</button>
            <button onClick={onGoToGreenboard} className="px-4 py-2 bg-green-600 text-white">{t('goToBoard')}</button>
            <button onClick={() => setActivePopup('folder')} className="px-4 py-2 bg-yellow-600 text-white">Upload PDF</button>
          </div>
        </div>

        <button onClick={onBack} className="absolute left-[33.3%] top-[55.2%] w-[11.3%] h-[6.5%] bg-transparent hover:bg-white/20 cursor-pointer transition-colors border-2 border-transparent hover:border-green-400/80 rounded-md z-10" title="Vrati se nazad">
          <span className="sr-only">Nazad</span>
        </button>
        <button onClick={onGoToGreenboard} className="absolute left-[46.5%] top-[55.2%] w-[11.3%] h-[6.5%] bg-transparent hover:bg-white/20 cursor-pointer transition-colors border-2 border-transparent hover:border-green-400/80 rounded-md z-10" title="Idi na tablu">
          <span className="sr-only">Tabla</span>
        </button>
        <button onClick={() => setActivePopup('folder')} className="absolute left-[37.4%] top-[36%] w-[12.6%] h-[18.2%] bg-transparent hover:bg-white/20 cursor-pointer transition-colors border-2 border-transparent hover:border-gray-300/80 rounded-sm z-10" title="Biblioteka i Materijali">
          <span className="sr-only">Folder</span>
        </button>
        <button onClick={() => setActivePopup('report')} className="absolute left-[38.2%] top-[21.5%] w-[11.8%] h-[14.5%] bg-transparent hover:bg-white/30 cursor-pointer transition-colors border-2 border-transparent hover:border-orange-400/80 rounded-sm z-10" title="Dnevnik studenta">
          <span className="sr-only">Dnevnik</span>
        </button>
        <button onClick={onHandOutExam} className="absolute left-[50.6%] top-[27.3%] w-[10.5%] h-[22.5%] bg-transparent hover:bg-white/20 cursor-pointer transition-colors border-2 border-transparent hover:border-red-400/80 rounded-sm z-10 rotate-[7deg]" title="Pokreni Test">
          <span className="sr-only">Testovi</span>
        </button>

        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] bg-green-500 text-white px-8 py-4 border-4 border-green-800 shadow-[4px_4px_0_rgba(0,0,0,0.4)] font-silkscreen text-xl flex items-center gap-3"
            >
              <BookOpen className="animate-bounce" />
              {t('lessonAdded')}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {activePopup && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 p-8"
            >
              <div className="bg-[#ebd09b] border-8 border-[#c2964e] w-full max-w-4xl h-[80vh] p-0 text-[#5e411b] relative shadow-[12px_12px_0_rgba(0,0,0,0.5)] flex flex-col overflow-hidden">
                <button onClick={() => setActivePopup(null)} className="absolute top-2 right-4 text-4xl font-bold hover:text-red-600 transition-colors z-[60]">×</button>

                {activePopup === 'folder' && (
                  <div className="flex flex-col h-full font-pixel">
                    <div className="flex bg-[#d4bb72] border-b-8 border-[#c2964e]">
                      <button
                        onClick={() => setFolderTab('new')}
                        className={`px-6 py-4 font-silkscreen text-base flex items-center gap-2 ${folderTab === 'new' ? 'bg-[#ebd09b] border-b-8 border-[#ebd09b] -mb-2' : 'hover:bg-[#e4ca8d]'}`}
                      >
                        <FileText size={18} /> {t('newLesson')}
                      </button>
                      <button
                        onClick={() => setFolderTab('library')}
                        className={`px-6 py-4 font-silkscreen text-base flex items-center gap-2 ${folderTab === 'library' ? 'bg-[#ebd09b] border-b-8 border-[#ebd09b] -mb-2' : 'hover:bg-[#e4ca8d]'}`}
                      >
                        <Library size={18} /> {t('library')}
                      </button>
                      <button
                        onClick={() => setFolderTab('history')}
                        className={`px-6 py-4 font-silkscreen text-base flex items-center gap-2 ${folderTab === 'history' ? 'bg-[#ebd09b] border-b-8 border-[#ebd09b] -mb-2' : 'hover:bg-[#e4ca8d]'}`}
                      >
                        <History size={18} /> {t('historyTab')} ({history.length})
                      </button>
                    </div>

                    <div className="p-8 flex-1 flex flex-col overflow-y-auto">
                      {folderTab === 'new' && (
                        <div className="flex flex-col h-full">
                          <h2 className="text-3xl font-silkscreen mb-4 flex items-center gap-2">
                            <FolderOpen /> {t('teachingMaterial')}
                          </h2>
                          <p className="mb-4 text-xl">{t('pasteTextOrUpload')}</p>
                          <div className="flex gap-4 mb-4 items-center">
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="px-6 py-3 bg-blue-600 text-white font-silkscreen hover:bg-blue-500 border-4 border-blue-800 transition-all shadow-[4px_4px_0_#1e3a8a] active:shadow-none active:translate-y-1"
                              disabled={isExtracting}
                            >
                              {isExtracting ? t('reading') : t('uploadFile')}
                            </button>
                            <input type="file" className="hidden" ref={fileInputRef} accept="application/pdf,image/*,text/plain" onChange={handleFileUpload} />
                          </div>
                          <textarea
                            value={lessonText}
                            onChange={(e) => setLessonText(e.target.value)}
                            className="flex-1 w-full bg-[#f9f2e3] border-4 border-[#c2964e] p-6 text-xl resize-none focus:outline-none focus:border-[#8b5a33] custom-scrollbar min-h-[250px]"
                            placeholder={t('textPlaceholder')}
                          />
                          <div className="mt-4 flex justify-end">
                            <button
                              onClick={() => setActivePopup(null)}
                              className="px-10 py-4 bg-[#4ade80] text-black font-silkscreen text-2xl hover:bg-[#22c55e] border-4 border-[#166534] shadow-[6px_6px_0_#166534] active:shadow-none active:translate-y-1 transition-all"
                            >
                              {t('saveAndGo')}
                            </button>
                          </div>
                        </div>
                      )}

                      {folderTab === 'library' && (
                        <div className="flex flex-col h-full">
                          <h2 className="text-3xl font-silkscreen mb-2 flex items-center gap-2">
                            <Library /> {t('contentLibrary')}
                          </h2>
                          <p className="mb-6 text-lg opacity-70">{t('chooseOrUpload')}</p>

                          <div className="flex gap-4 mb-6">
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="px-6 py-3 bg-blue-600 text-white font-silkscreen hover:bg-blue-500 border-4 border-blue-800 transition-all shadow-[4px_4px_0_#1e3a8a] active:shadow-none active:translate-y-1 flex items-center gap-2"
                              disabled={isExtracting || !!presetLoading}
                            >
                              {isExtracting ? <><Loader2 size={16} className="animate-spin" /> {t('reading')}</> : t('uploadPdf')}
                            </button>
                            <input type="file" className="hidden" ref={fileInputRef} accept="application/pdf,image/*,text/plain" onChange={handleFileUpload} />
                          </div>

                          {contentPdfs.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center opacity-50">
                              <Loader2 size={32} className="animate-spin mr-3" />
                              <span className="text-xl">{t('loadingLibrary')}</span>
                            </div>
                          ) : (
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                              {contentPdfs.map((pdf) => (
                                <div
                                  key={pdf.filename}
                                  className="bg-[#f9f2e3] border-4 border-[#c2964e] p-5 flex items-center justify-between hover:border-[#8b5a33] transition-all"
                                >
                                  <div className="flex items-center gap-3">
                                    <FileText size={24} className="text-[#c2964e] shrink-0" />
                                    <span className="text-xl font-bold">{pdf.name}</span>
                                  </div>
                                  <button
                                    onClick={() => handleLoadPreset(pdf)}
                                    disabled={!!presetLoading}
                                    className="px-6 py-2.5 bg-[#4ade80] text-black font-silkscreen border-4 border-[#166534] shadow-[4px_4px_0_#166534] hover:bg-[#22c55e] active:shadow-none active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                  >
                                    {presetLoading === pdf.filename ? (
                                      <><Loader2 size={14} className="animate-spin" /> {t('loadingItem')}</>
                                    ) : (
                                      t('load')
                                    )}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {folderTab === 'history' && (
                        <div className="flex flex-col h-full">
                          <h2 className="text-3xl font-silkscreen mb-6 flex items-center gap-2">
                            <History /> {t('teachingHistory')}
                          </h2>
                          {history.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-[#8b5a33] opacity-50 italic">
                              <History size={64} className="mb-4" />
                              <p className="text-2xl">{t('noAnalyses')}</p>
                              <p className="text-lg">{t('finishForHistory')}</p>
                            </div>
                          ) : (
                            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-4">
                              {history.map((record) => (
                                <div key={record.id} className="bg-[#f9f2e3] border-4 border-[#c2964e] p-6 flex justify-between items-center hover:border-[#8b5a33] transition-all">
                                  <div className="flex-1">
                                    <div className="flex justify-between mb-2">
                                      <span className="text-xs bg-[#c2964e] text-white px-2 py-1">{record.date}</span>
                                      <span className="font-silkscreen text-green-700">{t('scoreLabel')} {record.grade}/100</span>
                                    </div>
                                    <h4 className="text-2xl font-bold mb-1 truncate max-w-md">{record.topic}</h4>
                                    <p className="text-sm opacity-70 line-clamp-2">{record.report}</p>
                                  </div>
                                  <div className="ml-6">
                                    <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center font-silkscreen text-xl ${record.confusion > 50 ? 'border-red-400 text-red-500' : 'border-green-400 text-green-600'}`}>
                                      {record.confusion}%
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activePopup === 'report' && (
                  <div className="flex flex-col h-full font-pixel p-8">
                    <h2 className="text-3xl font-silkscreen mb-8 border-b-4 border-[#c2964e] pb-2 flex items-center gap-2">
                      <ScrollText /> {t('journalTitle')} {activeStudent.name.toUpperCase()}
                    </h2>
                    <div className="flex gap-10">
                      <div className="w-1/3 flex flex-col items-center border-r-4 border-[#c2964e] pr-8">
                        <div className="w-48 h-48 bg-[#f9f2e3] border-8 border-[#c2964e] mb-6 flex items-center justify-center overflow-hidden shadow-lg">
                          <img src={activeStudent.avatar} alt={activeStudent.name} className="w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
                        </div>
                        <h3 className="text-3xl font-bold font-silkscreen text-center">{t('levelLabel')} <span className="text-red-600">{studentLevel}</span></h3>
                        <p className="text-xl font-pixel text-[#8b5a33] mb-6 uppercase tracking-wider">{getIqLevel(iqPoints, lang)}</p>
                        <div className="bg-blue-600 text-white p-6 w-full shadow-[6px_6px_0_#1e3a8a] border-4 border-[#1e3a8a]">
                          <p className="text-center font-bold text-lg mb-2 uppercase opacity-80">{t('iqRating')}</p>
                          <p className="text-center text-6xl font-silkscreen">{iqPoints}</p>
                        </div>
                      </div>
                      <div className="flex-1 space-y-8">
                        <div className="bg-[#f9f2e3] border-4 border-[#c2964e] p-6 shadow-inner">
                          <h4 className="text-2xl font-bold mb-4 border-b-2 border-[#c2964e]/30 pb-2 uppercase tracking-tighter text-[#8b5a33]">{t('currentStatus')}</h4>
                          <ul className="space-y-4 text-xl">
                            <li className="flex gap-3">
                              <span className="text-[#c2964e]">▶</span> <strong>{t('topicLabel')}</strong> {lessonText ? (lessonText.substring(0, 40) + '...') : t('notSelected')}
                            </li>
                            <li className="flex gap-3">
                              <span className="text-[#c2964e]">▶</span> <strong>{t('statusLabel')}</strong> {lessonText ? <span className="text-green-600 font-bold">{t('readyForTest')}</span> : <span className="text-red-500 italic">{t('waitingForMaterial')}</span>}
                            </li>
                          </ul>
                        </div>
                        <div className="p-6 bg-[#d4bb72]/40 border-l-8 border-[#c2964e] relative overflow-hidden">
                          <div className="absolute -right-4 -bottom-4 opacity-10"><BookOpen size={100} /></div>
                          <h4 className="font-bold text-2xl mb-3 flex items-center gap-2">{t('teacherTip')}</h4>
                          <p className="text-lg leading-relaxed italic">
                            {t('feynmanQuote')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
