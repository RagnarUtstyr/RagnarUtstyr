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

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getDatabase(app);

function getGameCode() {
    const params = new URLSearchParams(window.location.search);
    return (params.get("code") || "").trim().toUpperCase();
}

function getEntriesPath() {
    const code = getGameCode();
    if (!code) {
        throw new Error("Missing game code in URL.");
    }
    return `games/${code}/entries`;
}

// Function to submit data to Firebase
async function submitData() {
    const name = document.getElementById('name').value;
    const number = parseInt(
        document.getElementById('initiative')
            ? document.getElementById('initiative').value
            : document.getElementById('number').value,
        10
    );

    const healthInput = document.getElementById('health')
        ? document.getElementById('health').value
        : null;
    const health = healthInput !== '' && healthInput !== null ? parseInt(healthInput, 10) : null;

    const acInput = document.getElementById('ac')
        ? document.getElementById('ac').value
        : null;
    const ac = acInput !== '' && acInput !== null ? parseInt(acInput, 10) : null;

    if (name && !isNaN(number)) {
        try {
            const reference = ref(db, getEntriesPath());
            await push(reference, { name, number, health, ac });

            document.getElementById('name').value = '';
            document.getElementById('initiative')
                ? document.getElementById('initiative').value = ''
                : document.getElementById('number').value = '';
            if (document.getElementById('health')) document.getElementById('health').value = '';
            if (document.getElementById('ac')) document.getElementById('ac').value = '';

            const swordSound = document.getElementById('sword-sound');
            if (swordSound) swordSound.play();
        } catch (error) {
            console.error('Error submitting data:', error);
        }
    } else {
        console.log('Please enter valid name and initiative values.');
    }
}

// Function to fetch and display rankings
function fetchRankings() {
    const reference = ref(db, getEntriesPath());

    onValue(reference, (snapshot) => {
        const data = snapshot.val();
        const rankingList = document.getElementById('rankingList');
        rankingList.innerHTML = '';

        if (data) {
            const rankings = Object.entries(data).map(([id, entry]) => ({ id, ...entry }));
            rankings.sort((a, b) => (b.number || 0) - (a.number || 0));

            rankings.forEach(({ id, name, number, health, ac }) => {
                const listItem = document.createElement('li');

                const nameDiv = document.createElement('div');
                nameDiv.className = 'name';
                nameDiv.textContent = ac !== null && ac !== undefined
                    ? `${name} (AC: ${ac})`
                    : name;

                const healthDiv = document.createElement('div');
                healthDiv.className = 'health';
                healthDiv.textContent = health !== null && health !== undefined ? `HP: ${health}` : '';

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
        } else {
            console.log('No data available');
        }
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
            console.error('Error clearing room entries:', error);
        });
}

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