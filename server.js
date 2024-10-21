import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, set, get } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

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

// Function to get the invite key from cookies
function getInviteKeyFromCookies() {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith('inviteKey=')) {
            return cookie.substring('inviteKey='.length);
        }
    }
    return null;
}

// Function to submit monster data to Firebase (used in monster.html and group.html)
async function submitMonsterData() {
    const name = document.getElementById('name').value;
    const initiative = parseInt(document.getElementById('initiative').value);
    const health = document.getElementById('health') ? parseInt(document.getElementById('health').value) : null;
    const ac = document.getElementById('ac') ? parseInt(document.getElementById('ac').value) : null;

    const inviteKey = getInviteKeyFromCookies();
    if (!inviteKey) {
        alert('You must join a room with an invite key before submitting data.');
        return;
    }

    if (name && !isNaN(initiative)) {
        try {
            const reference = ref(db, `rooms/${inviteKey}/data`);
            await push(reference, { name, initiative, health, ac });
            console.log('Monster data submitted:', { name, initiative, health, ac });

            // Clear input fields
            document.getElementById('name').value = '';
            document.getElementById('initiative').value = '';
            if (document.getElementById('health')) document.getElementById('health').value = '';
            if (document.getElementById('ac')) document.getElementById('ac').value = '';

        } catch (error) {
            console.error('Error submitting monster data:', error);
        }
    } else {
        alert('Please enter valid name and initiative values.');
    }
}

// Function to fetch and display rankings (used in group.html and monster.html)
function fetchRankings() {
    const inviteKey = getInviteKeyFromCookies();
    if (!inviteKey) {
        console.error('Invite key not found, cannot fetch room data.');
        return;
    }

    const reference = ref(db, `rooms/${inviteKey}/data`);
    onValue(reference, (snapshot) => {
        const data = snapshot.val();
        const rankingList = document.getElementById('rankingList');
        rankingList.innerHTML = ''; // Clear the list

        if (data) {
            const rankings = Object.entries(data).map(([id, entry]) => ({ id, ...entry }));
            rankings.sort((a, b) => b.initiative - a.initiative); // Sort by initiative

            rankings.forEach(({ id, name, ac, health, initiative }) => {
                const listItem = document.createElement('li');
                listItem.className = 'list-item';

                const nameDiv = document.createElement('div');
                nameDiv.className = 'name';
                nameDiv.textContent = name;
                listItem.appendChild(nameDiv);

                const acDiv = document.createElement('div');
                acDiv.className = 'ac';
                acDiv.textContent = `AC: ${ac ?? 'N/A'}`;
                listItem.appendChild(acDiv);

                const healthDiv = document.createElement('div');
                healthDiv.className = 'health';
                healthDiv.textContent = `HP: ${health ?? 'N/A'}`;
                listItem.appendChild(healthDiv);

                const initiativeDiv = document.createElement('div');
                initiativeDiv.className = 'initiative';
                initiativeDiv.textContent = `Initiative: ${initiative}`;
                listItem.appendChild(initiativeDiv);

                rankingList.appendChild(listItem);
            });
        } else {
            console.log('No data available in the room.');
        }
    });
}

// Function to save the current list (used in save.html)
function saveList() {
    const inviteKey = getInviteKeyFromCookies();
    if (!inviteKey) {
        alert('You must join a room with an invite key before saving a list.');
        return;
    }

    const listName = document.getElementById('list-name').value.trim();
    if (!listName) {
        alert('Please enter a name for the list.');
        return;
    }

    const rankingsRef = ref(db, `rooms/${inviteKey}/data`);
    get(rankingsRef).then((snapshot) => {
        if (snapshot.exists()) {
            const listData = snapshot.val();
            const savedListRef = ref(db, `savedLists/${listName}`);
            set(savedListRef, { list: listData }).then(() => {
                alert(`List "${listName}" saved successfully!`);
            }).catch((error) => {
                console.error('Error saving the list:', error);
            });
        } else {
            alert('No data available in the room to save.');
        }
    }).catch((error) => {
        console.error('Error fetching data for save:', error);
    });
}

// Function to load a saved list into the room (used in save.html)
function loadList() {
    const inviteKey = getInviteKeyFromCookies();
    if (!inviteKey) {
        alert('You must join a room with an invite key before loading a list.');
        return;
    }

    const listName = document.getElementById('list-name').value.trim();
    if (!listName) {
        alert('Please enter the name of the list to load.');
        return;
    }

    const savedListRef = ref(db, `savedLists/${listName}`);
    get(savedListRef).then((snapshot) => {
        if (snapshot.exists()) {
            const savedList = snapshot.val().list;
            const rankingsRef = ref(db, `rooms/${inviteKey}/data`);
            set(rankingsRef, savedList).then(() => {
                alert(`List "${listName}" loaded successfully into the current room.`);
                window.location.href = 'group.html'; // Redirect to group.html to view the list
            }).catch((error) => {
                console.error('Error loading the list into the room:', error);
            });
        } else {
            alert(`No list found with the name "${listName}".`);
        }
    }).catch((error) => {
        console.error('Error fetching saved list:', error);
    });
}

// Function to remove an entry (used in group.html and monster.html)
function removeEntry(id) {
    const inviteKey = getInviteKeyFromCookies();
    if (!inviteKey) {
        console.error('Invite key not found, cannot remove entry.');
        return;
    }

    const reference = ref(db, `rooms/${inviteKey}/data/${id}`);
    remove(reference).then(() => {
        console.log(`Entry ${id} removed from the room.`);
    }).catch((error) => {
        console.error('Error removing entry:', error);
    });
}

// Detect the active page and initialize relevant functions
document.addEventListener('DOMContentLoaded', function () {
    const currentPage = document.body.getAttribute('data-page');

    if (currentPage === 'group' || currentPage === 'monster') {
        // Fetch rankings for both group.html and monster.html
        fetchRankings();

        // Attach event listener for submitting monster data
        const submitButton = document.getElementById('submit-monster-entry');
        if (submitButton) {
            submitButton.addEventListener('click', submitMonsterData);
        }
    }

    if (currentPage === 'save') {
        // Attach event listeners for saving and loading lists in save.html
        const saveButton = document.getElementById('save-list-button');
        const loadButton = document.getElementById('load-list-button');
        if (saveButton) {
            saveButton.addEventListener('click', saveList);
        }
        if (loadButton) {
            loadButton.addEventListener('click', loadList);
        }
    }
});
