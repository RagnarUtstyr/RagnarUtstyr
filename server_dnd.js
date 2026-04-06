import { db } from "./firebase-config.js";
import { ref, push, onValue, remove, set } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

function getGameCode() {
  const params = new URLSearchParams(window.location.search);
  return (params.get("code") || "").trim().toUpperCase();
}

function getEntriesPath() {
  const code = getGameCode();
  if (!code) throw new Error("Missing game code in URL.");
  return `games/${code}/entries`;
}

function normalizeEntry(id, entry) {
  return {
    id,
    name: entry.name ?? entry.playerName ?? "Unknown",
    number: entry.number ?? entry.initiative ?? 0,
    health: entry.health ?? null,
    ac: entry.ac ?? null,
    url: entry.url ?? null
  };
}

async function submitData() {
  const name = document.getElementById("name")?.value?.trim();
  const initiativeEl = document.getElementById("initiative") || document.getElementById("number");
  const number = initiativeEl ? parseInt(initiativeEl.value, 10) : NaN;

  const healthRaw = document.getElementById("health")?.value ?? "";
  const acRaw = document.getElementById("ac")?.value ?? "";

  const health = healthRaw !== "" ? parseInt(healthRaw, 10) : null;
  const ac = acRaw !== "" ? parseInt(acRaw, 10) : null;

  if (!name || Number.isNaN(number)) {
    console.log("Please enter valid name and initiative values.");
    return;
  }

  try {
    const reference = ref(db, getEntriesPath());
    await push(reference, {
      name,
      number,
      health,
      ac,
      createdByAdmin: true,
      updatedAt: Date.now()
    });

    document.getElementById("name").value = "";
    if (initiativeEl) initiativeEl.value = "";
    if (document.getElementById("health")) document.getElementById("health").value = "";
    if (document.getElementById("ac")) document.getElementById("ac").value = "";

    const swordSound = document.getElementById("sword-sound");
    if (swordSound) swordSound.play();
  } catch (error) {
    console.error("Error submitting data:", error);
  }
}

function fetchRankings() {
  const reference = ref(db, getEntriesPath());

  onValue(
    reference,
    (snapshot) => {
      const data = snapshot.val();
      const rankingList = document.getElementById("rankingList");
      rankingList.innerHTML = "";

      if (!data) {
        console.log("No data available");
        return;
      }

      const rankings = Object.entries(data)
        .map(([id, entry]) => normalizeEntry(id, entry))
        .sort((a, b) => (b.number || 0) - (a.number || 0));

      rankings.forEach(({ id, name, health, ac }) => {
        const listItem = document.createElement("li");

        const nameDiv = document.createElement("div");
        nameDiv.className = "name";
        nameDiv.textContent = ac !== null && ac !== undefined ? `${name} (AC: ${ac})` : name;

        const healthDiv = document.createElement("div");
        healthDiv.className = "health";
        healthDiv.textContent = health !== null && health !== undefined ? `HP: ${health}` : "";

        const removeButton = document.createElement("button");
        removeButton.textContent = "Remove";
        removeButton.addEventListener("click", () => removeEntry(id));

        listItem.appendChild(nameDiv);
        if (healthDiv.textContent !== "") {
          listItem.appendChild(healthDiv);
        }
        listItem.appendChild(removeButton);

        rankingList.appendChild(listItem);
      });
    },
    (error) => {
      console.error("Error fetching data:", error);
    }
  );
}

function removeEntry(id) {
  const reference = ref(db, `${getEntriesPath()}/${id}`);
  remove(reference)
    .then(() => {
      console.log(`Entry with id ${id} removed successfully`);
    })
    .catch((error) => {
      console.error("Error removing entry:", error);
    });
}

function clearAllEntries() {
  const reference = ref(db, getEntriesPath());
  set(reference, null)
    .then(() => {
      console.log("All room entries removed successfully");
      const rankingList = document.getElementById("rankingList");
      rankingList.innerHTML = "";
    })
    .catch((error) => {
      console.error("Error clearing all room entries:", error);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  try {
    getEntriesPath();
  } catch (error) {
    console.error(error);
    return;
  }

  if (document.getElementById("submit-button")) {
    document.getElementById("submit-button").addEventListener("click", submitData);
  }

  if (document.getElementById("rankingList")) {
    fetchRankings();
  }

  if (document.getElementById("clear-list-button")) {
    document.getElementById("clear-list-button").addEventListener("click", clearAllEntries);
  }
});