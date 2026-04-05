import { getDatabase, ref, update, onValue, remove, set } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

const db = getDatabase();

function getGameCode() {
  const params = new URLSearchParams(window.location.search);
  return (params.get("code") || "").trim().toUpperCase();
}

function getEntriesPath() {
  const code = getGameCode();
  if (!code) throw new Error("Missing game code in URL.");
  return `games/${code}/entries`;
}

function normalizeEntry(id, entry = {}) {
  return {
    id,
    name: entry.name ?? entry.playerName ?? "Unknown",
    number: entry.number ?? entry.initiative ?? entry.initiativeBonus ?? 0,
    health: entry.health ?? entry.currentHp ?? null,
    grd: entry.grd ?? null,
    res: entry.res ?? null,
    tgh: entry.tgh ?? null,
    url: entry.url ?? null
  };
}

function openStatModal({ name, grd, res, tgh, url, initiative }) {
  const modal = document.getElementById("stat-modal");
  if (!modal) return;

  const titleEl = document.getElementById("stat-modal-title");
  const initEl = document.getElementById("stat-init");
  const grdEl = document.getElementById("stat-grd");
  const resEl = document.getElementById("stat-res");
  const tghEl = document.getElementById("stat-tgh");
  const link = document.getElementById("stat-url");

  if (titleEl) titleEl.textContent = name ?? "";
  if (initEl) initEl.textContent = initiative ?? "N/A";
  if (grdEl) grdEl.textContent = grd ?? "N/A";
  if (resEl) resEl.textContent = res ?? "N/A";
  if (tghEl) tghEl.textContent = tgh ?? "N/A";

  if (link) {
    if (url) {
      link.style.display = "";
      link.href = url;
    } else {
      link.style.display = "none";
      link.removeAttribute("href");
    }
  }

  modal.setAttribute("aria-hidden", "false");
}

function closeStatModal() {
  const modal = document.getElementById("stat-modal");
  if (!modal) return;
  modal.setAttribute("aria-hidden", "true");
}

function openHpModal(currentHp) {
  const modal = document.getElementById("hp-modal");
  if (!modal) return;

  const input = document.getElementById("hp-set-amount");
  if (input) {
    input.value = currentHp ?? "";
    setTimeout(() => {
      input.focus();
      input.select();
    }, 0);
  }

  modal.setAttribute("aria-hidden", "false");
}

function closeHpModal() {
  const modal = document.getElementById("hp-modal");
  if (!modal) return;
  modal.setAttribute("aria-hidden", "true");
}

let currentEntryId = null;

function fetchRankings() {
  const reference = ref(db, getEntriesPath());

  onValue(reference, (snapshot) => {
    const data = snapshot.val();
    const rankingList = document.getElementById("rankingList");
    if (!rankingList) return;

    rankingList.innerHTML = "";

    if (!data) {
      console.log("No data available");
      return;
    }

    const rankings = Object.entries(data)
      .map(([id, entry]) => normalizeEntry(id, entry))
      .sort((a, b) => (b.number || 0) - (a.number || 0));

    rankings.forEach(({ id, name, number, health, grd, res, tgh, url }) => {
      const listItem = document.createElement("li");
      listItem.className = "list-item";
      listItem.dataset.entryId = id;

      if (health === 0) {
        listItem.classList.add("defeated");
      }

      const nameCol = document.createElement("div");
      nameCol.className = "column name";
      nameCol.textContent = name;
      nameCol.style.cursor = "pointer";
      nameCol.title = "Show stats";
      nameCol.addEventListener("click", () => {
        currentEntryId = id;
        openStatModal({
          name,
          grd,
          res,
          tgh,
          url,
          initiative: number
        });
      });

      const hpCol = document.createElement("div");
      hpCol.className = "column hp";
      hpCol.textContent = health !== null && health !== undefined ? `${health}` : "N/A";
      hpCol.style.cursor = "pointer";
      hpCol.title = "Set HP";
      hpCol.addEventListener("click", () => {
        currentEntryId = id;
        openHpModal(health);
      });

      const dmgCol = document.createElement("div");
      dmgCol.className = "column dmg";

      const dmgInput = document.createElement("input");
      dmgInput.type = "number";
      dmgInput.placeholder = "DMG";
      dmgInput.className = "damage-input";
      dmgInput.dataset.entryId = id;
      dmgInput.dataset.currentHealth = health ?? "";
      dmgInput.dataset.grd = grd ?? 0;
      dmgInput.dataset.res = res ?? 0;
      dmgInput.dataset.tgh = tgh ?? 0;

      dmgCol.appendChild(dmgInput);

      listItem.appendChild(nameCol);
      listItem.appendChild(hpCol);
      listItem.appendChild(dmgCol);

      if (health === 0) {
        const removeButton = document.createElement("button");
        removeButton.textContent = "Remove";
        removeButton.className = "remove-button";
        removeButton.addEventListener("click", () => {
          removeEntry(id, listItem);
        });
        listItem.appendChild(removeButton);
      }

      rankingList.appendChild(listItem);
    });
  });
}

