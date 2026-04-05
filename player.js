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

const dndBuilderLink = document.getElementById("dnd-builder-link");
const openLegendBuilderLink = document.getElementById("openlegend-builder-link");

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

function applyModeStyles(currentMode) {
  const dndStyle = document.getElementById("player-dnd-style");
  const olStyle = document.getElementById("player-ol-style");

  if (!dndStyle || !olStyle) return;

  dndStyle.disabled = true;
  olStyle.disabled = true;

  if (currentMode === "dnd") {
    dndStyle.disabled = false;
  } else if (
    currentMode === "openlegend" ||
    currentMode === "ol" ||
    currentMode === "open_legend"
  ) {
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

  if (dndBuilderLink) {
    dndBuilderLink.href = `dnd_character_builder_firebase.html?code=${encodeURIComponent(code)}`;
  }
} else if (
  mode === "openlegend" ||
  mode === "ol" ||
  mode === "open_legend"
) {
  olSection.classList.remove("hidden");

  if (openLegendBuilderLink) {
    openLegendBuilderLink.href = `openlegend_character_builder.html?code=${encodeURIComponent(code)}`;
  }
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

function dndBuilderSheetPath() {
  return `games/${code}/builderSheetsDnd/${user.uid}`;
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
  document.getElementById("player-name").value =
    data.name ?? data.playerName ?? user.displayName ?? "";

  document.getElementById("player-initiative").value =
    data.initiative ?? data.initiativeBonus ?? data.number ?? "";
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

function mapDndFirebaseToPlayerValues(data = {}) {
  return {
    hp: data.hp ?? data.currentHp ?? data.health ?? data.baseHp ?? "",
    ac: data.ac ?? "",
    prof: data.prof ?? data.proficiencyBonus ?? "",
    str: data.str ?? data.strength ?? "",
    dex: data.dex ?? data.dexterity ?? "",
    con: data.con ?? data.constitution ?? "",
    int: data.int ?? data.intelligence ?? "",
    wis: data.wis ?? data.wisdom ?? "",
    cha: data.cha ?? data.charisma ?? ""
  };
}

function setDndValues(data = {}) {
  const mapped = mapDndFirebaseToPlayerValues(data);

  document.getElementById("player-hp").value = mapped.hp ?? "";
  document.getElementById("player-ac").value = mapped.ac ?? "";
  document.getElementById("player-prof").value = mapped.prof ?? "";
  document.getElementById("player-str").value = mapped.str ?? "";
  document.getElementById("player-dex").value = mapped.dex ?? "";
  document.getElementById("player-con").value = mapped.con ?? "";
  document.getElementById("player-int").value = mapped.int ?? "";
  document.getElementById("player-wis").value = mapped.wis ?? "";
  document.getElementById("player-cha").value = mapped.cha ?? "";
}

function setDndResult(message) {
  const el = document.getElementById("dnd-calc-result");
  if (el) el.textContent = message || "";
}

function getOlCurrentHp() {
  const el = document.getElementById("player-ol-current-hp");
  if (!el) return null;
  return numberOrNull(el.textContent);
}

function setOlCurrentHp(value) {
  const el = document.getElementById("player-ol-current-hp");
  if (!el) return;
  el.textContent = value === null || value === undefined || value === "" ? "—" : String(value);
}

function getOpenLegendValues() {
  return {
    currentHp: getOlCurrentHp(),
    grd: parseNumber(document.getElementById("player-ol-grd-view")?.textContent, 0),
    res: parseNumber(document.getElementById("player-ol-res-view")?.textContent, 0),
    tgh: parseNumber(document.getElementById("player-ol-tgh-view")?.textContent, 0)
  };
}

function setOpenLegendValues(data = {}) {
  setOlCurrentHp(data.currentHp ?? "");
  document.getElementById("player-ol-grd-view").textContent = data.grd ?? "—";
  document.getElementById("player-ol-res-view").textContent = data.res ?? "—";
  document.getElementById("player-ol-tgh-view").textContent = data.tgh ?? "—";
}

function getSelectedOlDefense() {
  const selected = document.querySelector(".ol-defense-choice:checked");
  return selected ? selected.value : null;
}

function setOlResult(message) {
  const el = document.getElementById("ol-calc-result");
  if (el) el.textContent = message || "";
}

function getOlBaseHpFromSheet(sheet) {
  return parseNumber(sheet?.baseHp, 0);
}

function applyDndDamage() {
  const damage = parseNumber(document.getElementById("dnd-damage-input").value, NaN);
  if (Number.isNaN(damage) || damage < 0) {
    setDndResult("Enter a valid damage amount.");
    return;
  }

  const currentHp = parseNumber(document.getElementById("player-hp").value, 0);
  const nextHp = Math.max(0, currentHp - damage);

  document.getElementById("player-hp").value = nextHp;
  document.getElementById("dnd-damage-input").value = "";
  setDndResult(`Took ${damage} damage. HP is now ${nextHp}.`);
  scheduleAutoSave("D&D damage applied.");
}

async function healDndHp() {
  const healAmount = parseNumber(document.getElementById("dnd-heal-amount").value, NaN);
  if (Number.isNaN(healAmount) || healAmount < 0) {
    setDndResult("Enter a valid heal amount.");
    return;
  }

  const allowTemp = !!document.getElementById("dnd-temp-heal")?.checked;
  const builderSnap = await get(ref(db, dndBuilderSheetPath()));
  const builderData = builderSnap.exists() ? builderSnap.val() : null;

  const totalLevels = parseNumber(
    (builderData?.classes || []).reduce((sum, c) => sum + Number(c?.level || 0), 0),
    0
  );
  const hpRolled = parseNumber(
    (builderData?.classes || []).reduce((sum, c) => {
      const hpLog = Array.isArray(c?.hpLog) ? c.hpLog : [];
      return sum + hpLog.reduce((a, b) => a + Number(b || 0), 0);
    }, 0),
    0
  );
  const conScore = Number(builderData?.abilities?.Constitution || 10);
  const conMod = Math.floor((conScore - 10) / 2);
  const baseHp = Math.max(totalLevels, hpRolled + (conMod * totalLevels));

  const currentHp = parseNumber(document.getElementById("player-hp").value, 0);

  const nextHp = allowTemp
    ? currentHp + healAmount
    : Math.min(baseHp, currentHp + healAmount);

  document.getElementById("player-hp").value = nextHp;
  document.getElementById("dnd-heal-amount").value = "";

  if (allowTemp) {
    setDndResult(`Healed ${healAmount}. HP is now ${nextHp} (temp allowed).`);
  } else {
    setDndResult(`Healed ${healAmount}. HP is now ${nextHp}.`);
  }

  scheduleAutoSave("D&D healing applied.");
}

async function resetDndFromBuilder() {
  const builderSnap = await get(ref(db, dndBuilderSheetPath()));

  if (!builderSnap.exists()) {
    setDndResult("No builder values found to reset from.");
    return;
  }

  const builderData = builderSnap.val();

  const totalLevels = parseNumber(
    (builderData?.classes || []).reduce((sum, c) => sum + Number(c?.level || 0), 0),
    0
  );

  const hpRolled = parseNumber(
    (builderData?.classes || []).reduce((sum, c) => {
      const hpLog = Array.isArray(c?.hpLog) ? c.hpLog : [];
      return sum + hpLog.reduce((a, b) => a + Number(b || 0), 0);
    }, 0),
    0
  );

  const conScore = Number(builderData?.abilities?.Constitution || 10);
  const conMod = Math.floor((conScore - 10) / 2);
  const rebuiltHp = Math.max(totalLevels, hpRolled + (conMod * totalLevels));

  const armorTable = {
    None:{base:10, dex:"full", maxDex:null},
    Padded:{base:11, dex:"full", maxDex:null},
    Leather:{base:11, dex:"full", maxDex:null},
    StuddedLeather:{base:12, dex:"full", maxDex:null},
    Hide:{base:12, dex:"cap", maxDex:2},
    ChainShirt:{base:13, dex:"cap", maxDex:2},
    ScaleMail:{base:14, dex:"cap", maxDex:2},
    Breastplate:{base:14, dex:"cap", maxDex:2},
    HalfPlate:{base:15, dex:"cap", maxDex:2},
    RingMail:{base:14, dex:"none", maxDex:0},
    ChainMail:{base:16, dex:"none", maxDex:0},
    Splint:{base:17, dex:"none", maxDex:0},
    Plate:{base:18, dex:"none", maxDex:0}
  };
  const shieldTable = { None: 0, Shield: 2 };

  const dexScore = Number(builderData?.abilities?.Dexterity || 10);
  const dexMod = Math.floor((dexScore - 10) / 2);
  const armorKey = builderData?.armor || "None";
  const shieldKey = builderData?.shield || "None";
  const armorData = armorTable[armorKey] || armorTable.None;

  const dexPart =
    armorData.dex === "full"
      ? dexMod
      : armorData.dex === "cap"
        ? Math.min(dexMod, armorData.maxDex)
        : 0;

  const rebuiltAc =
    armorData.base +
    dexPart +
    Number(shieldTable[shieldKey] || 0) +
    Number(builderData?.armorMagic || 0) +
    Number(builderData?.shieldMagic || 0);

  const rebuiltProf = 2 + Math.floor((Math.max(1, totalLevels) - 1) / 4);

  setDndValues({
    hp: rebuiltHp,
    ac: rebuiltAc,
    prof: rebuiltProf,
    str: Number(builderData?.abilities?.Strength ?? ""),
    dex: Number(builderData?.abilities?.Dexterity ?? ""),
    con: Number(builderData?.abilities?.Constitution ?? ""),
    int: Number(builderData?.abilities?.Intelligence ?? ""),
    wis: Number(builderData?.abilities?.Wisdom ?? ""),
    cha: Number(builderData?.abilities?.Charisma ?? "")
  });

  setDndResult("D&D fields reset from character builder.");
  scheduleAutoSave("D&D fields reset from builder.");
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
  const currentHp = parseNumber(values.currentHp, 0);
  const defenseValue = parseNumber(values[defenseKey], 0);

  let hpLoss = 0;
  if (damage >= defenseValue) {
    hpLoss = Math.max(3, damage - defenseValue);
  }

  const nextHp = Math.max(0, currentHp - hpLoss);
  setOlCurrentHp(nextHp);

  if (hpLoss > 0) {
    setOlResult(`DMG ${damage} vs ${defenseKey.toUpperCase()} ${defenseValue}. HP reduced by ${hpLoss}.`);
  } else {
    setOlResult(`DMG ${damage} vs ${defenseKey.toUpperCase()} ${defenseValue}. No HP damage taken.`);
  }

  document.getElementById("ol-damage-input").value = "";
  scheduleAutoSave("Open Legend damage applied.");
}

async function resetOpenLegendHp() {
  const existing = await getCurrentSheet();
  const baseHp = getOlBaseHpFromSheet(existing);
  setOlCurrentHp(baseHp);
  setOlResult("HP reset to base HP.");
  scheduleAutoSave("HP reset.");
}

function healOpenLegendHp() {
  const healAmount = parseNumber(document.getElementById("ol-heal-amount").value, NaN);
  if (Number.isNaN(healAmount) || healAmount < 0) {
    setOlResult("Enter a valid heal amount.");
    return;
  }

  getCurrentSheet().then((existing) => {
    const baseHp = getOlBaseHpFromSheet(existing);
    const currentHp = parseNumber(getOlCurrentHp(), baseHp);
    const nextHp = Math.min(baseHp, currentHp + healAmount);

    setOlCurrentHp(nextHp);
    setOlResult(`Healed ${healAmount}. Current HP is now ${nextHp}.`);
    document.getElementById("ol-heal-amount").value = "";
    scheduleAutoSave("HP healed.");
  });
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

    li.querySelector(".delete-tracker-btn").addEventListener("click", async () => {
      const confirmed = confirm(`Delete tracker "${tracker.name || "Tracker"}"?`);
      if (!confirmed) return;
      await deleteTracker(tracker.id);
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
    ...(existing || {}),
    uid: user.uid,
    userEmail: user.email || "",
    userName: user.displayName || "",
    mode,
    name: shared.name,
    initiative: shared.initiative,
    initiativeBonus: shared.initiative,
    trackers: existing.trackers || [],
    updatedAt: Date.now()
  };

  if (mode === "dnd") {
    const dnd = getDndValues();
    const existingBaseHp = parseNumber(existing.baseHp, dnd.hp ?? 0);

    payload = {
      ...payload,
      ...dnd,
      baseHp: existingBaseHp,
      currentHp: dnd.hp,
      proficiencyBonus: dnd.prof,
      strength: dnd.str,
      dexterity: dnd.dex,
      constitution: dnd.con,
      intelligence: dnd.int,
      wisdom: dnd.wis,
      charisma: dnd.cha
    };
  } else {
    const ol = getOpenLegendValues();
    payload = {
      ...payload,
      currentHp: ol.currentHp,
      grd: ol.grd,
      res: ol.res,
      tgh: ol.tgh
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
      setOpenLegendValues({
        currentHp: data.currentHp ?? "",
        grd: data.grd ?? "—",
        res: data.res ?? "—",
        tgh: data.tgh ?? "—"
      });
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
      initiative: entry.number ?? entry.initiative ?? entry.initiativeBonus ?? ""
    });

    if (mode === "dnd") {
      setDndValues(entry);
    } else {
      setOpenLegendValues({
        currentHp: "",
        grd: "—",
        res: "—",
        tgh: "—"
      });
    }

    renderTrackerList([]);
    statusEl.textContent = "Loaded existing room character data.";
    return;
  }

  setSharedValues({ name: user.displayName ?? "" });
  renderTrackerList([]);
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
    initiativeBonus: shared.initiative,
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

  const trackers = normalizeTrackers(existing.trackers).filter(
    (tracker) => tracker.id !== trackerId
  );

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

document.getElementById("dnd-apply-damage-btn")?.addEventListener("click", applyDndDamage);
document.getElementById("dnd-heal-btn")?.addEventListener("click", healDndHp);
document.getElementById("dnd-reset-hp-btn")?.addEventListener("click", resetDndFromBuilder);

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
  "player-cha"
].forEach((id) => {
  document.getElementById(id)?.addEventListener("input", () => {
    scheduleAutoSave("Character auto-saved.");
  });
});

await loadExistingCharacter();