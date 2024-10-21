import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, set, get } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

// Firebase Configuration (from your original code)
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

// Initialize Firebase App (ensure only one initialization)
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Function to retrieve the invite key from cookies
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

// Function to submit data to the Firebase room based on the invite key (used for both monster and player entries)
async function submitEntry(data) {
    const inviteKey = getInviteKeyFromCookies();
    if (!inviteKey) {
        alert('You must join a room with an invite key before submitting data.');
        return;
    }

    const reference = ref(db, `rooms/${inviteKey}/data`);
    try {
        await push(reference, data);
        console.log('Data submitted successfully:', data);
    } catch (error) {
        console.error('Error submitting data:', error);
    }
}

// Function to fetch data from the room and display it in the appropriate list (used for rankings, monsters, etc.)
function fetchRoomData(callback) {
    const inviteKey = getInviteKeyFromCookies();
    if (!inviteKey) {
        console.error('Invite key not found in cookies, cannot fetch room data.');
        return;
    }

    const reference = ref(db, `rooms/${inviteKey}/data`);
    onValue(reference, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            callback(data);
        } else {
            console.log('No data available in the room.');
        }
    });
}

// Function to remove an entry from the room in Firebase
function removeEntry(id) {
    const inviteKey = getInviteKeyFromCookies();
    if (!inviteKey) {
        console.error('Invite key not found, cannot remove entry.');
        return;
    }

    const reference = ref(db, `rooms/${inviteKey}/data/${id}`);
    remove(reference).then(() => {
        console.log(`Entry "${id}" removed successfully.`);
    }).catch((error) => {
        console.error('Error removing entry:', error);
    });
}

// Saving the current room's data (save.html page)
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
        console.error('Error fetching data for saving:', error);
    });
}

// Loading a saved list into the current room (save.html page)
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

// Attach event listeners for different pages
document.addEventListener('DOMContentLoaded', function () {
    const currentPage = document.body.getAttribute('data-page');

    if (currentPage === 'group' || currentPage === 'monster') {
        // Fetch and display room data (rankings or monster entries)
        fetchRoomData((data) => {
            const rankingList = document.getElementById('rankingList');
            rankingList.innerHTML = ''; // Clear the list

            const entries = Object.entries(data).map(([id, entry]) => ({ id, ...entry }));
            entries.sort((a, b) => b.initiative - a.initiative); // Sort by initiative (descending)

            entries.forEach(({ id, name, ac, health, initiative }) => {
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
        });

        // Attach submit event to the button for adding a monster entry
        const submitButton = document.getElementById('submit-monster-entry');
        if (submitButton) {
            submitButton.addEventListener('click', () => {
                const name = document.getElementById('name').value;
                const initiative = parseInt(document.getElementById('initiative').value);
                const health = document.getElementById('health') ? parseInt(document.getElementById('health').value) : null;
                const ac = document.getElementById('ac') ? parseInt(document.getElementById('ac').value) : null;

                if (name && !isNaN(initiative)) {
                    submitEntry({ name, initiative, health, ac });
                } else {
                    alert('Please provide valid name and initiative values.');
                }
            });
        }
    }

    if (currentPage === 'save') {
        // Attach event listeners for saving and loading lists
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
