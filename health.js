import { getDatabase, ref, update, onValue, remove, set } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";
import { BANES } from "./banes.js";

const db = getDatabase();
const __countdownById = new Map();
const __banesById = new Map();
let __currentEntryId = null;

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

function __getEntryBanes(id) {
  return __banesById.get(id) || [];
}

function __setEntryBanes(id, banes) {
  __banesById.set(id, Array.isArray(banes) ? banes : []);
}

function __rowFor(id) {
  return document.querySelector(`.list-item[data-entry-id="${id}"]`);
}

function __injectBaneStyles() {
  if (document.getElementById('bane-inline-styles')) return;
  const style = document.createElement('style');
  style.id = 'bane-inline-styles';
  style.textContent = `
    .name-main { display:block; }
    .name-banes { display:flex; flex-wrap:wrap; gap:6px; margin-top:6px; }
    .bane-chip {
      display:inline-flex; align-items:center; gap:6px; padding:2px 6px;
      border:1px solid #2d3d73; border-radius:999px; background:rgba(0,0,0,0.25);
      font-size:12px; line-height:1.2; cursor:pointer;
    }
    .bane-chip img, .bane-row__icon {
      width:18px; height:18px; object-fit:contain; border-radius:4px; flex:0 0 18px;
    }
    .bane-button-row { display:flex; gap:8px; margin-top:12px; flex-wrap:wrap; }
    .ol-bane-list { display:flex; flex-direction:column; gap:8px; margin-top:12px; max-height:60vh; overflow:auto; }
    .bane-row {
      display:flex; align-items:center; justify-content:space-between; gap:10px;
      padding:8px; border:1px solid #1a3b4a; border-radius:8px; background:rgba(0,0,0,0.18);
    }
    .bane-row__left { display:flex; align-items:center; gap:10px; min-width:0; }
    .bane-row__name { color:#e3cf95; white-space:normal; word-break:break-word; }
    .list-banes-button { margin-left:8px; padding:4px 8px; font-size:0.85em; }
  `;
  document.head.appendChild(style);
}

function __ensureBaneModals() {
  __injectBaneStyles();

  const statDialog = document.querySelector('#stat-modal .ol-modal__dialog');
  if (statDialog && !document.getElementById('stat-bane-button')) {
    const row = document.createElement('div');
    row.className = 'bane-button-row';

    const addBtn = document.createElement('button');
    addBtn.id = 'stat-bane-button';
    addBtn.textContent = 'Bane';
    addBtn.type = 'button';
    addBtn.addEventListener('click', () => {
      if (!__currentEntryId) return;
      openBanePickerModal(__currentEntryId);
    });

    const viewBtn = document.createElement('button');
    viewBtn.id = 'stat-view-banes-button';
    viewBtn.textContent = 'View Banes';
    viewBtn.type = 'button';
    viewBtn.addEventListener('click', () => {
      if (!__currentEntryId) return;
      openEntryBanesModal(__currentEntryId);
    });

    row.appendChild(addBtn);
    row.appendChild(viewBtn);

    const deleteBtn = document.getElementById('stat-delete');
    if (deleteBtn) statDialog.insertBefore(row, deleteBtn);
    else statDialog.appendChild(row);
  }

  if (!document.getElementById('bane-picker-modal')) {
    const picker = document.createElement('div');
    picker.id = 'bane-picker-modal';
    picker.className = 'ol-modal';
    picker.setAttribute('aria-hidden', 'true');
    picker.innerHTML = `
      <div class="ol-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="bane-picker-title">
        <button class="ol-modal__close" id="bane-picker-close" aria-label="Close">×</button>
        <h3 id="bane-picker-title">Choose a Bane</h3>
        <div id="bane-picker-list" class="ol-bane-list"></div>
      </div>
    `;
    document.body.appendChild(picker);
    document.getElementById('bane-picker-close')?.addEventListener('click', closeBanePickerModal);
    picker.addEventListener('click', (e) => { if (e.target === picker) closeBanePickerModal(); });
  }

  if (!document.getElementById('entry-banes-modal')) {
    const viewer = document.createElement('div');
    viewer.id = 'entry-banes-modal';
    viewer.className = 'ol-modal';
    viewer.setAttribute('aria-hidden', 'true');
    viewer.innerHTML = `
      <div class="ol-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="entry-banes-title">
        <button class="ol-modal__close" id="entry-banes-close" aria-label="Close">×</button>
        <h3 id="entry-banes-title">Banes</h3>
        <div id="entry-banes-list" class="ol-bane-list"></div>
      </div>
    `;
    document.body.appendChild(viewer);
    document.getElementById('entry-banes-close')?.addEventListener('click', closeEntryBanesModal);
    viewer.addEventListener('click', (e) => { if (e.target === viewer) closeEntryBanesModal(); });
  }
}

