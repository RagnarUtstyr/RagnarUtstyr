import { getDatabase, ref, update, onValue, remove, set } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";
import { BANES, normalizeStoredBanes } from "./banes.js";

const db = getDatabase();
let __currentEntryId = null;
let __currentEntryBanes = [];
const __banesByEntryId = new Map();

function openStatModal({ name, grd, res, tgh, url, initiative, countdownRemaining, countdownActive, countdownEnded, banes = [] }) {
  const modal = document.getElementById('stat-modal');
  if (!modal) return;

  __currentEntryBanes = normalizeStoredBanes(banes);

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

  const remainingEl = document.getElementById('stat-countdown-remaining');
  const inputEl = document.getElementById('stat-countdown-amount');
  if (remainingEl) {
    if (countdownEnded) remainingEl.textContent = 'ENDED (0)';
    else if (countdownActive) remainingEl.textContent = `${countdownRemaining ?? '—'}`;
    else if (countdownRemaining === 0) remainingEl.textContent = '0';
    else remainingEl.textContent = '—';
  }
  if (inputEl) inputEl.value = '';

  modal.setAttribute('aria-hidden', 'false');
}

function closeStatModal() {
  const modal = document.getElementById('stat-modal');
  if (!modal) return;
  modal.setAttribute('aria-hidden', 'true');
}

function openHpModal(currentHp) {
  const modal = document.getElementById('hp-modal');
  if (!modal) return;

  const input = document.getElementById('hp-set-amount');
  if (input) {
    input.value = (currentHp ?? currentHp === 0) ? currentHp : '';
    setTimeout(() => {
      input.focus();
      input.select();
    }, 0);
  }

  modal.setAttribute('aria-hidden', 'false');
}

function closeHpModal() {
  const modal = document.getElementById('hp-modal');
  if (!modal) return;
  modal.setAttribute('aria-hidden', 'true');
}

function openBanePickerModal() {
  const modal = document.getElementById('bane-picker-modal');
  if (!modal) return;
  renderBanePickerList();
  modal.setAttribute('aria-hidden', 'false');
}

function closeBanePickerModal() {
  document.getElementById('bane-picker-modal')?.setAttribute('aria-hidden', 'true');
}

function openBanesModal(entryId) {
  const modal = document.getElementById('banes-modal');
  if (!modal) return;
  renderBanesModalList(entryId);
  modal.setAttribute('aria-hidden', 'false');
}

function closeBanesModal() {
  document.getElementById('banes-modal')?.setAttribute('aria-hidden', 'true');
}

function createBaneIcon(icon, fallback = '✦') {
  const holder = document.createElement('span');
  holder.className = 'bane-chip__icon';

  if (icon) {
    const img = document.createElement('img');
    img.src = icon;
    img.alt = '';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    holder.appendChild(img);
  } else {
    holder.textContent = fallback;
  }

  return holder;
}

function renderEntryBanes(container, banes) {
  if (!container) return;
  container.innerHTML = '';
  normalizeStoredBanes(banes).forEach((bane) => {
    const chip = document.createElement('span');
    chip.className = 'bane-chip';
    chip.appendChild(createBaneIcon(bane.icon));

    const text = document.createElement('span');
    text.textContent = bane.name;
    chip.appendChild(text);
    container.appendChild(chip);
  });
}

function renderBanePickerList() {
  const container = document.getElementById('bane-picker-list');
  if (!container) return;
  container.innerHTML = '';

  const currentNames = new Set(normalizeStoredBanes(__currentEntryBanes).map((bane) => bane.name));

  BANES.forEach((bane) => {
    const row = document.createElement('div');
    row.className = 'bane-row';

    const icon = createBaneIcon(bane.icon);
    icon.className = 'bane-row__icon';

    const name = document.createElement('div');
    name.className = 'bane-row__name';
    name.textContent = bane.name;

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.textContent = currentNames.has(bane.name) ? 'Added' : 'Add';
    addButton.disabled = currentNames.has(bane.name);
    addButton.addEventListener('click', async () => {
      await addBaneToCurrentEntry(bane);
    });

    row.appendChild(icon);
    row.appendChild(name);
    row.appendChild(addButton);
    container.appendChild(row);
  });
}

