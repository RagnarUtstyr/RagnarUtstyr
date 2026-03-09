import { getDatabase, ref, update, onValue, remove, set } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";
import { BANES } from "./banes.js";

const db = getDatabase();

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

  ensureStatBaneButton();
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

const __countdownById = new Map();
const __entryDataById = new Map();
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
function __rowFor(id) {
  return document.querySelector(`.list-item[data-entry-id="${id}"]`);
}
function __getEntryData(id) {
  return __entryDataById.get(id) || null;
}

function ensureBaneStyles() {
  if (document.getElementById('bane-inline-styles')) return;
  const style = document.createElement('style');
  style.id = 'bane-inline-styles';
  style.textContent = `
    .name-block { display:flex; flex-direction:column; gap:6px; min-width:0; }
    .name-main { font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .bane-chip-row { display:flex; flex-wrap:wrap; gap:6px; }
    .bane-chip { display:inline-flex; align-items:center; gap:6px; padding:2px 6px; border:1px solid #2d3d73; border-radius:999px; background:rgba(11,38,33,0.65); font-size:0.82em; line-height:1.2; }
    .bane-chip img { width:16px; height:16px; object-fit:contain; }
    .bane-row-button { padding:6px 10px; white-space:nowrap; }
    .bane-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.72); display:flex; align-items:center; justify-content:center; z-index:9999; }
    .bane-dialog { width:min(92vw, 520px); max-height:80vh; overflow:auto; background:rgba(31,29,26,0.98); border:1px solid #2d3d73; border-radius:10px; box-shadow:0 0 20px #000; padding:18px; color:#bdb382; }
    .bane-dialog h3 { margin:0 0 12px; color:#e3cf95; }
    .bane-dialog-header { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:12px; }
    .bane-close { font-size:24px; line-height:1; background:transparent; border:none; color:#e3cf95; padding:0 4px; }
    .bane-list { display:flex; flex-direction:column; gap:8px; }
    .bane-item { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:8px 10px; border:1px solid #2d3d73; border-radius:8px; background:rgba(11,38,33,0.55); }
    .bane-item-left { display:flex; align-items:center; gap:10px; min-width:0; }
    .bane-item-left img { width:24px; height:24px; object-fit:contain; flex:0 0 auto; }
    .bane-link-button { background:none; border:none; color:#e3cf95; padding:0; text-align:left; font:inherit; cursor:pointer; }
    .bane-link-button:hover { text-decoration:underline; color:#fff; }
    .column.name { display:flex; align-items:center; }
  `;
  document.head.appendChild(style);
}

