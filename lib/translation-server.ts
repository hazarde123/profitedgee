import axios from 'axios';

const MS_TRANSLATOR_API_KEY = '9CrAKRSHmt9OtYi8Fk0xG8nrGuLKVdUTDuKRtnD2G6p3NmrtA8IpJQQJ99BDAC1i4TkXJ3w3AAAbACOG6njJ';
const MS_TRANSLATOR_ENDPOINT = 'https://api.cognitive.microsofttranslator.com/';
const MS_TRANSLATOR_LOCATION = 'centralus';

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequests: 100, // Maximum requests per minute
  timeWindow: 60 * 1000, // 1 minute in milliseconds
  retryAfter: 2000, // Wait 2 seconds before retrying
  maxRetries: 3 // Maximum number of retries
};

// Rate limiting state
let requestCount = 0;
let lastResetTime = Date.now();

// Reset rate limit counter
function resetRateLimit() {
  const now = Date.now();
  if (now - lastResetTime >= RATE_LIMIT.timeWindow) {
    requestCount = 0;
    lastResetTime = now;
  }
}

// Check if we can make a request
function canMakeRequest(): boolean {
  resetRateLimit();
  return requestCount < RATE_LIMIT.maxRequests;
}

// Sleep function for delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Microsoft Translator supported language codes
const MS_LANGUAGE_MAPPING = {
  'EN': 'en', // English
  'ES': 'es', // Spanish
  'FR': 'fr', // French
  'DE': 'de', // German
  'ZH': 'zh-Hans', // Chinese (Simplified)
  'JA': 'ja', // Japanese
  'KO': 'ko', // Korean
  'AR': 'ar'  // Arabic
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
  
  let retries = 0;
  
  while (retries <= RATE_LIMIT.maxRetries) {
    try {
      if (!canMakeRequest()) {
        console.log('[Translation] Rate limit reached, waiting...');
        await sleep(RATE_LIMIT.retryAfter);
        continue;
      }

      console.log(`[Translation] Attempting to translate ${texts.length} texts from ${from} to ${to}`);
      
      // Convert language codes to Microsoft format
      const msSourceLang = MS_LANGUAGE_MAPPING[from];
      const msTargetLang = MS_LANGUAGE_MAPPING[to];
      
      if (!msSourceLang || !msTargetLang) {
        throw new Error('Unsupported language code');
      }

      // Split texts into smaller batches to avoid hitting limits
      const batchSize = 25;
      const textBatches = [];
      for (let i = 0; i < texts.length; i += batchSize) {
        textBatches.push(texts.slice(i, i + batchSize));
      }

      const allTranslations = [];
      for (const batch of textBatches) {
        // Prepare request body
        const requestBody = batch.map(text => ({
          text
        }));

        requestCount++;
        const response = await axios.post(
          `${MS_TRANSLATOR_ENDPOINT}translate`,
          requestBody,
          {
            params: {
              'api-version': '3.0',
              from: msSourceLang,
              to: msTargetLang
            },
            headers: {
              'Ocp-Apim-Subscription-Key': MS_TRANSLATOR_API_KEY,
              'Ocp-Apim-Subscription-Region': MS_TRANSLATOR_LOCATION,
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );

        if (!Array.isArray(response.data)) {
          throw new Error('Invalid response format from Microsoft Translator API');
        }

        allTranslations.push(...response.data.map((item: any) => item.translations[0].text));
        
        // Add a small delay between batches
        if (textBatches.length > 1) {
          await sleep(200);
        }
      }

      console.log('[Translation] Success:', {
        requested: texts.length,
        received: allTranslations.length
      });

      return allTranslations;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const details = error.response?.data?.error?.message || error.message;
        
        // Handle rate limit errors
        if (status === 429 || (details && details.includes('exceeded request limits'))) {
          retries++;
          if (retries <= RATE_LIMIT.maxRetries) {
            console.log(`[Translation] Rate limit hit, retrying (${retries}/${RATE_LIMIT.maxRetries})...`);
            await sleep(RATE_LIMIT.retryAfter * retries); // Exponential backoff
            continue;
          }
        }
        
        console.error('[Translation] API error:', {
          status,
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

  throw new Error('Translation failed: Maximum retries exceeded');
}

// Keep single text translation for compatibility
export async function translateText(text: string, from: LanguageCode, to: LanguageCode): Promise<string> {
  if (!text) return '';
  if (from === to) return text;
  const results = await translateBatch({ texts: [text], from, to });
  return results[0];
}