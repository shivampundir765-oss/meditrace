import React, { createContext, useContext, useState, useEffect } from 'react';
import storage from '../api/storage';
import en from './en.json';
import hi from './hi.json';

const dictionaries = { en, hi };

const I18nContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key
});

export const I18nProvider = ({ children }) => {
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    storage.getItem('meditrace_language').then((saved) => {
      if (saved && (saved === 'en' || saved === 'hi')) {
        setLanguageState(saved);
      }
    });
  }, []);

  const setLanguage = async (lang) => {
    setLanguageState(lang);
    await storage.setItem('meditrace_language', lang);
  };

  const t = (path) => {
    const keys = path.split('.');
    let current = dictionaries[language] || dictionaries.en;
    for (const k of keys) {
      if (current && current[k] !== undefined) {
        current = current[k];
      } else {
        // Fallback to English if missing
        let fallback = dictionaries.en;
        for (const fk of keys) {
          if (fallback && fallback[fk] !== undefined) {
            fallback = fallback[fk];
          } else {
            return path;
          }
        }
        return fallback;
      }
    }
    return current;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => useContext(I18nContext);
export default useTranslation;
