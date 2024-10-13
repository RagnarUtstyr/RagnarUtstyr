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
            rankings.sort((a, b) => b.number - a.number);

            rankings.forEach(({ id, name, number, health }) => {
                const listItem = document.createElement('li');
                listItem.className = 'list-item';

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

// Event listeners for applying damage
document.getElementById('apply-damage-button').addEventListener('click', applyDamageToAll);

// Fetch rankings on page load
fetchRankings();
