import {
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

import { auth, provider } from "./firebase-config.js";

export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export function requireAuth(callback) {
  return onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    callback(user);
  });
}

export async function loginWithGoogle() {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Google sign-in failed:", error);
    alert("Google sign-in failed. Check Firebase Authentication and authorized domains.");
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
    window.location.href = "login.html";
  } catch (error) {
    console.error("Logout failed:", error);
  }
}