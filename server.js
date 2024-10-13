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

// Function to submit data to Firebase
async function submitData() {
    const name = document.getElementById('name').value;
    const number = parseInt(document.getElementById('initiative').value);
    const healthInput = document.getElementById('health').value;
    const health = healthInput !== '' ? parseInt(healthInput) : null;
    const acInput = document.getElementById('ac').value;
    const ac = acInput !== '' ? parseInt(acInput) : null;

    // Ensure name and number are valid, health and ac can be null
    if (name && !isNaN(number)) {
        try {
            const reference = ref(db, 'rankings/');
            await push(reference, { name, number, health, ac });
            console.log('Data submitted successfully:', { name, number, health, ac });
            // Clear input fields
            document.getElementById('name').value = '';
            document.getElementById('initiative').value = '';
            document.getElementById('health').value = '';
            document.getElementById('ac').value = '';
        } catch (error) {
            console.error('Error submitting data:', error);
        }
    } else {
        alert('Please enter valid name and initiative values.');
    }
}

// Function to fetch and display rankings
function fetchRankings() {
    const reference = ref(db, 'rankings/');
    onValue(reference, (snapshot) => {
        const data = snapshot.val();
        console.log('Data fetched from Firebase:', data); // Add this line
        const rankingList = document.getElementById('rankingList');
        rankingList.innerHTML = '';

        if (data) {
            const rankings = Object.entries(data).map(([id, entry]) => ({ id, ...entry }));
            rankings.sort((a, b) => b.number - a.number); // Sort by initiative (number)

            rankings.forEach(({ id, name, number, health, ac }) => {
                console.log(`Entry ID: ${id}, Name: ${name}, AC: ${ac}`);

                // Create separate containers for name, initiative (now Int), health (now HP), AC, and button
                const nameDiv = document.createElement('div');
                nameDiv.className = 'name';
                nameDiv.textContent = name;

                const numberDiv = document.createElement('div');
                numberDiv.className = 'number';
                numberDiv.textContent = `Int: ${number}`; // Initiative as Int

                const healthDiv = document.createElement('div');
                healthDiv.className = 'health';
                if (health !== null && health !== undefined) {
                    healthDiv.textContent = `HP: ${health}`; // Add HP prefix if health is defined
                } else {
                    healthDiv.textContent = ''; // Empty if no health value
                }

                const acDiv = document.createElement('div');
                acDiv.className = 'ac';
                if (ac !== null && ac !== undefined) {
                    acDiv.textContent = `AC: ${ac}`; // Add AC prefix if AC is defined
                } else {
                    acDiv.textContent = ''; // Empty if no AC value
                }

                const removeButton = document.createElement('button');
                removeButton.textContent = 'Remove';
                removeButton.addEventListener('click', () => removeEntry(id));

                // Append all parts to the list item
                listItem.appendChild(nameDiv);
                listItem.appendChild(numberDiv);
                if (healthDiv.textContent !== '') {
                    listItem.appendChild(healthDiv); // Only append HP if there is a value
                }
                if (acDiv.textContent !== '') {
                    listItem.appendChild(acDiv); // Only append AC if there is a value
                }
                listItem.appendChild(removeButton);

                // Append the list item to the ranking list
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
    const reference = ref(db, `rankings/${id}`);
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
    const reference = ref(db, 'rankings/');
    set(reference, null) // Sets the entire 'rankings' node to null, deleting all data.
        .then(() => {
            console.log('All entries removed successfully');
            // Clear the displayed list immediately
            const rankingList = document.getElementById('rankingList');
            rankingList.innerHTML = ''; // Explicitly clear the UI
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