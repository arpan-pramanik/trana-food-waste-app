/**
 * AI Suggestions Module for Trana
 * Handles interactions with Python backend to get food reuse suggestions from Gemini AI
 */

// API Endpoints
const API_ENDPOINTS = {
    testConnection: 'http://localhost:5000/api/test-connection',
    getSuggestions: 'http://localhost:5000/api/suggestions'
};

// DOM Elements
const suggestionForm = document.getElementById('suggestion-form');
const ingredientsInput = document.getElementById('ingredients-input');
const suggestionsContainer = document.getElementById('suggestions-container');
const suggestionsContent = document.getElementById('suggestions-content');
const loadingIndicator = document.getElementById('loading-indicator');
const noSuggestions = document.getElementById('no-suggestions');
const errorMessage = document.getElementById('error-message');
const historyList = document.getElementById('history-list');
const emptyHistoryMessage = document.getElementById('empty-history-message');
const suggestionsGeneratedCount = document.getElementById('suggestions-generated');
const suggestionsSavedCount = document.getElementById('suggestions-saved');

// State management
let suggestionHistory = [];
let stats = {
    suggestionsGenerated: 0,
    suggestionsSaved: 0
};

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    console.log('AI Suggestions page initialized');
    
    // Hide all containers initially
    loadingIndicator.style.display = 'none';
    suggestionsContent.style.display = 'none';
    errorMessage.style.display = 'none';
    noSuggestions.style.display = 'block';
    
    // Load suggestion history from localStorage
    loadSuggestionHistory();
    
    // Load and display stats
    loadStats();
    
    // Set up event listeners
    setupEventListeners();
    
    // Add API status indicator
    addApiStatusIndicator();
    
    // Test API connection
    testApiConnection();
});

/**
 * Add API status indicator to the page
 */
function addApiStatusIndicator() {
    // Create indicator element
    const apiStatus = document.createElement('div');
    apiStatus.className = 'api-status';
    apiStatus.id = 'api-status';
    
    // Set initial status (will be updated by the test)
    apiStatus.innerHTML = '<span class="status-icon pending">●</span> Checking Gemini API connection...';
    apiStatus.classList.add('pending');
    
    // Find the right place to insert it
    const infoCard = document.querySelector('.ai-info-card');
    const infoCardTitle = infoCard.querySelector('h3');
    
    // Insert after the title
    infoCardTitle.parentNode.insertBefore(apiStatus, infoCardTitle.nextSibling);
}

/**
 * Test the API connection to the Python backend
 */
async function testApiConnection() {
    const apiStatus = document.getElementById('api-status');
    
    try {
        const response = await fetch(API_ENDPOINTS.testConnection);
        const data = await response.json();
        
        if (response.ok && data.status === 'success') {
            console.log('API connection successful:', data);
            
            apiStatus.innerHTML = '<span class="status-icon active">●</span> Gemini API connected successfully';
            apiStatus.className = 'api-status connected';
            return true;
        } else {
            console.error('API test error:', data.message);
            
            apiStatus.innerHTML = `<span class="status-icon error">●</span> API connection error: ${data.message}`;
            apiStatus.className = 'api-status error';
            
            // Add help text
            addApiHelpText('Backend API error. Please make sure the Python server is running.');
            
            return false;
        }
    } catch (error) {
        console.error('API connection test error:', error);
        
        apiStatus.innerHTML = `<span class="status-icon error">●</span> API connection error: Network error`;
        apiStatus.className = 'api-status error';
        addApiHelpText('Cannot connect to the Python backend. Please make sure the server is running at http://localhost:5000.');
        return false;
    }
}

/**
 * Add help text for API issues
 */
function addApiHelpText(message) {
    // Remove any existing help text
    const existingHelpText = document.querySelector('.api-help-text');
    if (existingHelpText) {
        existingHelpText.remove();
    }
    
    // Create and add new help text
    const apiStatus = document.getElementById('api-status');
    const helpText = document.createElement('p');
    helpText.className = 'api-help-text';
    helpText.textContent = message;
    
    apiStatus.parentNode.insertBefore(helpText, apiStatus.nextSibling);
}

/**
 * Set up event listeners for the page
 */
