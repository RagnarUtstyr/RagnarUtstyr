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

            rankings.forEach(({ id, name, grd, res, tgh, health, url }) => {
                const listItem = document.createElement('li');
                listItem.className = 'list-item';

                // Name column
                const nameDiv = document.createElement('div');
                nameDiv.className = 'column name';
                nameDiv.textContent = name;
                if (url) {
                    nameDiv.style.cursor = 'pointer';
                    nameDiv.addEventListener('click', () => window.open(url, '_blank'));
                }
                listItem.appendChild(nameDiv);

                // Stat columns (GRD, RES, TGH) + radio buttons
                ['grd', 'res', 'tgh'].forEach(stat => {
                    const value = eval(stat); // get grd/res/tgh value
                    const container = document.createElement('div');
                    container.className = `column ${stat}`;
                    container.textContent = value ?? 'N/A';

                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.name = `stat-${id}`;
                    radio.value = stat;
                    radio.checked = stat === 'grd'; // default to GRD
                    radio.style.marginLeft = '6px';
                    container.appendChild(radio);
                    listItem.appendChild(container);
                });

                // HP column
                const hpDiv = document.createElement('div');
                hpDiv.className = 'column hp';
                hpDiv.textContent = health ?? 'N/A';
                listItem.appendChild(hpDiv);

                // Damage input field
                const dmgInput = document.createElement('input');
                dmgInput.type = 'number';
                dmgInput.placeholder = '0';
                dmgInput.className = 'damage-input';
                dmgInput.dataset.entryId = id;
                dmgInput.dataset.currentHealth = health;
                dmgInput.dataset.grd = grd ?? 0;
                dmgInput.dataset.res = res ?? 0;
                dmgInput.dataset.tgh = tgh ?? 0;
                dmgInput.dataset.statGroup = `stat-${id}`;

                const dmgWrapper = document.createElement('div');
                dmgWrapper.className = 'column dmg';
                dmgWrapper.appendChild(dmgInput);
                listItem.appendChild(dmgWrapper);

                // Remove button if defeated
                if (health === 0) {
                    const removeButton = document.createElement('button');
                    removeButton.textContent = 'Remove';
                    removeButton.className = 'remove-button';
                    removeButton.addEventListener('click', () => removeEntry(id, listItem));
                    listItem.appendChild(removeButton);
                }

                // Mark as defeated
                if (health === 0) listItem.classList.add('defeated');

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
            const row = healthInput.closest('.list-item');
            const hpDiv = row.querySelector('.column.hp');
            hpDiv.textContent = newHealth;

            healthInput.dataset.currentHealth = newHealth;

            if (newHealth <= 0) {
                row.classList.add('defeated');

                let removeButton = row.querySelector('.remove-button');
                if (!removeButton) {
                    removeButton = document.createElement('button');
                    removeButton.textContent = 'Remove';
                    removeButton.className = 'remove-button';
                    removeButton.addEventListener('click', () => removeEntry(id, row));
                    row.appendChild(removeButton);
                }
            } else {
                row.classList.remove('defeated');

                // Remove the remove button if it exists and health > 0
                const existing = row.querySelector('.remove-button');
                if (existing) existing.remove();
            }
        })
        .catch((error) => {
            console.error('Error updating health:', error);
        });
}

function removeEntry(id, listItem) {
    const reference = ref(db, `rankings/${id}`);
    remove(reference)
        .then(() => listItem.remove())
        .catch((error) => console.error('Error removing entry:', error));
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