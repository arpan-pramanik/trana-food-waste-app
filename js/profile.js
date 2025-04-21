/**
 * Profile Module for Trāṇa
 * Manages user profile settings, statistics, and data management
 */

// DOM Elements - Profile Info
const profileForm = document.getElementById('profile-form');
const userNameInput = document.getElementById('user-name');
const userJoinDate = document.getElementById('user-join-date');

// DOM Elements - Stats
const foodItemsLogged = document.getElementById('food-items-logged');
const itemsSaved = document.getElementById('items-saved');
const co2Saved = document.getElementById('co2-saved');
const aiSuggestionsUsed = document.getElementById('ai-suggestions-used');

// DOM Elements - Badges
const noBadgesMessage = document.getElementById('no-badges-message');
const recentBadgesContainer = document.getElementById('recent-badges-container');

// DOM Elements - Settings
const notificationsToggle = document.getElementById('notifications-toggle');
const summaryToggle = document.getElementById('summary-toggle');
const themeToggle = document.getElementById('theme-toggle');

// DOM Elements - Data Management
const exportDataBtn = document.getElementById('export-data');
const resetDataBtn = document.getElementById('reset-data');

// Constants
const STORAGE_PREFIX = CONFIG ? CONFIG.app.storagePrefix : 'trana_';
const USER_PROFILE_KEY = `${STORAGE_PREFIX}user_profile`;
const FIRST_VISIT_KEY = `${STORAGE_PREFIX}first_visit`;

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Load user profile
    loadUserProfile();
    
    // Load user statistics
    loadUserStatistics();
    
    // Load recent badges
    loadRecentBadges();
    
    // Load settings
    loadSettings();
    
    // Set up event listeners
    setupEventListeners();
    
    // Check and set first visit date if not already set
    checkFirstVisit();
});

/**
 * Set up event listeners for the page
 */
function setupEventListeners() {
    // Profile form submission
    profileForm.addEventListener('submit', handleProfileFormSubmit);
    
    // Settings toggles
    notificationsToggle.addEventListener('change', updateSettings);
    summaryToggle.addEventListener('change', updateSettings);
    themeToggle.addEventListener('change', toggleTheme);
    
    // Data management
    exportDataBtn.addEventListener('click', exportUserData);
    resetDataBtn.addEventListener('click', resetUserData);
}

/**
 * Handle profile form submission
 * @param {Event} event - Form submit event
 */
function handleProfileFormSubmit(event) {
    event.preventDefault();
    
    const userName = userNameInput.value.trim();
    if (!userName) return;
    
    // Save user name
    const userProfile = getUserProfile();
    userProfile.name = userName;
    saveUserProfile(userProfile);
    
    // Show confirmation
    showNotification('Profile updated successfully!');
}

/**
 * Load user profile from localStorage
 */
function loadUserProfile() {
    const userProfile = getUserProfile();
    
    // Set user name in form
    if (userProfile.name) {
        userNameInput.value = userProfile.name;
    }
}

/**
 * Get user profile from localStorage
 * @returns {Object} - User profile object
 */
function getUserProfile() {
    const storedProfile = localStorage.getItem(USER_PROFILE_KEY);
    return storedProfile ? JSON.parse(storedProfile) : {};
}

/**
 * Save user profile to localStorage
 * @param {Object} profile - User profile object
 */
function saveUserProfile(profile) {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
}

/**
 * Load user statistics from various localStorage sources
 */
function loadUserStatistics() {
    // Load food items statistics
    const foodItems = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}food_items`) || '[]');
    const usedItems = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}used_items`) || '[]');
    
    foodItemsLogged.textContent = foodItems.length + usedItems.length;
    itemsSaved.textContent = usedItems.length;
    
    // Load carbon statistics
    const carbonSavings = parseFloat(localStorage.getItem(`${STORAGE_PREFIX}carbon_savings`) || '0');
    co2Saved.textContent = `${carbonSavings.toFixed(2)} kg`;
    
    // Load AI statistics
    const aiStats = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}ai_stats`) || '{"suggestionsGenerated":0,"suggestionsSaved":0}');
    aiSuggestionsUsed.textContent = aiStats.suggestionsSaved;
}

/**
 * Load recent badges from localStorage
 */
function loadRecentBadges() {
    const badgeData = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}badges`) || '[]');
    
    if (badgeData.length === 0) {
        // Show empty state
        noBadgesMessage.style.display = 'block';
        return;
    }
    
    // Hide empty message
    noBadgesMessage.style.display = 'none';
    
    // Sort badges by date (newest first)
    const sortedBadges = [...badgeData].sort((a, b) => {
        return new Date(b.dateAwarded) - new Date(a.dateAwarded);
    });
    
    // Get the three most recent badges
    const recentBadges = sortedBadges.slice(0, 3);
    
    // Get all badge definitions from badges.js module if available
    let badgeDefinitions = [];
    if (typeof BADGE_DEFINITIONS !== 'undefined') {
        badgeDefinitions = BADGE_DEFINITIONS;
    } else {
        // Fallback definitions for basic badges if badges.js not loaded
        badgeDefinitions = [
            { id: 'food_logger_basic', title: 'Logger Novice', icon: '📝', backgroundColor: '#e0f7fa' },
            { id: 'food_saver_basic', title: 'Food Saver', icon: '🍎', backgroundColor: '#e8f5e9' },
            { id: 'carbon_basic', title: 'Carbon Counter', icon: '🔢', backgroundColor: '#f1f8e9' },
            { id: 'ai_basic', title: 'AI Apprentice', icon: '💡', backgroundColor: '#fff8e1' }
        ];
    }
    
    // Render each recent badge
    recentBadges.forEach(badge => {
        const badgeDefinition = badgeDefinitions.find(def => def.id === badge.id) || {
            icon: '🏆',
            backgroundColor: '#f5f5f5'
        };
        
        const badgeEl = document.createElement('div');
        badgeEl.className = 'badge-card mini';
        badgeEl.style.backgroundColor = badgeDefinition.backgroundColor || '#f5f5f5';
        
        // Format date
        const earnedDate = new Date(badge.dateAwarded);
        const formattedDate = earnedDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
        
        badgeEl.innerHTML = `
            <div class="badge-icon">${badgeDefinition.icon || '🏆'}</div>
            <div class="badge-content">
                <h4 class="badge-title">${badge.title}</h4>
                <div class="badge-earned-date">${formattedDate}</div>
            </div>
        `;
        
        recentBadgesContainer.appendChild(badgeEl);
    });
}

