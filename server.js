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
    const health = healthInput !== '' && healthInput !== null ? parseInt(healthInput) : null; // Handle empty health as null if present

    // Ensure name and number are valid, health can be null
    if (name && !isNaN(number)) {
        try {
            const reference = ref(db, 'rankings/');
            await push(reference, { name, number, health });
            console.log('Data submitted successfully:', { name, number, health });

            // Clear input fields after successful submission
            document.getElementById('name').value = '';
            document.getElementById('initiative').value = '';
            document.getElementById('health').value = '';
        } catch (error) {
            console.error('Error submitting data:', error);
        }
    } else {
        console.log('Please enter valid name and initiative values.');
    }
}

// Function to fetch and display rankings
function fetchRankings() {
    const reference = ref(db, 'rankings/');
    onValue(reference, (snapshot) => {
        const data = snapshot.val();
        const rankingList = document.getElementById('rankingList');
        rankingList.innerHTML = '';

        if (data) {
            const rankings = Object.entries(data).map(([id, entry]) => ({ id, ...entry }));
            rankings.sort((a, b) => b.number - a.number);

            rankings.forEach(({ id, name, number, health }) => {
                const listItem = document.createElement('li');
                listItem.className = 'list-item';  // Updated class for styling

                const nameDiv = document.createElement('div');
                nameDiv.className = 'name';
                nameDiv.textContent = name;

                const numberDiv = document.createElement('div');
                numberDiv.className = 'initiative';
                numberDiv.textContent = `Int: ${number}`;

                const healthDiv = document.createElement('div');
                healthDiv.className = 'health';
                healthDiv.textContent = `HP: ${health !== null ? health : 'N/A'}`;

                const damageInput = document.createElement('input');
                damageInput.type = 'number';
                damageInput.placeholder = 'Damage';
                damageInput.className = 'damage-input';
                damageInput.dataset.entryId = id;
                damageInput.dataset.currentHealth = health;

                const removeButton = document.createElement('button');
                removeButton.textContent = 'Remove';
                removeButton.className = 'remove-button';
                removeButton.addEventListener('click', () => removeEntry(id));

                listItem.appendChild(nameDiv);
                listItem.appendChild(numberDiv);
                listItem.appendChild(healthDiv);
                listItem.appendChild(damageInput);
                listItem.appendChild(removeButton);

                rankingList.appendChild(listItem);
            });
        } else {
            console.log('No data available');
        }
    });
}

// Function to apply damage to all entries
function applyDamageToAll() {
    const damageInputs = document.querySelectorAll('.damage-input');
    damageInputs.forEach(input => {
        const entryId = input.dataset.entryId;
        const currentHealth = parseInt(input.dataset.currentHealth);
        const damage = parseInt(input.value);

        if (!isNaN(damage)) {
            const updatedHealth = currentHealth - damage;
            updateHealth(entryId, updatedHealth > 0 ? updatedHealth : 0);
        }
    });
}

// Function to update health in Firebase
function updateHealth(id, newHealth) {
    const reference = ref(db, `rankings/${id}`);
    update(reference, { health: newHealth }).then(() => {
        console.log(`Health updated to ${newHealth}`);
    });
}

// Function to remove an entry from Firebase
function removeEntry(id) {
    const reference = ref(db, `rankings/${id}`);
    remove(reference).then(() => {
        console.log(`Entry with id ${id} removed successfully`);
    });
}

// Function to clear all entries from Firebase
function clearAllEntries() {
    const reference = ref(db, 'rankings/');
    set(reference, null).then(() => {
        console.log('All entries cleared');
        const rankingList = document.getElementById('rankingList');
        rankingList.innerHTML = ''; // Clear the UI
    });
}

// Event listeners for buttons
document.getElementById('submit-button').addEventListener('click', submitData);
document.getElementById('apply-damage-button').addEventListener('click', applyDamageToAll);
document.getElementById('clear-list-button').addEventListener('click', clearAllEntries);
