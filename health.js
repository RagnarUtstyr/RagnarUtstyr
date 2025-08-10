import { getDatabase, ref, update, onValue, remove, set } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

const db = getDatabase();

/* -------------------------- Modal helpers -------------------------- */
function openStatModal({ name, grd, res, tgh, url, initiative }) {
  const modal = document.getElementById('stat-modal');
  if (!modal) return;

  // Title + fields
  document.getElementById('stat-modal-title').textContent = name ?? '';
  document.getElementById('stat-init').textContent = (initiative ?? 'N/A');
  document.getElementById('stat-grd').textContent = (grd ?? 'N/A');
  document.getElementById('stat-res').textContent = (res ?? 'N/A');
  document.getElementById('stat-tgh').textContent = (tgh ?? 'N/A');

  const link = document.getElementById('stat-url');
  if (url) {
    link.style.display = '';
    link.href = url;
  } else {
    link.style.display = 'none';
    link.removeAttribute('href');
  }

  modal.setAttribute('aria-hidden', 'false');
}

function closeStatModal() {
  const modal = document.getElementById('stat-modal');
  if (!modal) return;
  modal.setAttribute('aria-hidden', 'true');
}

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('stat-modal');
  if (modal) {
    document.getElementById('stat-modal-close')?.addEventListener('click', closeStatModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeStatModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeStatModal();
    });
  }
});

/* --------------------- Initiative list rendering -------------------- */
function fetchRankings() {
  const reference = ref(db, 'rankings/');
  onValue(reference, (snapshot) => {
    const data = snapshot.val();
    const rankingList = document.querySelector('.ranking-body'); // <ul id="rankingList" class="ranking-body">
    if (!rankingList) return;
    rankingList.innerHTML = '';

    if (!data) return;

    const rankings = Object.entries(data).map(([id, entry]) => ({ id, ...entry }));
    rankings.sort((a, b) => b.number - a.number);

    rankings.forEach(({ id, name, grd, res, tgh, health, url, number }) => {
      const listItem = document.createElement('li');
      listItem.className = 'list-item';
      if (health === 0) listItem.classList.add('defeated');

      // Name (click to open modal with Initiative + GRD/RES/TGH)
      const nameCol = document.createElement('div');
      nameCol.className = 'column name';
      nameCol.textContent = name ?? 'Unknown';
      nameCol.style.cursor = 'pointer';
      nameCol.title = 'Show defenses (GRD / RES / TGH)';
      nameCol.addEventListener('click', () => openStatModal({
        name, grd, res, tgh, url, initiative: number
      }));

      // HP
      const hpCol = document.createElement('div');
      hpCol.className = 'column hp';
      hpCol.textContent = `${health ?? 'N/A'}`;

      // Damage input (compute effective damage using selected global stat)
      const dmgCol = document.createElement('div');
      dmgCol.className = 'column dmg';
      const dmgInput = document.createElement('input');
      dmgInput.type = 'number';
      dmgInput.placeholder = 'DMG';
      dmgInput.className = 'damage-input';
      dmgInput.dataset.entryId = id;
      dmgInput.dataset.health = health ?? 0;
      dmgInput.dataset.grd = grd ?? 0;
      dmgInput.dataset.res = res ?? 0;
      dmgInput.dataset.tgh = tgh ?? 0;
      dmgCol.appendChild(dmgInput);

      listItem.appendChild(nameCol);
      listItem.appendChild(hpCol);
      listItem.appendChild(dmgCol);

      // Remove button only if at 0 HP
      if ((health ?? 0) === 0) {
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

/* ------------------------- Damage application ----------------------- */
function applyDamageToAll() {
  const inputs = document.querySelectorAll('.damage-input');
  const selectedStat = document.querySelector('input[name="globalStat"]:checked')?.value ?? 'grd';

  inputs.forEach(input => {
    const id = input.dataset.entryId;
    const currentHealth = parseInt(input.dataset.health);
    const rawDamage = parseInt(input.value);
    const statValue = parseInt(input.dataset[selectedStat]);

    // sanitize
    if (isNaN(rawDamage) || isNaN(currentHealth) || isNaN(statValue)) {
      input.value = '';
      return;
    }

    // Effective damage = raw - stat; if raw >= stat and result < 3, floor to 3
    let effective = rawDamage - statValue;
    if (rawDamage >= statValue && effective < 3) effective = 3;

    const finalDamage = Math.max(effective, 0);
    if (finalDamage > 0) {
      const updated = Math.max(currentHealth - finalDamage, 0);
      updateHealth(id, updated, input);
    }

    input.value = '';
  });
}

function updateHealth(id, newHealth, inputEl) {
  const reference = ref(db, `rankings/${id}`);
  update(reference, { health: newHealth })
    .then(() => {
      const listItem = inputEl.closest('.list-item');
      const hpCol = listItem.querySelector('.column.hp');
      hpCol.textContent = `${newHealth}`;
      inputEl.dataset.health = newHealth;

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
    .catch(err => console.error('Error updating health:', err));
}

/* ---------------------------- Utilities ----------------------------- */
function removeEntry(id, listItem) {
  const reference = ref(db, `rankings/${id}`);
  remove(reference)
    .then(() => {
      listItem?.remove();
    })
    .catch(err => console.error('Error removing entry:', err));
}

function clearList() {
  const reference = ref(db, 'rankings/');
  set(reference, null).catch(err => console.error('Error clearing list:', err));
}

/* -------------------------- Wire up buttons ------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  // Load & render
  fetchRankings();

  // Apply damage
  const applyBtn = document.getElementById('apply-damage-button');
  applyBtn?.addEventListener('click', applyDamageToAll);

  // Clear list
  const clearBtn = document.getElementById('clear-list-button');
  clearBtn?.addEventListener('click', clearList);
});
