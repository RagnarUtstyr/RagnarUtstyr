// Import necessary Firebase modules from the SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, push, set } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function submitData() {
    const name = document.getElementById('name')?.value;
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

    if (name && !isNaN(number)) {
        try {
            const entry = { name, number };
            if (health !== null) entry.health = health;
            if (grd !== undefined) entry.grd = grd;
            if (res !== undefined) entry.res = res;
            if (tgh !== undefined) entry.tgh = tgh;

            const rankingsRef = ref(db, 'rankings/');
            const monsterRef = ref(db, 'OpenLegendMonster/');
            await push(rankingsRef, entry);
            await push(monsterRef, entry);

            document.getElementById('name').value = '';
            if (numberInput) numberInput.value = '';
            if (healthInput) healthInput.value = '';
            if (grdInput) grdInput.value = '';
            if (resInput) resInput.value = '';
            if (tghInput) tghInput.value = '';
        } catch (error) {
            console.error('Error submitting data:', error);
        }
    } else {
        console.log('Please enter a valid name and initiative number.');
    }
}

function clearAllEntries() {
    const reference = ref(db, 'rankings/');
    set(reference, null).catch((error) => {
        console.error('Error clearing all entries:', error);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('submit-button')?.addEventListener('click', submitData);
    document.getElementById('clear-list-button')?.addEventListener('click', clearAllEntries);
});
