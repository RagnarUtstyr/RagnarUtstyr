// key.js

// Function to set the room key in a cookie
function setRoomKey(key) {
    document.cookie = `roomKey=${key}; path=/; max-age=31536000`; // Expires in 1 year
}

// Function to get the room key from cookie
function getRoomKey() {
    const name = 'roomKey=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i].trim();
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return null;
}

// Export functions
export { setRoomKey, getRoomKey };
