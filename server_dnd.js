import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, set } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

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

// Initialize Firebase only once
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getDatabase(app);

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

// Function to submit data to Firebase
async function submitData() {
    const name = document.getElementById('name')?.value?.trim();
    const initiativeEl = document.getElementById('initiative') || document.getElementById('number');
    const number = initiativeEl ? parseInt(initiativeEl.value, 10) : NaN;

    const healthRaw = document.getElementById('health')?.value ?? "";
    const acRaw = document.getElementById('ac')?.value ?? "";

    const health = healthRaw !== "" ? parseInt(healthRaw, 10) : null;
    const ac = acRaw !== "" ? parseInt(acRaw, 10) : null;

    if (!name || Number.isNaN(number)) {
        console.log('Please enter valid name and initiative values.');
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

        document.getElementById('name').value = '';
        if (initiativeEl) initiativeEl.value = '';
        if (document.getElementById('health')) document.getElementById('health').value = '';
        if (document.getElementById('ac')) document.getElementById('ac').value = '';

        const swordSound = document.getElementById('sword-sound');
        if (swordSound) swordSound.play();
    } catch (error) {
        console.error('Error submitting data:', error);
    }
}

// Function to fetch and display rankings
function fetchRankings() {
    const reference = ref(db, getEntriesPath());

    onValue(reference, (snapshot) => {
        const data = snapshot.val();
        const rankingList = document.getElementById('rankingList');
        rankingList.innerHTML = '';

        if (!data) {
            console.log('No data available');
            return;
        }

        const rankings = Object.entries(data)
            .map(([id, entry]) => normalizeEntry(id, entry))
            .sort((a, b) => (b.number || 0) - (a.number || 0));

        rankings.forEach(({ id, name, health, ac }) => {
            const listItem = document.createElement('li');

            const nameDiv = document.createElement('div');
            nameDiv.className = 'name';
            nameDiv.textContent =
                ac !== null && ac !== undefined ? `${name} (AC: ${ac})` : name;

            const healthDiv = document.createElement('div');
            healthDiv.className = 'health';
            healthDiv.textContent =
                health !== null && health !== undefined ? `HP: ${health}` : '';

            const removeButton = document.createElement('button');
            removeButton.textContent = 'Remove';
            removeButton.addEventListener('click', () => removeEntry(id));

            listItem.appendChild(nameDiv);
            if (healthDiv.textContent !== '') {
                listItem.appendChild(healthDiv);
            }
            listItem.appendChild(removeButton);

            rankingList.appendChild(listItem);
        });
    }, (error) => {
        console.error('Error fetching data:', error);
    });
}

// Function to remove an entry from Firebase
function removeEntry(id) {
    const reference = ref(db, `${getEntriesPath()}/${id}`);
    remove(reference)
        .then(() => {
            console.log(`Entry with id ${id} removed successfully`);
        })
        .catch((error) => {
            console.error('Error removing entry:', error);
        });
}

// Function to clear all entries from this room only
function clearAllEntries() {
    const reference = ref(db, getEntriesPath());
    set(reference, null)
        .then(() => {
            console.log('All room entries removed successfully');
            const rankingList = document.getElementById('rankingList');
            rankingList.innerHTML = '';
        })
        .catch((error) => {
            console.error('Error clearing all room entries:', error);
        });
}

// Event listeners for page-specific actions
document.addEventListener('DOMContentLoaded', () => {
    try {
        getEntriesPath();
    } catch (error) {
        console.error(error);
        return;
    }

    if (document.getElementById('submit-button')) {
        document.getElementById('submit-button').addEventListener('click', submitData);
    }
    if (document.getElementById('rankingList')) {
        fetchRankings();
    }
    if (document.getElementById('clear-list-button')) {
        document.getElementById('clear-list-button').addEventListener('click', clearAllEntries);
    }
});