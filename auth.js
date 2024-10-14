import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getDatabase, ref, set, push, get } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

const firebaseConfig = {
    // your Firebase config
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Register function
async function register(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('User registered:', userCredential.user);
    } catch (error) {
        console.error('Error registering user:', error);
    }
}

// Login function
async function login(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('User logged in:', userCredential.user);
        // Redirect to GM's home page (group.html) after successful login
        window.location.href = 'group.html';
    } catch (error) {
        console.error('Error logging in:', error);
    }
}

// Check if user is logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('User is logged in:', user);
        // Fetch and display lobbies specific to the logged-in GM
    } else {
        console.log('No user is logged in');
    }
});

// Logout function
async function logout() {
    await signOut(auth);
    console.log('User logged out');
}