function renderBanesModalList(entryId) {
  const container = document.getElementById('banes-modal-list');
  if (!container) return;
  container.innerHTML = '';

  const banes = normalizeStoredBanes(__banesByEntryId.get(entryId));
  if (!banes.length) {
    const empty = document.createElement('p');
    empty.className = 'bane-empty';
    empty.textContent = 'No banes added yet.';
    container.appendChild(empty);
    return;
  }

  banes.forEach((bane) => {
    const row = document.createElement('div');
    row.className = 'bane-row bane-row__link';
    row.tabIndex = 0;
    row.title = `Open ${bane.name}`;

    const icon = createBaneIcon(bane.icon);
    icon.className = 'bane-row__icon';

    const name = document.createElement('div');
    name.className = 'bane-row__name';
    name.textContent = bane.name;

    const openLink = () => {
      if (bane.url) window.open(bane.url, '_blank', 'noopener');
    };

    row.addEventListener('click', openLink);
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLink();
      }
    });

    row.appendChild(icon);
    row.appendChild(name);
    container.appendChild(row);
  });
}

async function saveBanesForEntry(id, banes) {
  const normalized = normalizeStoredBanes(banes);
  __banesByEntryId.set(id, normalized);
  await update(ref(db, `rankings/${id}`), { banes: normalized });
}

async function addBaneToCurrentEntry(bane) {
  if (!__currentEntryId) return;
  const next = normalizeStoredBanes([...( __banesByEntryId.get(__currentEntryId) || []), bane]);
  await saveBanesForEntry(__currentEntryId, next);
  __currentEntryBanes = next;
  renderBanePickerList();
}

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('stat-modal');
  if (modal) {
    document.getElementById('stat-modal-close')?.addEventListener('click', closeStatModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeStatModal(); });
  }

  const hpModal = document.getElementById('hp-modal');
  if (hpModal) {
    document.getElementById('hp-modal-close')?.addEventListener('click', closeHpModal);
    hpModal.addEventListener('click', (e) => { if (e.target === hpModal) closeHpModal(); });
  }

  const pickerModal = document.getElementById('bane-picker-modal');
  if (pickerModal) {
    document.getElementById('bane-picker-close')?.addEventListener('click', closeBanePickerModal);
    pickerModal.addEventListener('click', (e) => { if (e.target === pickerModal) closeBanePickerModal(); });
  }

  const banesModal = document.getElementById('banes-modal');
  if (banesModal) {
    document.getElementById('banes-modal-close')?.addEventListener('click', closeBanesModal);
    banesModal.addEventListener('click', (e) => { if (e.target === banesModal) closeBanesModal(); });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeStatModal();
    closeHpModal();
    closeBanePickerModal();
    closeBanesModal();
  });

  document.getElementById('stat-add-bane')?.addEventListener('click', () => {
    if (!__currentEntryId) return;
    openBanePickerModal();
  });
});

const __countdownById = new Map();
function __getCountdownState(id) {
  return __countdownById.get(id) || { remaining: null, active: false, ended: false };
}
function __setCountdownState(id, state) {
  __countdownById.set(id, {
    remaining: (typeof state.remaining === 'number') ? state.remaining : null,
    active: !!state.active,
    ended: !!state.ended
  });
}

function __rowFor(id) {
  return document.querySelector(`.list-item[data-entry-id="${id}"]`);
}

function __updateCountdownBadge(row, state) {
  if (!row) return;
  const nameMain = row.querySelector('.name-main');
  if (!nameMain) return;

  let badge = nameMain.querySelector('.countdown-badge');
  const hasSomething =
    (state.active && typeof state.remaining === 'number' && state.remaining > 0) ||
    state.ended;

  if (!hasSomething) {
    badge?.remove();
    return;
  }

  if (!badge) {
    badge = document.createElement('span');
    badge.className = 'countdown-badge';
    nameMain.appendChild(badge);
  }

  badge.textContent = state.ended ? 'CD: ENDED' : `CD: ${state.remaining}`;
}

