import React, { createContext, useCallback, useContext, useState } from 'react';
import { Lang, TranslationKey, translations } from './translations';

interface LanguageContextType {
  lang: Lang;
  toggleLang: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'sr',
  toggleLang: () => {},
  t: (key) => translations.sr[key],
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('sr');

  const toggleLang = useCallback(() => {
    setLang(l => (l === 'sr' ? 'en' : 'sr'));
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translations[lang][key],
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
