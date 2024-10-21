import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, push, onValue, set, remove } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

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

// Function to submit data to Firebase
async function submitData() {
    const name = document.getElementById('name').value;
    const number = parseInt(document.getElementById('initiative') ? document.getElementById('initiative').value : document.getElementById('number').value);
    const healthInput = document.getElementById('health') ? document.getElementById('health').value : null; // Handle optional Health field
    const health = healthInput !== '' && healthInput !== null ? parseInt(healthInput) : null; // Handle empty health as null if present

    const acInput = document.getElementById('ac') ? document.getElementById('ac').value : null; // Handle optional AC field
    const ac = acInput !== '' && acInput !== null ? parseInt(acInput) : null;

    // Retrieve the invite key from cookies
    const inviteKey = getInviteKeyFromCookies();
    if (!inviteKey) {
        alert('You must join a room with an invite key before submitting data.');
        return;
    }

    // Ensure name and initiative are valid, health and ac can be null
    if (name && !isNaN(number)) {
        try {
            const reference = ref(db, `rooms/${inviteKey}/data`);
            await push(reference, { name, number, health, ac });
            console.log('Data submitted successfully:', { name, number, health, ac });

            // Clear input fields after successful submission
            document.getElementById('name').value = '';
            if (document.getElementById('initiative')) document.getElementById('initiative').value = '';
            if (document.getElementById('health')) document.getElementById('health').value = '';
            if (document.getElementById('ac')) document.getElementById('ac').value = '';

            // Optionally, play a sound or trigger a visual feedback
            const swordSound = document.getElementById('sword-sound');
            if (swordSound) {
                swordSound.play();
            }
        } catch (error) {
            console.error('Error submitting data:', error);
        }
    } else {
        console.log('Please enter valid name and initiative values.');
    }
}

// Function to fetch and display rankings (specific to the room)
function fetchRankings() {
    const inviteKey = getInviteKeyFromCookies();
    if (!inviteKey) {
        console.error('Invite key not found in cookies, cannot fetch room data.');
        return;
    }

    const reference = ref(db, `rooms/${inviteKey}/data`);
    onValue(reference, (snapshot) => {
        const data = snapshot.val();
        const rankingList = document.getElementById('rankingList');
        rankingList.innerHTML = ''; // Clear the list

        if (data) {
            // Convert the data into an array and sort by initiative (number)
            const rankings = Object.entries(data).map(([id, entry]) => ({ id, ...entry }));
            rankings.sort((a, b) => b.number - a.number); // Sort by initiative (number)

            rankings.forEach(({ id, name, ac, health }) => {
                const listItem = document.createElement('li');
                listItem.className = 'list-item';

                const nameDiv = document.createElement('div');
                nameDiv.className = 'name';
                nameDiv.textContent = name;
                listItem.appendChild(nameDiv);

                const acDiv = document.createElement('div');
                acDiv.className = 'ac';
                acDiv.textContent = `AC: ${ac !== null ? ac : 'N/A'}`;
                listItem.appendChild(acDiv);

                const healthDiv = document.createElement('div');
                healthDiv.className = 'health';
                healthDiv.textContent = `HP: ${health !== null ? health : 'N/A'}`;
                listItem.appendChild(healthDiv);

                rankingList.appendChild(listItem);
            });
        } else {
            console.log('No data available in the room.');
        }
    });
}

// Function to remove an entry from Firebase
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

// Function to clear the entire list
function clearList() {
    const inviteKey = getInviteKeyFromCookies();
    if (!inviteKey) {
        console.error('Invite key not found, cannot clear the list.');
        return;
    }

    const reference = ref(db, `rooms/${inviteKey}/data`);
    remove(reference).then(() => {
        console.log('Room data cleared successfully.');
    }).catch((error) => {
        console.error('Error clearing room data:', error);
    });
}

// Attach event listeners when the page loads
document.addEventListener('DOMContentLoaded', function () {
    // Fetch and display rankings
    fetchRankings();

    // Attach event listener for clearing the list
    const clearListButton = document.getElementById('clear-list-button');
    if (clearListButton) {
        clearListButton.addEventListener('click', clearList);
    }
});