function setupEventListeners() {
    // Form submission
    if (suggestionForm) {
        suggestionForm.addEventListener('submit', handleSuggestionFormSubmit);
    } else {
        console.error('Suggestion form not found in the DOM');
    }
    
    // Event delegation for history items
    if (historyList) {
        historyList.addEventListener('click', handleHistoryItemClick);
    }
    
    // Add retry button in error message
    if (errorMessage) {
        const retryButton = document.createElement('button');
        retryButton.className = 'btn secondary-btn retry-btn';
        retryButton.textContent = 'Retry Connection';
        retryButton.addEventListener('click', () => {
            testApiConnection().then(success => {
                if (success) {
                    // If connection is restored, hide error message
                    showNoSuggestionsState();
                }
            });
        });
        
        errorMessage.appendChild(retryButton);
    }
}

/**
 * Handle suggestion form submission
 * @param {Event} event - Form submit event
 */
async function handleSuggestionFormSubmit(event) {
    event.preventDefault();
    
    const ingredients = ingredientsInput.value.trim();
    if (!ingredients) {
        showNotification('Please enter some ingredients first.');
        return;
    }
    
    // Check API connection first
    const apiStatus = document.getElementById('api-status');
    if (apiStatus && apiStatus.classList.contains('error')) {
        showNotification('API connection error. Please check that the Python server is running.');
        showErrorState();
        return;
    }
    
    // Show loading state
    showLoadingState();
    
    try {
        // Get suggestions from Python backend
        const suggestions = await getGeminiSuggestions(ingredients);
        
        if (suggestions && suggestions.length > 0) {
            // Process and display suggestions
            displaySuggestions(ingredients, suggestions);
            
            // Update suggestion history
            updateSuggestionHistory(ingredients, suggestions);
            
            // Update stats
            updateStats('generated');
            
            // Check for badges
            checkForAiBadges();
        } else {
            throw new Error('No suggestions returned from the API');
        }
    } catch (error) {
        console.error('Error getting suggestions:', error);
        showErrorState();
        showNotification('Failed to get suggestions: ' + error.message);
    }
}

/**
 * Get suggestions from Python backend
 * @param {string} ingredients - User provided ingredients
 * @returns {Promise<Array>} - Array of suggestion objects
 */
async function getGeminiSuggestions(ingredients) {
    console.log('Requesting suggestions for:', ingredients);
    
    try {
        const response = await fetch(API_ENDPOINTS.getSuggestions, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ingredients: ingredients
            })
        });
        
        const data = await response.json();
        
        if (!response.ok || data.status === 'error') {
            throw new Error(data.message || 'Failed to get suggestions');
        }
        
        return data.suggestions;
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}

/**
 * Display suggestions on the page
 * @param {string} ingredients - User provided ingredients
 * @param {Array} suggestions - Array of suggestion objects
 */
function displaySuggestions(ingredients, suggestions) {
    // Clear previous content
    suggestionsContent.innerHTML = '';
    
    // Create ingredients header section
    const ingredientsHeader = document.createElement('div');
    ingredientsHeader.className = 'ingredients-header';
    ingredientsHeader.innerHTML = `
        <h3>Suggestions for your ingredients</h3>
        <p class="ingredients-list">${ingredients}</p>
    `;
    suggestionsContent.appendChild(ingredientsHeader);
    
    // Create suggestions list
    const suggestionsList = document.createElement('div');
    suggestionsList.className = 'suggestions-list';
    
    // Add each suggestion
    suggestions.forEach((suggestion, index) => {
        const suggestionCard = document.createElement('div');
        suggestionCard.className = 'suggestion-card';
        
        // Create heading element
        const heading = document.createElement('h4');
        heading.textContent = suggestion.title;
        
        // Create description element
        const description = document.createElement('p');
        description.textContent = suggestion.description;
        
        // Create save button
        const saveButton = document.createElement('button');
        saveButton.className = 'save-suggestion';
        saveButton.dataset.index = index;
        saveButton.innerHTML = `
            <span class="btn-text">Save Suggestion</span>
            <span class="btn-icon">💾</span>
        `;
        
        // Append elements to card in proper order
        suggestionCard.appendChild(heading);
        suggestionCard.appendChild(description);
        suggestionCard.appendChild(saveButton);
        
        // Add card to list
        suggestionsList.appendChild(suggestionCard);
    });
    
    suggestionsContent.appendChild(suggestionsList);
    
    // Add event listeners to save buttons
    suggestionsContent.querySelectorAll('.save-suggestion').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            saveSuggestion(ingredients, suggestions[index]);
            this.disabled = true;
            this.innerHTML = '<span class="btn-text">Saved!</span><span class="btn-icon">✓</span>';
        });
    });
    
    // Show the suggestions content
    loadingIndicator.style.display = 'none';
    noSuggestions.style.display = 'none';
    errorMessage.style.display = 'none';
    suggestionsContent.style.display = 'block';
}

