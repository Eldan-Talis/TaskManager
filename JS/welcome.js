// Function to set the theme based on user preferences
function applyUserTheme() {
    // Check if the user prefers dark mode
    const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;

    // Select the black and blue buttons
    const blackButton = document.querySelector("[data-navbar-color='#1a1b18']");
    const blueButton = document.querySelector("[data-navbar-color='#7695ff']");

    if (prefersDarkMode && blackButton) {
        blackButton.click(); // Simulate a click on the black button
    } else if (blueButton) {
        blueButton.click(); // Simulate a click on the blue button
    }
}

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

// Select all color picker buttons
const colorButtons = document.querySelectorAll(".color-picker button");

// Add click event listener to each button
colorButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const selectedNavbarColor = button.getAttribute("data-navbar-color");

        // Update the CSS variable --navbar-color
        document.documentElement.style.setProperty('--navbar-color', selectedNavbarColor);

        // Re-trigger the animation on welcome-text
        const welcomeText = document.querySelector('.welcome-text');
        welcomeText.style.animation = 'none'; // Remove the animation
        // Trigger reflow to restart the animation
        void welcomeText.offsetWidth;
        welcomeText.style.animation = ''; // Re-apply the animation
    });
});

// Helper functions to clear cookies and storage
function clearCookies() {
    document.cookie.split(";").forEach((cookie) => {
        const name = cookie.split("=")[0].trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    });
}
