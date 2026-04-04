import { requireAuth } from "./auth.js";
import { watchEntries, watchOrLoadGame } from "./game-service.js";

const params = new URLSearchParams(window.location.search);
const code = (params.get("code") || "").toUpperCase();
const metaEl = document.getElementById("game-meta");
const listEl = document.getElementById("admin-entry-list");
const statusEl = document.getElementById("admin-status");

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

if (game.ownerUid !== user.uid) {
  window.location.href = `player.html?code=${encodeURIComponent(code)}`;
}

metaEl.innerHTML = `
  <div><strong>${game.title}</strong></div>
  <div class="muted">Code: ${game.code} · ${game.mode} · Admin: ${game.ownerName}</div>
`;

watchEntries(code, (entries) => {
  if (!entries.length) {
    listEl.innerHTML = `<li class="simple-list-item muted">No player initiatives yet.</li>`;
    return;
  }

  listEl.innerHTML = entries.map((entry, index) => `
    <li class="simple-list-item">
      <span>#${index + 1} ${entry.playerName}</span>
      <strong>${entry.initiative}</strong>
    </li>
  `).join("");
});
