// auth.js

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getDatabase, ref, set, get, push } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

// Firebase configuration (replace with your actual config values)
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

// ---------------------- Authentication Functions ------------------------

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
        // Redirect to GM's home page after successful registration
        window.location.href = 'group.html';
    } catch (error) {
        console.error('Error registering user:', error.message);
    }
}

// Logout function
export async function logout() {
    try {
        await signOut(auth);
        console.log('User logged out');
        // Redirect to login page after logout
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error logging out:', error.message);
    }
}

// Check if user is logged in and auto-redirect if necessary
export function checkUserState() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log('User is logged in:', user);
        } else {
            console.log('No user is logged in');
            // Redirect to login page if not logged in
            window.location.href = 'index.html';
        }
    });
}

// ---------------------- Lobby Functions ------------------------

// Generate a random lobby key (e.g., 'lobby-x5zgkfg')
function generateLobbyKey() {
    return 'lobby-' + Math.random().toString(36).substr(2, 9);
}

// Create a new lobby and display invite key
export async function createLobby() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const gmId = user.uid; // Get the Game Master's user ID
            const lobbyKey = generateLobbyKey(); // Generate a unique lobby key

            // Reference to the lobby in Firebase
            const lobbyRef = ref(db, `lobbies/${lobbyKey}`);

            // Set the initial lobby data (with GM ID and empty players list)
            await set(lobbyRef, {
                gmId: gmId,
                players: {},  // Empty object for players to join
            });

            // Display the lobby key for GM to share
            const lobbyKeyElement = document.getElementById('lobbyKey');
            if (lobbyKeyElement) {
                lobbyKeyElement.textContent = `Invite Key: ${lobbyKey}`;
            }

            console.log(`Lobby created with key: ${lobbyKey}`);
        } else {
            console.log('No user is logged in.');
        }
    });
}

// Join a lobby using the invite key
export async function joinLobby(lobbyKey) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const playerId = user.uid;
            const lobbyRef = ref(db, `lobbies/${lobbyKey}/players/${playerId}`);

            await set(lobbyRef, { playerId });
            console.log(`Player ${playerId} joined lobby ${lobbyKey}`);

            // Redirect player to the group page (after joining)
            window.location.href = 'group.html';
        } else {
            console.log('User not logged in. Cannot join lobby.');
        }
    });
}

// Get the lobby key for a logged-in user (GM or player)
export async function getLobbyKeyForUser() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const uid = user.uid;
            const lobbiesRef = ref(db, 'lobbies');
            const snapshot = await get(lobbiesRef);
            const lobbies = snapshot.val();

            for (const lobbyKey in lobbies) {
                if (lobbies[lobbyKey].gmId === uid || lobbies[lobbyKey].players[uid]) {
                    console.log(`Lobby key found for user: ${lobbyKey}`);
                    return lobbyKey;  // Return the lobby key
                }
            }

            console.log('No lobby found for the current user.');
            return null;
        } else {
            console.log('User is not logged in.');
            return null;
        }
    });
}
