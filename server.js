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
    const number = parseInt(document.getElementById('initiative') ? document.getElementById('initiative').value : document.getElementById('number').value);
    const healthInput = document.getElementById('health') ? document.getElementById('health').value : null; // Handle optional Health field
    const health = healthInput !== '' && healthInput !== null ? parseInt(healthInput) : null; // Handle empty health as null if present

    // Ensure name and number are valid, health can be null
    if (name && !isNaN(number)) {
        try {
            const reference = ref(db, 'rankings/');
            await push(reference, { name, number, health });
            console.log('Data submitted successfully:', { name, number, health });

            // Clear input fields after successful submission
            document.getElementById('name').value = '';
            document.getElementById('initiative') ? document.getElementById('initiative').value = '' : document.getElementById('number').value = '';
            if (document.getElementById('health')) document.getElementById('health').value = '';

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
    const reference = ref(db, 'rankings/');
    onValue(reference, (snapshot) => {
        const data = snapshot.val();
        const rankingList = document.getElementById('rankingList');
        rankingList.innerHTML = '';

        if (data) {
            const rankings = Object.entries(data).map(([id, entry]) => ({ id, ...entry }));
            rankings.sort((a, b) => b.number - a.number); // Sort by initiative (number)

            rankings.forEach(({ id, name, number, health }) => {
                const listItem = document.createElement('li');
                listItem.className = 'list-item';  // Updated class for styling

                const nameDiv = document.createElement('div');
                nameDiv.className = 'name';  // Updated class for styling
                nameDiv.textContent = name;

                const numberDiv = document.createElement('div');
                numberDiv.className = 'initiative';  // Updated class for styling
                numberDiv.textContent = `Int: ${number}`;

                const healthDiv = document.createElement('div');
                healthDiv.className = 'health';  // Updated class for styling
                if (health !== null && health !== undefined) {
                    healthDiv.textContent = `HP: ${health}`;
                } else {
                    healthDiv.textContent = 'HP: N/A';
                }

                const damageInput = document.createElement('input');
                damageInput.type = 'number';
                damageInput.placeholder = 'Damage';
                damageInput.className = 'damage-input';  // Updated class for styling
                damageInput.dataset.entryId = id;  // Store the entry ID in a custom data attribute
                damageInput.dataset.currentHealth = health;  // Store the current health

                const removeButton = document.createElement('button');
                removeButton.textContent = 'Remove';
                removeButton.className = 'remove-button';  // Ensure button maintains its styles
                removeButton.addEventListener('click', () => removeEntry(id));

                // Append all parts to the list item
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
    }, (error) => {
        console.error('Error fetching data:', error);
    });
}

// Function to apply damage to all entries
function applyDamageToAll() {
    const damageInputs = document.querySelectorAll('.damage-input');  // Select all damage inputs
    damageInputs.forEach(input => {
        const entryId = input.dataset.entryId;  // Get the entry ID from the data attribute
        const currentHealth = parseInt(input.dataset.currentHealth);  // Get the current health
        const damage = parseInt(input.value);  // Get the entered damage

        // Ensure damage is a valid number
        if (!isNaN(damage)) {
            const updatedHealth = currentHealth - damage;  // Calculate new health
            updateHealth(entryId, updatedHealth > 0 ? updatedHealth : 0);  // Ensure health doesn't go below 0
        }
    });
}

// Function to update health in Firebase
function updateHealth(id, newHealth) {
    const reference = ref(db, `rankings/${id}`);
    update(reference, { health: newHealth })
        .then(() => {
            console.log(`Health updated to ${newHealth}`);
        })
        .catch((error) => {
            console.error('Error updating health:', error);
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
    set(reference, null) // Sets the entire 'rankings' node to null, deleting all entries
        .then(() => {
            console.log('All entries cleared');
        })
        .catch((error) => {
            console.error('Error clearing entries:', error);
        });
}

// Event listeners for buttons
document.getElementById('submit-button').addEventListener('click', submitData);
document.getElementById('apply-damage-button').addEventListener('click', applyDamageToAll);
document.getElementById('clear-list-button').addEventListener('click', clearAllEntries);

// Fetch rankings on page load
fetchRankings();
