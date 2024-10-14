// auth.js

import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";

// Firebase configuration (make sure to replace these with your actual Firebase config values)
const firebaseConfig = {
    apiKey: "AIzaSyD_4kINWig7n6YqB11yM2M-EuxGNz5uekI",
    authDomain: "roll202-c0b0d.firebaseapp.com",
    databaseURL: "https://roll202-c0b0d-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "roll202-c0b0d",
    storageBucket: "roll202-c0b0d.appspot.com",
    messagingSenderId: "607661730400",
    appId: "1:607661730400:web:b4b3f97a12cfae373e7105",
    measurementId: "G-L3JB5YC43M"
  };

// Initialize Firebase only if it hasn't been initialized already
let app;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApps()[0];
}

const auth = getAuth(app);
const db = getDatabase(app);

// Login function
export async function login(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('User logged in:', userCredential.user);
        // Redirect to GM's home page (group.html) after successful login
        window.location.href = 'group.html';
    } catch (error) {
        console.error('Error logging in:', error.message);
    }
}

// Register function
export async function register(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('User registered:', userCredential.user);
        // After registration, redirect to group.html or wherever you'd like
        window.location.href = 'group.html';
    } catch (error) {
        console.error('Error registering user:', error.message);
        alert(`Registration error: ${error.message}`);
    }
}

// Logout function
export async function logout() {
    await signOut(auth);
    console.log('User logged out');
}

// Check if user is logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('User is logged in:', user);
    } else {
        console.log('No user is logged in');
    }
});
