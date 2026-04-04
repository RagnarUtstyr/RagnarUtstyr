import { requireAuth, logout } from "./auth.js";
import { createGame, joinGame, watchOwnedAndJoinedGames } from "./game-service.js";

const createBtn = document.getElementById("create-game-button");
const joinBtn = document.getElementById("join-game-button");
const logoutBtn = document.getElementById("logout-button");
const statusEl = document.getElementById("lobby-status");
const gamesList = document.getElementById("games-list");
const userCard = document.getElementById("user-card");

function gameLink(game, uid) {
  const role = game.ownerUid === uid ? "admin" : (game.members?.[uid]?.role || "player");
  const target = role === "admin" ? "admin.html" : "player.html";
  return `${target}?code=${encodeURIComponent(game.code)}`;
}

const user = await requireAuth();

userCard.innerHTML = `
  <div class="user-row">
    ${user.photoURL ? `<img src="${user.photoURL}" alt="${user.displayName}" class="avatar" />` : ""}
    <div>
      <div><strong>${user.displayName || "User"}</strong></div>
      <div class="muted">${user.email || ""}</div>
    </div>
  </div>
`;

watchOwnedAndJoinedGames(user.uid, (games) => {
  if (!games.length) {
    gamesList.innerHTML = `<p class="muted">No games yet.</p>`;
    return;
  }

  gamesList.innerHTML = games.map((game) => {
    const role = game.ownerUid === user.uid ? "Admin" : "Player";
    return `
      <a class="game-card" href="${gameLink(game, user.uid)}">
        <div><strong>${game.title}</strong></div>
        <div class="muted">${game.mode} · Code: ${game.code} · ${role}</div>
      </a>
    `;
  }).join("");
});

createBtn?.addEventListener("click", async () => {
  const title = document.getElementById("game-title").value;
  const mode = document.getElementById("game-mode").value;
  statusEl.textContent = "Creating game...";
  try {
    const game = await createGame({ owner: user, mode, title });
    window.location.href = `admin.html?code=${encodeURIComponent(game.code)}`;
  } catch (error) {
    console.error(error);
    statusEl.textContent = error.message || "Could not create game.";
  }
});

joinBtn?.addEventListener("click", async () => {
  const code = document.getElementById("join-code").value.trim().toUpperCase();
  statusEl.textContent = "Joining game...";
  try {
    const game = await joinGame({ user, code });
    window.location.href = `player.html?code=${encodeURIComponent(game.code)}`;
  } catch (error) {
    console.error(error);
    statusEl.textContent = error.message || "Could not join game.";
  }
});

logoutBtn?.addEventListener("click", async () => {
  await logout();
  window.location.href = "login.html";
});
