// Import necessary Firebase modules from the SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, set } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Function to handle room key creation
document.getElementById('create-room-button').addEventListener('click', () => {
    const roomKey = document.getElementById('room-key').value.trim();
    if (roomKey) {
        // Store the room key in localStorage
        localStorage.setItem('roomKey', roomKey);

        // Create a room reference in Firebase
        const roomRef = ref(db, `rooms/${roomKey}`);
        set(roomRef, {
            createdAt: Date.now()
        }).then(() => {
            alert(`Room "${roomKey}" created successfully!`);
            fetchRankings(); // Fetch any existing rankings for the room
        }).catch((error) => {
            console.error('Error creating room:', error);
        });
    } else {
        alert('Please enter a valid room key.');
    }
});

// Function to check if the user is logged in with a room key
const roomKey = localStorage.getItem('roomKey');
if (!roomKey) {
    alert('You must log in or create a room with a room key.');
} else {
    const rankingsRef = ref(db, `rankings/${roomKey}`);
}

// Function to submit data to Firebase
document.getElementById('submit-button').addEventListener('click', () => {
    const name = document.getElementById('name').value;
    const initiative = parseInt(document.getElementById('initiative').value);
    const health = parseInt(document.getElementById('health').value) || null;
    const ac = parseInt(document.getElementById('ac').value) || null;

    if (name && !isNaN(initiative)) {
        const rankingsRef = ref(db, `rankings/${roomKey}`);
        push(rankingsRef, { name, initiative, health, ac })
            .then(() => {
                alert('Entry submitted successfully.');
                fetchRankings(); // Refresh the list after submission
            })
            .catch((error) => {
                console.error('Error submitting data:', error);
            });
    } else {
        alert('Please enter valid values.');
    }
});

// Function to fetch and display rankings
function fetchRankings() {
    const rankingsRef = ref(db, `rankings/${roomKey}`);
    onValue(rankingsRef, (snapshot) => {
        const data = snapshot.val();
        const rankingList = document.getElementById('rankingList');
        rankingList.innerHTML = ''; // Clear current rankings

        if (data) {
            const rankings = Object.entries(data).map(([id, entry]) => ({ id, ...entry }));
            rankings.sort((a, b) => b.initiative - a.initiative); // Sort by initiative number

            rankings.forEach(({ id, name, initiative, health, ac }) => {
                const listItem = document.createElement('li');
                listItem.textContent = `${name} (Initiative: ${initiative}, HP: ${health || ''}, AC: ${ac || ''})`;

                const removeButton = document.createElement('button');
                removeButton.textContent = 'Remove';
                removeButton.addEventListener('click', () => removeEntry(id));

                listItem.appendChild(removeButton);
                rankingList.appendChild(listItem);
            });
        }
    });
}

// Function to remove an entry
function removeEntry(id) {
    const rankingsRef = ref(db, `rankings/${roomKey}/${id}`);
    remove(rankingsRef)
        .then(() => {
            console.log(`Entry with ID: ${id} removed successfully.`);
            fetchRankings(); // Refresh the list after removal
        })
        .catch((error) => {
            console.error('Error removing entry:', error);
        });
}

// Automatically fetch rankings when the page loads
if (roomKey) {
    fetchRankings();
}
