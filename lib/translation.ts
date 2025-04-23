'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { SUPPORTED_LANGUAGES, type LanguageCode } from './translation-server';
import axios from 'axios';

export { SUPPORTED_LANGUAGES, type LanguageCode };

// Cache translations in localStorage
const CACHE_KEY = 'translation_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  translation: string;
  timestamp: number;
}

interface TranslationCache {
  [lang: string]: {
    [text: string]: CacheEntry;
  };
}

const getApiEndpoint = () => {
  if (process.env.NODE_ENV === 'development') {
    return '/api/translate';
  }
  return '/api/translate'; // Use relative URL, Netlify will handle the redirect
};

class TranslationManager {
  private batchSize = 20; // Maximum batch size for translations
  private batchTimeout = 200; // Batch collection window
  private pending: Map<string, string[]> = new Map();
  private timeoutId: NodeJS.Timeout | null = null;
  private cache: TranslationCache;

  constructor() {
    this.cache = this.loadCache();
  }

  private isClient(): boolean {
    return typeof window !== 'undefined';
  }

  private loadCache(): TranslationCache {
    if (!this.isClient()) return {};
    
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Clear expired entries
        Object.keys(parsed).forEach(lang => {
          Object.keys(parsed[lang]).forEach(text => {
            if (Date.now() - parsed[lang][text].timestamp > CACHE_EXPIRY) {
              delete parsed[lang][text];
            }
          });
        });
        return parsed;
      }
    } catch (error) {
      console.error('Error loading translation cache:', error);
    }
    return {};
  }

  private saveCache() {
    if (!this.isClient()) return;
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.error('Error saving translation cache:', error);
    }
  }

  getCachedTranslation(text: string, lang: LanguageCode): string | null {
    const cached = this.cache[lang]?.[text];
    if (cached && Date.now() - cached.timestamp <= CACHE_EXPIRY) {
      return cached.translation;
    }
    return null;
  }

  private setCachedTranslation(texts: string[], translations: string[], lang: LanguageCode) {
    if (!this.cache[lang]) {
      this.cache[lang] = {};
    }
    
    texts.forEach((text, i) => {
      this.cache[lang][text] = {
        translation: translations[i],
        timestamp: Date.now()
      };
    });
    
    this.saveCache();
  }

  clearCache(lang: LanguageCode) {
    delete this.cache[lang];
    this.saveCache();
  }

  async translateBatch(lang: LanguageCode, setTranslations: (updates: Record<string, string>) => void) {
    const texts = this.pending.get(lang) || [];
    if (!texts.length) return;

    this.pending.delete(lang);
    
    try {
      console.log(`[Translation Manager] Translating batch of ${texts.length} texts to ${lang}`);
      
      const response = await axios.post(getApiEndpoint(), {
        texts,
        from: 'EN',
        to: lang,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 20000, // 20 second timeout
      });

      const { translations } = response.data;
      if (Array.isArray(translations)) {
        const updates: Record<string, string> = {};
        texts.forEach((text, i) => {
          updates[text] = translations[i];
        });
        setTranslations(updates);
        this.setCachedTranslation(texts, translations, lang);
      }
    } catch (error) {
      console.error('[Translation Manager] Batch translation error:', error);
      // On error, clear pending texts to prevent infinite retries
      this.pending.clear();
    }
  }

  queueTranslation(text: string, lang: LanguageCode, setTranslations: (updates: Record<string, string>) => void) {
    const pending = this.pending.get(lang) || [];
    pending.push(text);
    this.pending.set(lang, pending);

    if (pending.length >= this.batchSize) {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      this.translateBatch(lang, setTranslations);
    } else if (!this.timeoutId) {
      this.timeoutId = setTimeout(() => {
        this.timeoutId = null;
        this.translateBatch(lang, setTranslations);
      }, this.batchTimeout);
    }
  }
}

export function useTranslation() {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>('EN');
  const [translations, setTranslations] = useState<Record<string, Record<LanguageCode, string>>>({});
  const translationManager = useRef<TranslationManager | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);

  useEffect(() => {
    // Initialize TranslationManager on client side only
    if (!translationManager.current) {
      translationManager.current = new TranslationManager();
    }
  }, []);

  useEffect(() => {
    // Load language preference from localStorage on client side only
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('preferred_language');
      if (savedLang && SUPPORTED_LANGUAGES.some(lang => lang.code === savedLang)) {
        setCurrentLanguage(savedLang as LanguageCode);
      }
    }
  }, []);

  useEffect(() => {
    // Save language preference and clear translations when language changes
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred_language', currentLanguage);
      
      if (translationManager.current) {
        // Clear cache for the new language to force fresh translations
        translationManager.current.clearCache(currentLanguage);
        // Clear in-memory translations
        setTranslations({});
        // Force component re-render
        setForceUpdate(prev => prev + 1);
      }
    }
  }, [currentLanguage]);

  const translate = useCallback((text: string, targetLang?: LanguageCode): string => {
    if (!translationManager.current) return text;

    const lang = targetLang || currentLanguage;
    if (lang === 'EN') return text;

    // Check in-memory cache first
    if (translations[text]?.[lang]) {
      return translations[text][lang];
    }

    // Then check persistent cache
    const cached = translationManager.current.getCachedTranslation(text, lang);
    if (cached) {
      setTranslations(prev => ({
        ...prev,
        [text]: { ...(prev[text] || {}), [lang]: cached }
      }));
      return cached;
    }

    // Queue for translation if not cached
    translationManager.current.queueTranslation(text, lang, (updates) => {
      setTranslations(prev => {
        const newTranslations = { ...prev };
        Object.entries(updates).forEach(([originalText, translation]) => {
          newTranslations[originalText] = {
            ...(newTranslations[originalText] || {}),
            [lang]: translation
          };
        });
        return newTranslations;
      });
    });

    return text; // Return original text while translation is pending
  }, [currentLanguage, translations, forceUpdate]);

  return {
    currentLanguage,
    setCurrentLanguage,
    translate,
    SUPPORTED_LANGUAGES,
  };
}