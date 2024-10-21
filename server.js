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
    const numberInput = document.getElementById('initiative') || document.getElementById('number');
    const number = parseInt(numberInput.value);

    // Ensure name and number are valid
    if (name && !isNaN(number)) {
        try {
            // Get the room key
            const roomKey = getRoomKey();

            // Check if the room key is set
            if (!roomKey) {
                alert('Please set a room key first.');
                return;
            }

            // Reference to the rankings in the specific room
            const reference = ref(db, `rooms/${roomKey}/rankings/`);

            // Push the data to the database
            await push(reference, { name, number });
            console.log('Data submitted successfully:', { name, number });

            // Clear input fields after successful submission
            document.getElementById('name').value = '';
            numberInput.value = '';

            // Play sword sound after submission
            const swordSound = document.getElementById('sword-sound');
            if (swordSound) {
                swordSound.play();
            }
        } catch (error) {
            console.error('Error submitting data:', error);
        }
    } else {
        alert('Please enter valid name and initiative values.');
    }
}

// Function to fetch and display rankings
function fetchRankings() {
    // Get the room key
    const roomKey = getRoomKey();

    // Check if the room key is set
    if (!roomKey) {
        console.log('No room key set. Cannot fetch rankings.');
        return;
    }

    // Reference to the rankings in the specific room
    const reference = ref(db, `rooms/${roomKey}/rankings/`);

    onValue(reference, (snapshot) => {
        const data = snapshot.val();
        const rankingList = document.getElementById('rankingList');
        if (rankingList) {
            rankingList.innerHTML = ''; // Clear the list
        }

        if (data) {
            // Convert the data into an array and include the 'number' field for sorting
            const rankings = Object.entries(data).map(([id, entry]) => ({ id, ...entry }));
            rankings.sort((a, b) => b.number - a.number); // Sort by initiative (number)

            rankings.forEach(({ id, name, number, health, ac }) => {
                const listItem = document.createElement('li');

                // Name and AC combined
                const nameDiv = document.createElement('div');
                nameDiv.className = 'name';
                if (ac !== null && ac !== undefined) {
                    nameDiv.textContent = `${name} (AC: ${ac})`;
                } else {
                    nameDiv.textContent = name;
                }

                // Health
                const healthDiv = document.createElement('div');
                healthDiv.className = 'health';
                healthDiv.textContent = health !== null && health !== undefined ? `HP: ${health}` : '';

                // Remove Button
                const removeButton = document.createElement('button');
                removeButton.textContent = 'Remove';
                removeButton.addEventListener('click', () => removeEntry(id));

                // Append elements to listItem
                listItem.appendChild(nameDiv);
                if (healthDiv.textContent !== '') {
                    listItem.appendChild(healthDiv);
                }
                listItem.appendChild(removeButton);

                // Append the listItem to the rankingList
                if (rankingList) {
                    rankingList.appendChild(listItem);
                }
            });
        } else {
            console.log('No data available in this room.');
        }
    }, (error) => {
        console.error('Error fetching data:', error);
    });
}

// Function to remove an entry from Firebase
function removeEntry(id) {
    // Get the room key
    const roomKey = getRoomKey();

    // Check if the room key is set
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

    // Check if the room key is set
    if (!roomKey) {
        alert('Please set a room key first.');
        return;
    }

    const reference = ref(db, `rooms/${roomKey}/rankings/`);
    set(reference, null) // Sets the entire 'rankings' node to null, deleting all data.
        .then(() => {
            console.log('All entries removed successfully');
            // Clear the displayed list immediately
            const rankingList = document.getElementById('rankingList');
            if (rankingList) {
                rankingList.innerHTML = ''; // Explicitly clear the UI
            }
        })
        .catch((error) => {
            console.error('Error clearing all entries:', error);
        });
}

// Event listeners for page-specific actions
document.addEventListener('DOMContentLoaded', () => {
    // Attach event listener for the submit button
    const submitButton = document.getElementById('submit-button');
    if (submitButton) {
        submitButton.addEventListener('click', submitData);
    }

    // If the rankingList element exists, fetch and display rankings
    const rankingList = document.getElementById('rankingList');
    if (rankingList) {
        fetchRankings();
    }

    // Attach event listener for the clear list button
    const clearListButton = document.getElementById('clear-list-button');
    if (clearListButton) {
        clearListButton.addEventListener('click', clearAllEntries);
    }
});