/**
 * Load user settings from localStorage
 */
function loadSettings() {
    const settings = getUserSettings();
    
    // Set toggle states based on saved settings
    notificationsToggle.checked = settings.notifications !== false; // Default to true
    summaryToggle.checked = settings.weeklySummary === true; // Default to false
    themeToggle.checked = settings.darkMode === true; // Default to false
    
    // Apply theme if dark mode is enabled
    if (settings.darkMode) {
        document.body.classList.add('dark-mode');
    }
}

/**
 * Get user settings from localStorage
 * @returns {Object} - User settings object
 */
function getUserSettings() {
    const userProfile = getUserProfile();
    return userProfile.settings || {
        notifications: true,
        weeklySummary: false,
        darkMode: false
    };
}

/**
 * Update settings when toggles are changed
 */
function updateSettings() {
    const userProfile = getUserProfile();
    
    userProfile.settings = {
        ...userProfile.settings,
        notifications: notificationsToggle.checked,
        weeklySummary: summaryToggle.checked,
        darkMode: themeToggle.checked
    };
    
    saveUserProfile(userProfile);
    
    // Show confirmation
    showNotification('Settings updated!');
}

/**
 * Toggle between light and dark theme
 */
function toggleTheme() {
    const isDarkMode = themeToggle.checked;
    
    // Update body class
    document.body.classList.toggle('dark-mode', isDarkMode);
    
    // Update settings
    updateSettings();
}

/**
 * Export user data as JSON file
 */
function exportUserData() {
    // Collect all user data from localStorage
    const userData = {};
    
    // Get all keys with the storage prefix
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith(STORAGE_PREFIX)) {
            try {
                userData[key] = JSON.parse(localStorage.getItem(key));
            } catch (error) {
                userData[key] = localStorage.getItem(key);
            }
        }
    });
    
    // Create a JSON string
    const jsonString = JSON.stringify(userData, null, 2);
    
    // Create a download link
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `trana_user_data_${formatDateForFilename(new Date())}.json`;
    
    // Trigger download
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Clean up
    URL.revokeObjectURL(url);
    
    // Show confirmation
    showNotification('Data exported successfully!');
}

/**
 * Reset all user data
 */
function resetUserData() {
    // Confirm with user
    if (!confirm('Are you sure you want to reset all your data? This cannot be undone.')) {
        return;
    }
    
    // Remove all data with the storage prefix
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith(STORAGE_PREFIX)) {
            localStorage.removeItem(key);
        }
    });
    
    // Set first visit date to now
    localStorage.setItem(FIRST_VISIT_KEY, new Date().toISOString());
    
    // Show confirmation
    showNotification('All data has been reset.');
    
    // Reload the page
    setTimeout(() => {
        window.location.reload();
    }, 1500);
}

/**
 * Check if this is the first visit and set join date
 */
function checkFirstVisit() {
    const firstVisit = localStorage.getItem(FIRST_VISIT_KEY);
    
    if (!firstVisit) {
        // Set first visit date to now
        localStorage.setItem(FIRST_VISIT_KEY, new Date().toISOString());
    }
    
    // Set the join date text
    const joinDate = firstVisit ? new Date(firstVisit) : new Date();
    userJoinDate.textContent = formatJoinDate(joinDate);
}

/**
 * Format date for join date display
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date string
 */
function formatJoinDate(date) {
    return date.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
    });
}

/**
 * Format date for filename
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date string
 */
function formatDateForFilename(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Show a temporary notification toast
 * @param {string} message - Message to display
 */
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification-toast';
    notification.textContent = message;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}