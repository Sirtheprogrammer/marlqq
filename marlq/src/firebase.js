// Firebase configuration and initialization
// Replace the below config with your own Firebase project config
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence } from "firebase/auth";

// Load environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyAgt6KeH0wczwHtbo0s34ptBLFkic3LODI",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "marlq-c2b66.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "marlq-c2b66",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "marlq-c2b66.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "67350795121",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:67350795121:web:af8deeddd8ea2f73c69cd0",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-3D9PXGMJ7P"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Offline persistence requires exclusive database access');
  } else if (err.code === 'unimplemented') {
    console.warn('Browser doesn\'t support persistence');
  }
});

// Set persistence to LOCAL
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Auth persistence error:", error);
});

// Auth functions for email/password
export const signInWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Login error:", error);
    throw new Error("Invalid email or password");
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Sign out error:", error);
    throw error;
  }
};

// Error handler for Firestore operations
const handleFirestoreError = (error) => {
  console.error("Firestore error:", error);
  if (error.code === 'permission-denied') {
    signOutUser(); // Sign out user if permissions are denied
    throw new Error("Access denied. Please log in again.");
  }
  throw error;
};

// Export services and handlers
export { app, analytics, db, storage, auth, handleFirestoreError };
