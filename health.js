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

                // Create container for name and AC
                const nameAcContainer = document.createElement('div');
                nameAcContainer.className = 'name-ac-container';

                // Name div
                const nameDiv = document.createElement('div');
                nameDiv.className = 'name';
                nameDiv.textContent = name;

                // Add click event to the name only if a URL exists
                if (url) {
                    nameDiv.style.cursor = 'pointer';
                    nameDiv.addEventListener('click', () => {
                        window.open(url, '_blank');
                    });
                }
                nameAcContainer.appendChild(nameDiv);

                // AC div (ensure AC is retrieved and displayed)
                const acDiv = document.createElement('div');
                acDiv.className = 'ac';
                acDiv.textContent = `AC: ${ac !== null && ac !== undefined ? ac : 'N/A'}`;
                nameAcContainer.appendChild(acDiv);

                // Append name and AC container to the list item
                listItem.appendChild(nameAcContainer);

                // Health div
                const healthDiv = document.createElement('div');
                healthDiv.className = 'health';
                healthDiv.textContent = `HP: ${health !== null && health !== undefined ? health : 'N/A'}`;
                listItem.appendChild(healthDiv);

                // Damage input field (always visible, even if health is 0)
                const healthInput = document.createElement('input');
                healthInput.type = 'number';
                healthInput.placeholder = 'Damage';
                healthInput.className = 'damage-input';
                healthInput.style.width = '50px';  // Small input field
                healthInput.dataset.entryId = id;  // Store entry ID
                healthInput.dataset.currentHealth = health;  // Store current health
                listItem.appendChild(healthInput);

                // Add the remove button only if health is 0 or below
                if (health === 0) {
                    const removeButton = document.createElement('button');
                    removeButton.textContent = 'Remove';
                    removeButton.className = 'remove-button';
                    removeButton.addEventListener('click', () => {
                        removeEntry(id, listItem); // Pass listItem to remove it from DOM
                    });
                    listItem.appendChild(removeButton);
                }

                // Add defeated class if health is 0
                if (health === 0) {
                    listItem.classList.add('defeated');
                }

                // Append the list item to ranking list
                rankingList.appendChild(listItem);
            });
        } else {
            console.log('No data available');
        }
    });
}

// Function to apply damage to all entries, factoring in AC reduction and minimum damage of 3
function applyDamageToAll() {
    const damageInputs = document.querySelectorAll('.damage-input');
    damageInputs.forEach(input => {
        const entryId = input.dataset.entryId;
        const currentHealth = parseInt(input.dataset.currentHealth);
        const damage = parseInt(input.value);
        const ac = parseInt(input.parentElement.querySelector('.ac').textContent.replace('AC: ', ''));

        // Ensure damage and AC are valid numbers
        if (!isNaN(damage) && !isNaN(ac)) {
            // Calculate the effective damage (damage minus AC)
            const effectiveDamage = Math.max(damage - ac, 0); // Ensure no negative damage

            // If effective damage is positive but less than 3, set it to 3
            const finalDamage = effectiveDamage > 0 && effectiveDamage < 3 ? 3 : effectiveDamage;

            // Calculate the new health
            const updatedHealth = currentHealth - finalDamage;
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

            // If the health is 0 or below, mark as defeated
            if (newHealth <= 0) {
                listItem.classList.add('defeated');  // Add defeated class

                // Ensure the damage input stays visible and usable
                healthInput.disabled = false; // Ensure input is not disabled
                healthInput.style.display = 'inline-block';  // Ensure it's visible
                healthInput.dataset.currentHealth = newHealth;  // Update current health dataset

                // Check if remove button exists; if not, create it
                let removeButton = listItem.querySelector('.remove-button');
                if (!removeButton) {
                    removeButton = document.createElement('button');
                    removeButton.textContent = 'Remove';
                    removeButton.className = 'remove-button';
                    removeButton.addEventListener('click', () => {
                        removeEntry(id, listItem);
                    });
                    listItem.appendChild(removeButton);
                }

            } else {
                // If health is greater than 0, just update the health
                healthInput.dataset.currentHealth = newHealth;  // Update current health
                listItem.classList.remove('defeated');  // Remove defeated class if health is restored
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

    // Ensure the apply damage button is present before attaching the event listener
    const applyDamageButton = document.getElementById('apply-damage-button');
    if (applyDamageButton) {
        applyDamageButton.addEventListener('click', applyDamageToAll);
    }
});