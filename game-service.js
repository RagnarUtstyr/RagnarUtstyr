import { db } from "./firebase-config.js";
import {
  ref,
  set,
  get,
  update,
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

function normalizeCode(code) {
  return String(code || "").trim().toUpperCase();
}

function membershipPath(uid, code) {
  return `memberships/${uid}/${code}`;
}

function joinCodePath(code) {
  return `joinCodes/${code}`;
}

export async function createUniqueGameCode(length = 4, maxAttempts = 20) {
  for (let i = 0; i < maxAttempts; i += 1) {
    const code = randomCode(length);
    const snapshot = await get(ref(db, joinCodePath(code)));
    if (!snapshot.exists()) return code;
  }
  throw new Error("Could not generate a unique game code.");
}

export async function createGame({ owner, mode, title }) {
  const code = await createUniqueGameCode();
  const normalizedMode = String(mode || "openlegend").toLowerCase();
  const gameTitle = title?.trim() || `${normalizedMode === "dnd" ? "D&D" : "Open Legend"} Game`;
  const game = {
    code,
    title: gameTitle,
    gameName: gameTitle,
    mode: normalizedMode,
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
  await set(ref(db, membershipPath(owner.uid, code)), {
    gameCode: code,
    role: "admin",
    mode: normalizedMode,
    joinedAt: Date.now()
  });
  await set(ref(db, joinCodePath(code)), {
    code,
    mode: normalizedMode,
    title: game.title,
    ownerUid: owner.uid,
    active: true,
    createdAt: game.createdAt
  });

  return game;
}

export async function joinGame({ user, code }) {
  const normalized = normalizeCode(code);
  const joinSnap = await get(ref(db, joinCodePath(normalized)));
  if (!joinSnap.exists()) {
    throw new Error("Game not found.");
  }

  const joinInfo = joinSnap.val() || {};

  await set(ref(db, `games/${normalized}/members/${user.uid}`), {
    uid: user.uid,
    role: "player",
    name: user.displayName || "Player",
    email: user.email || ""
  });

  await set(ref(db, membershipPath(user.uid, normalized)), {
    gameCode: normalized,
    role: "player",
    mode: joinInfo.mode || "openlegend",
    joinedAt: Date.now()
  });

  const gameSnap = await get(ref(db, `games/${normalized}`));
  if (gameSnap.exists()) return gameSnap.val();

  return {
    code: normalized,
    title: joinInfo.title || "Game",
    mode: joinInfo.mode || "openlegend",
    ownerUid: joinInfo.ownerUid || null
  };
}

export async function leaveCurrentGame(uid) {
  const membershipSnap = await get(ref(db, `memberships/${uid}`));
  if (!membershipSnap.exists()) return;

  const memberships = membershipSnap.val() || {};
  const firstCode = Object.keys(memberships)[0];
  if (!firstCode) return;

  await leaveSpecificGame(uid, firstCode);
}

export async function leaveSpecificGame(uid, gameCode) {
  const normalized = normalizeCode(gameCode);
  const membershipSnap = await get(ref(db, membershipPath(uid, normalized)));
  if (!membershipSnap.exists()) {
    throw new Error("You are not a member of that game.");
  }

  const gameSnap = await get(ref(db, `games/${normalized}`));
  if (!gameSnap.exists()) {
    await remove(ref(db, membershipPath(uid, normalized)));
    return;
  }

  const game = gameSnap.val();

  if (game.ownerUid === uid) {
    throw new Error("The owner cannot leave their own game. Delete it instead.");
  }

  await remove(ref(db, `games/${normalized}/members/${uid}`));
  await remove(ref(db, `games/${normalized}/entries/${uid}`));
  await remove(ref(db, `games/${normalized}/players/${uid}`));
  await remove(ref(db, `games/${normalized}/builderSheetsDnd/${uid}`));
  await remove(ref(db, `games/${normalized}/builderSheets/${uid}`));
  await remove(ref(db, membershipPath(uid, normalized)));
}

export async function deleteGame(ownerUid, gameCode) {
  const normalized = normalizeCode(gameCode);
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
    await remove(ref(db, membershipPath(uid, normalized)));
  }

  await remove(ref(db, joinCodePath(normalized)));
  await remove(gameRef);
}

export async function loadMembership(uid) {
  const membershipSnap = await get(ref(db, `memberships/${uid}`));
  return membershipSnap.exists() ? membershipSnap.val() : {};
}

export function watchOwnedAndJoinedGames(uid, callback) {
  return onValue(ref(db, `memberships/${uid}`), async (snapshot) => {
    const memberships = snapshot.val() || {};
    const codes = Object.keys(memberships);

    if (!codes.length) {
      callback([]);
      return;
    }

    const games = await Promise.all(codes.map(async (code) => {
      const gameSnap = await get(ref(db, `games/${code}`));
      if (!gameSnap.exists()) return null;
      return gameSnap.val();
    }));

    callback(
      games
        .filter(Boolean)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    );
  });
}

export async function submitInitiative({ gameCode, user, initiative, name }) {
  const entriesRef = ref(db, `games/${normalizeCode(gameCode)}/entries/${user.uid}`);
  const entry = {
    uid: user.uid,
    playerName: name?.trim() || user.displayName || "Player",
    initiative: Number(initiative),
    updatedAt: Date.now()
  };
  await set(entriesRef, entry);
}

export async function removePlayerEntry(gameCode, uid) {
  await remove(ref(db, `games/${normalizeCode(gameCode)}/entries/${uid}`));
}

export function watchEntries(gameCode, callback) {
  return onValue(ref(db, `games/${normalizeCode(gameCode)}/entries`), (snapshot) => {
    const data = snapshot.val() || {};
    const entries = Object.values(data).sort((a, b) => (b.initiative || 0) - (a.initiative || 0));
    callback(entries);
  });
}

export function watchGame(gameCode, callback) {
  return onValue(ref(db, `games/${normalizeCode(gameCode)}`), (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });
}

export async function watchOrLoadGame(gameCode) {
  const snapshot = await get(ref(db, `games/${normalizeCode(gameCode)}`));
  return snapshot.exists() ? snapshot.val() : null;
}

export async function updateGameMeta(gameCode, patch) {
  const normalized = normalizeCode(gameCode);
  await update(ref(db, `games/${normalized}`), patch);

  const title = typeof patch?.title === "string" ? patch.title.trim() : null;
  if (title) {
    await update(ref(db, joinCodePath(normalized)), { title });
  }
}
