// Main JavaScript file for Trana application
// Handles overall UI logic and interactions across the application

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    setupNavigation();
    setupEventListeners();
});

// Function to set up navigation links
function setupNavigation() {
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const targetPage = link.getAttribute('href');
            loadPage(targetPage);
        });
    });
}

// Function to load different pages
function loadPage(page) {
    const contentArea = document.getElementById('content');
    fetch(page)
        .then(response => response.text())
        .then(data => {
            contentArea.innerHTML = data;
            // Call any additional setup functions for the loaded page
            if (page.includes('food.html')) {
                setupFoodLogger();
            } else if (page.includes('carbon.html')) {
                setupCarbonCalculator();
            } else if (page.includes('ai.html')) {
                setupAISuggestions();
            } else if (page.includes('badges.html')) {
                setupBadges();
            } else if (page.includes('profile.html')) {
                setupProfile();
            }
        })
        .catch(error => console.error('Error loading page:', error));
}

// Function to set up event listeners for various functionalities
function setupEventListeners() {
    // Add any global event listeners here
}

// Placeholder functions for page-specific setups
function setupFoodLogger() {
    // Logic for food logger page
}

function setupCarbonCalculator() {
    // Logic for carbon calculator page
}

function setupAISuggestions() {
    // Logic for AI suggestions page
}

function setupBadges() {
    // Logic for badges page
}

function setupProfile() {
    // Logic for profile page
}