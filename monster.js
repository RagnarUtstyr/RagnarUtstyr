// Import necessary Firebase modules from the SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

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

// Function to handle adding a monster to the list
function addToList(name, health, url, ac) {
    console.log(`Adding monster: ${name} with HP: ${health}, AC: ${ac}, and URL: ${url}`);
    const initiative = prompt(`Enter initiative for ${name}:`);
    if (initiative !== null && !isNaN(initiative)) {
        submitMonsterToFirebase(name, parseInt(initiative), health, ac, url);
    } else {
        alert('Please enter a valid initiative number.');
    }
}

// Function to submit data to Firebase
async function submitMonsterToFirebase(name, initiative, health, ac, url) {
    try {
        console.log('Attempting to push data to Firebase...');
        const reference = ref(db, 'rankings/');
        const newEntryRef = await push(reference, { name, number: initiative, health, ac, url });
        console.log('Data pushed to Firebase successfully.');

        // If push is successful, add to the UI
        addMonsterToListUI(newEntryRef.key, name, initiative, health, ac, url);
    } catch (error) {
        console.error('Error (possibly network-related) submitting monster, but continuing:', error);
    }
}

// Function to add monster to the list UI
function addMonsterToListUI(id, name, initiative, health, ac, url) {
    const rankingList = document.getElementById('rankingList');
    if (!rankingList) {
        console.error("Ranking list element not found in the DOM. Cannot add monster.");
        return;
    }

    const listItem = document.createElement('li');
    listItem.textContent = `${name} (Int: ${initiative}, HP: ${health}, AC: ${ac})`;
    listItem.className = 'list-item';
    listItem.dataset.url = url;
    listItem.onclick = function() {
        window.open(this.dataset.url, '_blank');
    };
    rankingList.appendChild(listItem);
}

// Attach addToList function to the global window object to be accessible from the HTML
document.addEventListener('DOMContentLoaded', () => {
    window.addToList = addToList;
    console.log("JavaScript loaded and DOM is fully ready.");
});
