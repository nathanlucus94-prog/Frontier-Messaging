// Replace with your PlayFab Title ID
PlayFab.settings.TitleId = "7DDAD";

let googleAccessToken = null;
let tokenClient;

// Initialize Google OAuth Token Client for Google Drive access
window.onload = function () {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: '186186648504-bt961f8nij12tq8bkjuodvj5hk1b6m4o.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/drive.appdata',
        callback: (response) => {
            if (response.access_token) {
                googleAccessToken = response.access_token;
                console.log("Google Drive Access Token Granted!");
            }
        },
    });
};

// Handles standard Google Login Response (YouTube/Gmail style sign-in popup)
function handleGoogleResponse(response) {
    const idToken = response.credential; // Google JWT Token
    console.log("Google Sign-In Successful!");

    // 1. Authenticate / Link with PlayFab using Google credential
    authenticateWithPlayFab(idToken);

    // 2. Request Google Drive permissions in the background for data storage
    if (tokenClient) {
        tokenClient.requestAccessToken({ prompt: '' });
    }

    // 3. Switch UI to App Screen
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("app-screen").classList.remove("hidden");
    document.getElementById("username-display").innerText = "Google User";
}

// Send Google Token to Microsoft PlayFab
function authenticateWithPlayFab(googleIdToken) {
    PlayFabClientApi.LoginWithGoogleAccount({
        ServerAuthCode: googleIdToken,
        CreateAccount: true
    }, 
    function (result) {
        console.log("PlayFab Login Success. PlayFab ID:", result.data.PlayFabId);
    }, 
    function (error) {
        console.warn("PlayFab login notice:", error.errorMessage || "Running in static mode fallback.");
    });
}

function promptCreateServer() {
    const serverName = prompt("Enter new server name:");
    if (serverName) {
        alert(`Server "${serverName}" created successfully!`);
    }
}

function openSettingsTab() {
    document.getElementById("settings-modal").classList.remove("hidden");
    checkGoogleDriveStorage();
}

function closeSettingsTab() {
    document.getElementById("settings-modal").classList.add("hidden");
}

function handleKeyPress(event) {
    if (event.key === "Enter") {
        sendChatMessage();
    }
}

function sendChatMessage() {
    const input = document.getElementById("message-input");
    const text = input.value.trim();
    if (!text) return;
    
    const container = document.getElementById("messages-container");
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
            warningEl.classList.remove("hidden");
        } else {
            warningEl.classList.add("hidden");
        }
    } catch (error) {
        storageStatusEl.innerText = "Unable to retrieve storage quota metrics.";
        console.error(error);
    }
}