function __applyRowCountdownClasses(entryId, state) {
  const row = __rowFor(entryId);
  if (!row) return;

  if (state.active && typeof state.remaining === 'number' && state.remaining > 0) {
    row.classList.add('countdown-active');
  } else {
    row.classList.remove('countdown-active');
  }

  if (!state.ended) row.classList.remove('countdown-expired');
  __updateCountdownBadge(row, state);
}

function fetchRankings() {
  const reference = ref(db, 'rankings/');
  onValue(reference, (snapshot) => {
    const data = snapshot.val();
    const rankingList = document.querySelector('.ranking-body');
    if (!rankingList) return;
    rankingList.innerHTML = '';

    __countdownById.clear();
    __banesByEntryId.clear();
    if (!data) return;

    const rankings = Object.entries(data).map(([id, entry]) => ({ id, ...entry }));
    rankings.sort((a, b) => b.number - a.number);

    rankings.forEach(({ id, name, grd, res, tgh, health, url, number, countdownRemaining, countdownActive, countdownEnded, banes }) => {
      __setCountdownState(id, {
        remaining: (typeof countdownRemaining === 'number') ? countdownRemaining : null,
        active: !!countdownActive,
        ended: !!countdownEnded
      });
      const normalizedBanes = normalizeStoredBanes(banes);
      __banesByEntryId.set(id, normalizedBanes);

      const listItem = document.createElement('li');
      listItem.className = 'list-item';
      listItem.dataset.entryId = id;
      if (health === 0) listItem.classList.add('defeated');

      const nameCol = document.createElement('div');
      nameCol.className = 'column name';
      nameCol.style.cursor = 'pointer';
      nameCol.title = 'Show defenses (GRD / RES / TGH)';
      nameCol.addEventListener('click', () => {
        __currentEntryId = id;
        __currentEntryBanes = normalizedBanes;
        const s = __getCountdownState(id);
        openStatModal({
          name, grd, res, tgh, url, initiative: number,
          countdownRemaining: s.remaining,
          countdownActive: s.active,
          countdownEnded: s.ended,
          banes: normalizedBanes
        });
      });

      const nameMain = document.createElement('div');
      nameMain.className = 'name-main';
      const nameText = document.createElement('span');
      nameText.className = 'name-main__text';
      nameText.textContent = name ?? 'Unknown';
      nameMain.appendChild(nameText);

      const entryBanes = document.createElement('div');
      entryBanes.className = 'entry-banes';
      renderEntryBanes(entryBanes, normalizedBanes);

      nameCol.appendChild(nameMain);
      nameCol.appendChild(entryBanes);

      const hpCol = document.createElement('div');
      hpCol.className = 'column hp';
      hpCol.textContent = (health === null || health === undefined) ? 'N/A' : `${health}`;
      hpCol.style.cursor = 'pointer';
      hpCol.title = 'Set HP';
      hpCol.addEventListener('click', () => {
        __currentEntryId = id;
        openHpModal(health);
      });

      const dmgCol = document.createElement('div');
      dmgCol.className = 'column dmg';
      const dmgInput = document.createElement('input');
      dmgInput.type = 'number';
      dmgInput.placeholder = 'DMG';
      dmgInput.className = 'damage-input';
      dmgInput.dataset.entryId = id;
      dmgInput.dataset.grd = grd ?? 0;
      dmgInput.dataset.res = res ?? 0;
      dmgInput.dataset.tgh = tgh ?? 0;
      if (health !== null && health !== undefined) {
        dmgInput.dataset.health = health;
      }
      dmgCol.appendChild(dmgInput);

      const banesButton = document.createElement('button');
      banesButton.type = 'button';
      banesButton.className = 'list-banes-button';
      banesButton.textContent = 'Banes';
      banesButton.addEventListener('click', (e) => {
        e.stopPropagation();
        __currentEntryId = id;
        openBanesModal(id);
      });

      listItem.appendChild(nameCol);
      listItem.appendChild(hpCol);
      listItem.appendChild(dmgCol);
      listItem.appendChild(banesButton);

      if (health === 0) {
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.className = 'remove-button';
        removeButton.addEventListener('click', () => removeEntry(id, listItem));
        listItem.appendChild(removeButton);
      }

      rankingList.appendChild(listItem);
      __applyRowCountdownClasses(id, __getCountdownState(id));
    });
  });
}

