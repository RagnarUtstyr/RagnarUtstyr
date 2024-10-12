import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

// Initialize Firebase Authentication and Database
const auth = getAuth();
const db = getDatabase();

// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // Check if a user is logged in
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Fetch the invite key from Firebase
            const inviteKeyRef = ref(db, 'inviteKeys/' + user.uid);
            onValue(inviteKeyRef, (snapshot) => {
                const inviteData = snapshot.val();
                if (inviteData && inviteData.inviteKey) {
                    // Display the invite key in the menu
                    document.getElementById('invite-key').textContent = inviteData.inviteKey;
                } else {
                    document.getElementById('invite-key').textContent = 'No invite key found';
                }
            });
        } else {
            console.log("No user is logged in");
        }
    });
});

import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

// Initialize Firebase Authentication
const auth = getAuth();

// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // Logout button handler
    const logoutBtn = document.getElementById('logout-btn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await signOut(auth);
                console.log("User logged out successfully");
                window.location.href = 'index.html';  // Redirect to login page after logout
            } catch (error) {
                console.error("Error during logout: ", error);
                alert("Logout failed, please try again.");
            }
        });
    }

    // Ensure logout works on both index.html and group.html
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            console.log("No user is logged in, redirecting to index.");
            window.location.href = 'index.html';  // Redirect to login page if no user is logged in
        }
    });
});