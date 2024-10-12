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
