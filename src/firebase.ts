import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCrUKwW6tVyVQlj1XEg-wUSz2REt4hCp8I",
  authDomain: "community-hero-66083.firebaseapp.com",
  projectId: "community-hero-66083",
  storageBucket: "community-hero-66083.firebasestorage.app",
  messagingSenderId: "46161820054",
  appId: "1:46161820054:web:dc95145404faf8fb4005b7"
};

let app;
let db: any = null;
let auth: any = null;
let isFirebaseAvailable = false;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
  auth = getAuth(app);
  isFirebaseAvailable = true;
} catch (error) {
  console.warn("Firebase failed to initialize. Falling back to LocalStorage.", error);
}

export { app, db, auth, isFirebaseAvailable };
