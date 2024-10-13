import { getDatabase, ref, update, onValue, remove } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

const db = getDatabase();

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
                listItem.className = 'list-item';  // Add new class for styling

                const nameDiv = document.createElement('div');
                nameDiv.className = 'name';  // Add class for styling
                nameDiv.textContent = name;

                const numberDiv = document.createElement('div');
                numberDiv.className = 'initiative';  // Add class for styling
                numberDiv.textContent = `Int: ${number}`;

                const healthDiv = document.createElement('div');
                healthDiv.className = 'health';  // Add class for styling
                healthDiv.textContent = `HP: ${health !== null ? health : 'N/A'}`;

                const damageInput = document.createElement('input');
                damageInput.type = 'number';
                damageInput.placeholder = 'Damage';
                damageInput.className = 'damage-input';  // Add class for styling
                damageInput.dataset.entryId = id;  // Store the entry ID in a custom data attribute
                damageInput.dataset.currentHealth = health;  // Store the current health

                listItem.appendChild(nameDiv);
                listItem.appendChild(numberDiv);
                listItem.appendChild(healthDiv);
                listItem.appendChild(damageInput);

                rankingList.appendChild(listItem);
            });
        } else {
            console.log('No data available');
        }
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
            updateHealth(entryId, updatedHealth > 0 ? updatedHealth : 0);  // Update health and ensure it doesn't go below 0
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

// Event listeners for applying damage
document.getElementById('apply-damage-button').addEventListener('click', applyDamageToAll);

// Fetch rankings on page load
fetchRankings();