function applyDamageToAll() {
  const damageInputs = document.querySelectorAll(".damage-input");
  const selectedStat = document.querySelector('input[name="globalStat"]:checked')?.value ?? "grd";

  damageInputs.forEach((input) => {
    const entryId = input.dataset.entryId;
    const currentHealth = parseInt(input.dataset.currentHealth, 10);
    const damage = parseInt(input.value, 10);
    const defense = parseInt(input.dataset[selectedStat], 10) || 0;

    if (isNaN(damage)) {
      input.value = "";
      return;
    }

    // If HP is missing, do not try to apply damage
    if (isNaN(currentHealth)) {
      input.value = "";
      return;
    }

    let effectiveDamage = 0;
    if (damage >= defense) {
      effectiveDamage = Math.max(3, damage - defense);
    }

    const updatedHealth = Math.max(currentHealth - effectiveDamage, 0);
    updateHealth(entryId, updatedHealth, input);

    input.value = "";
  });
}

function updateHealth(id, newHealth, inputEl) {
  const reference = ref(db, `${getEntriesPath()}/${id}`);
  update(reference, { health: newHealth })
    .then(() => {
      const listItem = inputEl.closest(".list-item");
      const hpCol = listItem?.querySelector(".column.hp");

      if (hpCol) hpCol.textContent = `${newHealth}`;
      inputEl.dataset.currentHealth = newHealth;

      if (newHealth <= 0) {
        listItem?.classList.add("defeated");

        let removeButton = listItem?.querySelector(".remove-button");
        if (!removeButton && listItem) {
          removeButton = document.createElement("button");
          removeButton.textContent = "Remove";
          removeButton.className = "remove-button";
          removeButton.addEventListener("click", () => {
            removeEntry(id, listItem);
          });
          listItem.appendChild(removeButton);
        }
      } else {
        listItem?.classList.remove("defeated");
      }
    })
    .catch((err) => console.error("Error updating health:", err));
}

function removeEntry(id, listItem) {
  const reference = ref(db, `${getEntriesPath()}/${id}`);
  remove(reference)
    .then(() => {
      listItem?.remove();
    })
    .catch((err) => console.error("Error removing entry:", err));
}

function clearList() {
  const reference = ref(db, getEntriesPath());
  set(reference, null)
    .then(() => {
      if (typeof window.resetRoundCounter === "function") {
        window.resetRoundCounter();
      }
    })
    .catch((err) => console.error("Error clearing list:", err));
}

document.addEventListener("DOMContentLoaded", () => {
  const statModal = document.getElementById("stat-modal");
  if (statModal) {
    document.getElementById("stat-modal-close")?.addEventListener("click", closeStatModal);
    statModal.addEventListener("click", (e) => {
      if (e.target === statModal) closeStatModal();
    });
  }

  const hpModal = document.getElementById("hp-modal");
  if (hpModal) {
    document.getElementById("hp-modal-close")?.addEventListener("click", closeHpModal);
    hpModal.addEventListener("click", (e) => {
      if (e.target === hpModal) closeHpModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeStatModal();
      closeHpModal();
    }
  });

  document.getElementById("stat-delete")?.addEventListener("click", () => {
    if (!currentEntryId) return;
    if (!confirm("Delete this entry from the list?")) return;

    const row = document.querySelector(`.list-item[data-entry-id="${currentEntryId}"]`);
    removeEntry(currentEntryId, row);
    closeStatModal();
    currentEntryId = null;
  });

  const healBtn = document.getElementById("stat-heal");
  const healAmtInput = document.getElementById("stat-heal-amount");

  if (healBtn && healAmtInput) {
    healBtn.addEventListener("click", () => {
      if (!currentEntryId) return;

      const amount = parseInt(healAmtInput.value, 10);
      if (isNaN(amount) || amount === 0) return;

      const dmgInput = document.querySelector(`.damage-input[data-entry-id="${currentEntryId}"]`);
      if (!dmgInput) return;

      const current = parseInt(dmgInput.dataset.currentHealth, 10);
      if (isNaN(current)) {
        alert("This entry has no HP set yet.");
        return;
      }

      const newHealth = Math.max(current + amount, 0);
      updateHealth(currentEntryId, newHealth, dmgInput);
      healAmtInput.value = "";
    });
  }

  const setBtn = document.getElementById("hp-set-button");
  const hpInput = document.getElementById("hp-set-amount");

  if (setBtn && hpInput) {
    setBtn.addEventListener("click", () => {
      if (!currentEntryId) return;

      const amount = parseInt(hpInput.value, 10);
      if (isNaN(amount) || amount < 0) return;

      const dmgInput = document.querySelector(`.damage-input[data-entry-id="${currentEntryId}"]`);
      if (!dmgInput) return;

      updateHealth(currentEntryId, amount, dmgInput);
      hpInput.value = "";
      closeHpModal();
    });

    hpInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        setBtn.click();
      }
    });
  }

  try {
    getEntriesPath();
  } catch (err) {
    console.error(err);
    return;
  }

  fetchRankings();

  document.getElementById("apply-damage-button")?.addEventListener("click", applyDamageToAll);
  document.getElementById("clear-list-button")?.addEventListener("click", clearList);
});