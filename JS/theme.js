// JS/theme.js

// Define a unique key for storing the theme in localStorage
const THEME_STORAGE_KEY = "userTheme";

// Function to save the selected theme to localStorage
function saveUserTheme(navbarColor, sidebarColor, categoryColor) {
    const theme = {
        navbarColor,
        sidebarColor,
        categoryColor
    };
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
}

// Function to load the saved theme from localStorage
function loadUserTheme() {
    const themeJSON = localStorage.getItem(THEME_STORAGE_KEY);
    if (themeJSON) {
        try {
            return JSON.parse(themeJSON);
        } catch (e) {
            console.error("Failed to parse theme from localStorage:", e);
            return null;
        }
    }
    return null;
}

// Function to apply the saved theme to the UI using CSS variables
function applySavedTheme(theme) {
    if (theme) {
        const { navbarColor, sidebarColor, categoryColor } = theme;
        
        // Apply CSS variables
        if (navbarColor) {
            document.documentElement.style.setProperty("--navbar-color", navbarColor);
        }

        if (sidebarColor) {
            document.documentElement.style.setProperty("--sidebar-color", sidebarColor);
        }

        if (categoryColor) {
            document.documentElement.style.setProperty("--category-color", categoryColor);
        }

        // Optionally, store the selectedCategoryContainerColor globally for other scripts
        window.selectedCategoryContainerColor = categoryColor;
    }
}

// Function to apply user theme on page load
function applyUserTheme() {
    const savedTheme = loadUserTheme();
    if (savedTheme) {
        // Apply the saved theme
        applySavedTheme(savedTheme);
    } else {
        // Fallback to applying theme based on user system preferences
        const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;

        const blackButton = document.querySelector("[data-navbar-color='#1a1b18']");
        const blueButton = document.querySelector("[data-navbar-color='#7695ff']");

        if (prefersDarkMode && blackButton) {
            blackButton.click(); // Simulate a click on the black button
        } else if (blueButton) {
            blueButton.click(); // Simulate a click on the blue button
        }
    }
}

// Add event listener for DOMContentLoaded to apply theme
document.addEventListener("DOMContentLoaded", applyUserTheme);

// === Color Picker Button Event Listeners ===

// Select all color picker buttons
const colorButtons = document.querySelectorAll(".color-picker button");

// Add click event listener to each button
colorButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const selectedNavbarColor = button.getAttribute("data-navbar-color");
        const selectedSidebarColor = button.getAttribute("data-sidebar-color");
        const selectedCategoryColor = button.getAttribute("data-category-color");

        // Apply the selected colors using CSS variables
        if (selectedNavbarColor) {
            document.documentElement.style.setProperty("--navbar-color", selectedNavbarColor);
        }

        if (selectedSidebarColor) {
            document.documentElement.style.setProperty("--sidebar-color", selectedSidebarColor);
        }

        if (selectedCategoryColor) {
            document.documentElement.style.setProperty("--category-color", selectedCategoryColor);
        }

        // Save the selected theme to localStorage
        saveUserTheme(selectedNavbarColor, selectedSidebarColor, selectedCategoryColor);

        // Update the global selectedCategoryContainerColor if applicable
        window.selectedCategoryContainerColor = selectedCategoryColor;
    });
});
