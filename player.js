import { requireAuth } from "./auth.js";
import { watchEntries, watchOrLoadGame, submitInitiative } from "./game-service.js";

const params = new URLSearchParams(window.location.search);
const code = (params.get("code") || "").toUpperCase();
const metaEl = document.getElementById("player-game-meta");
const listEl = document.getElementById("player-entry-list");
const statusEl = document.getElementById("player-status");
const saveBtn = document.getElementById("save-initiative-button");

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

metaEl.innerHTML = `
  <div><strong>${game.title}</strong></div>
  <div class="muted">Code: ${game.code} · ${game.mode} · Admin: ${game.ownerName}</div>
`;

saveBtn?.addEventListener("click", async () => {
  const name = document.getElementById("player-name").value;
  const initiative = document.getElementById("player-initiative").value;

  if (initiative === "") {
    statusEl.textContent = "Please enter initiative.";
    return;
  }

  try {
    await submitInitiative({
      gameCode: code,
      user,
      initiative,
      name
    });
    statusEl.textContent = "Initiative saved.";
  } catch (error) {
    console.error(error);
    statusEl.textContent = error.message || "Could not save initiative.";
  }
});

watchEntries(code, (entries) => {
  if (!entries.length) {
    listEl.innerHTML = `<li class="simple-list-item muted">No initiatives submitted yet.</li>`;
    return;
  }

  listEl.innerHTML = entries.map((entry, index) => `
    <li class="simple-list-item">
      <span>#${index + 1} ${entry.playerName}</span>
      <strong>${entry.initiative}</strong>
    </li>
  `).join("");
});
