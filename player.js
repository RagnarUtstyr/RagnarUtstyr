import { requireAuth } from "./auth.js";
import { db } from "./firebase-config.js";
import { watchOrLoadGame } from "./game-service.js";
import {
  ref,
  get,
  set
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

const params = new URLSearchParams(window.location.search);
const code = (params.get("code") || "").toUpperCase();

const metaEl = document.getElementById("player-game-meta");
const statusEl = document.getElementById("player-status");

const saveInitiativeBtn = document.getElementById("save-initiative-button");

const dndSection = document.getElementById("player-dnd-section");
const olSection = document.getElementById("player-openlegend-section");

const trackerListEl = document.getElementById("tracker-list");
const trackerEmptyEl = document.getElementById("tracker-empty");

const user = await requireAuth();

if (!code) {
  statusEl.textContent = "Missing game code.";
  throw new Error("Missing game code.");
}

const game = await watchOrLoadGame(code);
if (!game) {
  statusEl.textContent = "Game not found.";
  throw new Error("Game not found.");
}

const mode = String(game.mode || "").toLowerCase();

function applyModeStyles(mode) {
  const dndStyle = document.getElementById("player-dnd-style");
  const olStyle = document.getElementById("player-ol-style");

  if (!dndStyle || !olStyle) return;

  dndStyle.disabled = true;
  olStyle.disabled = true;

  if (mode === "dnd") {
    dndStyle.disabled = false;
  } else if (mode === "openlegend" || mode === "ol" || mode === "open_legend") {
    olStyle.disabled = false;
  }
}

applyModeStyles(mode);

metaEl.innerHTML = `
  <div><strong>${game.title}</strong></div>
  <div class="muted">Code: ${game.code} · ${game.mode} · Admin: ${game.ownerName}</div>
`;

if (mode === "dnd") {
  dndSection.classList.remove("hidden");
} else if (mode === "openlegend" || mode === "ol" || mode === "open_legend") {
  olSection.classList.remove("hidden");
} else {
  statusEl.textContent = `Unsupported game mode: ${game.mode}`;
  throw new Error(`Unsupported game mode: ${game.mode}`);
}

function playerSheetPath() {
  return `games/${code}/players/${user.uid}`;
}

function playerEntryPath() {
  return `games/${code}/entries/${user.uid}`;
}

function numberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseNumber(value, fallback = 0) {
  const parsed = parseInt(String(value ?? "").trim(), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function makeId() {
  return "id-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
}

function getSharedValues() {
  return {
    name: document.getElementById("player-name").value.trim(),
    initiative: numberOrNull(document.getElementById("player-initiative").value)
  };
}

function setSharedValues(data = {}) {
  document.getElementById("player-name").value = data.name ?? user.displayName ?? "";
  document.getElementById("player-initiative").value = data.initiative ?? "";
}

function getDndValues() {
  return {
    hp: numberOrNull(document.getElementById("player-hp").value),
    ac: numberOrNull(document.getElementById("player-ac").value),
    prof: numberOrNull(document.getElementById("player-prof").value),
    str: numberOrNull(document.getElementById("player-str").value),
    dex: numberOrNull(document.getElementById("player-dex").value),
    con: numberOrNull(document.getElementById("player-con").value),
    int: numberOrNull(document.getElementById("player-int").value),
    wis: numberOrNull(document.getElementById("player-wis").value),
    cha: numberOrNull(document.getElementById("player-cha").value)
  };
}

function setDndValues(data = {}) {
  document.getElementById("player-hp").value = data.hp ?? "";
  document.getElementById("player-ac").value = data.ac ?? "";
  document.getElementById("player-prof").value = data.prof ?? "";
  document.getElementById("player-str").value = data.str ?? "";
  document.getElementById("player-dex").value = data.dex ?? "";
  document.getElementById("player-con").value = data.con ?? "";
  document.getElementById("player-int").value = data.int ?? "";
  document.getElementById("player-wis").value = data.wis ?? "";
  document.getElementById("player-cha").value = data.cha ?? "";
}

function getOpenLegendValues() {
  return {
    baseHp: numberOrNull(document.getElementById("player-ol-base-hp").value),
    currentHp: numberOrNull(document.getElementById("player-ol-current-hp").value),
    grd: numberOrNull(document.getElementById("player-ol-grd").value),
    res: numberOrNull(document.getElementById("player-ol-res").value),
    tgh: numberOrNull(document.getElementById("player-ol-tgh").value)
  };
}

function setOpenLegendValues(data = {}) {
  document.getElementById("player-ol-base-hp").value = data.baseHp ?? data.hp ?? "";
  document.getElementById("player-ol-current-hp").value = data.currentHp ?? data.hp ?? "";
  document.getElementById("player-ol-grd").value = data.grd ?? "";
  document.getElementById("player-ol-res").value = data.res ?? "";
  document.getElementById("player-ol-tgh").value = data.tgh ?? "";
  renderOpenLegendStats();
}

function renderOpenLegendStats() {
  // visible values are the editable stat-card inputs themselves
}

function getSelectedOlDefense() {
  const selected = document.querySelector(".ol-defense-choice:checked");
  return selected ? selected.value : null;
}

function setOlResult(message) {
  const el = document.getElementById("ol-calc-result");
  if (el) el.textContent = message || "";
}

function applyOpenLegendDamage() {
  const damage = parseNumber(document.getElementById("ol-damage-input").value, NaN);
  if (Number.isNaN(damage) || damage < 0) {
    setOlResult("Enter a valid damage amount.");
    return;
  }

  const defenseKey = getSelectedOlDefense();
  if (!defenseKey) {
    setOlResult("Choose GRD, RES, or TGH.");
    return;
  }

  const values = getOpenLegendValues();
  const currentHp = parseNumber(values.currentHp, parseNumber(values.baseHp, 0));
  const defenseValue = parseNumber(values[defenseKey], 0);

  let hpLoss = 0;
  if (damage >= defenseValue) {
    hpLoss = Math.max(3, damage - defenseValue);
  }

  const nextHp = Math.max(0, currentHp - hpLoss);
  document.getElementById("player-ol-current-hp").value = nextHp;
  renderOpenLegendStats();

  if (hpLoss > 0) {
    setOlResult(`DMG ${damage} vs ${defenseKey.toUpperCase()} ${defenseValue}. HP reduced by ${hpLoss}.`);
  } else {
    setOlResult(`DMG ${damage} vs ${defenseKey.toUpperCase()} ${defenseValue}. No HP damage taken.`);
  }

  document.getElementById("ol-damage-input").value = "";
  scheduleAutoSave("Open Legend damage applied.");
}

function resetOpenLegendHp() {
  const baseHp = parseNumber(document.getElementById("player-ol-base-hp").value, 0);
  document.getElementById("player-ol-current-hp").value = baseHp;
  renderOpenLegendStats();
  setOlResult("HP reset to base HP.");
  scheduleAutoSave("HP reset.");
}

function healOpenLegendHp() {
  const healAmount = parseNumber(document.getElementById("ol-heal-amount").value, NaN);
  if (Number.isNaN(healAmount) || healAmount < 0) {
    setOlResult("Enter a valid heal amount.");
    return;
  }

  const baseHp = parseNumber(document.getElementById("player-ol-base-hp").value, 0);
  const currentHp = parseNumber(document.getElementById("player-ol-current-hp").value, baseHp);
  const nextHp = Math.min(baseHp, currentHp + healAmount);

  document.getElementById("player-ol-current-hp").value = nextHp;
  renderOpenLegendStats();
  setOlResult(`Healed ${healAmount}. Current HP is now ${nextHp}.`);
  document.getElementById("ol-heal-amount").value = "";
  scheduleAutoSave("HP healed.");
}

function normalizeTrackers(trackers) {
  if (!Array.isArray(trackers)) return [];
  return trackers.filter(Boolean);
}

function renderTrackerList(trackers = []) {
  trackerListEl.innerHTML = "";
  const safeTrackers = normalizeTrackers(trackers);
  trackerEmptyEl.classList.toggle("hidden", safeTrackers.length > 0);

  for (const tracker of safeTrackers) {
    const li = document.createElement("li");
    li.className = "tracker-card";

    const total = Math.max(0, Number(tracker.amount) || 0);
    const value = Math.max(0, Math.min(total, Number(tracker.value) || 0));

    let boxesHtml = "";
    for (let i = 0; i < total; i += 1) {
      boxesHtml += `<input type="checkbox" ${i < value ? "checked" : ""} disabled />`;
    }

    li.innerHTML = `
      <div>
        <div class="tracker-top">
          <span class="tracker-name">${tracker.name || "Tracker"}</span>
          <span class="tracker-progress">${value} / ${total}</span>
        </div>
        <div class="tracker-boxes">${boxesHtml || '<span class="muted">No boxes</span>'}</div>
      </div>
      <div class="tracker-controls">
        <button type="button" class="button-small deduct-btn">Deduct</button>
        <button type="button" class="button-small add-btn">Add</button>
        <button type="button" class="remove-button button-small delete-tracker-btn">Delete</button>
      </div>
    `;

    li.querySelector(".deduct-btn").addEventListener("click", () => {
      changeTrackerValue(tracker.id, value - 1);
    });

    li.querySelector(".add-btn").addEventListener("click", () => {
      changeTrackerValue(tracker.id, value + 1);
    });

    li.querySelector(".delete-tracker-btn").addEventListener("click", () => {
      deleteTracker(tracker.id);
    });

    trackerListEl.appendChild(li);
  }
}

async function getCurrentSheet() {
  const snap = await get(ref(db, playerSheetPath()));
  return snap.exists() ? snap.val() : null;
}

function buildSheetPayload(existing = {}) {
  const shared = getSharedValues();

  let payload = {
    uid: user.uid,
    userEmail: user.email || "",
    userName: user.displayName || "",
    mode,
    name: shared.name,
    initiative: shared.initiative,
    trackers: existing.trackers || [],
    updatedAt: Date.now()
  };

  if (mode === "dnd") {
    payload = {
      ...payload,
      ...getDndValues()
    };
  } else {
    payload = {
      ...payload,
      ...getOpenLegendValues()
    };
  }

  return payload;
}

let autoSaveTimer = null;
let isAutoSaving = false;

function scheduleAutoSave(message = "Saved.") {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(async () => {
    await autoSaveCharacter(message);
  }, 500);
}

async function autoSaveCharacter(message = "Saved.") {
  if (isAutoSaving) return;
  isAutoSaving = true;

  try {
    const existing = (await getCurrentSheet()) || {};
    const payload = buildSheetPayload(existing);
    await set(ref(db, playerSheetPath()), payload);
    statusEl.textContent = message;
  } catch (error) {
    console.error(error);
    statusEl.textContent = error.message || "Could not auto-save character sheet.";
  } finally {
    isAutoSaving = false;
  }
}

async function loadExistingCharacter() {
  const sheetSnap = await get(ref(db, playerSheetPath()));

  if (sheetSnap.exists()) {
    const data = sheetSnap.val();
    setSharedValues(data);

    if (mode === "dnd") {
      setDndValues(data);
    } else {
      setOpenLegendValues(data);
    }

    renderTrackerList(data.trackers || []);
    statusEl.textContent = "Loaded saved character sheet.";
    return;
  }

  const entrySnap = await get(ref(db, playerEntryPath()));
  if (entrySnap.exists()) {
    const entry = entrySnap.val();

    setSharedValues({
      name: entry.name ?? entry.playerName ?? user.displayName ?? "",
      initiative: entry.number ?? entry.initiative ?? ""
    });

    if (mode === "dnd") {
      setDndValues({
        hp: entry.health ?? "",
        ac: entry.ac ?? "",
        prof: entry.prof ?? "",
        str: entry.str ?? "",
        dex: entry.dex ?? "",
        con: entry.con ?? "",
        int: entry.int ?? "",
        wis: entry.wis ?? "",
        cha: entry.cha ?? ""
      });
    } else {
      setOpenLegendValues({
        baseHp: entry.baseHp ?? entry.health ?? "",
        currentHp: entry.currentHp ?? entry.health ?? "",
        grd: entry.grd ?? "",
        res: entry.res ?? "",
        tgh: entry.tgh ?? ""
      });
    }

    renderTrackerList([]);
    statusEl.textContent = "Loaded existing room character data.";
    return;
  }

  setSharedValues({ name: user.displayName ?? "" });
  renderTrackerList([]);
  if (mode === "openlegend" || mode === "ol" || mode === "open_legend") {
    renderOpenLegendStats();
  }
}

async function saveInitiativeToGame() {
  const shared = getSharedValues();

  if (!shared.name) {
    statusEl.textContent = "Please enter a character name.";
    return;
  }

  if (shared.initiative === null) {
    statusEl.textContent = "Please enter initiative.";
    return;
  }

  const existing = (await getCurrentSheet()) || {};
  const sheetPayload = buildSheetPayload(existing);

  const entryPayload = {
    uid: user.uid,
    playerName: shared.name,
    initiative: shared.initiative,
    name: shared.name,
    number: shared.initiative,
    updatedAt: Date.now()
  };

  try {
    await set(ref(db, playerSheetPath()), sheetPayload);
    await set(ref(db, playerEntryPath()), entryPayload);
    statusEl.textContent = "Initiative saved to this game.";
  } catch (error) {
    console.error(error);
    statusEl.textContent = error.message || "Could not save initiative to this game.";
  }
}

async function createTracker() {
  const nameInput = document.getElementById("tracker-name");
  const amountInput = document.getElementById("tracker-amount");
  const startFull = document.getElementById("tracker-start-full");

  const trackerName = nameInput.value.trim();
  const amount = parseInt(amountInput.value, 10);

  if (!trackerName || Number.isNaN(amount) || amount < 1) {
    statusEl.textContent = "Enter a tracker name and amount.";
    return;
  }

  const existing = (await getCurrentSheet()) || {};
  const payload = buildSheetPayload(existing);

  payload.trackers = [
    ...(existing.trackers || []),
    {
      id: makeId(),
      name: trackerName,
      amount,
      value: startFull.checked ? amount : 0,
      createdAt: Date.now()
    }
  ];
  payload.updatedAt = Date.now();

  await set(ref(db, playerSheetPath()), payload);
  renderTrackerList(payload.trackers);
  statusEl.textContent = "Tracker added.";

  nameInput.value = "";
  amountInput.value = "";
  startFull.checked = false;
}

async function changeTrackerValue(trackerId, nextValue) {
  const existing = await getCurrentSheet();
  if (!existing) return;

  const trackers = normalizeTrackers(existing.trackers).map((tracker) => {
    if (tracker.id !== trackerId) return tracker;
    const bounded = Math.max(0, Math.min(Number(tracker.amount) || 0, nextValue));
    return { ...tracker, value: bounded };
  });

  const payload = {
    ...existing,
    trackers,
    updatedAt: Date.now()
  };

  await set(ref(db, playerSheetPath()), payload);
  renderTrackerList(trackers);
}

async function deleteTracker(trackerId) {
  const existing = await getCurrentSheet();
  if (!existing) return;

  const trackers = normalizeTrackers(existing.trackers).filter((tracker) => tracker.id !== trackerId);

  const payload = {
    ...existing,
    trackers,
    updatedAt: Date.now()
  };

  await set(ref(db, playerSheetPath()), payload);
  renderTrackerList(trackers);
  statusEl.textContent = "Tracker deleted.";
}

saveInitiativeBtn?.addEventListener("click", saveInitiativeToGame);

document.getElementById("ol-apply-damage-btn")?.addEventListener("click", applyOpenLegendDamage);
document.getElementById("ol-reset-hp-btn")?.addEventListener("click", resetOpenLegendHp);
document.getElementById("ol-heal-btn")?.addEventListener("click", healOpenLegendHp);

document.getElementById("create-tracker-btn")?.addEventListener("click", createTracker);

document.querySelectorAll(".ol-defense-choice").forEach((checkbox) => {
  checkbox.addEventListener("change", () => {
    if (!checkbox.checked) return;
    document.querySelectorAll(".ol-defense-choice").forEach((other) => {
      if (other !== checkbox) other.checked = false;
    });
  });
});

[
  "player-name",
  "player-initiative",
  "player-hp",
  "player-ac",
  "player-prof",
  "player-str",
  "player-dex",
  "player-con",
  "player-int",
  "player-wis",
  "player-cha",
  "player-ol-base-hp",
  "player-ol-current-hp",
  "player-ol-grd",
  "player-ol-res",
  "player-ol-tgh"
].forEach((id) => {
  document.getElementById(id)?.addEventListener("input", () => {
    if (id.startsWith("player-ol-")) {
      renderOpenLegendStats();
    }
    scheduleAutoSave("Character auto-saved.");
  });
});

await loadExistingCharacter();