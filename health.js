import { getDatabase, ref, update, onValue, remove } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

const db = getDatabase();
let selectedStat = 'grd'; // Default stat for damage reduction

function fetchRankings() {
    const reference = ref(db, 'rankings/');
    onValue(reference, (snapshot) => {
        const data = snapshot.val();
        const rankingList = document.getElementById('rankingList');
        rankingList.innerHTML = '';

        if (data) {
            const rankings = Object.entries(data).map(([id, entry]) => ({ id, ...entry }));
            rankings.sort((a, b) => b.number - a.number);

            rankings.forEach(({ id, name, grd, res, tgh, health, url }) => {
                const listItem = document.createElement('li');
                listItem.className = 'list-item';

                const nameContainer = document.createElement('div');
                nameContainer.className = 'name-ac-container';

                const nameDiv = document.createElement('div');
                nameDiv.className = 'name';
                nameDiv.textContent = name;
                if (url) {
                    nameDiv.style.cursor = 'pointer';
                    nameDiv.addEventListener('click', () => window.open(url, '_blank'));
                }
                nameContainer.appendChild(nameDiv);

                // GRD, RES, TGH with radio buttons
                const statOptions = ['grd', 'res', 'tgh'];
                statOptions.forEach(stat => {
                    const statValue = eval(stat); // Get stat value
                    const statDiv = document.createElement('div');
                    statDiv.className = stat;
                    statDiv.textContent = `${stat.toUpperCase()}: ${statValue ?? 'N/A'}`;

                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.name = `stat-${id}`;
                    radio.value = stat;
                    radio.checked = (stat === 'grd'); // Default selection
                    radio.addEventListener('change', () => {
                        selectedStat = radio.value;
                    });

                    statDiv.appendChild(radio);
                    nameContainer.appendChild(statDiv);
                });

                listItem.appendChild(nameContainer);

                const healthDiv = document.createElement('div');
                healthDiv.className = 'health';
                healthDiv.textContent = `HP: ${health ?? 'N/A'}`;
                listItem.appendChild(healthDiv);

                const healthInput = document.createElement('input');
                healthInput.type = 'number';
                healthInput.placeholder = 'Damage';
                healthInput.className = 'damage-input';
                healthInput.style.width = '50px';
                healthInput.dataset.entryId = id;
                healthInput.dataset.currentHealth = health;
                healthInput.dataset.grd = grd ?? 0;
                healthInput.dataset.res = res ?? 0;
                healthInput.dataset.tgh = tgh ?? 0;
                healthInput.dataset.statGroup = `stat-${id}`;
                listItem.appendChild(healthInput);

                if (health === 0) {
                    const removeButton = document.createElement('button');
                    removeButton.textContent = 'Remove';
                    removeButton.className = 'remove-button';
                    removeButton.addEventListener('click', () => removeEntry(id, listItem));
                    listItem.appendChild(removeButton);
                }

                if (health === 0) {
                    listItem.classList.add('defeated');
                }

                rankingList.appendChild(listItem);
            });
        } else {
            console.log('No data available');
        }
    });
}

function applyDamageToAll() {
    const damageInputs = document.querySelectorAll('.damage-input');
    damageInputs.forEach(input => {
        const entryId = input.dataset.entryId;
        const currentHealth = parseInt(input.dataset.currentHealth);
        const damage = parseInt(input.value);
        const statGroup = input.dataset.statGroup;

        const selectedRadio = document.querySelector(`input[name="${statGroup}"]:checked`);
        const stat = selectedRadio ? selectedRadio.value : 'grd';
        const defense = parseInt(input.dataset[stat]);

        if (!isNaN(damage) && !isNaN(defense)) {
            const effectiveDamage = Math.max(damage - defense, 0);
            const finalDamage = effectiveDamage > 0 && effectiveDamage < 3 ? 3 : effectiveDamage;

            if (finalDamage > 0) {
                const updatedHealth = currentHealth - finalDamage;
                updateHealth(entryId, updatedHealth > 0 ? updatedHealth : 0, input);
            }

            input.value = '';
        } else {
            input.value = '';
        }
    });
}

function updateHealth(id, newHealth, healthInput) {
    const reference = ref(db, `rankings/${id}`);
    update(reference, { health: newHealth })
        .then(() => {
            const healthDiv = healthInput.parentElement.querySelector('.health');
            healthDiv.textContent = `HP: ${newHealth}`;

            const listItem = healthInput.parentElement;

            if (newHealth <= 0) {
                listItem.classList.add('defeated');
                healthInput.disabled = false;
                healthInput.style.display = 'inline-block';
                healthInput.dataset.currentHealth = newHealth;

                let removeButton = listItem.querySelector('.remove-button');
                if (!removeButton) {
                    removeButton = document.createElement('button');
                    removeButton.textContent = 'Remove';
                    removeButton.className = 'remove-button';
                    removeButton.addEventListener('click', () => removeEntry(id, listItem));
                    listItem.appendChild(removeButton);
                }
            } else {
                healthInput.dataset.currentHealth = newHealth;
                listItem.classList.remove('defeated');
            }
        })
        .catch((error) => {
            console.error('Error updating health:', error);
        });
}

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

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('rankingList')) {
        fetchRankings();
    }

    const applyDamageButton = document.getElementById('apply-damage-button');
    if (applyDamageButton) {
        applyDamageButton.addEventListener('click', applyDamageToAll);
    }
});
