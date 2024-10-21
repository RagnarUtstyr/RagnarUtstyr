import { getDatabase, ref, push, set, onValue } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

// Initialize Firebase Database
const db = getDatabase();

// Function to create or join a room and store the key in cookies
function handleInviteKeySubmit(pageType) {
    const inviteKeyInput = document.getElementById(`invite-key-${pageType}`).value;
    
    if (inviteKeyInput) {
        // Store invite key in cookies
        document.cookie = `inviteKey=${inviteKeyInput}; path=/; max-age=86400`; // Store in cookie for 1 day
        alert(`Joined room with invite key: ${inviteKeyInput}`);

        // Explicitly create the room in Firebase
        createRoomInFirebase(inviteKeyInput);
    } else {
        alert('Please enter a valid invite key.');
    }
}

// Function to create the room in Firebase if it doesn't exist yet
function createRoomInFirebase(inviteKey) {
    const roomRef = ref(db, `rooms/${inviteKey}`);
    
    // Set the room to an empty object to create it in Firebase if it doesn't already exist
    set(roomRef, {
        createdAt: new Date().toISOString(),
        data: {} // Placeholder for actual data to be added later
    }).then(() => {
        console.log(`Room with invite key "${inviteKey}" has been created in Firebase.`);
    }).catch(error => {
        console.error('Error creating room in Firebase:', error);
    });
}

// Function to get the invite key from cookies
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

// Function to submit data (name and initiative) to Firebase within a room
function handleSubmitEntry(pageType) {
    const name = document.getElementById('name').value;
    const initiative = document.getElementById('initiative').value;

    if (!name || !initiative) {
        alert('Please enter both name and initiative.');
        return;
    }

    const inviteKey = getInviteKeyFromCookies();
    if (!inviteKey) {
        alert('You must first join a room with an invite key.');
        return;
    }

    const reference = ref(db, `rooms/${inviteKey}/data`);
    push(reference, { name, initiative }).then(() => {
        alert('Data submitted successfully.');
    }).catch(error => {
        console.error('Error submitting data:', error);
    });
}

// Function to listen for room data changes (optional, for displaying dynamic updates)
function listenToRoomData() {
    const inviteKey = getInviteKeyFromCookies();
    if (!inviteKey) return;

    const reference = ref(db, `rooms/${inviteKey}/data`);
    onValue(reference, (snapshot) => {
        const data = snapshot.val();
        console.log('Received data for the room:', data);
        // Handle data display or updates here
    });
}

// Function to initialize the page
function initializePage(pageType) {
    // Attach event listeners for invite key submission
    document.getElementById(`submit-invite-${pageType}`).addEventListener('click', function() {
        handleInviteKeySubmit(pageType);
    });

    // Attach event listeners for entry submission
    document.getElementById(`submit-entry-${pageType}`).addEventListener('click', function() {
        handleSubmitEntry(pageType);
    });

    // Optionally start listening to room data when the page loads
    listenToRoomData();
}

// Automatically detect which page is loaded (group or index) and initialize
document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('submit-invite-group')) {
        initializePage('group');
    } else if (document.getElementById('submit-invite-index')) {
        initializePage('index');
    }
});
