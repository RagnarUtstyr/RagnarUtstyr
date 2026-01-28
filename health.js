import { getDatabase, ref, update, onValue, remove, set } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

const db = getDatabase();

/* -------------------------- Modal helpers -------------------------- */
function openStatModal({ name, grd, res, tgh, url, initiative, countdownRemaining, countdownActive, countdownEnded }) {
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

  /* ===================== Countdown modal binding ===================== */
  const remainingEl = document.getElementById('stat-countdown-remaining');
  const inputEl = document.getElementById('stat-countdown-amount');
  if (remainingEl) {
    if (countdownEnded) {
      remainingEl.textContent = 'ENDED (0)';
    } else if (countdownActive) {
      remainingEl.textContent = `${countdownRemaining ?? '—'}`;
    } else if (countdownRemaining === 0) {
      remainingEl.textContent = '0';
    } else {
      remainingEl.textContent = '—';
    }
  }
  if (inputEl) inputEl.value = '';
  /* =================== /Countdown modal binding =================== */

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

/* ===================== Countdown state cache ===================== */
/**
 * We keep the latest countdown fields for each entry here so we can decrement
 * when "tracker:highlightChange" fires.
 */
const __countdownById = new Map(); // id -> { remaining, active, ended }
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
/* =================== /Countdown state cache =================== */

/* ===================== ADDED: Row/UI helpers for countdown ===================== */
function __rowFor(id) {
  return document.querySelector(`.list-item[data-entry-id="${id}"]`);
}

function __updateCountdownBadge(row, state) {
  if (!row) return;
  const nameCol = row.querySelector('.column.name');
  if (!nameCol) return;

  let badge = nameCol.querySelector('.countdown-badge');

  // If no countdown at all, remove badge
  const hasSomething =
    (state.active && typeof state.remaining === 'number' && state.remaining > 0) ||
    state.ended;

  if (!hasSomething) {
    badge?.remove();
    return;
  }

  // Ensure badge exists
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

  // Green while active
  if (state.active && typeof state.remaining === 'number' && state.remaining > 0) {
    row.classList.add('countdown-active');
  } else {
    row.classList.remove('countdown-active');
  }

  // Orange style toggled when highlighted (handled in tracker listener)
  if (!state.ended) {
    row.classList.remove('countdown-expired');
  }

  __updateCountdownBadge(row, state);
}
/* =================== /ADDED: Row/UI helpers for countdown =================== */

/* --------------------- Initiative list rendering -------------------- */
function fetchRankings() {
  const reference = ref(db, 'rankings/');
  onValue(reference, (snapshot) => {
    const data = snapshot.val();
    const rankingList = document.querySelector('.ranking-body'); // <ul id="rankingList" class="ranking-body">
    if (!rankingList) return;
    rankingList.innerHTML = '';

    // Keep countdown cache fresh each render pass
    __countdownById.clear();

    if (!data) return;

    // Spread entry properly
    const rankings = Object.entries(data).map(([id, entry]) => ({ id, ...entry }));
    rankings.sort((a, b) => b.number - a.number);

    rankings.forEach(({ id, name, grd, res, tgh, health, url, number, countdownRemaining, countdownActive, countdownEnded }) => {
      // Cache countdown for tracker events
      __setCountdownState(id, {
        remaining: (typeof countdownRemaining === 'number') ? countdownRemaining : null,
        active: !!countdownActive,
        ended: !!countdownEnded
      });

      const listItem = document.createElement('li');
      listItem.className = 'list-item';
      listItem.dataset.entryId = id; // keep id on the row

      // Mark defeated ONLY if health is explicitly 0
      if (health === 0) listItem.classList.add('defeated');

      // Apply countdown classes from state
      __applyRowCountdownClasses(id, __getCountdownState(id));

      // Name (click to open modal with Initiative + GRD/RES/TGH)
      const nameCol = document.createElement('div');
      nameCol.className = 'column name';
      nameCol.textContent = name ?? 'Unknown';
      nameCol.style.cursor = 'pointer';
      nameCol.title = 'Show defenses (GRD / RES / TGH)';
      nameCol.addEventListener('click', () => {
        __currentEntryId = id; // remember target for modal actions
        const s = __getCountdownState(id);
        openStatModal({
          name, grd, res, tgh, url, initiative: number,
          countdownRemaining: s.remaining,
          countdownActive: s.active,
          countdownEnded: s.ended
        });
      });

      // HP column
      const hpCol = document.createElement('div');
      hpCol.className = 'column hp';
      hpCol.textContent = (health === null || health === undefined) ? 'N/A' : `${health}`;

      // Damage input
      const dmgCol = document.createElement('div');
      dmgCol.className = 'column dmg';
      const dmgInput = document.createElement('input');
      dmgInput.type = 'number';
      dmgInput.placeholder = 'DMG';
      dmgInput.className = 'damage-input';
      dmgInput.dataset.entryId = id;

      // Store stats for damage calc
      dmgInput.dataset.grd = grd ?? 0;
      dmgInput.dataset.res = res ?? 0;
      dmgInput.dataset.tgh = tgh ?? 0;

      // Only set dataset.health if health is actually provided
      if (health !== null && health !== undefined) {
        dmgInput.dataset.health = health;
      }

      dmgCol.appendChild(dmgInput);

      listItem.appendChild(nameCol);
      listItem.appendChild(hpCol);
      listItem.appendChild(dmgCol);

      // Remove button ONLY if health is explicitly 0 (not N/A)
      if (health === 0) {
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.className = 'remove-button';
        removeButton.addEventListener('click', () => removeEntry(id, listItem));
        listItem.appendChild(removeButton);
      }

      rankingList.appendChild(listItem);

      // If there is a badge needed, add it now (after nameCol exists)
      __updateCountdownBadge(listItem, __getCountdownState(id));
    });
  });
}

/* ------------------------- Damage application ----------------------- */
function applyDamageToAll() {
  const inputs = document.querySelectorAll('.damage-input');
  const selectedStat = document.querySelector('input[name="globalStat"]:checked')?.value ?? 'grd';

  inputs.forEach(input => {
    // Skip entries that don't have a health value yet (players from index.html)
    if (!('health' in input.dataset)) {
      input.value = ''; // clear any typed value
      return;
    }

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
      const hpCol = listItem?.querySelector('.column.hp');
      if (hpCol) hpCol.textContent = `${newHealth}`;
      inputEl.dataset.health = newHealth;

      if (newHealth <= 0) {
        listItem?.classList.add('defeated');

        // Add remove button if missing
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

/* ---------------------------- Utilities ----------------------------- */
function removeEntry(id, listItem) {
  const reference = ref(db, `rankings/${id}`);
  remove(reference)
    .then(() => {
      listItem?.remove();
      __countdownById.delete(id);
    })
    .catch(err => console.error('Error removing entry:', err));
}

function clearList() {
  const reference = ref(db, 'rankings/');
  set(reference, null)
    .then(() => {
      window.resetRoundCounter?.();
      __countdownById.clear();
    })
    .catch(err => console.error('Error clearing list:', err));
}

/* ===================== Modal actions: Delete & Heal ===================== */
let __currentEntryId = null;

document.addEventListener('DOMContentLoaded', () => {
  // DELETE from modal
  const delBtn = document.getElementById('stat-delete');
  if (delBtn) {
    delBtn.addEventListener('click', () => {
      if (!__currentEntryId) return;
      if (!confirm('Delete this entry from the list?')) return;

      const row = __rowFor(__currentEntryId);
      removeEntry(__currentEntryId, row || undefined);

      const modal = document.getElementById('stat-modal');
      modal?.setAttribute('aria-hidden', 'true');

      __currentEntryId = null;
    });
  }

  // HEAL from modal
  const healBtn = document.getElementById('stat-heal');
  const healAmtInput = document.getElementById('stat-heal-amount');

  if (healBtn && healAmtInput) {
    healBtn.addEventListener('click', () => {
      if (!__currentEntryId) return;
      const amount = parseInt(healAmtInput.value, 10);
      if (isNaN(amount) || amount <= 0) return;

      const dmgInput = document.querySelector(`.damage-input[data-entry-id="${__currentEntryId}"]`);
      if (!dmgInput || !('health' in dmgInput.dataset)) {
        alert('This entry has no HP set yet.');
        return;
      }

      const current = parseInt(dmgInput.dataset.health, 10) || 0;
      const updated = current + amount;
      updateHealth(__currentEntryId, updated, dmgInput);

      healAmtInput.value = '';
    });
  }
});

/* ===================== Countdown helpers & modal actions ===================== */
function setCountdown(id, turns) {
  const reference = ref(db, `rankings/${id}`);

  // Optimistic local update (so it keeps working even with modal closed)
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

  // Optimistic local update
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

/* ===================== Tracker-driven countdown decrement ===================== */
/**
 * Behavior:
 * - Each time the tracker highlights an entry again, if countdownActive && remaining > 0:
 *     remaining -= 1
 *     if remaining becomes 0 -> mark countdownEnded=true, countdownActive=false
 * - When countdownEnded is true:
 *     entry shows ORANGE only when highlighted
 * - After tracker moves away from an orange-ended entry:
 *     countdown fields are cleared and row returns to normal
 */
async function __decrementCountdownIfNeeded(entryId) {
  const state = __getCountdownState(entryId);
  if (!state.active) return;
  if (typeof state.remaining !== 'number') return;
  if (state.remaining <= 0) return;

  const nextRemaining = state.remaining - 1;
  const reference = ref(db, `rankings/${entryId}`);

  // Optimistically update local cache + row immediately (THIS is what makes it keep working with modal closed)
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

  // Clear ended state when we move off it
  try {
    await clearCountdown(entryId);
  } catch (err) {
    console.error('Error cleaning up ended countdown:', err);
  }
}

// Listen to tracker highlight changes (dispatched by turn.js)
window.addEventListener('tracker:highlightChange', async (e) => {
  const previousId = e?.detail?.previousId ?? null;
  const currentId = e?.detail?.currentId ?? null;

  // If we just moved away from an ended countdown entry, clean it up
  if (previousId && previousId !== currentId) {
    await __cleanupEndedCountdownIfNeeded(previousId);

    const prevRow = __rowFor(previousId);
    if (prevRow) prevRow.classList.remove('countdown-expired');
  }

  // If the newly highlighted entry has an active countdown, decrement it
  if (currentId) {
    try {
      await __decrementCountdownIfNeeded(currentId);
    } catch (err) {
      console.error('Error decrementing countdown:', err);
    }

    // If it is ended, show orange while highlighted
    const currentState = __getCountdownState(currentId);
    const row = __rowFor(currentId);
    if (row) {
      if (currentState.ended) row.classList.add('countdown-expired');
      else row.classList.remove('countdown-expired');
    }
  }
});
/* =================== /Tracker-driven countdown decrement =================== */

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