/**
 * Save a suggestion to history
 * @param {string} ingredients - Ingredients used
 * @param {Object} suggestion - Suggestion object to save
 */
function saveSuggestion(ingredients, suggestion) {
    // Create a copy of the suggestion with ingredients and timestamp
    const savedSuggestion = {
        ingredients,
        title: suggestion.title,
        description: suggestion.description,
        timestamp: new Date().toISOString()
    };
    
    // Add to suggestion history
    suggestionHistory.unshift(savedSuggestion);
    
    // Keep only the most recent 20 suggestions
    if (suggestionHistory.length > 20) {
        suggestionHistory = suggestionHistory.slice(0, 20);
    }
    
    // Save to localStorage
    localStorage.setItem(`${CONFIG.app.storagePrefix}suggestionHistory`, JSON.stringify(suggestionHistory));
    
    // Update display
    displaySuggestionHistory();
    
    // Update stats
    updateStats('saved');
    
    // Show notification
    showNotification('Suggestion saved to your history.');
}

/**
 * Show loading state
 */
function showLoadingState() {
    suggestionsContent.style.display = 'none';
    noSuggestions.style.display = 'none';
    errorMessage.style.display = 'none';
    loadingIndicator.style.display = 'flex';
}

/**
 * Show error state
 */
function showErrorState() {
    suggestionsContent.style.display = 'none';
    noSuggestions.style.display = 'none';
    loadingIndicator.style.display = 'none';
    errorMessage.style.display = 'block';
}

/**
 * Show no suggestions state
 */
function showNoSuggestionsState() {
    suggestionsContent.style.display = 'none';
    loadingIndicator.style.display = 'none';
    errorMessage.style.display = 'none';
    noSuggestions.style.display = 'block';
}

/**
 * Update suggestion history
 * @param {string} ingredients - User provided ingredients
 * @param {Array} suggestions - Array of suggestions
 */
function updateSuggestionHistory(ingredients, suggestions) {
    // Create history entry
    const historyEntry = {
        ingredients,
        suggestions,
        timestamp: new Date().toISOString()
    };
    
    // Add to history
    suggestionHistory.unshift(historyEntry);
    
    // Keep only the most recent 20 entries
    if (suggestionHistory.length > 20) {
        suggestionHistory = suggestionHistory.slice(0, 20);
    }
    
    // Save to localStorage
    localStorage.setItem(`${CONFIG.app.storagePrefix}suggestionHistory`, JSON.stringify(suggestionHistory));
    
    // Update display
    displaySuggestionHistory();
}

/**
 * Display suggestion history on the page
 */
