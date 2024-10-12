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
function addToList(name, health, url) {
    const initiative = prompt(`Enter initiative for ${name}:`);
    if (initiative !== null && !isNaN(initiative)) {
        submitMonsterToFirebase(name, parseInt(initiative), health, url);
    } else {
        alert('Please enter a valid initiative number.');
    }
}

// Function to submit data to Firebase
async function submitMonsterToFirebase(name, initiative, health, url) {
    try {
        // Wait for the push to complete before proceeding
        const reference = ref(db, 'rankings/');
        const newEntryRef = await push(reference, { name, number: initiative, health, url });

        // If push is successful, add to the UI and show success message
        addMonsterToListUI(newEntryRef.key, name, initiative, health, url);
        alert('Monster added successfully!');
    } catch (error) {
        // If there's an error, show the error message
        console.error('Error submitting monster:', error);
        alert('Failed to add monster. Please check the console for more details.');
    }
}

// Function to add monster to the list UI
function addMonsterToListUI(id, name, initiative, health, url) {
    const rankingList = document.getElementById('rankingList');
    const listItem = document.createElement('li');
    listItem.textContent = `${name} (Int: ${initiative}, HP: ${health})`;
    listItem.className = 'list-item';
    listItem.dataset.url = url;
    listItem.onclick = function() {
        window.open(this.dataset.url, '_blank');
    };
    rankingList.appendChild(listItem);
}

// Attach addToList function to the global window object to be accessible from the HTML
window.addToList = addToList;
