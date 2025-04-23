import axios from 'axios';

const DEEPL_API_KEY = 'c39671a9-1c88-4791-bf68-6cd7facc28c9:fx';
const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';

// DeepL officially supported language codes
// https://www.deepl.com/docs-api/translate-text
const DEEPL_LANGUAGE_MAPPING = {
  'EN': 'EN', // English
  'ES': 'ES', // Spanish
  'FR': 'FR', // French
  'DE': 'DE', // German
  'ZH': 'ZH', // Chinese
  'JA': 'JA', // Japanese
  'KO': 'KO', // Korean
  'AR': 'AR'  // Arabic
} as const;

export const SUPPORTED_LANGUAGES = [
  { code: 'EN', name: 'English' },
  { code: 'ES', name: 'Spanish' },
  { code: 'FR', name: 'French' },
  { code: 'DE', name: 'German' },
  { code: 'ZH', name: 'Chinese' },
  { code: 'JA', name: 'Japanese' },
  { code: 'KO', name: 'Korean' },
  { code: 'AR', name: 'Arabic' },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

export interface BatchTranslationRequest {
  texts: string[];
  from: LanguageCode;
  to: LanguageCode;
}

export async function translateBatch({ texts, from, to }: BatchTranslationRequest): Promise<string[]> {
  if (from === to) return texts;
  if (!texts.length) return [];
  
  try {
    console.log(`[Translation] Attempting to translate ${texts.length} texts from ${from} to ${to}`);
    
    // Convert language codes to DeepL format
    const deeplSourceLang = DEEPL_LANGUAGE_MAPPING[from];
    const deeplTargetLang = DEEPL_LANGUAGE_MAPPING[to];
    
    if (!deeplSourceLang || !deeplTargetLang) {
      throw new Error('Unsupported language code');
    }

    console.log('[Translation] Language mapping:', {
      from,
      to,
      mappedSourceLang: deeplSourceLang,
      mappedTargetLang: deeplTargetLang
    });

    const formData = new URLSearchParams();
    texts.forEach(text => formData.append('text', text));
    
    // Only include source_lang if not English (DeepL default)
    if (deeplSourceLang !== 'EN') {
      formData.append('source_lang', deeplSourceLang);
    }
    formData.append('target_lang', deeplTargetLang);

    console.log('[Translation] Sending request with params:', {
      ...(deeplSourceLang !== 'EN' ? { source_lang: deeplSourceLang } : {}),
      target_lang: deeplTargetLang,
      text_count: texts.length
    });

    const response = await axios.post(DEEPL_API_URL, formData, {
      headers: {
        'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 30000,
      validateStatus: (status) => status === 200,
    });

    if (!response.data?.translations || !Array.isArray(response.data.translations)) {
      console.error('[Translation] Invalid response format:', response.data);
      throw new Error('Invalid response format from DeepL API');
    }

    console.log('[Translation] Success:', {
      requested: texts.length,
      received: response.data.translations.length
    });

    return response.data.translations.map((t: any) => t.text as string);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const details = error.response?.data?.message || error.message;
      console.error('[Translation] API error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        details,
        requestConfig: error.config
      });
      throw new Error(`Translation failed: ${details}`);
    }
    console.error('[Translation] Unexpected error:', error);
    throw error;
  }
}

// Keep single text translation for compatibility
export async function translateText(text: string, from: LanguageCode, to: LanguageCode): Promise<string> {
  if (!text) return '';
  if (from === to) return text;
  const results = await translateBatch({ texts: [text], from, to });
  return results[0];
}