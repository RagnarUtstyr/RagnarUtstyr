import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

// Avoid reinitializing the app if it's already initialized
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";

// Firebase configuration (same as in group.html and server.js)
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
  

// Initialize Firebase App only if it hasn’t been initialized yet
let app;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApps()[0]; // Use the already initialized app
}

const auth = getAuth(app);
const db = getDatabase(app);

// Login function
export async function login(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('User logged in:', userCredential.user);
        window.location.href = 'group.html'; // Redirect to the GM's dashboard
    } catch (error) {
        console.error('Error logging in:', error.message);
    }
}

// Register function
export async function register(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('User registered:', userCredential.user);
        window.location.href = 'group.html'; // Redirect after successful registration
    } catch (error) {
        console.error('Error registering user:', error.message);
        alert(`Registration error: ${error.message}`);
    }
}

// Logout function
export async function logout() {
    await signOut(auth);
    console.log('User logged out');
    window.location.href = 'index.html';  // Redirect to the login page after logging out
}

// Track if a user is logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('User is logged in:', user);
        // Optional: redirect users based on their role, session, etc.
    } else {
        console.log('No user is logged in');
    }
});
