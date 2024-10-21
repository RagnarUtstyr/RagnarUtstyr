// server.js

// Import necessary Firebase modules from the SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, set } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";
// Import getRoomKey from key.js
import { getRoomKey } from './key.js';

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

// Function to submit data to Firebase
async function submitData() {
    const name = document.getElementById('name').value;
    const number = parseInt(document.getElementById('initiative') ? document.getElementById('initiative').value : document.getElementById('number').value);
    const healthInput = document.getElementById('health') ? document.getElementById('health').value : null;
    const health = healthInput !== '' && healthInput !== null ? parseInt(healthInput) : null;
    const acInput = document.getElementById('ac') ? document.getElementById('ac').value : null;
    const ac = acInput !== '' && acInput !== null ? parseInt(acInput) : null;

    // Ensure name and number are valid
    if (name && !isNaN(number)) {
        try {
            // Get the room key
            const roomKey = getRoomKey();
            if (!roomKey) {
                alert('Please set a room key first.');
                return;
            }

            // Modify the reference to include the room key
            const reference = ref(db, `rooms/${roomKey}/rankings/`);
            await push(reference, { name, number, health, ac });
            console.log('Data submitted successfully:', { name, number, health, ac });

            // Clear input fields after successful submission
            document.getElementById('name').value = '';
            document.getElementById('initiative') ? document.getElementById('initiative').value = '' : document.getElementById('number').value = '';
            if (document.getElementById('health')) document.getElementById('health').value = '';
            if (document.getElementById('ac')) document.getElementById('ac').value = '';

            // Play sword sound after submission
            const swordSound = document.getElementById('sword-sound');
            if (swordSound) {
                swordSound.play();
            }
        } catch (error) {
            console.error('Error submitting data:', error);
        }
    } else {
        console.log('Please enter valid name and initiative values.');
    }
}

// Function to fetch and display rankings
function fetchRankings() {
    // Get the room key
    const roomKey = getRoomKey();
    if (!roomKey) {
        alert('Please set a room key first.');
        return;
    }

    const reference = ref(db, `rooms/${roomKey}/rankings/`);
    onValue(reference, (snapshot) => {
        const data = snapshot.val();
        const rankingList = document.getElementById('rankingList');
        rankingList.innerHTML = '';

        if (data) {
            const rankings = Object.entries(data).map(([id, entry]) => ({ id, ...entry }));
            rankings.sort((a, b) => b.number - a.number);

            rankings.forEach(({ id, name, number, health, ac }) => {
                const listItem = document.createElement('li');

                const nameDiv = document.createElement('div');
                nameDiv.className = 'name';
                if (ac !== null && ac !== undefined) {
                    nameDiv.textContent = `${name} (AC: ${ac})`;
                } else {
                    nameDiv.textContent = name;
                }

                const healthDiv = document.createElement('div');
                healthDiv.className = 'health';
                healthDiv.textContent = health !== null && health !== undefined ? `HP: ${health}` : '';

                const removeButton = document.createElement('button');
                removeButton.textContent = 'Remove';
                removeButton.addEventListener('click', () => removeEntry(id));

                listItem.appendChild(nameDiv);
                if (healthDiv.textContent !== '') {
                    listItem.appendChild(healthDiv);
                }
                listItem.appendChild(removeButton);

                rankingList.appendChild(listItem);
            });
        } else {
            console.log('No data available');
        }
    }, (error) => {
        console.error('Error fetching data:', error);
    });
}

// Function to remove an entry from Firebase
function removeEntry(id) {
    // Get the room key
    const roomKey = getRoomKey();
    if (!roomKey) {
        alert('Please set a room key first.');
        return;
    }

    const reference = ref(db, `rooms/${roomKey}/rankings/${id}`);
    remove(reference)
        .then(() => {
            console.log(`Entry with id ${id} removed successfully`);
        })
        .catch((error) => {
            console.error('Error removing entry:', error);
        });
}

// Function to clear all entries from Firebase
function clearAllEntries() {
    // Get the room key
    const roomKey = getRoomKey();
    if (!roomKey) {
        alert('Please set a room key first.');
        return;
    }

    const reference = ref(db, `rooms/${roomKey}/rankings/`);
    set(reference, null)
        .then(() => {
            console.log('All entries removed successfully');
            const rankingList = document.getElementById('rankingList');
            rankingList.innerHTML = '';
        })
        .catch((error) => {
            console.error('Error clearing all entries:', error);
        });
}

// Event listeners for page-specific actions
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('submit-button')) {
        document.getElementById('submit-button').addEventListener('click', submitData);
    }
    if (document.getElementById('rankingList')) {
        fetchRankings();
    }
    if (document.getElementById('clear-list-button')) {
        document.getElementById('clear-list-button').addEventListener('click', clearAllEntries);
    }
});
