import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import type { LanguageCode } from './translation-server';

interface PageTranslation {
  content: Record<string, string>;
  locale: LanguageCode;
  path: string;
  lastUpdated: Date;
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const TRANSLATIONS_COLLECTION = 'pageTranslations';

export async function getCachedTranslation(
  path: string, 
  locale: LanguageCode
): Promise<Record<string, string> | null> {
  try {
    const docRef = doc(db, TRANSLATIONS_COLLECTION, `${path}_${locale}`);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const data = docSnap.data() as PageTranslation;
    const age = Date.now() - data.lastUpdated.getTime();

    // Return null if cache is expired
    if (age > CACHE_DURATION) return null;

    return data.content;
  } catch (error) {
    console.error('Error fetching cached translation:', error);
    return null;
  }
}

export async function setCachedTranslation(
  path: string, 
  locale: LanguageCode, 
  content: Record<string, string>
): Promise<void> {
  try {
    const docRef = doc(db, TRANSLATIONS_COLLECTION, `${path}_${locale}`);
    await setDoc(docRef, {
      content,
      locale,
      path,
      lastUpdated: serverTimestamp()
    });
  } catch (error) {
    console.error('Error caching translation:', error);
  }
}

export async function invalidatePathCache(path: string): Promise<void> {
  try {
    const q = query(
      collection(db, TRANSLATIONS_COLLECTION), 
      where('path', '==', path)
    );
    
    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map(doc => setDoc(
      doc.ref,
      { lastUpdated: new Date(0) }, // Set to expired
      { merge: true }
    ));
    
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error invalidating cache:', error);
  }
}