function applyDamageToAll() {
  const inputs = document.querySelectorAll('.damage-input');
  const selectedStat = document.querySelector('input[name="globalStat"]:checked')?.value ?? 'grd';

  inputs.forEach(input => {
    if (!('health' in input.dataset)) {
      input.value = '';
      return;
    }

    const id = input.dataset.entryId;
    const currentHealth = parseInt(input.dataset.health);
    const rawDamage = parseInt(input.value);
    const statValue = parseInt(input.dataset[selectedStat]);

    if (isNaN(rawDamage) || isNaN(currentHealth) || isNaN(statValue)) {
      input.value = '';
      return;
    }

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
      const hpCol = listItem?.querySelector('.column.hp');
      if (hpCol) hpCol.textContent = `${newHealth}`;
      inputEl.dataset.health = newHealth;

      if (newHealth <= 0) {
        listItem?.classList.add('defeated');

        let removeButton = listItem?.querySelector('.remove-button');
        if (!removeButton && listItem) {
          removeButton = document.createElement('button');
          removeButton.textContent = 'Remove';
          removeButton.className = 'remove-button';
          removeButton.addEventListener('click', () => removeEntry(id, listItem));
          listItem.appendChild(removeButton);
        }
      } else {
        listItem?.classList.remove('defeated');
      }
    })
    .catch(err => console.error('Error updating health:', err));
}

function removeEntry(id, listItem) {
  const reference = ref(db, `rankings/${id}`);
  remove(reference)
    .then(() => {
      listItem?.remove();
      __countdownById.delete(id);
      __banesByEntryId.delete(id);
    })
    .catch(err => console.error('Error removing entry:', err));
}

function clearList() {
  const reference = ref(db, 'rankings/');
  set(reference, null)
    .then(() => {
      window.resetRoundCounter?.();
      __countdownById.clear();
      __banesByEntryId.clear();
    })
    .catch(err => console.error('Error clearing list:', err));
}

document.addEventListener('DOMContentLoaded', () => {
  const delBtn = document.getElementById('stat-delete');
  if (delBtn) {
    delBtn.addEventListener('click', () => {
      if (!__currentEntryId) return;
      if (!confirm('Delete this entry from the list?')) return;

      const row = __rowFor(__currentEntryId);
      removeEntry(__currentEntryId, row || undefined);
      document.getElementById('stat-modal')?.setAttribute('aria-hidden', 'true');
      __currentEntryId = null;
    });
  }

  const healBtn = document.getElementById('stat-heal');
  const healAmtInput = document.getElementById('stat-heal-amount');
  if (healBtn && healAmtInput) {
    healBtn.addEventListener('click', () => {
      if (!__currentEntryId) return;
      const amount = parseInt(healAmtInput.value, 10);
      if (isNaN(amount) || amount === 0) return;

      const dmgInput = document.querySelector(`.damage-input[data-entry-id="${__currentEntryId}"]`);
      if (!dmgInput || !('health' in dmgInput.dataset)) {
        alert('This entry has no HP set yet.');
        return;
      }

      const current = parseInt(dmgInput.dataset.health, 10) || 0;
      const newHealth = Math.max(current + amount, 0);
      updateHealth(__currentEntryId, newHealth, dmgInput);
      healAmtInput.value = '';
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const setBtn = document.getElementById('hp-set-button');
  const hpInput = document.getElementById('hp-set-amount');

  if (setBtn && hpInput) {
    setBtn.addEventListener('click', () => {
      if (!__currentEntryId) return;
      const amount = parseInt(hpInput.value, 10);
      if (isNaN(amount) || amount < 0) return;

      const dmgInput = document.querySelector(`.damage-input[data-entry-id="${__currentEntryId}"]`);
      if (!dmgInput) return;

      updateHealth(__currentEntryId, amount, dmgInput);
      hpInput.value = '';
      closeHpModal();
    });

    hpInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        setBtn.click();
      }
    });
  }
});

