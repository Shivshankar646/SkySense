// firebaseConfig.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-analytics.js";

// Your Firebase config (from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyBMSkmbS_uE2WP-AOiHuBChLFs2B_gwBqs",
  authDomain: "skysense-c8c62.firebaseapp.com",
  projectId: "skysense-c8c62",
  storageBucket: "skysense-c8c62.firebasestorage.app",
  messagingSenderId: "613136084317",
  appId: "1:613136084317:web:399bcab60a63a4e1a1ccb4",
  measurementId: "G-XZW2MY6Q3C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export Firebase services so index.html can use them
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
