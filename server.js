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

// Function to fetch and display rankings
function fetchRankings() {
    const reference = ref(db, 'rankings/');
    onValue(reference, (snapshot) => {
        const data = snapshot.val();
        const rankingList = document.getElementById('rankingList');
        rankingList.innerHTML = ''; // Clear the list before repopulating

        if (data) {
            const rankings = Object.entries(data).map(([id, entry]) => ({ id, ...entry }));
            rankings.sort((a, b) => b.number - a.number); // Sort by initiative

            rankings.forEach(({ id, name, number, health, ac }) => {
                const listItem = document.createElement('li');
                listItem.textContent = `${name} (Int: ${number}, HP: ${health}, AC: ${ac})`;
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
    remove(reference).then(() => {
        console.log(`Entry with id ${id} removed successfully`);
    }).catch((error) => {
        console.error('Error removing entry:', error);
    });
}

// Function to clear all entries from Firebase and update the UI
function clearAllEntries() {
    const reference = ref(db, 'rankings/');
    set(reference, null).then(() => {
        const rankingList = document.getElementById('rankingList');
        rankingList.innerHTML = ''; // Clear the UI after clearing Firebase
        console.log('All entries removed successfully');
    }).catch((error) => {
        console.error('Error clearing all entries:', error);
    });
}

// Event listeners for page-specific actions
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('clear-list-button')) {
        document.getElementById('clear-list-button').addEventListener('click', clearAllEntries);
    }
    if (document.getElementById('rankingList')) {
        fetchRankings();
    }
});
