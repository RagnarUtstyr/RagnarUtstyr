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

// ---- Submit ----
async function submitData() {
  const name = document.getElementById('name')?.value?.trim();
  const numberInput = document.getElementById('initiative') || document.getElementById('number');
  const number = numberInput ? parseInt(numberInput.value, 10) : null;

  const healthInput = document.getElementById('health');
  const health = healthInput && healthInput.value !== '' ? parseInt(healthInput.value, 10) : null;

  const grdInput = document.getElementById('grd');
  const resInput = document.getElementById('res');
  const tghInput = document.getElementById('tgh');

  const grd = grdInput ? (grdInput.value !== '' ? parseInt(grdInput.value, 10) : null) : undefined;
  const res = resInput ? (resInput.value !== '' ? parseInt(resInput.value, 10) : null) : undefined;
  const tgh = tghInput ? (tghInput.value !== '' ? parseInt(tghInput.value, 10) : null) : undefined;

  if (!name || isNaN(number)) {
    console.log('Please enter a valid name and initiative number.');
    return;
  }

  try {
    const entry = { name, number };
    if (health !== null) entry.health = health;
    if (grd !== undefined) entry.grd = grd;
    if (res !== undefined) entry.res = res;
    if (tgh !== undefined) entry.tgh = tgh;

    const rankingsRef = ref(db, 'rankings/');
    const monsterRef = ref(db, 'OpenLegendMonster/');

    await push(rankingsRef, entry);
    await push(monsterRef, entry);

    // clear inputs
    document.getElementById('name').value = '';
    if (numberInput) numberInput.value = '';
    if (healthInput) healthInput.value = '';
    if (grdInput) grdInput.value = '';
    if (resInput) resInput.value = '';
    if (tghInput) tghInput.value = '';

    const swordSound = document.getElementById('sword-sound');
    if (swordSound) swordSound.play();
  } catch (err) {
    console.error('Error submitting data:', err);
  }
}

// ---- Render helpers ----
function valOrNA(v) {
  return (v ?? v === 0) ? v : 'N/A';
}

function buildListItem({ id, name, number, health, grd, res, tgh }) {
  const li = document.createElement('li');

  // Name with tooltip
  const tip = `GRD: ${valOrNA(grd)}\nRES: ${valOrNA(res)}\nTGH: ${valOrNA(tgh)}`;

  const nameDiv = document.createElement('div');
  nameDiv.className = 'name';
  nameDiv.textContent = name;          // show only the name
  nameDiv.setAttribute('data-tooltip', tip); // styled tooltip
  nameDiv.title = tip;                 // native fallback
  li.appendChild(nameDiv);

  // HP (if present)
  if (health !== null && health !== undefined) {
    const healthDiv = document.createElement('div');
    healthDiv.className = 'health';
    healthDiv.textContent = `HP: ${health}`;
    li.appendChild(healthDiv);
  }

  // Remove button
  const removeBtn = document.createElement('button');
  removeBtn.textContent = 'Remove';
  removeBtn.addEventListener('click', () => removeEntry(id));
  li.appendChild(removeBtn);

  return li;
}

// ---- Fetch & render ----
function fetchRankings() {
  const reference = ref(db, 'rankings/');
  onValue(reference, (snapshot) => {
    const data = snapshot.val();
    const rankingList = document.getElementById('rankingList');
    if (!rankingList) return;

    rankingList.innerHTML = '';

    if (data) {
      // FIX: spread the entry object correctly
      const rankings = Object.entries(data).map(([id, entry]) => ({ id, ...entry }));
      rankings.sort((a, b) => (b.number ?? -Infinity) - (a.number ?? -Infinity));

      rankings.forEach(row => rankingList.appendChild(buildListItem(row)));
    } else {
      console.log('No data available');
    }
  }, (error) => {
    console.error('Error fetching data:', error);
  });
}

// ---- Remove & clear ----
function removeEntry(id) {
  const reference = ref(db, `rankings/${id}`);
  remove(reference).catch(err => console.error('Error removing entry:', err));
}

function clearAllEntries() {
  const reference = ref(db, 'rankings/');
  set(reference, null)
    .then(() => {
      const rankingList = document.getElementById('rankingList');
      if (rankingList) rankingList.innerHTML = '';
    })
    .catch(err => console.error('Error clearing all entries:', err));
}

// ---- Wire up ----
document.addEventListener('DOMContentLoaded', () => {
  const submitBtn = document.getElementById('submit-button');
  if (submitBtn) submitBtn.addEventListener('click', submitData);

  const clearBtn = document.getElementById('clear-list-button');
  if (clearBtn) clearBtn.addEventListener('click', clearAllEntries);

  if (document.getElementById('rankingList')) {
    fetchRankings();
  }
});
