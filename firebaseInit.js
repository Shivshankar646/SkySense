// =======================
// 🔥 Firebase Setup
// =======================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

// Your Firebase config
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
export const auth = getAuth(app);
export const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// =======================
// 🔐 Login / Logout System
// =======================

// Login
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Save user to Firestore
    const userRef = doc(db, "users", user.uid);
    await setDoc(
      userRef,
      {
        email: user.email,
        city: "Nanded", // default — we’ll make this dynamic later
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );

    alert(`Welcome, ${user.displayName}! You’re now logged in.`);
    toggleAuthUI(true, user);
    return user;
  } catch (error) {
    console.error("Login failed:", error);
    alert("Login failed, please try again.");
  }
}

// Logout
export async function logoutUser() {
  try {
    await signOut(auth);
    alert("Logged out successfully!");
    toggleAuthUI(false);
  } catch (error) {
    console.error("Logout failed:", error);
  }
}

// UI update helper
function toggleAuthUI(isLoggedIn, user = null) {
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (isLoggedIn) {
    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
  } else {
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
  }
}

// Keep UI synced on refresh
onAuthStateChanged(auth, (user) => {
  toggleAuthUI(!!user, user);
});
