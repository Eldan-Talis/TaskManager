// Function to parse URL parameters
function getUrlParameters() {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    return Object.fromEntries(hashParams);
}

// Save relevant token data
function saveTokenData(params) {
    if (params.id_token) {
        try {
            const decodedIdToken = JSON.parse(atob(params.id_token.split('.')[1])); // Decode the ID token
            const firstName = decodedIdToken.given_name || "User";
            const email = decodedIdToken.email || "Unknown";
            const sub = decodedIdToken.sub || "Unknown"; // Extract the unique sub identifier
            const groups = decodedIdToken["cognito:groups"] || [];

            // Save to sessionStorage
            sessionStorage.setItem('id_token', params.id_token);
            sessionStorage.setItem('first_name', firstName);
            sessionStorage.setItem('email', email);
            sessionStorage.setItem('sub', sub); // Save the sub value
            sessionStorage.setItem('groups', JSON.stringify(groups));

            console.log("Saved user information:", { firstName, email, sub });
        } catch (error) {
            console.error("Error decoding ID token:", error);
        }
    } else {
        console.warn("ID token not found.");
    }
}

// Update the welcome message and hide the loader
function updateWelcomeMessage() {
    const firstName = sessionStorage.getItem('first_name') || "User";
    const welcomeMessage = document.getElementById('welcomeMessage');

    if (welcomeMessage) {
        welcomeMessage.textContent = `Welcome ${firstName}!`; // Update H1 with user's name
    }
}

// Check for tokens on page load
window.onload = function () {
    const params = getUrlParameters();
    saveTokenData(params);
    updateWelcomeMessage(); // Update the welcome message

    // Redirect to dashboard after processing tokens
    if (params.access_token && params.id_token) {
        setTimeout(() => {
            window.location.href = '/HTML/personal.html'; // Example redirection to dashboard
        }, 1600); // Delay for user to see token info briefly
    } else {
        console.warn("Access token or ID token missing.");
    }
};
