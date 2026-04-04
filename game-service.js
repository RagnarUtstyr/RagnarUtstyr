import { db } from "./firebase-config.js";
import {
  ref,
  set,
  get,
  update,
  push,
  onValue,
  remove
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(length = 4) {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

export async function createUniqueGameCode(length = 4, maxAttempts = 20) {
  for (let i = 0; i < maxAttempts; i += 1) {
    const code = randomCode(length);
    const snapshot = await get(ref(db, `games/${code}`));
    if (!snapshot.exists()) return code;
  }
  throw new Error("Could not generate a unique game code.");
}

export async function createGame({ owner, mode, title }) {
  const code = await createUniqueGameCode();
  const game = {
    code,
    title: title?.trim() || `${mode === "dnd" ? "D&D" : "Open Legend"} Game`,
    mode,
    ownerUid: owner.uid,
    ownerName: owner.displayName || owner.email || "Admin",
    createdAt: Date.now()
  };

  await set(ref(db, `games/${code}`), game);
  await set(ref(db, `games/${code}/members/${owner.uid}`), {
    uid: owner.uid,
    role: "admin",
    name: owner.displayName || "Admin",
    email: owner.email || ""
  });
  await set(ref(db, `memberships/${owner.uid}`), {
    gameCode: code,
    role: "admin",
    mode
  });

  return game;
}

export async function joinGame({ user, code }) {
  const normalized = code.trim().toUpperCase();
  const gameSnap = await get(ref(db, `games/${normalized}`));
  if (!gameSnap.exists()) {
    throw new Error("Game not found.");
  }

  const game = gameSnap.val();

  await set(ref(db, `games/${normalized}/members/${user.uid}`), {
    uid: user.uid,
    role: "player",
    name: user.displayName || "Player",
    email: user.email || ""
  });

  await set(ref(db, `memberships/${user.uid}`), {
    gameCode: normalized,
    role: "player",
    mode: game.mode
  });

  return game;
}

export async function leaveCurrentGame(uid) {
  const membershipSnap = await get(ref(db, `memberships/${uid}`));
  if (!membershipSnap.exists()) return;

  const membership = membershipSnap.val();
  const { gameCode } = membership;

  await remove(ref(db, `games/${gameCode}/members/${uid}`));
  await remove(ref(db, `games/${gameCode}/entries/${uid}`));
  await remove(ref(db, `memberships/${uid}`));
}

export async function leaveSpecificGame(uid, gameCode) {
  const normalized = gameCode.trim().toUpperCase();
  const gameSnap = await get(ref(db, `games/${normalized}`));

  if (!gameSnap.exists()) {
    throw new Error("Game not found.");
  }

  const game = gameSnap.val();

  if (game.ownerUid === uid) {
    throw new Error("The owner cannot leave their own game. Delete it instead.");
  }

  await remove(ref(db, `games/${normalized}/members/${uid}`));
  await remove(ref(db, `games/${normalized}/entries/${uid}`));

  const membershipSnap = await get(ref(db, `memberships/${uid}`));
  if (membershipSnap.exists()) {
    const membership = membershipSnap.val();
    if (membership.gameCode === normalized) {
      await remove(ref(db, `memberships/${uid}`));
    }
  }
}

export async function deleteGame(ownerUid, gameCode) {
  const normalized = gameCode.trim().toUpperCase();
  const gameRef = ref(db, `games/${normalized}`);
  const gameSnap = await get(gameRef);

  if (!gameSnap.exists()) {
    throw new Error("Game not found.");
  }

  const game = gameSnap.val();

  if (game.ownerUid !== ownerUid) {
    throw new Error("Only the owner can delete this game.");
  }

  const members = game.members || {};
  const memberIds = Object.keys(members);

  for (const uid of memberIds) {
    const membershipSnap = await get(ref(db, `memberships/${uid}`));
    if (membershipSnap.exists()) {
      const membership = membershipSnap.val();
      if (membership.gameCode === normalized) {
        await remove(ref(db, `memberships/${uid}`));
      }
    }
  }

  await remove(gameRef);
}

export async function loadMembership(uid) {
  const membershipSnap = await get(ref(db, `memberships/${uid}`));
  return membershipSnap.exists() ? membershipSnap.val() : null;
}

export function watchOwnedAndJoinedGames(uid, callback) {
  return onValue(ref(db, "games"), (snapshot) => {
    const data = snapshot.val() || {};
    const games = Object.values(data)
      .filter((game) => game.ownerUid === uid || game.members?.[uid])
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    callback(games);
  });
}

export async function submitInitiative({ gameCode, user, initiative, name }) {
  const entriesRef = ref(db, `games/${gameCode}/entries/${user.uid}`);
  const entry = {
    uid: user.uid,
    playerName: name?.trim() || user.displayName || "Player",
    initiative: Number(initiative),
    updatedAt: Date.now()
  };
  await set(entriesRef, entry);
}

export async function removePlayerEntry(gameCode, uid) {
  await remove(ref(db, `games/${gameCode}/entries/${uid}`));
}

export function watchEntries(gameCode, callback) {
  return onValue(ref(db, `games/${gameCode}/entries`), (snapshot) => {
    const data = snapshot.val() || {};
    const entries = Object.values(data).sort((a, b) => (b.initiative || 0) - (a.initiative || 0));
    callback(entries);
  });
}

export function watchGame(gameCode, callback) {
  return onValue(ref(db, `games/${gameCode}`), (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });
}

export async function watchOrLoadGame(gameCode) {
  const snapshot = await get(ref(db, `games/${gameCode}`));
  return snapshot.exists() ? snapshot.val() : null;
}

export async function updateGameMeta(gameCode, patch) {
  await update(ref(db, `games/${gameCode}`), patch);
}