function openStatModal({ name, grd, res, tgh, url, initiative, countdownRemaining, countdownActive, countdownEnded }) {
  const modal = document.getElementById('stat-modal');
  if (!modal) return;

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
  document.getElementById('stat-modal')?.setAttribute('aria-hidden', 'true');
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
  document.getElementById('hp-modal')?.setAttribute('aria-hidden', 'true');
}

function openBanePickerModal(entryId) {
  const modal = document.getElementById('bane-picker-modal');
  const list = document.getElementById('bane-picker-list');
  if (!modal || !list) return;

  list.innerHTML = '';
  const activeNames = new Set(__getEntryBanes(entryId).map(b => b.name));

  BANES.forEach((bane) => {
    const row = document.createElement('div');
    row.className = 'bane-row';

    const left = document.createElement('div');
    left.className = 'bane-row__left';

    const icon = document.createElement('img');
    icon.className = 'bane-row__icon';
    icon.src = bane.icon || 'icons/banes/test.png';
    icon.alt = '';

    const name = document.createElement('div');
    name.className = 'bane-row__name';
    name.textContent = bane.name;

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.textContent = activeNames.has(bane.name) ? 'Added' : 'Add';
    addBtn.disabled = activeNames.has(bane.name);
    addBtn.addEventListener('click', async () => {
      await addBaneToEntry(entryId, bane);
      openBanePickerModal(entryId);
    });

    left.appendChild(icon);
    left.appendChild(name);
    row.appendChild(left);
    row.appendChild(addBtn);
    list.appendChild(row);
  });

  modal.setAttribute('aria-hidden', 'false');
}

function closeBanePickerModal() {
  document.getElementById('bane-picker-modal')?.setAttribute('aria-hidden', 'true');
}

function openEntryBanesModal(entryId) {
  const modal = document.getElementById('entry-banes-modal');
  const list = document.getElementById('entry-banes-list');
  if (!modal || !list) return;

  const entryName = __rowFor(entryId)?.querySelector('.name-main')?.textContent || 'Banes';
  const title = document.getElementById('entry-banes-title');
  if (title) title.textContent = `${entryName} — Banes`;

  list.innerHTML = '';
  const banes = __getEntryBanes(entryId);

  if (!banes.length) {
    const empty = document.createElement('div');
    empty.className = 'bane-row';
    empty.textContent = 'No banes added yet.';
    list.appendChild(empty);
  } else {
    banes.forEach((bane) => {
      const row = document.createElement('div');
      row.className = 'bane-row';
      row.style.cursor = 'pointer';
      row.addEventListener('click', () => {
        if (bane.url) window.open(bane.url, '_blank', 'noopener');
      });

      const left = document.createElement('div');
      left.className = 'bane-row__left';

      const icon = document.createElement('img');
      icon.className = 'bane-row__icon';
      icon.src = bane.icon || 'icons/banes/test.png';
      icon.alt = '';

      const name = document.createElement('div');
      name.className = 'bane-row__name';
      name.textContent = bane.name;

      left.appendChild(icon);
      left.appendChild(name);
      row.appendChild(left);
      list.appendChild(row);
    });
  }

  modal.setAttribute('aria-hidden', 'false');
}

function closeEntryBanesModal() {
  document.getElementById('entry-banes-modal')?.setAttribute('aria-hidden', 'true');
}

async function addBaneToEntry(entryId, bane) {
  const current = __getEntryBanes(entryId);
  if (current.some(item => item.name === bane.name)) return;
  const updatedBanes = [...current, bane];
  __setEntryBanes(entryId, updatedBanes);
  __renderRowBanes(entryId, updatedBanes);
  await update(ref(db, `rankings/${entryId}`), { banes: updatedBanes });
}

function __renderRowBanes(entryId, banes) {
  const row = __rowFor(entryId);
  if (!row) return;

  const nameCol = row.querySelector('.column.name');
  if (!nameCol) return;

  let wrap = nameCol.querySelector('.name-banes');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'name-banes';
    nameCol.appendChild(wrap);
  }
  wrap.innerHTML = '';

  banes.forEach((bane) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'bane-chip';
    chip.title = bane.name;
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      if (bane.url) window.open(bane.url, '_blank', 'noopener');
    });

    const icon = document.createElement('img');
    icon.src = bane.icon || 'icons/banes/test.png';
    icon.alt = '';

    const label = document.createElement('span');
    label.textContent = bane.name;

    chip.appendChild(icon);
    chip.appendChild(label);
    wrap.appendChild(chip);
  });

  let listBtn = row.querySelector('.list-banes-button');
  if (!banes.length) {
    wrap.remove();
    listBtn?.remove();
    return;
  }

  if (!listBtn) {
    listBtn = document.createElement('button');
    listBtn.type = 'button';
    listBtn.className = 'remove-button list-banes-button';
    listBtn.textContent = 'Banes';
    listBtn.addEventListener('click', () => openEntryBanesModal(entryId));
    row.appendChild(listBtn);
  }
}

