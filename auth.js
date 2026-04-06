import { auth, googleProvider, db } from "./firebase-config.js";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import {
  ref,
  set,
  get,
  update
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  const userRef = ref(db, `users/${user.uid}`);
  const existing = await get(userRef);

  const payload = {
    uid: user.uid,
    name: user.displayName || "Unknown",
    email: user.email || "",
    photoURL: user.photoURL || "",
    lastLoginAt: Date.now()
  };

  if (existing.exists()) {
    await update(userRef, payload);
  } else {
    await set(userRef, {
      ...payload,
      createdAt: Date.now()
    });
  }

  return user;
}

export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser() {
  return auth.currentUser;
}

export async function logout() {
  await signOut(auth);
}

export function requireAuth(callback) {
  const promise = new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        window.location.href = "login.html";
        return;
      }
      unsub();
      resolve(user);
    });
  });

  if (typeof callback === "function") {
    promise.then(callback);
  }

  return promise;
}

export async function getUserMembership(uid) {
  const snapshot = await get(ref(db, `memberships/${uid}`));
  return snapshot.exists() ? snapshot.val() : {};
}
