// roomChecker.js

import { getDatabase, ref, get } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js';
import { app } from './firebaseInit.js';

const db = getDatabase(app);

export async function checkRoomExists(roomKey) {
    try {
        const roomRef = ref(db, `rooms/${roomKey}/rankings`);
        const snapshot = await get(roomRef);
        return snapshot.exists();
    } catch (error) {
        console.error('Error checking room existence:', error);
        return false;
    }
}