function sanitizeBanes(rawBanes) {
  if (!rawBanes) return [];
  const values = Array.isArray(rawBanes) ? rawBanes : Object.values(rawBanes);
  const cleaned = values
    .filter(Boolean)
    .map(b => ({ name: b.name, url: b.url, icon: b.icon || 'icons/banes/test.png' }))
    .filter(b => b.name && b.url);
  const seen = new Set();
  return cleaned.filter(b => {
    const key = `${b.name}|${b.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function writeBanes(id, banes) {
  return update(ref(db, `rankings/${id}`), { banes });
}

async function addBaneToEntry(id, bane) {
  const entry = __getEntryData(id);
  const current = sanitizeBanes(entry?.banes);
  if (current.some(b => b.name === bane.name && b.url === bane.url)) return;
  const next = [...current, { name: bane.name, url: bane.url, icon: bane.icon || 'icons/banes/test.png' }];
  await writeBanes(id, next);
}

function closeBaneModal() {
  document.getElementById('bane-overlay-root')?.remove();
}

function createBaneOverlay(titleText) {
  closeBaneModal();
  const overlay = document.createElement('div');
  overlay.id = 'bane-overlay-root';
  overlay.className = 'bane-overlay';

  const dialog = document.createElement('div');
  dialog.className = 'bane-dialog';

  const header = document.createElement('div');
  header.className = 'bane-dialog-header';

  const title = document.createElement('h3');
  title.textContent = titleText;

  const close = document.createElement('button');
  close.className = 'bane-close';
  close.type = 'button';
  close.textContent = '×';
  close.addEventListener('click', closeBaneModal);

  header.appendChild(title);
  header.appendChild(close);
  dialog.appendChild(header);

  const list = document.createElement('div');
  list.className = 'bane-list';
  dialog.appendChild(list);

  overlay.appendChild(dialog);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeBaneModal();
  });
  document.body.appendChild(overlay);

  return list;
}

function openAddBanePopup(entryId) {
  const entry = __getEntryData(entryId);
  const current = sanitizeBanes(entry?.banes);
  const list = createBaneOverlay(`Add Bane${entry?.name ? `: ${entry.name}` : ''}`);

  BANES.forEach((bane) => {
    const row = document.createElement('div');
    row.className = 'bane-item';

    const left = document.createElement('div');
    left.className = 'bane-item-left';

    const icon = document.createElement('img');
    icon.src = bane.icon || 'icons/banes/test.png';
    icon.alt = '';

    const name = document.createElement('div');
    name.textContent = bane.name;

    left.appendChild(icon);
    left.appendChild(name);

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.textContent = current.some(b => b.name === bane.name && b.url === bane.url) ? 'Added' : 'Add';
    addButton.disabled = addButton.textContent === 'Added';
    addButton.addEventListener('click', async () => {
      try {
        await addBaneToEntry(entryId, bane);
        addButton.textContent = 'Added';
        addButton.disabled = true;
      } catch (err) {
        console.error('Error adding bane:', err);
      }
    });

    row.appendChild(left);
    row.appendChild(addButton);
    list.appendChild(row);
  });
}

function openViewBanesPopup(entryId) {
  const entry = __getEntryData(entryId);
  const banes = sanitizeBanes(entry?.banes);
  const list = createBaneOverlay(`Banes${entry?.name ? `: ${entry.name}` : ''}`);

  if (!banes.length) {
    const empty = document.createElement('div');
    empty.textContent = 'No banes added.';
    list.appendChild(empty);
    return;
  }

  banes.forEach((bane) => {
    const row = document.createElement('div');
    row.className = 'bane-item';

    const left = document.createElement('div');
    left.className = 'bane-item-left';

    const icon = document.createElement('img');
    icon.src = bane.icon || 'icons/banes/test.png';
    icon.alt = '';

    const linkButton = document.createElement('button');
    linkButton.type = 'button';
    linkButton.className = 'bane-link-button';
    linkButton.textContent = bane.name;
    linkButton.addEventListener('click', () => {
      if (bane.url) window.open(bane.url, '_blank', 'noopener');
    });

    left.appendChild(icon);
    left.appendChild(linkButton);
    row.appendChild(left);
    list.appendChild(row);
  });
}

function ensureStatBaneButton() {
  const modal = document.querySelector('#stat-modal .ol-modal__dialog');
  if (!modal || document.getElementById('stat-bane-button')) return;

  const btn = document.createElement('button');
  btn.id = 'stat-bane-button';
  btn.type = 'button';
  btn.textContent = 'Bane';
  btn.style.marginTop = '12px';
  btn.addEventListener('click', () => {
    if (!__currentEntryId) return;
    openAddBanePopup(__currentEntryId);
  });

  const deleteBtn = document.getElementById('stat-delete');
  if (deleteBtn) modal.insertBefore(btn, deleteBtn);
  else modal.appendChild(btn);
}

function __updateCountdownBadge(row, state) {
  if (!row) return;
  const nameCol = row.querySelector('.column.name');
  if (!nameCol) return;

  let badge = nameCol.querySelector('.countdown-badge');
  const hasSomething = (state.active && typeof state.remaining === 'number' && state.remaining > 0) || state.ended;

  if (!hasSomething) {
    badge?.remove();
    return;
  }

  if (!badge) {
    badge = document.createElement('span');
    badge.className = 'countdown-badge';
    const main = nameCol.querySelector('.name-main') || nameCol;
    main.appendChild(badge);
  }

  badge.textContent = state.ended ? ` CD: ENDED` : ` CD: ${state.remaining}`;
}

function __applyRowCountdownClasses(entryId, state) {
  const row = __rowFor(entryId);
  if (!row) return;

  if (state.active && typeof state.remaining === 'number' && state.remaining > 0) row.classList.add('countdown-active');
  else row.classList.remove('countdown-active');

  if (!state.ended) row.classList.remove('countdown-expired');
  __updateCountdownBadge(row, state);
}

function renderBaneChips(container, banes) {
  const safeBanes = sanitizeBanes(banes);
  if (!safeBanes.length) return;

  const row = document.createElement('div');
  row.className = 'bane-chip-row';
  safeBanes.forEach((bane) => {
    const chip = document.createElement('div');
    chip.className = 'bane-chip';

    const icon = document.createElement('img');
    icon.src = bane.icon || 'icons/banes/test.png';
    icon.alt = '';

    const label = document.createElement('span');
    label.textContent = bane.name;

    chip.appendChild(icon);
    chip.appendChild(label);
    row.appendChild(chip);
  });
  container.appendChild(row);
}

function fetchRankings() {
  const reference = ref(db, 'rankings/');
  onValue(reference, (snapshot) => {
    const data = snapshot.val();
    const rankingList = document.querySelector('.ranking-body');
    if (!rankingList) return;
    rankingList.innerHTML = '';

    __countdownById.clear();
    __entryDataById.clear();
    if (!data) return;

    const rankings = Object.entries(data).map(([id, entry]) => ({ id, ...entry }));
    rankings.sort((a, b) => b.number - a.number);

    rankings.forEach(({ id, name, grd, res, tgh, health, url, number, countdownRemaining, countdownActive, countdownEnded, banes }) => {
      __setCountdownState(id, {
        remaining: (typeof countdownRemaining === 'number') ? countdownRemaining : null,
        active: !!countdownActive,
        ended: !!countdownEnded
      });
      __entryDataById.set(id, { id, name, grd, res, tgh, health, url, number, banes: sanitizeBanes(banes) });

      const listItem = document.createElement('li');
      listItem.className = 'list-item';
      listItem.dataset.entryId = id;
      if (health === 0) listItem.classList.add('defeated');

      const nameCol = document.createElement('div');
      nameCol.className = 'column name';
      nameCol.style.cursor = 'pointer';
      nameCol.title = 'Show defenses (GRD / RES / TGH)';

      const nameBlock = document.createElement('div');
      nameBlock.className = 'name-block';
      const nameMain = document.createElement('div');
      nameMain.className = 'name-main';
      nameMain.textContent = name ?? 'Unknown';
      nameBlock.appendChild(nameMain);
      renderBaneChips(nameBlock, banes);
      nameCol.appendChild(nameBlock);

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

      const hpCol = document.createElement('div');
      hpCol.className = 'column hp';
      hpCol.textContent = (health === null || health === undefined) ? 'N/A' : `${health}`;
      hpCol.style.cursor = 'pointer';
      hpCol.title = 'Set HP';
      hpCol.addEventListener('click', () => {
        __currentEntryId = id;
        openHpModal(health);
      });

      const banesButton = document.createElement('button');
      banesButton.type = 'button';
      banesButton.className = 'bane-row-button';
      banesButton.textContent = 'Banes';
      banesButton.style.visibility = sanitizeBanes(banes).length ? 'visible' : 'hidden';
      banesButton.addEventListener('click', () => {
        __currentEntryId = id;
        openViewBanesPopup(id);
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
      if (health !== null && health !== undefined) dmgInput.dataset.health = health;
      dmgCol.appendChild(dmgInput);

      listItem.appendChild(nameCol);
      listItem.appendChild(hpCol);
      listItem.appendChild(banesButton);
      listItem.appendChild(dmgCol);

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
    const currentHealth = parseInt(input.dataset.health, 10);
    const rawDamage = parseInt(input.value, 10);
    const statValue = parseInt(input.dataset[selectedStat], 10);

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
      __entryDataById.delete(id);
    })
    .catch(err => console.error('Error removing entry:', err));
}

function clearList() {
  const reference = ref(db, 'rankings/');
  set(reference, null)
    .then(() => {
      window.resetRoundCounter?.();
      __countdownById.clear();
      __entryDataById.clear();
    })
    .catch(err => console.error('Error clearing list:', err));
}

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
  if (!state.active || typeof state.remaining !== 'number' || state.remaining <= 0) return;
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
  try { await clearCountdown(entryId); } catch (err) { console.error('Error cleaning up ended countdown:', err); }
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
    try { await __decrementCountdownIfNeeded(currentId); } catch (err) { console.error('Error decrementing countdown:', err); }
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
  ensureBaneStyles();

  const modal = document.getElementById('stat-modal');
  if (modal) {
    document.getElementById('stat-modal-close')?.addEventListener('click', closeStatModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeStatModal(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') closeStatModal();
    });
  }

  const hpModal = document.getElementById('hp-modal');
  if (hpModal) {
    document.getElementById('hp-modal-close')?.addEventListener('click', closeHpModal);
    hpModal.addEventListener('click', (e) => { if (e.target === hpModal) closeHpModal(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && hpModal.getAttribute('aria-hidden') === 'false') closeHpModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeBaneModal();
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

  const setHpBtn = document.getElementById('hp-set-button');
  const hpInput = document.getElementById('hp-set-amount');
  if (setHpBtn && hpInput) {
    setHpBtn.addEventListener('click', () => {
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
        setHpBtn.click();
      }
    });
  }

  const setCdBtn = document.getElementById('stat-countdown-set');
  const clearCdBtn = document.getElementById('stat-countdown-clear');
  const amtInput = document.getElementById('stat-countdown-amount');
  if (setCdBtn && amtInput) {
    setCdBtn.addEventListener('click', async () => {
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
  if (clearCdBtn) {
    clearCdBtn.addEventListener('click', async () => {
      if (!__currentEntryId) return;
      try { await clearCountdown(__currentEntryId); } catch (err) { console.error('Error clearing countdown:', err); }
    });
  }

  fetchRankings();
  document.getElementById('apply-damage-button')?.addEventListener('click', applyDamageToAll);
  document.getElementById('clear-list-button')?.addEventListener('click', clearList);
});
