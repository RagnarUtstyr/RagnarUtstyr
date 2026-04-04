import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
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

// Initialize Firebase only once
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getDatabase(app);

function getGameCode() {
    const params = new URLSearchParams(window.location.search);
    return (params.get("code") || "").trim().toUpperCase();
}

function getEntriesPath() {
    const code = getGameCode();
    if (!code) {
        throw new Error("Missing game code in URL.");
    }
    return `games/${code}/entries`;
}

// Function to handle adding a monster to the current room list
async function addToList(name, health, url, ac) {
    console.log(`Adding monster: ${name} with HP: ${health}, AC: ${ac}, and URL: ${url}`);

    const code = getGameCode();
    if (!code) {
        alert("Missing game code. Open this page from a game room.");
        return;
    }

    const initiative = prompt(`Enter initiative for ${name}:`);
    if (initiative === null) return;

    const parsedInitiative = parseInt(initiative, 10);
    if (Number.isNaN(parsedInitiative)) {
        alert("Please enter a valid initiative number.");
        return;
    }

    await submitMonsterToFirebase(name, parsedInitiative, health, url, ac);
}

// Function to submit monster data to the current room
async function submitMonsterToFirebase(name, initiative, health, url, ac) {
    try {
        const reference = ref(db, getEntriesPath());

        await push(reference, {
            name,
            number: initiative,
            health: health ?? null,
            url: url ?? "",
            ac: ac ?? null,
            createdByAdmin: true,
            source: "monster-list",
            updatedAt: Date.now()
        });

        console.log("Monster added to current room successfully.");
    } catch (error) {
        console.error("Error submitting monster:", error);
        alert("Could not add monster to this game.");
    }
}

// Attach addToList function to the global window object so the HTML onclick works
document.addEventListener("DOMContentLoaded", () => {
    try {
        getEntriesPath();
    } catch (error) {
        console.error(error);
    }

    window.addToList = addToList;
    console.log("monster.js loaded and room-aware addToList is ready.");
});