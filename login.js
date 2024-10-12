// Import Firebase modules for authentication and database operations
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getDatabase, ref, set, onValue, get } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";

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
const auth = getAuth(app);
const db = getDatabase(app);

// Automatically display the sign-in popup on page load
document.addEventListener('DOMContentLoaded', () => {
    const authPopup = document.getElementById('auth-popup');
    const errorMessageDiv = document.getElementById('error-message'); // Error message element

    // Check if user is logged in and show/hide content accordingly
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User is logged in");
            generateInviteKeyIfMissing(user.uid);  // Generate invite key if missing
        } else {
            console.log("User is not logged in");
        }
    });

    // Invite key validation when clicking 'Submit Key'
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
                console.log('Valid invite key. Proceed to login or sign up.');
                authPopup.style.display = 'block';  // Show the login form
                document.getElementById('invite-key-input').disabled = true;  // Disable further changes to the invite key
            } else {
                showErrorMessage("Invalid invite key.");
            }
        } catch (error) {
            console.error("Error validating invite key: ", error);
            showErrorMessage("Error validating invite key.");
        }
    });

    // Sign up function
    document.getElementById('signup-btn').addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (email && password) {
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                console.log("User created successfully:", userCredential.user);

                // Assign role and invite key
                await set(ref(db, 'roles/' + userCredential.user.uid), {
                    role: 'user'  // Default role is 'user'
                });
                await generateInviteKeyIfMissing(userCredential.user.uid);

                window.location.href = 'group.html';  // Redirect after sign-up

            } catch (error) {
                console.error("Error creating user: ", error);
                showErrorMessage(error.message);
            }
        } else {
            showErrorMessage("Please fill in both email and password.");
        }
    });

    // Log in function
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
                console.error("Error during login: ", error);
                showErrorMessage(error.message);
            }
        } else {
            showErrorMessage("Please enter both email and password.");
        }
    });

    // Validate invite key function
    async function validateInviteKey(inputKey) {
        const inviteKeyRef = ref(db, 'inviteKeys/');
        const snapshot = await get(inviteKeyRef);
        const keysData = snapshot.val();

        // Loop through the keys and check if the invite key exists
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

            await set(inviteKeyRef, {
                inviteKey: newInviteKey
            });
        }
    }

    // Logout button handler
    document.getElementById('logout-btn').addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = 'index.html';  // Redirect to login page after logout
        } catch (error) {
            console.error("Error during logout: ", error);
        }
    });

    // Function to display error messages
    function showErrorMessage(message) {
        errorMessageDiv.textContent = message;
    }
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