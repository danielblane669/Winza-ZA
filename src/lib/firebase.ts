import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBnIPmnJiD9fc0pkM931uu-NCD_hKZmt5s",
  authDomain: "win-za.firebaseapp.com",
  projectId: "win-za",
  storageBucket: "win-za.firebasestorage.app",
  messagingSenderId: "984951599947",
  appId: "1:984951599947:web:06499df83a336c27b02ece"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);