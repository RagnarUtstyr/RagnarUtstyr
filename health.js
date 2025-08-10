import { getDatabase, ref, update, onValue, remove } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

const db = getDatabase();

// Function to fetch and display rankings with health update functionality
function fetchRankings() {
    const reference = ref(db, 'rankings/');
    onValue(reference, (snapshot) => {
        const data = snapshot.val();
        const rankingList = document.querySelector('.ranking-body');
        if (!rankingList) return;
        rankingList.innerHTML = ''; // Clear the list

        if (data) {
            const rankings = Object.entries(data).map(([id, entry]) => ({ id, ...entry }));
            rankings.sort((a, b) => b.number - a.number);

            rankings.forEach(({ id, name, grd, res, tgh, health, url }) => {
                const listItem = document.createElement('li');
                listItem.className = 'list-item';
                if (health === 0) listItem.classList.add('defeated');

                nameCol.style.cursor = 'pointer';
nameCol.title = 'View defenses';
nameCol.addEventListener('click', () => {
  openStatsModal({
    name,
    grd: grd ?? 'N/A',
    res: res ?? 'N/A',
    tgh: tgh ?? 'N/A',
    health: health ?? 'N/A'
  });
});

                const hpCol = document.createElement('div');
                hpCol.className = 'column hp';
                hpCol.textContent = `${health ?? 'N/A'}`;

                const dmgCol = document.createElement('div');
                dmgCol.className = 'column dmg';
                const dmgInput = document.createElement('input');
                dmgInput.type = 'number';
                dmgInput.placeholder = 'DMG';
                dmgInput.className = 'damage-input';
                dmgInput.dataset.entryId = id;
                dmgInput.dataset.health = health;
                dmgInput.dataset.grd = grd ?? 0;
                dmgInput.dataset.res = res ?? 0;
                dmgInput.dataset.tgh = tgh ?? 0;
                dmgCol.appendChild(dmgInput);

                listItem.appendChild(nameCol);
                listItem.appendChild(hpCol);
                listItem.appendChild(dmgCol);

                if (health === 0) {
                    const removeButton = document.createElement('button');
                    removeButton.textContent = 'Remove';
                    removeButton.className = 'remove-button';
                    removeButton.addEventListener('click', () => removeEntry(id, listItem));
                    listItem.appendChild(removeButton);
                }

                rankingList.appendChild(listItem);
            });
        }
    });
}

// Function to apply damage to all entries
function applyDamageToAll() {
    const inputs = document.querySelectorAll('.damage-input');
    const selectedStat = document.querySelector('input[name="globalStat"]:checked')?.value ?? 'grd';

    inputs.forEach(input => {
        const id = input.dataset.entryId;
        const currentHealth = parseInt(input.dataset.health);
        const damage = parseInt(input.value);
        const statValue = parseInt(input.dataset[selectedStat]);

        if (!isNaN(damage) && !isNaN(statValue)) {
            let effectiveDamage = damage - statValue;

            // Apply minimum of 3 if damage >= stat and result < 3
            if (damage >= statValue && effectiveDamage < 3) {
                effectiveDamage = 3;
            }

            const finalDamage = Math.max(effectiveDamage, 0);

            if (finalDamage > 0) {
                const updatedHealth = Math.max(currentHealth - finalDamage, 0);
                updateHealth(id, updatedHealth, input);
            }
            input.value = '';
        } else {
            input.value = '';
        }
    });
}

// Function to update health in Firebase
function updateHealth(id, newHealth, input) {
    const reference = ref(db, `rankings/${id}`);
    update(reference, { health: newHealth })
        .then(() => {
            const listItem = input.closest('.list-item');
            const hpCol = listItem.querySelector('.column.hp');
            hpCol.textContent = `${newHealth}`;
            input.dataset.health = newHealth;

            if (newHealth <= 0) {
                listItem.classList.add('defeated');
                let removeButton = listItem.querySelector('.remove-button');
                if (!removeButton) {
                    removeButton = document.createElement('button');
                    removeButton.textContent = 'Remove';
                    removeButton.className = 'remove-button';
                    removeButton.addEventListener('click', () => removeEntry(id, listItem));
                    listItem.appendChild(removeButton);
                }
            } else {
                listItem.classList.remove('defeated');
            }
        })
        .catch(error => console.error('Error updating health:', error));
}

function openStatsModal({ name, grd, res, tgh, health }) {
  const overlay = document.getElementById('stats-modal');
  if (!overlay) return;

  // Fill content
  document.getElementById('stats-title').textContent = name;
  document.getElementById('stat-grd').textContent = grd ?? '—';
  document.getElementById('stat-res').textContent = res ?? '—';
  document.getElementById('stat-tgh').textContent = tgh ?? '—';
  document.getElementById('stat-hp').textContent  = health ?? '—';

  // Show
  overlay.hidden = false;

  // One-time listeners (idempotent)
  const closeBtn = overlay.querySelector('.close-btn');
  const okBtn = document.getElementById('modal-ok');

  const close = () => { overlay.hidden = true; };

  // close on X / OK
  closeBtn.onclick = close;
  okBtn.onclick = close;

  // close on backdrop click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  }, { once: true });

  // close on Escape
  const onKey = (e) => { if (e.key === 'Escape') { close(); window.removeEventListener('keydown', onKey); } };
  window.addEventListener('keydown', onKey, { once: true });
}

// Function to remove an entry
function removeEntry(id, listItem) {
    const reference = ref(db, `rankings/${id}`);
    remove(reference)
        .then(() => listItem.remove())
        .catch(error => console.error('Error removing entry:', error));
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.ranking-body')) fetchRankings();
    const dmgButton = document.getElementById('apply-damage-button');
    if (dmgButton) dmgButton.addEventListener('click', applyDamageToAll);
});