import { auth, provider, db } from './firebaseConfig.js';
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
let currentUser = null;

// LOGIN
loginBtn.addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    currentUser = user;

    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      name: user.displayName,
      createdAt: new Date(),
    }, { merge: true });

    alert(`Welcome, ${user.displayName || user.email}!`);
  } catch (err) {
    console.error(err);
    alert("Login failed, please try again.");
  }
});

// LOGOUT
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  alert("Logged out successfully!");
});

// AUTH STATE
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) console.log("User data:", snap.data());
  } else {
    currentUser = null;
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
  }
});

export { currentUser };