function setCountdown(id, turns) {
  const reference = ref(db, `rankings/${id}`);
  __setCountdownState(id, { remaining: turns, active: true, ended: false });
  __applyRowCountdownClasses(id, __getCountdownState(id));

  return update(reference, {
    countdownActive: true,
    countdownRemaining: turns,
    countdownEnded: false
  });
}

function clearCountdown(id) {
  const reference = ref(db, `rankings/${id}`);
  __setCountdownState(id, { remaining: null, active: false, ended: false });
  __applyRowCountdownClasses(id, __getCountdownState(id));

  return update(reference, {
    countdownActive: null,
    countdownRemaining: null,
    countdownEnded: null
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const setBtn = document.getElementById('stat-countdown-set');
  const clearBtn = document.getElementById('stat-countdown-clear');
  const amtInput = document.getElementById('stat-countdown-amount');

  if (setBtn && amtInput) {
    setBtn.addEventListener('click', async () => {
      if (!__currentEntryId) return;
      const turns = parseInt(amtInput.value, 10);
      if (isNaN(turns) || turns <= 0) return;

      try {
        await setCountdown(__currentEntryId, turns);
        amtInput.value = '';
      } catch (err) {
        console.error('Error setting countdown:', err);
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      if (!__currentEntryId) return;
      try {
        await clearCountdown(__currentEntryId);
      } catch (err) {
        console.error('Error clearing countdown:', err);
      }
    });
  }
});

async function __decrementCountdownIfNeeded(entryId) {
  const state = __getCountdownState(entryId);
  if (!state.active) return;
  if (typeof state.remaining !== 'number') return;
  if (state.remaining <= 0) return;

  const nextRemaining = state.remaining - 1;
  const reference = ref(db, `rankings/${entryId}`);

  if (nextRemaining <= 0) {
    __setCountdownState(entryId, { remaining: 0, active: false, ended: true });
    __applyRowCountdownClasses(entryId, __getCountdownState(entryId));

    await update(reference, {
      countdownRemaining: 0,
      countdownActive: false,
      countdownEnded: true
    });
    return;
  }

  __setCountdownState(entryId, { remaining: nextRemaining, active: true, ended: false });
  __applyRowCountdownClasses(entryId, __getCountdownState(entryId));

  await update(reference, {
    countdownRemaining: nextRemaining,
    countdownActive: true,
    countdownEnded: false
  });
}

async function __cleanupEndedCountdownIfNeeded(entryId) {
  if (!entryId) return;
  const state = __getCountdownState(entryId);
  if (!state.ended) return;
  try {
    await clearCountdown(entryId);
  } catch (err) {
    console.error('Error cleaning up ended countdown:', err);
  }
}

window.addEventListener('tracker:highlightChange', async (e) => {
  const previousId = e?.detail?.previousId ?? null;
  const currentId = e?.detail?.currentId ?? null;
  const reason = e?.detail?.reason ?? 'sync';

  if ((reason === 'next' || reason === 'prev') && previousId && previousId !== currentId) {
    await __cleanupEndedCountdownIfNeeded(previousId);
    const prevRow = __rowFor(previousId);
    if (prevRow) prevRow.classList.remove('countdown-expired');
  }

  if (currentId && (reason === 'next' || reason === 'prev')) {
    try {
      await __decrementCountdownIfNeeded(currentId);
    } catch (err) {
      console.error('Error decrementing countdown:', err);
    }
  }

  if (currentId) {
    const currentState = __getCountdownState(currentId);
    const row = __rowFor(currentId);
    if (row) {
      if (currentState.ended) row.classList.add('countdown-expired');
      else row.classList.remove('countdown-expired');
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  fetchRankings();
  document.getElementById('apply-damage-button')?.addEventListener('click', applyDamageToAll);
  document.getElementById('clear-list-button')?.addEventListener('click', clearList);
});
