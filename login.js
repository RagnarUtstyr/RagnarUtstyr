// Import Firebase modules for authentication and database operations
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

// Initialize Firebase Authentication and Database
const auth = getAuth();
const db = getDatabase();

// Automatically display the sign-in popup on page load
document.addEventListener('DOMContentLoaded', () => {
    const authPopup = document.getElementById('auth-popup');
    const mainContent = document.getElementById('main-content');
    const errorMessageDiv = document.getElementById('error-message'); // Error message element

    // Hide the main content until the user logs in or submits a valid invite key
    mainContent.style.display = 'none';

    // If the user signs in successfully, redirect to the group page
    onAuthStateChanged(auth, (user) => {
        if (user) {
            window.location.href = 'group.html';
        } else {
            authPopup.style.display = 'block';
        }
    });

    // If an invite key is submitted, validate and redirect to the index page
    document.getElementById('access-group-btn').addEventListener('click', async () => {
        const inviteKeyInput = document.getElementById('invite-key-input').value;
        const reference = ref(db, 'inviteKeys/');
        onValue(reference, (snapshot) => {
            const data = snapshot.val();
            let validKey = false;
            for (let userId in data) {
                if (data[userId].inviteKey === inviteKeyInput) {
                    validKey = true;
                    break;
                }
            }
            if (validKey) {
                authPopup.style.display = 'none';
                mainContent.style.display = 'block'; // Show main content once the invite key is valid
            } else {
                showErrorMessage("Invalid invite key!");
            }
        });
    });

    // Function to sign up a new user
    document.getElementById('signup-btn').addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (email && password) {
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                console.log("User created successfully:", userCredential.user);
                window.location.href = 'group.html';  // Redirect to group page upon successful sign-up
            } catch (error) {
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
                window.location.href = 'group.html';  // Redirect to group page upon successful login
            } catch (error) {
                showErrorMessage(error.message);
            }
        } else {
            showErrorMessage("Please enter both email and password.");
        }
    });

    // Function to display error messages in the popup
    function showErrorMessage(message) {
        errorMessageDiv.textContent = message;
    }
});
