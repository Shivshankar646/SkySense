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
  setDoc
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

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // ✅ Auto-save user info to Firestore
    await setDoc(doc(db, "users", user.uid), {
      name: user.displayName || "Unknown",
      email: user.email,
      city: "Nanded", // default for now — will be updated when they search weather
      subscribed: true,
      lastLogin: new Date().toISOString()
    }, { merge: true });

    console.log("🔥 User saved to Firestore:", user.email);
    alert(`✅ Welcome ${user.displayName || "User"}!`);

    toggleAuthUI(true, user);
    return user;
  } catch (error) {
    console.error("Login failed:", error);
    alert("Login failed, please try again.");
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
    alert("👋 Logged out successfully!");
    toggleAuthUI(false);
  } catch (error) {
    console.error("Logout failed:", error);
  }
}

// =======================
// 🧩 UI Helpers
// =======================

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

// Keep UI synced after refresh
onAuthStateChanged(auth, (user) => {
  toggleAuthUI(!!user, user);
});
