// Import necessary Firebase modules from the SDK
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

// Function to check if the user is logged in
function getRoomKey() {
    const roomKey = localStorage.getItem('roomKey');
    if (!roomKey) {
        alert('You must log in with a room key.');
        window.location.href = 'index.html'; // Redirect to login if no room key
    }
    return roomKey;
}

// Function to submit data to Firebase
async function submitData() {
    const name = document.getElementById('name').value;
    const initiative = parseInt(document.getElementById('initiative') ? document.getElementById('initiative').value : document.getElementById('number').value);
    const healthInput = document.getElementById('health') ? document.getElementById('health').value : null; // Handle optional Health field
    const health = healthInput !== '' && healthInput !== null ? parseInt(healthInput) : null; // Handle empty health as null if present
    const acInput = document.getElementById('ac') ? document.getElementById('ac').value : null; // Handle optional AC field
    const ac = acInput !== '' && acInput !== null ? parseInt(acInput) : null;

    // Ensure name and initiative are valid
    if (name && !isNaN(initiative)) {
        const roomKey = getRoomKey(); // Get the current room key
        const reference = ref(db, `rankings/${roomKey}`); // Use room-specific reference
        
        try {
            await push(reference, { name, initiative, health, ac });
            console.log('Data submitted successfully:', { name, initiative, health, ac });
            
            // Clear the input fields after successful submission
            document.getElementById('name').value = '';
            document.getElementById('initiative') ? document.getElementById('initiative').value = '' : document.getElementById('number').value = '';
            if (document.getElementById('health')) document.getElementById('health').value = '';
            if (document.getElementById('ac')) document.getElementById('ac').value = '';
        } catch (error) {
            console.error('Error submitting data:', error);
        }
    } else {
        alert('Please enter valid name and initiative values.');
    }
}

// Function to fetch and display rankings from Firebase
function fetchRankings() {
    const roomKey = getRoomKey(); // Ensure the user is logged in
    const reference = ref(db, `rankings/${roomKey}`); // Fetch rankings for the current room

    onValue(reference, (snapshot) => {
        const data = snapshot.val();
        const rankingList = document.getElementById('rankingList');
        rankingList.innerHTML = ''; // Clear current rankings

        if (data) {
            // Convert Firebase data to an array for easier manipulation and sorting
            const rankings = Object.entries(data).map(([id, entry]) => ({ id, ...entry }));
            rankings.sort((a, b) => b.initiative - a.initiative); // Sort by initiative (number)

            // Populate the list with ranking data
            rankings.forEach(({ id, name, initiative, health, ac }) => {
                const listItem = document.createElement('li');
                
                const nameText = `${name} (Initiative: ${initiative}`;
                const acText = ac !== null ? `, AC: ${ac}` : '';
                const healthText = health !== null ? `, HP: ${health}` : '';
                listItem.textContent = `${nameText}${acText}${healthText})`;

                // Remove button for each item
                const removeButton = document.createElement('button');
                removeButton.textContent = 'Remove';
                removeButton.addEventListener('click', () => removeEntry(id));

                listItem.appendChild(removeButton);
                rankingList.appendChild(listItem);
            });
        }
    });
}

// Function to remove an entry from Firebase
function removeEntry(id) {
    const roomKey = getRoomKey(); // Get the room key
    const reference = ref(db, `rankings/${roomKey}/${id}`); // Reference to the specific entry

    remove(reference)
        .then(() => {
            console.log(`Entry with ID: ${id} removed successfully.`);
        })
        .catch((error) => {
            console.error('Error removing entry:', error);
        });
}

// Function to check if the room key exists (used for login validation)
async function validateRoomKey(roomKey) {
    const reference = ref(db, `rankings/${roomKey}`);
    const snapshot = await get(reference);
    return snapshot.exists(); // Return whether the room key exists
}

// Function to save a list in Firebase under the current room
function saveList(listName, listData) {
    const roomKey = getRoomKey(); // Ensure the user is logged in
    const reference = ref(db, `savedLists/${roomKey}/${listName}`); // Save under the room's list name

    set(reference, listData)
        .then(() => {
            alert(`List "${listName}" saved successfully.`);
        })
        .catch((error) => {
            console.error('Error saving list:', error);
        });
}

// Function to load a saved list from Firebase
function loadList(listName) {
    const roomKey = getRoomKey(); // Ensure the user is logged in
    const reference = ref(db, `savedLists/${roomKey}/${listName}`);

    get(reference)
        .then((snapshot) => {
            if (snapshot.exists()) {
                const listData = snapshot.val();
                // Handle the list data here, e.g., populate the UI with the list
                alert(`List "${listName}" loaded successfully.`);
                // Load data into the UI as needed
            } else {
                alert(`No list found with the name "${listName}".`);
            }
        })
        .catch((error) => {
            console.error('Error loading list:', error);
        });
}
