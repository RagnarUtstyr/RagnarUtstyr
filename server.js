// Import Firebase SDK modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, set } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyD_4kINWig7n6YqB11yM2M-EuxGNz5uekI",
  authDomain: "roll202-c0b0d.firebaseapp.com",
  databaseURL: "https://roll202-c0b0d-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "roll202-c0b0d",
  storageBucket: "roll202-c0b0d.appspot.com",
  messagingSenderId: "607661730400",
  appId: "1:607661730400:web:b4b3f97a12cfae373e7105",
  measurementId: "G-6X5L39W56C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Helpers
function valOrNA(v) {
  return (v ?? v === 0) ? v : "N/A";
}
function toIntOrNull(v) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

// Submit a new entry
function submitData() {
  const nameEl   = document.getElementById('name');
  const numEl    = document.getElementById('number');
  const hpEl     = document.getElementById('health');
  const grdEl    = document.getElementById('grd');
  const resEl    = document.getElementById('res');
  const tghEl    = document.getElementById('tgh');

  const name   = (nameEl?.value || '').trim();
  const number = toIntOrNull(numEl?.value);
  const health = toIntOrNull(hpEl?.value);
  const grd    = toIntOrNull(grdEl?.value);
  const res    = toIntOrNull(resEl?.value);
  const tgh    = toIntOrNull(tghEl?.value);

  if (!name || number === null) {
    console.log('Please enter a valid name and initiative number.');
    return;
  }

  const entry = {
    name,
    number,
    health: health ?? 0,
    grd: grd ?? null,
    res: res ?? null,
    tgh: tgh ?? null
  };

  const listRef = ref(db, 'rankings/');
  push(listRef, entry).then(() => {
    if (nameEl) nameEl.value = '';
    if (numEl) numEl.value = '';
    if (hpEl) hpEl.value = '';
    if (grdEl) grdEl.value = '';
    if (resEl) resEl.value = '';
    if (tghEl) tghEl.value = '';
  }).catch(err => {
    console.error('Error pushing entry:', err);
  });
}

// Build one list item (with tooltip)
function buildListItem({ id, name, number, health, grd, res, tgh }) {
  const li = document.createElement('li');

  // Init
  const initDiv = document.createElement('div');
  initDiv.className = 'init';
  initDiv.textContent = `Init: ${valOrNA(number)}`;
  li.appendChild(initDiv);

  // Name (hover shows GRD/RES/TGH)
  const tooltip = `GRD: ${valOrNA(grd)}\nRES: ${valOrNA(res)}\nTGH: ${valOrNA(tgh)}`;

  const nameDiv = document.createElement('div');
  nameDiv.className = 'name';
  nameDiv.textContent = name;
  nameDiv.setAttribute('data-tooltip', tooltip); // styled tooltip
  nameDiv.title = tooltip;                       // native fallback
  li.appendChild(nameDiv);

  // HP
  const healthDiv = document.createElement('div');
  healthDiv.className = 'health';
  healthDiv.textContent = `HP: ${valOrNA(health)}`;
  li.appendChild(healthDiv);

  // Remove button
  const removeBtn = document.createElement('button');
  removeBtn.className = 'remove';
  removeBtn.textContent = 'Remove';
  removeBtn.addEventListener('click', () => {
    const entryRef = ref(db, `rankings/${id}`);
    remove(entryRef).catch(err => console.error('Error removing entry:', err));
  });
  li.appendChild(removeBtn);

  return li;
}

// Fetch and render list
function fetchRankings() {
  const listRef = ref(db, 'rankings/');
  onValue(listRef, (snapshot) => {
    const data = snapshot.val();
    const ul = document.getElementById('rankingList');
    if (!ul) return;

    ul.innerHTML = '';
    if (!data) return;

    const rows = Object.entries(data).map(([id, v]) => ({ id, ...v }));
    rows.sort((a, b) => (b.number ?? -Infinity) - (a.number ?? -Infinity));

    for (const row of rows) {
      ul.appendChild(buildListItem(row));
    }
  }, (err) => {
    console.error('Error reading rankings:', err);
  });
}

// Clear all entries
function clearAllEntries() {
  const listRef = ref(db, 'rankings/');
  set(listRef, null)
    .then(() => {
      const ul = document.getElementById('rankingList');
      if (ul) ul.innerHTML = '';
    })
    .catch(err => console.error('Error clearing all entries:', err));
}

// Wire up
document.addEventListener('DOMContentLoaded', () => {
  const submitBtn = document.getElementById('submit-button');
  if (submitBtn) submitBtn.addEventListener('click', submitData);

  const clearBtn = document.getElementById('clear-list-button');
  if (clearBtn) clearBtn.addEventListener('click', clearAllEntries);

  if (document.getElementById('rankingList')) {
    fetchRankings();
  }
});
