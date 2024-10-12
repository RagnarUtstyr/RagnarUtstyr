import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

const auth = getAuth();
const db = getDatabase();

// Wait for DOM content to load
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout-btn');
    const errorMessageDiv = document.getElementById('error-message');

    // Handle invite key validation
    document.getElementById('access-group-btn').addEventListener('click', async () => {
        const inviteKeyInput = document.getElementById('invite-key-input').value.trim();
        if (!inviteKeyInput) {
            showErrorMessage("Please enter an invite key.");
            return;
        }
        const isValid = await validateInviteKey(inviteKeyInput);
        if (isValid) {
            window.location.href = 'group.html';  // Redirect to group page
        } else {
            showErrorMessage("Invalid invite key.");
        }
    });

    // Handle login
    document.getElementById('login-btn').addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        if (!email || !password) {
            showErrorMessage("Please enter both email and password.");
            return;
        }
        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = 'group.html';
        } catch (error) {
            showErrorMessage(error.message);
        }
    });

    // Handle sign-up
    document.getElementById('signup-btn').addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        if (!email || !password) {
            showErrorMessage("Please enter both email and password.");
            return;
        }
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await generateInviteKey(userCredential.user.uid);
            window.location.href = 'group.html';
        } catch (error) {
            showErrorMessage(error.message);
        }
    });

    // Handle logout
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = 'index.html';  // Redirect to login page after logout
        } catch (error) {
            console.error("Error logging out:", error);
        }
    });

    // Validate invite key
    async function validateInviteKey(inviteKey) {
        const inviteKeyRef = ref(db, 'inviteKeys/');
        const snapshot = await get(inviteKeyRef);
        const inviteKeys = snapshot.val();
        for (let userId in inviteKeys) {
            if (inviteKeys[userId].inviteKey === inviteKey) {
                return true;
            }
        }
        return false;
    }

    // Generate invite key for new user
    async function generateInviteKey(uid) {
        const newKey = Math.random().toString(36).substring(2, 10);
        await set(ref(db, 'inviteKeys/' + uid), { inviteKey: newKey });
    }

    // Show error messages
    function showErrorMessage(message) {
        errorMessageDiv.textContent = message;
    }
});
