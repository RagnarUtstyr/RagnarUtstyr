import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, push, set, onValue, get, remove } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

// Firebase configuration
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

// Initialize Firebase App only if it hasn’t been initialized yet
let app;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApps()[0]; // Use the already initialized app
}

const db = getDatabase(app);
const auth = getAuth(app);

// Function to create a lobby for the Game Master (GM)
export async function createLobby() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const gmId = user.uid;
            const lobbyKey = generateLobbyKey();
            const lobbyRef = ref(db, `lobbies/${lobbyKey}`);
            
            await set(lobbyRef, { gmId, players: {}, rankings: {} });  // Create lobby with empty players and rankings

            // Display invite key on the page
            document.getElementById('lobbyKey').textContent = `Invite Key: ${lobbyKey}`;
            console.log('Lobby created:', lobbyKey);
        }
    });
}

// Generate a random lobby key (ensure it's unique)
function generateLobbyKey() {
    return 'lobby-' + Math.random().toString(36).substr(2, 9); // Example: 'lobby-x5zgkfg'
}

// Function to create a new lobby
export async function createLobby() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const gmId = user.uid; // Get the Game Master's user ID
            const lobbyKey = generateLobbyKey(); // Generate a unique lobby key
            
            // Reference to the lobby in Firebase under "lobbies"
            const lobbyRef = ref(db, `lobbies/${lobbyKey}`);
            
            // Set the initial lobby data (with the GM ID and empty players and rankings)
            await set(lobbyRef, {
                gmId: gmId,
                players: {}, // Empty object for players to join
                rankings: {} // Empty object for rankings or initiatives
            });

            // Display the lobby key on the GM's dashboard (in group.html)
            const lobbyKeyElement = document.getElementById('lobbyKey');
            if (lobbyKeyElement) {
                lobbyKeyElement.textContent = `Invite Key: ${lobbyKey}`;
            }

            console.log(`Lobby created with key: ${lobbyKey}`);
        } else {
            console.log('No user is logged in.');
        }
    });
}

// Function for players to join a lobby using an invite key
export async function joinLobby(lobbyKey) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const playerId = user.uid;
            const lobbyRef = ref(db, `lobbies/${lobbyKey}/players/${playerId}`);

            await set(lobbyRef, { playerId });
            console.log(`Player ${playerId} joined lobby ${lobbyKey}`);
            
            window.location.href = 'group.html';  // Redirect to group page after joining
        }
    });
}

// Fetch rankings and sync with Firebase
export function fetchRankings(lobbyKey) {
    const rankingListRef = ref(db, `lobbies/${lobbyKey}/rankings`);
    onValue(rankingListRef, (snapshot) => {
        const data = snapshot.val();
        displayRankings(data);  // Update the UI with the rankings
    });
}

// Add a new entry (monster or character) to the active lobby
export async function addToLobby(monsterData) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const lobbyKey = await getActiveLobbyKey(user.uid);
            if (lobbyKey) {
                const rankingRef = ref(db, `lobbies/${lobbyKey}/rankings`);
                await push(rankingRef, monsterData);
                console.log('Monster added to lobby:', monsterData);
            }
        }
    });
}

// Utility function to get the current active lobby key for the user
async function getActiveLobbyKey(uid) {
    const lobbiesRef = ref(db, `lobbies`);
    const snapshot = await get(lobbiesRef);
    const lobbies = snapshot.val();

    for (const lobbyKey in lobbies) {
        if (lobbies[lobbyKey].gmId === uid || lobbies[lobbyKey].players[uid]) {
            return lobbyKey;  // Return the lobby the user belongs to
        }
    }

    return null;  // No active lobby found
}

// Function to display rankings on the UI
function displayRankings(rankings) {
    const rankingList = document.getElementById('rankingList');
    rankingList.innerHTML = ''; // Clear the current list

    if (rankings) {
        const sortedRankings = Object.entries(rankings).sort((a, b) => b[1].initiative - a[1].initiative);
        sortedRankings.forEach(([id, entry]) => {
            const listItem = document.createElement('li');
            listItem.textContent = `${entry.name} (Initiative: ${entry.initiative}, AC: ${entry.ac}, HP: ${entry.health})`;

            const removeButton = document.createElement('button');
            removeButton.textContent = 'Remove';
            removeButton.addEventListener('click', () => removeEntry(id));

            listItem.appendChild(removeButton);
            rankingList.appendChild(listItem);
        });
    }
}
