import axios from 'axios';

const DEEPL_API_KEY = 'c39671a9-1c88-4791-bf68-6cd7facc28c9:fx';
const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';

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
    
    // Format the request body according to DeepL API requirements
    const formData = new URLSearchParams();
    texts.forEach(text => formData.append('text', text));
    formData.append('source_lang', from);
    formData.append('target_lang', to);

    const response = await axios.post(DEEPL_API_URL, formData, {
      headers: {
        'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 30000, // 30 second timeout
    });

    if (response.status !== 200) {
      console.error(`[Translation] Failed with status: ${response.status}`, response.data);
      throw new Error(`Translation failed: ${response.status} ${response.statusText}`);
    }

    if (!response.data.translations || !Array.isArray(response.data.translations)) {
      console.error('[Translation] Invalid response format:', response.data);
      throw new Error('Invalid response format from DeepL API');
    }

    console.log(`[Translation] Successfully translated ${texts.length} texts`);
    return response.data.translations.map((t: any) => t.text as string);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[Translation] API error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        }
      });
    } else {
      console.error('[Translation] Unexpected error:', error);
    }
    
    // Return original texts on error as fallback
    return texts;
  }
}

// Keep single text translation for compatibility
export async function translateText(text: string, from: LanguageCode, to: LanguageCode): Promise<string> {
  if (!text) return '';
  const results = await translateBatch({ texts: [text], from, to });
  return results[0];
}