import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

const auth = getAuth();
const db = getDatabase();

// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // Ensure user is logged in and display invite key
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const inviteKeyRef = ref(db, 'inviteKeys/' + user.uid);
            onValue(inviteKeyRef, (snapshot) => {
                const data = snapshot.val();
                if (data && data.inviteKey) {
                    document.getElementById('invite-key').textContent = data.inviteKey;
                } else {
                    document.getElementById('invite-key').textContent = 'No invite key found';
                }
            });
        } else {
            console.log("No user is logged in");
        }
    });

    // Handle logout
    document.getElementById('logout-btn').addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = 'index.html';  // Redirect to login page after logout
        } catch (error) {
            console.error("Error logging out:", error);
        }
    });
});
