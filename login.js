// Import Firebase modules for authentication and database operations
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
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

    // Add event listener to validate invite key before login or sign-up
    document.getElementById('access-group-btn').addEventListener('click', async () => {
        const inviteKeyInput = document.getElementById('invite-key-input').value;

        // Validate invite key
        validateInviteKey(inviteKeyInput).then((isValid) => {
            if (isValid) {
                console.log('Valid invite key. Proceed to login or sign up.');
                authPopup.style.display = 'block';
                document.getElementById('invite-key-input').disabled = true;  // Disable further changes to the invite key input
            } else {
                showErrorMessage("Invalid invite key.");
            }
        }).catch((error) => {
            console.error("Error validating invite key: ", error);
            showErrorMessage("Error validating invite key.");
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

                // Assign role to user in Firebase Realtime Database
                await set(ref(db, 'roles/' + userCredential.user.uid), {
                    role: 'user'  // Default role is 'user'
                });

                // Generate an invite key for the new user
                await generateInviteKeyIfMissing(userCredential.user.uid);

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
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                console.log("Logged in successfully:", userCredential.user);

                // Generate an invite key for the user if missing
                await generateInviteKeyIfMissing(userCredential.user.uid);

                checkUserRole(userCredential.user.uid);  // Check user role and redirect accordingly

            } catch (error) {
                console.error("Error during login: ", error);
                showErrorMessage(error.message);
            }
        } else {
            showErrorMessage("Please enter both email and password.");
        }
    });

    // Function to validate invite key
    async function validateInviteKey(inputKey) {
        const inviteKeyRef = ref(db, 'inviteKeys/');
        return new Promise((resolve, reject) => {
            onValue(inviteKeyRef, (snapshot) => {
                const keysData = snapshot.val();
                for (let uid in keysData) {
                    if (keysData[uid].inviteKey === inputKey) {
                        resolve(true);  // Valid key found
                        return;
                    }
                }
                resolve(false);  // No matching invite key found
            }, (error) => {
                reject(error);  // Error accessing database
            });
        });
    }

    // Function to generate an invite key if it is missing
    async function generateInviteKeyIfMissing(uid) {
        const inviteKeyRef = ref(db, 'inviteKeys/' + uid);

        onValue(inviteKeyRef, async (snapshot) => {
            if (!snapshot.exists()) {
                // Generate a new random invite key
                const newInviteKey = Math.random().toString(36).substring(2, 10);  // Example key generator
                console.log("Generated new invite key: ", newInviteKey);

                // Save the generated invite key in Firebase
                await set(inviteKeyRef, {
                    inviteKey: newInviteKey
                });
            }
        });
    }

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
