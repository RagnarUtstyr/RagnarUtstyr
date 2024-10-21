import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyD_4kINWig7n6YqB11yM2M-EuxGNz5uekI",
    authDomain: "roll202-c0b0d.firebaseapp.com",
    databaseURL: "https://roll202-c0b0d-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "roll202-c0b0d",
    storageBucket: "roll202-c0b0d.appspot.com",
    messagingSenderId: "607661730400",
    appId: "1:607661730400:web:b4b3f97a12cfae373e7105",
    measurementId: "G-6X5L39W56C"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Function to create or join a room and store the invite key in cookies
function handleInviteKeySubmit(pageType) {
    const inviteKeyInput = document.getElementById(`invite-key-${pageType}`).value;

    if (inviteKeyInput) {
        // Store the invite key in cookies for 1 day
        document.cookie = `inviteKey=${inviteKeyInput}; path=/; max-age=86400`; 
        alert(`Joined room with invite key: ${inviteKeyInput}`);

        // Create or join the room in Firebase
        createRoomInFirebase(inviteKeyInput);
    } else {
        alert('Please enter a valid invite key.');
    }
}

// Function to create the room in Firebase if it doesn't exist yet
function createRoomInFirebase(inviteKey) {
    const roomRef = ref(db, `rooms/${inviteKey}`);

    // Initialize the room with a placeholder if it doesn't exist
    set(roomRef, {
        createdAt: new Date().toISOString(),
        data: {} // Placeholder for room data
    }).then(() => {
        console.log(`Room "${inviteKey}" created successfully in Firebase.`);
    }).catch(error => {
        console.error('Error creating room:', error);
    });
}

// Function to retrieve the invite key from cookies
function getInviteKeyFromCookies() {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith('inviteKey=')) {
            return cookie.substring('inviteKey='.length);
        }
    }
    return null;
}

// Expose the functions globally for use in HTML files
window.handleInviteKeySubmit = handleInviteKeySubmit;
window.getInviteKeyFromCookies = getInviteKeyFromCookies;
