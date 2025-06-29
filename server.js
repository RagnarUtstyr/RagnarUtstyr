// Import necessary Firebase modules from the SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Function to submit data to Firebase
async function submitData() {
    const name = document.getElementById('name').value;
    const number = parseInt(document.getElementById('initiative') ? document.getElementById('initiative').value : document.getElementById('number').value);
    const healthInput = document.getElementById('health')?.value;
    const health = healthInput !== '' && healthInput !== null ? parseInt(healthInput) : null;

    const grdInput = document.getElementById('grd')?.value;
    const resInput = document.getElementById('res')?.value;
    const tghInput = document.getElementById('tgh')?.value;

    const grd = grdInput !== '' ? parseInt(grdInput) : null;
    const res = resInput !== '' ? parseInt(resInput) : null;
    const tgh = tghInput !== '' ? parseInt(tghInput) : null;

    // Ensure name and number are valid
    if (name && !isNaN(number)) {
        try {
            const reference = ref(db, 'rankings/');
            await push(reference, { name, number, health, grd, res, tgh });
            console.log('Data submitted successfully:', { name, number, health, grd, res, tgh });

            // Clear input fields after successful submission
            document.getElementById('name').value = '';
            if (document.getElementById('initiative')) document.getElementById('initiative').value = '';
            if (document.getElementById('number')) document.getElementById('number').value = '';
            if (document.getElementById('health')) document.getElementById('health').value = '';
            if (document.getElementById('grd')) document.getElementById('grd').value = '';
            if (document.getElementById('res')) document.getElementById('res').value = '';
            if (document.getElementById('tgh')) document.getElementById('tgh').value = '';

            // Play sword sound after submission
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
    const reference = ref(db, 'rankings/');
    onValue(reference, (snapshot) => {
        const data = snapshot.val();
        const rankingList = document.getElementById('rankingList');
        rankingList.innerHTML = '';

        if (data) {
            const rankings = Object.entries(data).map(([id, entry]) => ({ id, ...entry }));
            rankings.sort((a, b) => b.number - a.number);

            rankings.forEach(({ id, name, number, health, grd, res, tgh }) => {
                const listItem = document.createElement('li');

                // Name + GRD/RES/TGH display
                const nameDiv = document.createElement('div');
                nameDiv.className = 'name';
                nameDiv.textContent = `${name} (GRD: ${grd ?? 'N/A'}, RES: ${res ?? 'N/A'}, TGH: ${tgh ?? 'N/A'})`;

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
    const reference = ref(db, `rankings/${id}`);
    remove(reference)
        .then(() => {
            console.log(`Entry with id ${id} removed successfully`);
        })
        .catch((error) => {
            console.error('Error removing entry:', error);
        });
}

// Function to clear all entries from Firebase
function clearAllEntries() {
    const reference = ref(db, 'rankings/');
    set(reference, null)
        .then(() => {
            console.log('All entries removed successfully');
            const rankingList = document.getElementById('rankingList');
            rankingList.innerHTML = '';
        })
        .catch((error) => {
            console.error('Error clearing all entries:', error);
        });
}

// Event listeners for page-specific actions
document.addEventListener('DOMContentLoaded', () => {
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
