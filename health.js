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
            const rankings = Object.entries(data).map(([id, entry]) => ({ id, ...entry }));
            rankings.sort((a, b) => b.number - a.number); // Sort by initiative (number)

            rankings.forEach(({ id, name, number, health }) => {
                const listItem = document.createElement('li');
                listItem.className = 'list-item';

                const nameDiv = document.createElement('div');
                nameDiv.className = 'name';
                nameDiv.textContent = name;

                const numberDiv = document.createElement('div');
                numberDiv.className = 'number';
                numberDiv.textContent = `Int: ${number}`;

                const healthDiv = document.createElement('div');
                healthDiv.className = 'health';

                // Display "N/A" if health is not provided
                healthDiv.textContent = `HP: ${health !== null && health !== undefined ? health : 'N/A'}`;

                // If health is greater than 0, show the damage input field
                if (health !== null && health !== undefined) {
                    const healthInput = document.createElement('input');
                    healthInput.type = 'number';
                    healthInput.placeholder = 'Damage';
                    healthInput.className = 'damage-input';
                    healthInput.style.width = '50px';  // Small input field
                    healthInput.dataset.entryId = id;  // Store the entry ID in a custom data attribute
                    healthInput.dataset.currentHealth = health;  // Store the current health

                    listItem.appendChild(healthInput);
                }

                // Add the remove button
                const removeButton = document.createElement('button');
                removeButton.textContent = 'Remove';
                removeButton.className = 'remove-button';
                removeButton.addEventListener('click', () => {
                    removeEntry(id, listItem); // Pass listItem to remove it from DOM
                });

                // If health is 0 or less, show the remove button only
                if (health === 0) {
                    listItem.appendChild(removeButton);
                }

                // Append all the elements to the list item
                listItem.appendChild(nameDiv);
                listItem.appendChild(numberDiv);
                listItem.appendChild(healthDiv);

                // Append the list item to the ranking list
                rankingList.appendChild(listItem);

                // If health is 0, apply the "defeated" class to change the background color
                if (health === 0) {
                    listItem.classList.add('defeated');  // Add defeated class to the list item
                }
            });
        } else {
            console.log('No data available');
        }
    });
}

// Function to apply damage to all entries (updated to handle negative damage)
function applyDamageToAll() {
    const damageInputs = document.querySelectorAll('.damage-input');  // Select all damage inputs
    damageInputs.forEach(input => {
        const entryId = input.dataset.entryId;  // Get the entry ID from the data attribute
        const currentHealth = parseInt(input.dataset.currentHealth);  // Get the current health
        const damage = parseInt(input.value);  // Get the entered damage

        // Ensure damage is a valid number
        if (!isNaN(damage)) {
            const updatedHealth = currentHealth - damage;  // Negative damage will increase health
            updateHealth(entryId, updatedHealth > 0 ? updatedHealth : 0, input);  // Update health and ensure it doesn't go below 0
        }
    });
}

// Function to update health in Firebase and toggle input/remove button
function updateHealth(id, newHealth, healthInput) {
    const reference = ref(db, `rankings/${id}`);
    update(reference, { health: newHealth })
        .then(() => {
            console.log(`Health updated to ${newHealth}`);
            const healthDiv = healthInput.parentElement.querySelector('.health');
            healthDiv.textContent = `HP: ${newHealth}`;  // Update health display

            const listItem = healthInput.parentElement;

            // If health reaches 0, remove the input field, show the remove button, and apply defeated class
            if (newHealth <= 0) {
                healthInput.remove();  // Remove input field
                listItem.classList.add('defeated');  // Add defeated class to the list item
                const removeButton = healthInput.parentElement.querySelector('.remove-button');
                if (removeButton) {
                    removeButton.style.display = 'inline';  // Show remove button
                }
            } else {
                // Update the data-current-health attribute with the new health value
                healthInput.dataset.currentHealth = newHealth;
            }
        })
        .catch((error) => {
            console.error('Error updating health:', error);
        });
}

// Function to remove an entry from Firebase and the DOM
function removeEntry(id, listItem) {
    const reference = ref(db, `rankings/${id}`);
    remove(reference)
        .then(() => {
            console.log(`Entry with id ${id} removed successfully`);
            // Remove the corresponding list item from the DOM
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

    // Add event listener for the global "Apply Damage" button
    const applyDamageButton = document.getElementById('apply-damage-button');
    if (applyDamageButton) {
        applyDamageButton.addEventListener('click', applyDamageToAll);
    }
});
