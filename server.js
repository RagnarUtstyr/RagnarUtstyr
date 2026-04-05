// Import necessary Firebase modules from the SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, push, remove } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

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

function getGameCode() {
    const params = new URLSearchParams(window.location.search);
    return (params.get("code") || "").trim().toUpperCase();
}

function getEntriesPath() {
    const code = getGameCode();
    if (!code) throw new Error("Missing game code in URL.");
    return `games/${code}/entries`;
}

// Function to submit data to Firebase
async function submitData() {
    const name = document.getElementById('name')?.value?.trim();
    const numberInput = document.getElementById('initiative') || document.getElementById('number');
    const number = numberInput ? parseInt(numberInput.value, 10) : null;

    const healthInput = document.getElementById('health');
    const health = healthInput && healthInput.value !== '' ? parseInt(healthInput.value, 10) : null;

    const grdInput = document.getElementById('grd');
    const resInput = document.getElementById('res');
    const tghInput = document.getElementById('tgh');

    const grd = grdInput ? (grdInput.value !== '' ? parseInt(grdInput.value, 10) : null) : undefined;
    const res = resInput ? (resInput.value !== '' ? parseInt(resInput.value, 10) : null) : undefined;
    const tgh = tghInput ? (tghInput.value !== '' ? parseInt(tghInput.value, 10) : null) : undefined;

    if (!name || isNaN(number)) {
        console.log('Please enter a valid name and initiative number.');
        return;
    }

    try {
        const entry = {
            name,
            number,
            initiative: number,
            updatedAt: Date.now()
        };

        if (health !== null) entry.health = health;
        if (grd !== undefined) entry.grd = grd;
        if (res !== undefined) entry.res = res;
        if (tgh !== undefined) entry.tgh = tgh;

        const entriesRef = ref(db, getEntriesPath());
        await push(entriesRef, entry);

        console.log('Data submitted to room entries:', entry);

        // Clear inputs
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

// Page setup
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('submit-button')) {
        document.getElementById('submit-button').addEventListener('click', submitData);
    }
});