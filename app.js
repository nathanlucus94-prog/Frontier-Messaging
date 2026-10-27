let googleAccessToken = null;
let tokenClient;

// Initialize Google OAuth Token Client for Google Drive access
window.onload = function () {
    console.log("Window loaded. Initializing Google client...");
    if (typeof google !== 'undefined' && google.accounts) {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
            scope: 'https://www.googleapis.com/auth/drive.appdata',
            callback: (response) => {
                if (response.access_token) {
                    googleAccessToken = response.access_token;
                    console.log("Google Drive Access Token Granted!");
                }
            },
        });
    } else {
        console.warn("Google SDK not loaded yet.");
    }
};

// Handles standard Google Login Response
function handleGoogleResponse(response) {
    console.log("Google Sign-In Triggered! Response received:", response);

    // 1. Switch UI to App Screen immediately
    const loginScreen = document.getElementById("login-screen");
    const appScreen = document.getElementById("app-screen");
    
    if (loginScreen && appScreen) {
        loginScreen.classList.add("hidden");
        appScreen.classList.remove("hidden");
        console.log("UI Switched to App Screen.");
    }

    const userDisplay = document.getElementById("username-display");
    if (userDisplay) {
        userDisplay.innerText = "Google User";
    }

    // 2. Request Google Drive permissions in the background for data storage
    if (tokenClient) {
        try {
            tokenClient.requestAccessToken({ prompt: '' });
        } catch (e) {
            console.warn("Drive token popup skipped or blocked:", e);
        }
    }
}

function promptCreateServer() {
    const serverName = prompt("Enter new server name:");
    if (serverName) {
        alert(`Server "${serverName}" created successfully!`);
    }
}

function openSettingsTab() {
    const modal = document.getElementById("settings-modal");
    if (modal) modal.classList.remove("hidden");
    checkGoogleDriveStorage();
}

function closeSettingsTab() {
    const modal = document.getElementById("settings-modal");
    if (modal) modal.classList.add("hidden");
}

function handleKeyPress(event) {
    if (event.key === "Enter") {
        sendChatMessage();
    }
}

function sendChatMessage() {
    const input = document.getElementById("message-input");
    if (!input) return;
    
    const text = input.value.trim();
    if (!text) return;
    
    const container = document.getElementById("messages-container");
    if (!container) return;

    const msgDiv = document.createElement("div");
    msgDiv.className = "message-item";
    msgDiv.innerHTML = `<strong>Google User:</strong> ${escapeHtml(text)}`;
    container.appendChild(msgDiv);
    
    input.value = "";
    container.scrollTop = container.scrollHeight;
}

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Check Google Drive App Folder size and warn if >= 2 GB
async function checkGoogleDriveStorage() {
    const storageStatusEl = document.getElementById("storage-status");
    const warningEl = document.getElementById("storage-warning");

    if (!storageStatusEl) return;

    if (!googleAccessToken) {
        storageStatusEl.innerText = "Google Drive access token not active yet.";
        return;
    }

    try {
        const response = await fetch("https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(size)", {
            headers: { 'Authorization': 'Bearer ' + googleAccessToken }
        });
        
        const data = await response.json();
        let totalAppBytes = 0;
        
        if (data.files) {
            data.files.forEach(file => {
                totalAppBytes += parseInt(file.size || 0, 10);
            });
        }
        
        const totalGB = (totalAppBytes / (1024 * 1024 * 1024)).toFixed(2);
        storageStatusEl.innerText = `Google Drive App Storage Used: ${totalGB} GB / 2.00 GB`;

        const TWO_GB_IN_BYTES = 2147483648;
        if (totalAppBytes >= TWO_GB_IN_BYTES) {
            if (warningEl) warningEl.classList.remove("hidden");
        } else {
            if (warningEl) warningEl.classList.add("hidden");
        }
    } catch (error) {
        storageStatusEl.innerText = "Unable to retrieve storage quota metrics.";
        console.error(error);
    }
}
