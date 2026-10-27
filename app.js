// Replace with your PlayFab Title ID
PlayFab.settings.TitleId = "7DDAD";

let googleAccessToken = null; // Stored after Google Drive link

function loginWithPlayFab() {
    // Basic PlayFab Custom/Google login placeholder flow
    // In production, integrate your Google Auth token with PlayFabClientApi.LoginWithGoogleAccount
    
    // Simulating successful login for static deployment preview:
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("app-screen").classList.remove("hidden");
    document.getElementById("username-display").innerText = "PlayerOne";
}

function promptCreateServer() {
    const serverName = prompt("Enter new server name:");
    if (serverName) {
        alert(`Server "${serverName}" created! (Data will sync to Google Drive)`);
    }
}

function openSettingsTab() {
    document.getElementById("settings-modal").classList.remove("hidden");
    checkGoogleDriveStorage();
}

function closeSettingsTab() {
    document.getElementById("settings-modal").classList.add("hidden");
}

function sendChatMessage() {
    const input = document.getElementById("message-input");
    if (!input.value.trim()) return;
    
    const container = document.getElementById("messages-container");
    const msg = document.createElement("div");
    msg.style.marginBottom = "8px";
    msg.innerHTML = `<strong>PlayerOne:</strong> ${input.value}`;
    container.appendChild(msg);
    
    input.value = "";
    container.scrollTop = container.scrollHeight;
}

// Check Google Drive storage and trigger warning if > 2 GB
async function checkGoogleDriveStorage() {
    const storageStatusEl = document.getElementById("storage-status");
    const warningEl = document.getElementById("storage-warning");

    if (!googleAccessToken) {
        storageStatusEl.innerText = "Google Drive not connected or token missing.";
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
        storageStatusEl.innerText = `Google Drive Usage: ${totalGB} GB / 2.00 GB`;

        const TWO_GB_IN_BYTES = 2147483648;
        if (totalAppBytes >= TWO_GB_IN_BYTES) {
            warningEl.classList.remove("hidden");
        } else {
            warningEl.classList.add("hidden");
        }
    } catch (error) {
        storageStatusEl.innerText = "Could not fetch storage metrics.";
        console.error(error);
    }
}
