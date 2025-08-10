// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, set } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

// Firebase config
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

// Init
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Helpers
const valOrNA = (v) => (v ?? v === 0) ? v : "N/A";
const toIntOrNull = (v) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
};

// Submit new entry
async function submitData() {
  const name = document.getElementById("name")?.value?.trim();
  const numberInput = document.getElementById("initiative") || document.getElementById("number");
  const number = numberInput ? toIntOrNull(numberInput.value) : null;

  const health = toIntOrNull(document.getElementById("health")?.value);
  const grd = toIntOrNull(document.getElementById("grd")?.value);
  const res = toIntOrNull(document.getElementById("res")?.value);
  const tgh = toIntOrNull(document.getElementById("tgh")?.value);

  if (!name || number === null) {
    console.log("Please enter a valid name and initiative number.");
    return;
  }

  const entry = { name, number };
  if (health !== null) entry.health = health;
  if (grd !== null) entry.grd = grd;
  if (res !== null) entry.res = res;
  if (tgh !== null) entry.tgh = tgh;

  try {
    await push(ref(db, "rankings/"), entry);
    await push(ref(db, "OpenLegendMonster/"), entry);

    // Clear inputs
    document.getElementById("name").value = "";
    if (numberInput) numberInput.value = "";
    const ids = ["health", "grd", "res", "tgh"];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });

    const sword = document.getElementById("sword-sound");
    if (sword) sword.play();
  } catch (e) {
    console.error("Error pushing entry:", e);
  }
}

// Build one row with tooltip
function buildListItem({ id, name, number, health, grd, res, tgh }) {
  const li = document.createElement("li");

  // Name cell with tooltip
  const tip = `GRD: ${valOrNA(grd)}\nRES: ${valOrNA(res)}\nTGH: ${valOrNA(tgh)}`;
  const nameDiv = document.createElement("div");
  nameDiv.className = "name";
  nameDiv.textContent = name;                // show only the name
  nameDiv.setAttribute("data-tooltip", tip); // styled tooltip
  nameDiv.title = tip;                       // native fallback
  li.appendChild(nameDiv);

  // HP (if present)
  if (health !== null && health !== undefined) {
    const healthDiv = document.createElement("div");
    healthDiv.className = "health";
    healthDiv.textContent = `HP: ${health}`;
    li.appendChild(healthDiv);
  }

  // Remove button
  const removeBtn = document.createElement("button");
  removeBtn.textContent = "Remove";
  removeBtn.addEventListener("click", () => removeEntry(id));
  li.appendChild(removeBtn);

  return li;
}

// Read & render list
function fetchRankings() {
  const listRef = ref(db, "rankings/");
  onValue(listRef, (snapshot) => {
    const data = snapshot.val();
    const ul = document.getElementById("rankingList");
    if (!ul) return;

    ul.innerHTML = "";
    if (!data) return;

    // FIX: correct spread (old file had `({ id, .entry })`)
    const rows = Object.entries(data).map(([id, entry]) => ({ id, ...entry }));
    rows.sort((a, b) => (b.number ?? -Infinity) - (a.number ?? -Infinity));

    rows.forEach(row => ul.appendChild(buildListItem(row)));
  }, (err) => console.error("Error reading rankings:", err));
}

// Remove & clear
function removeEntry(id) {
  remove(ref(db, `rankings/${id}`)).catch(err => console.error("Error removing:", err));
}
function clearAllEntries() {
  set(ref(db, "rankings/"), null)
    .then(() => { const ul = document.getElementById("rankingList"); if (ul) ul.innerHTML = ""; })
    .catch(err => console.error("Error clearing:", err));
}

// Wire up
document.addEventListener("DOMContentLoaded", () => {
  const submitBtn = document.getElementById("submit-button");
  if (submitBtn) submitBtn.addEventListener("click", submitData);

  const clearBtn = document.getElementById("clear-list-button");
  if (clearBtn) clearBtn.addEventListener("click", clearAllEntries);

  if (document.getElementById("rankingList")) fetchRankings();
});
