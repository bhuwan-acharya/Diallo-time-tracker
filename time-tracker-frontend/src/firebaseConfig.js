// Import Firebase modules
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration (from Firebase Console)
// const firebaseConfig = {
//   apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
//   authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
//   projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
//   storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
//   appId: import.meta.env.VITE_FIREBASE_APP_ID,
// };

const firebaseConfig = {
  apiKey: "AIzaSyCnjpym1AHwjb16nWUrMIFfrPRTg19nArs",
  authDomain: "time-tracking-ba0dc.firebaseapp.com",
  projectId: "time-tracking-ba0dc",
  storageBucket: "time-tracking-ba0dc.firebasestorage.app",
  messagingSenderId: "651206625004",
  appId: "1:651206625004:web:97d7947452bdaf325587c9",
  measurementId: "G-Y5XH0V6R0Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export authentication and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
