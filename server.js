// Import necessary Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, set } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";


// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyD_4kINWig7n6YqB11yM2M-EuxGNz5uekI",
    authDomain: "roll202-c0b0d.firebaseapp.com",
    databaseURL: "https://roll202-c0b0d-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "roll202-c0b0d",
    storageBucket: "roll202-c0b0d.appspot.com",
    messagingSenderId: "607661730400",
    appId: "1:607661730400:web:b4b3f97a12cfae373e7105",
    measurementId: "G-6X5L39W56C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
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

// Generate a random lobby key
function generateLobbyKey() {
    return 'lobby-' + Math.random().toString(36).substr(2, 9);
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
        // Update the DOM with the latest rankings
        displayRankings(data);
    });
}

// Function to submit data to Firebase (characters/monsters)
export async function submitData() {
    const name = document.getElementById('name').value;
    const initiative = parseInt(document.getElementById('initiative').value);
    const health = parseInt(document.getElementById('health').value);
    const ac = parseInt(document.getElementById('ac').value);

    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const lobbyKey = await getActiveLobbyKey(user.uid); // Retrieve the active lobby key for this user
            if (lobbyKey && name && !isNaN(initiative)) {
                const rankingRef = ref(db, `lobbies/${lobbyKey}/rankings`);
                await push(rankingRef, { name, initiative, health, ac });
                console.log('Data submitted successfully:', { name, initiative, health, ac });

                // Clear input fields after successful submission
                document.getElementById('name').value = '';
                document.getElementById('initiative').value = '';
                document.getElementById('health').value = '';
                document.getElementById('ac').value = '';
            } else {
                console.log('Please enter valid values.');
            }
        }
    });
}

// Function to get the active lobby key for the logged-in user (GM or player)
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

// Function to fetch and display rankings for the GM
export function fetchRankingsForGM() {
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const lobbyKey = await getActiveLobbyKey(user.uid);
            fetchRankings(lobbyKey);
        }
    });
}

// Function to remove an entry from Firebase
export function removeEntry(id) {
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const lobbyKey = await getActiveLobbyKey(user.uid);
            const entryRef = ref(db, `lobbies/${lobbyKey}/rankings/${id}`);
            await remove(entryRef);
            console.log(`Entry with id ${id} removed successfully`);
        }
    });
}

// Function to clear all entries from Firebase
export function clearAllEntries() {
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const lobbyKey = await getActiveLobbyKey(user.uid);
            const rankingsRef = ref(db, `lobbies/${lobbyKey}/rankings`);
            await set(rankingsRef, null); // Deletes all data in 'rankings'
            console.log('All entries removed successfully');
            // Clear the displayed list immediately
            document.getElementById('rankingList').innerHTML = ''; // Clear the UI
        }
    });
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