function displaySuggestionHistory() {
    // Check if history element exists
    if (!historyList) return;
    
    // Clear existing content
    historyList.innerHTML = '';
    
    // Hide empty message if there are history items
    if (suggestionHistory.length > 0) {
        emptyHistoryMessage.style.display = 'none';
    } else {
        emptyHistoryMessage.style.display = 'block';
        return;
    }
    
    // Add history items
    suggestionHistory.forEach((entry, index) => {
        // Format date
        const date = new Date(entry.timestamp);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        
        // Create history item
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div class="history-item-header">
                <span class="history-item-ingredients">${entry.ingredients}</span>
                <span class="history-item-date">${formattedDate}</span>
            </div>
            <button class="history-item-view" data-index="${index}">View</button>
        `;
        
        historyList.appendChild(historyItem);
    });
}

/**
 * Handle history item click
 * @param {Event} event - Click event
 */
function handleHistoryItemClick(event) {
    // Check if clicked element is a view button
    if (event.target.classList.contains('history-item-view')) {
        const index = parseInt(event.target.dataset.index);
        const entry = suggestionHistory[index];
        
        // Display suggestions from history
        if (entry && entry.suggestions) {
            displaySuggestions(entry.ingredients, entry.suggestions);
            // Scroll to suggestions
            suggestionsContainer.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

/**
 * Load suggestion history from localStorage
 */
function loadSuggestionHistory() {
    try {
        const savedHistory = localStorage.getItem(`${CONFIG.app.storagePrefix}suggestionHistory`);
        suggestionHistory = savedHistory ? JSON.parse(savedHistory) : [];
        displaySuggestionHistory();
    } catch (error) {
        console.error('Error loading suggestion history:', error);
        suggestionHistory = [];
    }
}

/**
 * Load stats from localStorage
 */
function loadStats() {
    try {
        const savedStats = localStorage.getItem(`${CONFIG.app.storagePrefix}suggestionStats`);
        stats = savedStats ? JSON.parse(savedStats) : { suggestionsGenerated: 0, suggestionsSaved: 0 };
        updateStatsDisplay();
    } catch (error) {
        console.error('Error loading stats:', error);
        stats = { suggestionsGenerated: 0, suggestionsSaved: 0 };
    }
}

/**
 * Update stats
 * @param {string} type - Type of stat to update ('generated' or 'saved')
 */
function updateStats(type) {
    if (type === 'generated') {
        stats.suggestionsGenerated++;
    } else if (type === 'saved') {
        stats.suggestionsSaved++;
    }
    
    // Save to localStorage
    localStorage.setItem(`${CONFIG.app.storagePrefix}suggestionStats`, JSON.stringify(stats));
    
    // Update display
    updateStatsDisplay();
}

/**
 * Update stats display on the page
 */
function updateStatsDisplay() {
    if (suggestionsGeneratedCount) {
        suggestionsGeneratedCount.textContent = stats.suggestionsGenerated;
    }
    
    if (suggestionsSavedCount) {
        suggestionsSavedCount.textContent = stats.suggestionsSaved;
    }
}

/**
 * Check if user has earned any AI-related badges
 */
function checkForAiBadges() {
    // Get user's current badges
    const badgesKey = `${CONFIG.app.storagePrefix}userBadges`;
    let userBadges = JSON.parse(localStorage.getItem(badgesKey)) || [];
    
    // Basic AI badge - Use AI suggestions once
    if (stats.suggestionsGenerated >= CONFIG.badges.aiSuggestionsBasic) {
        const basicBadge = {
            id: 'ai-suggestions-basic',
            name: 'AI Assistant',
            description: 'Used AI suggestions to reduce food waste',
            icon: '🤖',
            date: new Date().toISOString()
        };
        
        awardBadgeIfNotExists(userBadges, basicBadge.id, basicBadge);
    }
    
    // Intermediate AI badge - Use AI suggestions multiple times
    if (stats.suggestionsGenerated >= CONFIG.badges.aiSuggestionsIntermediate) {
        const intermediateBadge = {
            id: 'ai-suggestions-intermediate',
            name: 'AI Innovator',
            description: 'Regularly uses AI to create new recipes from leftovers',
            icon: '🧠',
            date: new Date().toISOString()
        };
        
        awardBadgeIfNotExists(userBadges, intermediateBadge.id, intermediateBadge);
    }
}

/**
 * Award a badge if the user doesn't already have it
 * @param {Array} badgeData - Current user badges
 * @param {string} id - Badge ID to check
 * @param {Object} badge - Badge object to award
 */
function awardBadgeIfNotExists(badgeData, id, badge) {
    // Check if badge already exists
    const exists = badgeData.some(b => b.id === id);
    
    if (!exists) {
        // Add the badge
        badgeData.push(badge);
        
        // Save updated badges
        localStorage.setItem(`${CONFIG.app.storagePrefix}userBadges`, JSON.stringify(badgeData));
        
        // Show notification
        showNotification(`🎉 New Badge Earned: ${badge.name}!`);
    }
}

/**
 * Show a notification toast
 * @param {string} message - Message to display
 */
function showNotification(message) {
    // Check if a notification element already exists
    let notification = document.querySelector('.notification-toast');
    
    // Create a new notification if none exists
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification-toast';
        document.body.appendChild(notification);
    }
    
    // Set message and show
    notification.textContent = message;
    notification.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}