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
            const entry = { name, number };
            if (health !== null) entry.health = health;
            if (grd !== undefined) entry.grd = grd;
            if (res !== undefined) entry.res = res;
            if (tgh !== undefined) entry.tgh = tgh;

            const rankingsRef = ref(db, 'rankings/');
            const monsterRef = ref(db, 'OpenLegendMonster/');

            // Save to both locations
            await push(rankingsRef, entry);
            await push(monsterRef, entry);
            console.log('Data submitted to rankings and OpenLegendMonster:', entry);

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
    } else {
        console.log('Please enter a valid name and initiative number.');
    }
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

// Page setup
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('submit-button')) {
        document.getElementById('submit-button').addEventListener('click', submitData);
    }
});