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
    const name = document.getElementById('name')?.value;
    const numberInput = document.getElementById('initiative') || document.getElementById('number');
    const number = numberInput ? parseInt(numberInput.value) : null;

    const healthInput = document.getElementById('health');
    const health = healthInput && healthInput.value !== '' ? parseInt(healthInput.value) : null;

    const grdInput = document.getElementById('grd');
    const resInput = document.getElementById('res');
    const tghInput = document.getElementById('tgh');

    const grd = grdInput ? (grdInput.value !== '' ? parseInt(grdInput.value) : null) : undefined;
    const res = resInput ? (resInput.value !== '' ? parseInt(resInput.value) : null) : undefined;
    const tgh = tghInput ? (tghInput.value !== '' ? parseInt(tghInput.value) : null) : undefined;

    if (name && !isNaN(number)) {
        try {
            const reference = ref(db, 'rankings/');

            const entry = { name, number };
            if (health !== null) entry.health = health;
            if (grd !== undefined) entry.grd = grd;
            if (res !== undefined) entry.res = res;
            if (tgh !== undefined) entry.tgh = tgh;

            await push(reference, entry);
            console.log('Data submitted:', entry);

            // Clear inputs that exist on the page
            document.getElementById('name').value = '';
            if (numberInput) numberInput.value = '';
            if (healthInput) healthInput.value = '';
            if (grdInput) grdInput.value = '';
            if (resInput) resInput.value = '';
            if (tghInput) tghInput.value = '';

            // Play sword sound if available
            const swordSound = document.getElementById('sword-sound');
            if (swordSound) swordSound.play();

        } catch (error) {
            console.error('Error submitting data:', error);
        }
    } else {
        console.log('Please enter a valid name and initiative number.');
    }
}

// Function to fetch and display rankings
function fetchRankings() {
    const reference = ref(db, 'rankings/');
    onValue(reference, (snapshot) => {
        const data = snapshot.val();
        const rankingList = document.getElementById('rankingList');
        if (!rankingList) return;

        rankingList.innerHTML = '';

        if (data) {
            const rankings = Object.entries(data).map(([id, entry]) => ({ id, ...entry }));
            rankings.sort((a, b) => b.number - a.number);

            rankings.forEach(({ id, name, number, health, grd, res, tgh }) => {
                const listItem = document.createElement('li');

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
            if (rankingList) rankingList.innerHTML = '';
        })
        .catch((error) => {
            console.error('Error clearing all entries:', error);
        });
}

// Page setup
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
