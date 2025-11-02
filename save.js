// Import Firebase modules
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, get, set, remove, push } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

// Firebase configuration (same as in group.html and server.js)
const firebaseConfig = {
  apiKey: "AIzaSyD_4kINWig7n6YqB11yM2M-EuxGNz5uekI",
  authDomain: "roll202-c0b0d.firebaseapp.com",
  databaseURL: "https://roll202-c0b0d-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "roll202-c0b0d",
  storageBucket: "roll202-c0b0d.appspot.com",
  messagingSenderId: "607661730400",
  appId: "1:607661730400:web:b4b3f97a12cfae373e7105",
  measurementId: "G-L3JB5YC43M"
};

// Initialize Firebase app once
function ensureApp() {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}
ensureApp();
const db = getDatabase();

// -------------- Helpers --------------
function normalizeEntries(listLike) {
  // Accepts an Array of entries or an Object keyed by id -> entry
  if (!listLike) return [];
  if (Array.isArray(listLike)) return listLike.filter(Boolean);
  return Object.values(listLike).filter(Boolean);
}

async function fetchCurrentListFromFirebase() {
  const rankingsRef = ref(db, "rankings/");
  const snap = await get(rankingsRef);
  return snap.exists() ? snap.val() : null;
}

async function fetchSavedLists() {
  const savedRef = ref(db, "savedLists/");
  const snap = await get(savedRef);
  return snap.exists() ? snap.val() : {};
}

function renderSavedLists(saved) {
  const ul = document.getElementById("savedLists");
  if (!ul) return;
  ul.innerHTML = "";
  const names = Object.keys(saved);
  if (names.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No saved lists yet.";
    ul.appendChild(li);
    return;
  }
  names.sort().forEach((name) => {
    const li = document.createElement("li");
    li.className = "saved-list-item";
    li.textContent = name;
    li.style.cursor = "pointer";
    li.title = "Click to select this list name below";
    li.addEventListener("click", () => {
      const input = document.getElementById("list-name");
      if (input) input.value = name;
    });
    ul.appendChild(li);
  });
}

// -------------- Save current rankings as a named list --------------
async function saveList() {
  const listNameEl = document.getElementById("list-name");
  const listName = (listNameEl?.value || "").trim();
  if (!listName) {
    alert("Please enter a name for the list.");
    return;
  }

  const current = await fetchCurrentListFromFirebase();
  if (!current) {
    alert("There is no current list to save.");
    return;
  }

  const saveRef = ref(db, "savedLists/" + listName);
  await set(saveRef, {
    list: current,
    savedAt: Date.now()
  });

  alert(`List "${listName}" saved.`);
  // refresh the list UI
  loadSavedLists();
}

// -------------- LOAD a named list: APPEND to current --------------
async function loadList() {
  const listNameEl = document.getElementById("list-name");
  const listName = (listNameEl?.value || "").trim();
  if (!listName) {
    alert("Please enter the name of the list to load.");
    return;
  }

  const loadRef = ref(db, "savedLists/" + listName);
  const snap = await get(loadRef);
  if (!snap.exists()) {
    alert(`No list found with the name "${listName}".`);
    return;
  }

  const savedList = snap.val().list;
  const entries = normalizeEntries(savedList);
  if (entries.length === 0) {
    alert(`Saved list "${listName}" is empty.`);
    return;
  }

  // APPEND: for each entry, create a new child under /rankings with a new key
  const rankingsRef = ref(db, "rankings/");
  for (const entry of entries) {
    // Be defensive: only copy known fields
    const { name, number, health, grd, res, tgh, url } = entry || {};
    await set(push(rankingsRef), {
      name: name ?? "Unknown",
      number: typeof number === "number" ? number : 0,
      health: typeof health === "number" ? health : null,
      grd: typeof grd === "number" ? grd : null,
      res: typeof res === "number" ? res : null,
      tgh: typeof tgh === "number" ? tgh : null,
      url: url ?? null
    });
  }

  alert(`List "${listName}" loaded and appended to the current rankings. Redirecting to group.html.`);
  window.location.href = "group.html";
}

// -------------- Delete a named list --------------
async function deleteList() {
  const listNameEl = document.getElementById("list-name");
  const listName = (listNameEl?.value || "").trim();
  if (!listName) {
    alert("Please enter the name of the list to delete.");
    return;
  }
  if (!confirm(`Delete saved list "${listName}"? This cannot be undone.`)) return;

  const delRef = ref(db, "savedLists/" + listName);
  await remove(delRef);
  alert(`List "${listName}" deleted.`);
  loadSavedLists();
}

// -------------- Populate the Saved Lists list on page load --------------
async function loadSavedLists() {
  try {
    const saved = await fetchSavedLists();
    renderSavedLists(saved);
  } catch (err) {
    console.error("Error loading saved lists:", err);
  }
}

// Attach event listeners for Save, Load, and Delete buttons
document.getElementById("save-list-button")?.addEventListener("click", saveList);
document.getElementById("load-list-button")?.addEventListener("click", loadList);
document.getElementById("delete-list-button")?.addEventListener("click", deleteList);

// Load saved lists when the page is loaded
document.addEventListener("DOMContentLoaded", loadSavedLists);