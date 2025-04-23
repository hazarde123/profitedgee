import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, addDoc, collection } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyATT8ToyjaAFQIzy_ForvNxaREjsPfDv8U",
  authDomain: "profitedge-56ff7.firebaseapp.com",
  projectId: "profitedge-56ff7",
  storageBucket: "profitedge-56ff7.firebasestorage.app",
  messagingSenderId: "456044937223",
  appId: "1:456044937223:web:0df33faae9c56cb1606aa2"
};


// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Enable offline persistence
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      console.log('Persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      // The current browser doesn't support persistence
      console.log('Persistence not supported by browser');
    }
  });
}

export { app, auth, db, storage };