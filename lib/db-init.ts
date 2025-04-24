import { db } from './firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';

export async function initializeDatabase() {
  try {
    // Perform a small query to verify database connection
    const testQuery = query(collection(db, 'translations'), limit(1));
    await getDocs(testQuery);
    console.log('Firebase database connection initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase database:', error);
    throw error; // Propagate the error for handling in layout.tsx
  }
}