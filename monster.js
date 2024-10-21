// Import necessary Firebase modules from the SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";
import { getRoomKey } from './key.js';

// Firebase Configuration
const firebaseConfig = {
    // Your Firebase config here
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Function to handle adding a monster to the list
function addToList(name, health, url, ac) {
    const initiative = prompt(`Enter initiative for ${name}:`);
    if (initiative !== null && !isNaN(initiative)) {
        submitMonsterToFirebase(name, parseInt(initiative), health, url, ac);
    } else {
        alert('Please enter a valid initiative number.');
    }
}

// Function to submit data to Firebase
async function submitMonsterToFirebase(name, initiative, health, url, ac) {
    try {
        // Get the room key
        const roomKey = getRoomKey();
        if (!roomKey) {
            alert('Please set a room key first.');
            return;
        }

        const reference = ref(db, `rooms/${roomKey}/rankings/`);
        await push(reference, { name, number: initiative, health, url, ac });
    } catch (error) {
        console.error('Error submitting monster:', error);
    }
}

// Attach addToList function to the global window object to be accessible from the HTML
document.addEventListener('DOMContentLoaded', () => {
    window.addToList = addToList;
    console.log("JavaScript loaded and DOM is fully ready.");
});
