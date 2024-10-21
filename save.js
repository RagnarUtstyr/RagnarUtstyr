// Import Firebase modules
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, get, set, remove } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";
import { getRoomKey } from './key.js';

// Firebase configuration
const firebaseConfig = {
    // Your Firebase config here
};

// Initialize Firebase only if it's not already initialized
let app;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

// Initialize the database
const db = getDatabase(app);

// Function to fetch the current list from Firebase
function fetchCurrentListFromFirebase() {
    const roomKey = getRoomKey();
    if (!roomKey) {
        alert('Please set a room key first.');
        return null;
    }

    const reference = ref(db, `rooms/${roomKey}/rankings/`);
    return get(reference)
        .then((snapshot) => {
            if (snapshot.exists()) {
                return snapshot.val();
            } else {
                alert('No current list found in Firebase.');
                return null;
            }
        })
        .catch((error) => {
            console.error('Error fetching current list:', error);
        });
}

// Function to save the current list under a new name in Firebase
function saveList() {
    const listName = document.getElementById('list-name').value.trim();
    if (!listName) {
        alert('Please enter a name for the list.');
        return;
    }

    const roomKey = getRoomKey();
    if (!roomKey) {
        alert('Please set a room key first.');
        return;
    }

    fetchCurrentListFromFirebase().then((currentList) => {
        if (currentList) {
            const newListReference = ref(db, `rooms/${roomKey}/savedLists/${listName}`);
            set(newListReference, { list: currentList })
                .then(() => {
                    alert(`List "${listName}" saved successfully!`);
                    loadSavedLists();
                })
                .catch((error) => {
                    console.error('Error saving the list:', error);
                });
        }
    });
}

// Function to load a selected saved list into group.html
function loadList() {
    const listName = document.getElementById('list-name').value.trim();
    if (!listName) {
        alert('Please enter the name of the list to load.');
        return;
    }

    const roomKey = getRoomKey();
    if (!roomKey) {
        alert('Please set a room key first.');
        return;
    }

    const reference = ref(db, `rooms/${roomKey}/savedLists/${listName}`);
    get(reference)
        .then((snapshot) => {
            if (snapshot.exists()) {
                const savedList = snapshot.val().list;

                const rankingsReference = ref(db, `rooms/${roomKey}/rankings/`);
                set(rankingsReference, savedList)
                    .then(() => {
                        alert(`List "${listName}" loaded successfully! Redirecting to group.html.`);
                        window.location.href = 'group.html';
                    })
                    .catch((error) => {
                        console.error('Error syncing the list:', error);
                    });
            } else {
                alert(`No list found with the name "${listName}".`);
            }
        })
        .catch((error) => {
            console.error('Error fetching saved list:', error);
        });
}

// Function to delete a selected saved list from Firebase
function deleteList() {
    const listName = document.getElementById('list-name').value.trim();
    if (!listName) {
        alert('Please enter the name of the list to delete.');
        return;
    }

    const roomKey = getRoomKey();
    if (!roomKey) {
        alert('Please set a room key first.');
        return;
    }

    const reference = ref(db, `rooms/${roomKey}/savedLists/${listName}`);
    remove(reference)
        .then(() => {
            alert(`List "${listName}" deleted successfully!`);
            loadSavedLists();
        })
        .catch((error) => {
            console.error('Error deleting the list:', error);
        });
}

// Function to load and display all saved lists
function loadSavedLists() {
    const savedListsContainer = document.getElementById('savedLists');
    const roomKey = getRoomKey();
    if (!roomKey) {
        alert('Please set a room key first.');
        return;
    }

    const reference = ref(db, `rooms/${roomKey}/savedLists/`);

    get(reference)
        .then((snapshot) => {
            savedListsContainer.innerHTML = '';
            if (snapshot.exists()) {
                const savedLists = snapshot.val();
                Object.keys(savedLists).forEach((listName) => {
                    const listItem = document.createElement('li');
                    listItem.textContent = listName;
                    listItem.addEventListener('click', () => {
                        document.getElementById('list-name').value = listName;
                    });
                    savedListsContainer.appendChild(listItem);
                });
            } else {
                savedListsContainer.innerHTML = '<li>No saved lists found.</li>';
            }
        })
        .catch((error) => {
            console.error('Error loading saved lists:', error);
        });
}

// Attach event listeners
document.getElementById('save-list-button').addEventListener('click', saveList);
document.getElementById('load-list-button').addEventListener('click', loadList);
document.getElementById('delete-list-button').addEventListener('click', deleteList);

// Load saved lists on page load
document.addEventListener('DOMContentLoaded', loadSavedLists);
