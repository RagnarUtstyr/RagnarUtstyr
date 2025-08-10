import { getDatabase, ref, update, onValue, remove } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

const db = getDatabase();

// Fetch and display rankings with health update functionality
function fetchRankings() {
  const reference = ref(db, 'rankings/');
  onValue(reference, (snapshot) => {
    const data = snapshot.val();
    const rankingList = document.querySelector('.ranking-body');
    if (!rankingList) return;

    rankingList.innerHTML = ''; // Clear the list

    if (!data) return;

    const rankings = Object.entries(data)
      .map(([id, entry]) => ({ id, ...entry }))
      .sort((a, b) => (b.number ?? 0) - (a.number ?? 0));

    rankings.forEach(({ id, name, grd, res, tgh, health, url }) => {
      const listItem = document.createElement('li');
      listItem.className = 'list-item';
      if (health === 0) listItem.classList.add('defeated');

      // Name column (click to open modal with defenses)
      const nameCol = document.createElement('div');
      nameCol.className = 'column name';
      nameCol.textContent = name ?? '—';
      nameCol.style.cursor = 'pointer';

      // Store stats for the modal
      nameCol.dataset.name = name ?? '';
      if (grd != null) nameCol.dataset.grd = grd;
      if (res != null) nameCol.dataset.res = res;
      if (tgh != null) nameCol.dataset.tgh = tgh;

      // If a URL exists, allow Ctrl/Cmd+Click to open it, normal click opens modal
      nameCol.addEventListener('click', (e) => {
        if ((e.ctrlKey || e.metaKey) && url) { window.open(url, '_blank'); return; }
        openStatsModal({
          name: nameCol.dataset.name || nameCol.textContent.trim(),
          grd: nameCol.dataset.grd ?? '—',
          res: nameCol.dataset.res ?? '—',
          tgh: nameCol.dataset.tgh ?? '—'
        });
      });

      // HP column
      const hpCol = document.createElement('div');
      hpCol.className = 'column hp';
      hpCol.textContent = `${health ?? 'N/A'}`;

      // DMG column with input
      const dmgCol = document.createElement('div');
      dmgCol.className = 'column dmg';
      const dmgInput = document.createElement('input');
      dmgInput.type = 'number';
      dmgInput.placeholder = 'DMG';
      dmgInput.className = 'damage-input';
      dmgInput.dataset.entryId = id;
      dmgInput.dataset.health = `${health ?? 0}`;
      dmgInput.dataset.grd = `${grd ?? 0}`;
      dmgInput.dataset.res = `${res ?? 0}`;
      dmgInput.dataset.tgh = `${tgh ?? 0}`;
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
  });
}

// Modal helper to show GRD/RES/TGH
function openStatsModal({ name, grd, res, tgh }) {
  const overlay = document.getElementById('stats-modal');
  if (!overlay) return;

  document.getElementById('stats-title').textContent = name || 'Stats';
  document.getElementById('stat-grd').textContent = grd ?? '—';
  document.getElementById('stat-res').textContent = res ?? '—';
  document.getElementById('stat-tgh').textContent = tgh ?? '—';

  overlay.hidden = false;

  const close = () => { overlay.hidden = true; };

  overlay.querySelector('.close-btn').onclick = close;
  const okBtn = document.getElementById('modal-ok');
  if (okBtn) okBtn.onclick = close;

  // click outside to close
  const onBackdrop = (e) => { if (e.target === overlay) close(); };
  overlay.addEventListener('click', onBackdrop, { once: true });

  // Esc to close
  const onKey = (e) => { if (e.key === 'Escape') { close(); window.removeEventListener('keydown', onKey); } };
  window.addEventListener('keydown', onKey, { once: true });
}

// Apply damage to all entries using selected global stat
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

      // Minimum 3 damage if damage >= stat and result < 3
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

// Update health in Firebase
function updateHealth(id, newHealth, input) {
  const reference = ref(db, `rankings/${id}`);
  update(reference, { health: newHealth })
    .then(() => {
      const listItem = input.closest('.list-item');
      const hpCol = listItem.querySelector('.column.hp');
      hpCol.textContent = `${newHealth}`;
      input.dataset.health = `${newHealth}`;

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

// Remove an entry
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
