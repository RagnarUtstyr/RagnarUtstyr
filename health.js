import { getDatabase, ref, update, onValue, remove } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

const db = getDatabase();

// Function to fetch and display rankings with health update functionality
function fetchRankings() {
    const reference = ref(db, 'rankings/');
    onValue(reference, (snapshot) => {
        const data = snapshot.val();
        const rankingList = document.getElementById('rankingList');
        rankingList.innerHTML = ''; // Clear the list

        if (data) {
            // Convert data into an array and sort by initiative (number)
            const rankings = Object.entries(data).map(([id, entry]) => ({ id, ...entry }));
            rankings.sort((a, b) => b.number - a.number); // Sort by initiative (number)

            // Display rankings
            rankings.forEach(({ id, name, ac, health, url }) => {
                const listItem = document.createElement('li');
                listItem.className = 'list-item';

                // Create a button for each list item
                const monsterButton = document.createElement('button');
                monsterButton.className = 'monster-button';
                monsterButton.textContent = `${name} (AC: ${ac !== null && ac !== undefined ? ac : 'N/A'}, HP: ${health !== null && health !== undefined ? health : 'N/A'})`;

                // Add click event to redirect to the URL
                if (url) {
                    monsterButton.onclick = () => {
                        window.open(url, '_blank');
                    };
                }

                // Append the button to the list item
                listItem.appendChild(monsterButton);

                // Append list item to ranking list
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

        // Ensure damage is a valid number
        if (!isNaN(damage)) {
            const updatedHealth = currentHealth - damage;
            updateHealth(entryId, updatedHealth > 0 ? updatedHealth : 0, input);
        }
    });
}

// Function to update health in Firebase and UI
function updateHealth(id, newHealth, healthInput) {
    const reference = ref(db, `rankings/${id}`);
    update(reference, { health: newHealth })
        .then(() => {
            const healthDiv = healthInput.parentElement.querySelector('.health');
            healthDiv.textContent = `HP: ${newHealth}`;  // Update health display

            const listItem = healthInput.parentElement;

            if (newHealth <= 0) {
                healthInput.remove();  // Remove input field
                listItem.classList.add('defeated');  // Add defeated class

                // Add remove button when health reaches 0
                let removeButton = listItem.querySelector('.remove-button');
                if (!removeButton) {  // Only add if it doesn't exist
                    removeButton = document.createElement('button');
                    removeButton.textContent = 'Remove';
                    removeButton.className = 'remove-button';
                    removeButton.addEventListener('click', () => {
                        removeEntry(id, listItem);
                    });
                    listItem.appendChild(removeButton);
                }
            } else {
                healthInput.dataset.currentHealth = newHealth;  // Update current health
            }
        })
        .catch((error) => {
            console.error('Error updating health:', error);
        });
}

// Function to remove an entry
function removeEntry(id, listItem) {
    const reference = ref(db, `rankings/${id}`);
    remove(reference)
        .then(() => {
            listItem.remove();
        })
        .catch((error) => {
            console.error('Error removing entry:', error);
        });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('rankingList')) {
        fetchRankings();
    }

    // Event listener for "Apply Damage" button
    const applyDamageButton = document.getElementById('apply-damage-button');
    if (applyDamageButton) {
        applyDamageButton.addEventListener('click', applyDamageToAll);
    }
});
