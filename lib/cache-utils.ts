import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp, 
  QueryDocumentSnapshot,
  Timestamp 
} from 'firebase/firestore';
import type { LanguageCode } from './translation-server';

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const TRANSLATIONS_COLLECTION = 'translations';

interface TranslationCache {
  text: string;
  translation: string;
  from: LanguageCode;
  to: LanguageCode;
  timestamp: Timestamp;
}

export async function getCachedTranslation(
  text: string, 
  from: LanguageCode,
  to: LanguageCode
): Promise<string | null> {
  try {
    const docId = `${from}_${to}_${text}`;
    const docRef = doc(db, TRANSLATIONS_COLLECTION, docId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const data = docSnap.data() as TranslationCache;
    const age = Date.now() - data.timestamp.toMillis();

    // Return null if cache is expired
    if (age > CACHE_DURATION) return null;

    return data.translation;
  } catch (error) {
    console.error('Error fetching cached translation:', error);
    return null;
  }
}

export async function setCachedTranslation(
  text: string, 
  from: LanguageCode,
  to: LanguageCode,
  translation: string
): Promise<void> {
  try {
    const docId = `${from}_${to}_${text}`;
    const docRef = doc(db, TRANSLATIONS_COLLECTION, docId);
    await setDoc(docRef, {
      text,
      translation,
      from,
      to,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error caching translation:', error);
  }
}