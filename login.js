
// Import Firebase modules for authentication and database operations
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

// Initialize Firebase Authentication and Database
const auth = getAuth(app);
const db = getDatabase(app);

// Automatically display the sign-in popup on page load
document.addEventListener('DOMContentLoaded', () => {
    const authPopup = document.getElementById('auth-popup');
    const mainContent = document.getElementById('main-content');

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
                alert('Invalid invite key!');
            }
        });
    });
});

// Function to sign up a new user
document.getElementById('signup-btn').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        console.log("User created and logged in successfully");
        document.getElementById('logout-btn').style.display = 'block';
    } catch (error) {
        console.error("Sign-up failed: ", error);
    }
});

// Function to log in a user
document.getElementById('login-btn').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        console.log("Logged in successfully");
        document.getElementById('logout-btn').style.display = 'block';
    } catch (error) {
        console.error("Login failed: ", error);
    }
});

// Function to log out a user
document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
        await signOut(auth);
        console.log("Logged out");
        document.getElementById('logout-btn').style.display = 'none';
    } catch (error) {
        console.error("Logout failed: ", error);
    }
});

// Function to generate an invite key for logged-in users
document.getElementById('generate-invite-btn').addEventListener('click', async () => {
    const user = auth.currentUser;
    if (user) {
        const inviteKey = Math.random().toString(36).substring(2, 15); // Generate random invite key
        const reference = ref(db, `inviteKeys/${user.uid}`);
        await set(reference, { inviteKey });
        document.getElementById('invite-key').innerText = `Invite Key: ${inviteKey}`;
        console.log("Invite key generated:", inviteKey);
    }
});

// Function to validate an invite key and redirect to the group page
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
            window.location.href = 'group.html'; // Redirect to group page if invite key is valid
        } else {
            alert('Invalid invite key!');
        }
    });
});

// Function to check if the user is authenticated before accessing the group page
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // If user is not authenticated, redirect to index.html
        alert("You must be logged in to access this page");
        window.location.href = 'index.html';
    }
});
