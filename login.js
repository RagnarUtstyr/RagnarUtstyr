// Import Firebase modules for authentication and database operations
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";
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
    const mainContent = document.getElementById('main-content');
    const errorMessageDiv = document.getElementById('error-message'); // Error message element

    // Hide the main content until the user logs in or submits a valid invite key
    mainContent.style.display = 'none';

    // If the user signs in successfully, redirect to the appropriate page based on role
    onAuthStateChanged(auth, (user) => {
        if (user) {
            checkUserRole(user.uid);  // Check the role of the user
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
                // Debugging output
                console.log("Attempting to create user with email: ", email);

                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                console.log("User created successfully:", userCredential.user);

                // Assign role to user in Firebase Realtime Database
                await set(ref(db, 'roles/' + userCredential.user.uid), {
                    role: 'user'  // Default role is 'user'
                });

                // Redirect to group.html after sign-up
                window.location.href = 'group.html';

            } catch (error) {
                console.error("Error creating user: ", error);
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
                console.log("Attempting to log in with email: ", email);

                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                console.log("Logged in successfully:", userCredential.user);

                checkUserRole(userCredential.user.uid);  // Check user role and redirect accordingly

            } catch (error) {
                console.error("Error during login: ", error);
                showErrorMessage(error.message);
            }
        } else {
            showErrorMessage("Please enter both email and password.");
        }
    });

    // Function to check the user's role
    function checkUserRole(uid) {
        const roleRef = ref(db, 'roles/' + uid);
        onValue(roleRef, (snapshot) => {
            const roleData = snapshot.val();
            if (roleData && roleData.role === 'admin') {
                window.location.href = 'admin.html';  // Redirect admin to admin page
            } else {
                window.location.href = 'group.html';  // Redirect regular users to group page
            }
        });
    }

    // Function to display error messages in the popup
    function showErrorMessage(message) {
        errorMessageDiv.textContent = message;
    }
});
