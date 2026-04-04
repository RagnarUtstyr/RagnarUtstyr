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

// Initialize Firebase once
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

// Function to handle adding a monster to the list
async function addToList(name, health, url, ac) {
    console.log(`Adding monster: ${name} with HP: ${health}, AC: ${ac}, and URL: ${url}`);

    const code = getGameCode();
    if (!code) {
        alert("Missing game code. Please open the monster page from a specific game.");
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

// Function to submit data to Firebase
async function submitMonsterToFirebase(name, initiative, health, url, ac) {
    try {
        console.log("Attempting to push monster to room entries...");
        const reference = ref(db, getEntriesPath());

        await push(reference, {
            name,
            number: initiative,
            health: typeof health === "number" ? health : null,
            url: url ?? null,
            ac: typeof ac === "number" ? ac : null,
            createdByAdmin: true,
            source: "monster-list",
            updatedAt: Date.now()
        });

        console.log("Monster pushed to Firebase successfully.");
    } catch (error) {
        console.error("Error submitting monster:", error);
        alert("Could not add monster to this game.");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.addToList = addToList;

    const backLink = document.getElementById("view-initiative-link");
    const code = getGameCode();
    if (backLink && code) {
        backLink.href = `group_dnd.html?code=${encodeURIComponent(code)}`;
    }

    console.log("monster.js loaded and DOM is fully ready.");
});