function __updateCountdownBadge(row, state) {
  if (!row) return;
  const nameCol = row.querySelector('.column.name');
  if (!nameCol) return;

  let badge = nameCol.querySelector('.countdown-badge');

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
    nameCol.appendChild(badge);
  }

  if (state.ended) badge.textContent = `CD: ENDED`;
  else badge.textContent = `CD: ${state.remaining}`;
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
    __banesById.clear();
    if (!data) return;

    const rankings = Object.entries(data).map(([id, entry]) => ({ id, ...entry }));
    rankings.sort((a, b) => b.number - a.number);

    rankings.forEach(({ id, name, grd, res, tgh, health, url, number, countdownRemaining, countdownActive, countdownEnded, banes }) => {
      __setCountdownState(id, {
        remaining: (typeof countdownRemaining === 'number') ? countdownRemaining : null,
        active: !!countdownActive,
        ended: !!countdownEnded
      });
      __setEntryBanes(id, banes);

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
        const s = __getCountdownState(id);
        openStatModal({
          name, grd, res, tgh, url, initiative: number,
          countdownRemaining: s.remaining,
          countdownActive: s.active,
          countdownEnded: s.ended
        });
      });

      const nameMain = document.createElement('div');
      nameMain.className = 'name-main';
      nameMain.textContent = name ?? 'Unknown';
      nameCol.appendChild(nameMain);

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
      __renderRowBanes(id, __getEntryBanes(id));
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

        let removeButton = listItem?.querySelector('.remove-button:not(.list-banes-button)');
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
      __banesById.delete(id);
    })
    .catch(err => console.error('Error removing entry:', err));
}

function clearList() {
  const reference = ref(db, 'rankings/');
  set(reference, null)
    .then(() => {
      window.resetRoundCounter?.();
      __countdownById.clear();
      __banesById.clear();
    })
    .catch(err => console.error('Error clearing list:', err));
}

document.addEventListener('DOMContentLoaded', () => {
  __ensureBaneModals();

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

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (document.getElementById('entry-banes-modal')?.getAttribute('aria-hidden') === 'false') return closeEntryBanesModal();
    if (document.getElementById('bane-picker-modal')?.getAttribute('aria-hidden') === 'false') return closeBanePickerModal();
    if (document.getElementById('hp-modal')?.getAttribute('aria-hidden') === 'false') return closeHpModal();
    if (document.getElementById('stat-modal')?.getAttribute('aria-hidden') === 'false') return closeStatModal();
  });

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

  const countdownSetBtn = document.getElementById('stat-countdown-set');
  const countdownClearBtn = document.getElementById('stat-countdown-clear');
  const amtInput = document.getElementById('stat-countdown-amount');

  if (countdownSetBtn && amtInput) {
    countdownSetBtn.addEventListener('click', async () => {
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

  if (countdownClearBtn) {
    countdownClearBtn.addEventListener('click', async () => {
      if (!__currentEntryId) return;
      try {
        await clearCountdown(__currentEntryId);
      } catch (err) {
        console.error('Error clearing countdown:', err);
      }
    });
  }

  fetchRankings();
  document.getElementById('apply-damage-button')?.addEventListener('click', applyDamageToAll);
  document.getElementById('clear-list-button')?.addEventListener('click', clearList);
});

function setCountdown(id, turns) {
  const reference = ref(db, `rankings/${id}`);
  __setCountdownState(id, { remaining: turns, active: true, ended: false });
  __applyRowCountdownClasses(id, __getCountdownState(id));
  return update(reference, { countdownActive: true, countdownRemaining: turns, countdownEnded: false });
}

function clearCountdown(id) {
  const reference = ref(db, `rankings/${id}`);
  __setCountdownState(id, { remaining: null, active: false, ended: false });
  __applyRowCountdownClasses(id, __getCountdownState(id));
  return update(reference, { countdownActive: null, countdownRemaining: null, countdownEnded: null });
}

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
    await update(reference, { countdownRemaining: 0, countdownActive: false, countdownEnded: true });
    return;
  }

  __setCountdownState(entryId, { remaining: nextRemaining, active: true, ended: false });
  __applyRowCountdownClasses(entryId, __getCountdownState(entryId));
  await update(reference, { countdownRemaining: nextRemaining, countdownActive: true, countdownEnded: false });
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
