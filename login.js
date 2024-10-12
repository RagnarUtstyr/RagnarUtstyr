import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

// Initialize Firebase
const auth = getAuth();
const db = getDatabase();

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    const authPopup = document.getElementById('auth-popup');
    const errorMessageDiv = document.getElementById('error-message'); // Error message element

    // Add event listener to validate invite key before login or sign-up
    document.getElementById('access-group-btn').addEventListener('click', async () => {
        const inviteKeyInput = document.getElementById('invite-key-input').value.trim();

        if (!inviteKeyInput) {
            showErrorMessage("Please enter an invite key.");
            return;
        }

        // Validate the invite key
        try {
            const isValid = await validateInviteKey(inviteKeyInput);
            if (isValid) {
                console.log('Valid invite key. Proceed to login or sign-up.');
                authPopup.style.display = 'block';  // Show the login/signup form
                document.getElementById('invite-key-input').disabled = true;  // Disable further changes to the invite key
            } else {
                showErrorMessage("Invalid invite key.");
            }
        } catch (error) {
            console.error("Error validating invite key: ", error);
            showErrorMessage("Error validating invite key.");
        }
    });

    // Function to sign up a new user
    document.getElementById('signup-btn').addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (email && password) {
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                console.log("User created successfully:", userCredential.user);

                // Assign role and generate invite key
                await set(ref(db, 'roles/' + userCredential.user.uid), { role: 'user' });
                await generateInviteKeyIfMissing(userCredential.user.uid);

                window.location.href = 'group.html';  // Redirect after sign-up

            } catch (error) {
                console.error("Error creating user:", error);
                showErrorMessage(error.message);
            }
        } else {
            showErrorMessage("Please fill in both email and password.");
        }
    });

    // Function to log in an existing user
    document.getElementById('login-btn').addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (email && password) {
            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                console.log("Logged in successfully:", userCredential.user);

                await generateInviteKeyIfMissing(userCredential.user.uid);
                window.location.href = 'group.html';  // Redirect after login

            } catch (error) {
                console.error("Error during login:", error);
                showErrorMessage(error.message);
            }
        } else {
            showErrorMessage("Please enter both email and password.");
        }
    });

    // Logout button functionality
    document.getElementById('logout-btn').addEventListener('click', async () => {
        try {
            await signOut(auth);
            console.log("User logged out successfully.");
            window.location.href = 'index.html';  // Redirect to login page
        } catch (error) {
            console.error("Error logging out:", error);
        }
    });

    // Validate invite key function
    async function validateInviteKey(inputKey) {
        const inviteKeyRef = ref(db, 'inviteKeys/');
        const snapshot = await get(inviteKeyRef);
        const keysData = snapshot.val();

        // Check if the invite key exists
        for (let uid in keysData) {
            if (keysData[uid].inviteKey === inputKey) {
                return true;  // Valid key found
            }
        }
        return false;  // No matching invite key found
    }

    // Generate invite key if missing
    async function generateInviteKeyIfMissing(uid) {
        const inviteKeyRef = ref(db, 'inviteKeys/' + uid);
        const snapshot = await get(inviteKeyRef);

        if (!snapshot.exists()) {
            const newInviteKey = Math.random().toString(36).substring(2, 10);
            console.log("Generated new invite key: ", newInviteKey);

            await set(inviteKeyRef, { inviteKey: newInviteKey });
        }
    }

    // Display error messages
    function showErrorMessage(message) {
        errorMessageDiv.textContent = message;
    }
});
