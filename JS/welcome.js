function login(){
    const authUrl =
    `${config.domain}/login?` +
    // response_type=code +
    "response_type=token" +
    `&client_id=${config.clientId}` +
    `&redirect_uri=${encodeURIComponent(config.redirectUri)}` +
    "&scope=openid+aws.cognito.signin.user.admin";
    window.location.href = authUrl;
}

// Call the function when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", applyUserTheme);

// Function to toggle the color picker visibility
function toggleColorPicker() {
    const colorPicker = document.getElementById("colorPicker");

    // Check the current display style
    const currentDisplay = window.getComputedStyle(colorPicker).getPropertyValue("display");

    if (currentDisplay === "none") {
        // Show the color picker with !important
        colorPicker.style.setProperty("display", "flex", "important");
    } else {
        // Hide the color picker with !important
        colorPicker.style.setProperty("display", "none", "important");
    }
}


// Helper functions to clear cookies and storage
function clearCookies() {
    document.cookie.split(";").forEach((cookie) => {
        const name = cookie.split("=")[0].trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    });
}
