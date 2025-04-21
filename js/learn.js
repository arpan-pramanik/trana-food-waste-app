/**
 * Learn Page Module for Trāṇa
 * Handles interactions with Python backend to get educational content from Gemini AI
 */

// API Endpoints
const API_ENDPOINTS = {
    testConnection: 'http://localhost:5000/api/test-connection',
    getLearnContent: 'http://localhost:5000/api/learn'
};

// DOM Elements
const topicForm = document.getElementById('topic-form');
const topicInput = document.getElementById('topic-input');
const contentContainer = document.getElementById('content-container');
const contentDisplay = document.getElementById('content-display');
const loadingIndicator = document.getElementById('loading-indicator');
const noContent = document.getElementById('no-content');
const errorMessage = document.getElementById('error-message');
const learnedTopicsCount = document.getElementById('learned-topics-count');
const searchHistoryList = document.getElementById('search-history-list');
const emptyHistoryMessage = document.getElementById('empty-history-message');
const popularTopicsContainer = document.getElementById('popular-topics');

// State management
let searchHistory = [];
let stats = {
    topicsLearned: 0
};

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    console.log('Learn page initialized');
    
    // Hide all containers initially
    loadingIndicator.style.display = 'none';
    contentDisplay.style.display = 'none';
    errorMessage.style.display = 'none';
    noContent.style.display = 'block';
    
    // Load search history from localStorage
    loadSearchHistory();
    
    // Load and display stats
    loadStats();
    
    // Set up event listeners
    setupEventListeners();
    
    // Add API status indicator
    addApiStatusIndicator();
    
    // Test API connection
    testApiConnection();
    
    // Set up popular topics
    setupPopularTopics();
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
    const infoCard = document.querySelector('.learn-info-card');
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
    if (topicForm) {
        topicForm.addEventListener('submit', handleTopicFormSubmit);
    } else {
        console.error('Topic form not found in the DOM');
    }
    
    // Event delegation for history items
    if (searchHistoryList) {
        searchHistoryList.addEventListener('click', handleHistoryItemClick);
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
                    showNoContentState();
                }
            });
        });
        
        errorMessage.appendChild(retryButton);
    }
}

/**
 * Set up popular topics for quick access
 */
function setupPopularTopics() {
    const popularTopics = [
        { name: "Composting Basics", icon: "🌱" },
        { name: "Food Storage Tips", icon: "🥫" },
        { name: "Zero Waste Cooking", icon: "🍲" },
        { name: "Reducing Food Waste", icon: "♻️" },
        { name: "Meal Planning", icon: "📝" },
        { name: "Preserving Methods", icon: "🥭" }
    ];
    
    popularTopicsContainer.innerHTML = '';
    
    popularTopics.forEach(topic => {
        const topicButton = document.createElement('button');
        topicButton.className = 'popular-topic-btn';
        topicButton.innerHTML = `<span class="topic-icon">${topic.icon}</span> ${topic.name}`;
        
        // Add click handler
        topicButton.addEventListener('click', () => {
            topicInput.value = topic.name;
            handleTopicFormSubmit(new Event('submit'));
        });
        
        popularTopicsContainer.appendChild(topicButton);
    });
}

/**
 * Handle topic form submission
 * @param {Event} event - Form submit event
 */
async function handleTopicFormSubmit(event) {
    event.preventDefault();
    
    const topic = topicInput.value.trim();
    if (!topic) {
        showNotification('Please enter a topic first.');
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
        // Get educational content from Python backend
        const content = await getGeminiLearnContent(topic);
        
        if (content) {
            // Display the educational content
            displayLearnContent(topic, content);
            
            // Update search history
            updateSearchHistory(topic, content);
            
            // Update stats
            updateStats('learned');
            
            // Check for badges
            checkForLearnBadges();
        } else {
            throw new Error('No content returned from the API');
        }
    } catch (error) {
        console.error('Error getting content:', error);
        
        // Check if this is a validation error (non-food waste related topic)
        if (error.isValidationError) {
            showErrorState(error.message);
            showNotification(error.message);
        } else {
            showErrorState();
            showNotification('Failed to get content: ' + error.message);
        }
    }
}

/**
 * Get educational content from Python backend
 * @param {string} topic - Topic to learn about
 * @returns {Promise<Object>} - Content object with title, content, tips, etc.
 */
async function getGeminiLearnContent(topic) {
    console.log('Requesting learn content for:', topic);
    
    try {
        const response = await fetch(API_ENDPOINTS.getLearnContent, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                topic: topic
            })
        });
        
        const data = await response.json();
        
        if (!response.ok || data.status === 'error') {
            // Check if this is a topic validation error (non-food waste related topic)
            if (data.message && data.message.includes("Please enter topics related to food waste")) {
                // Create custom error with specific message for UI display
                const error = new Error(data.message);
                error.isValidationError = true;
                throw error;
            }
            throw new Error(data.message || 'Failed to get educational content');
        }
        
        return data.content;
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}

/**
 * Display educational content in the UI
 * @param {string} topic - The queried topic
 * @param {Object} content - Content object with educational material
 */
function displayLearnContent(topic, content) {
    // Hide loading indicator and show content
    loadingIndicator.style.display = 'none';
    noContent.style.display = 'none';
    errorMessage.style.display = 'none';
    contentDisplay.style.display = 'block';
    
    // Clear previous content
    contentDisplay.innerHTML = '';
    
    // Create content elements
    const contentCard = document.createElement('div');
    contentCard.className = 'learn-content-card';
    
    // Title
    const title = document.createElement('h3');
    title.className = 'content-title';
    title.textContent = content.title || topic;
    contentCard.appendChild(title);
    
    // Content sections
    if (content.introduction) {
        const intro = document.createElement('div');
        intro.className = 'content-section';
        intro.innerHTML = `<p>${sanitizeHTML(content.introduction)}</p>`;
        contentCard.appendChild(intro);
    }
    
    // Main content
    const mainContent = document.createElement('div');
    mainContent.className = 'content-section';
    
    // Process and sanitize the main content
    let processedContent = content.content || '';
    
    // If content is still in JSON format or contains markdown code blocks, clean it up
    if (typeof processedContent === 'string') {
        // Remove any JSON blocks or markdown formatting
        processedContent = processedContent
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .replace(/^\s*\{/g, '')
            .replace(/\}\s*$/g, '');
            
        // If content doesn't already have HTML paragraph tags, add them
        if (!processedContent.includes('<p>')) {
            processedContent = `<p>${processedContent.split('\n\n').join('</p><p>')}</p>`;
        }
    } else {
        // If content is not a string, convert to string
        processedContent = String(processedContent);
    }
    
    mainContent.innerHTML = sanitizeHTML(processedContent);
    contentCard.appendChild(mainContent);
    
    // Tips section
    if (content.tips && Array.isArray(content.tips) && content.tips.length > 0) {
        const tipsSection = document.createElement('div');
        tipsSection.className = 'tips-section';
        
        const tipsTitle = document.createElement('h4');
        tipsTitle.textContent = 'Practical Tips';
        tipsSection.appendChild(tipsTitle);
        
        const tipsList = document.createElement('ul');
        tipsList.className = 'tips-list';
        
        content.tips.forEach(tip => {
            // Skip empty tips
            if (!tip) return;
            
            const tipItem = document.createElement('li');
            tipItem.className = 'tip-item';
            tipItem.innerHTML = `
                <div class="tip-icon">💡</div>
                <div class="tip-content">${sanitizeHTML(String(tip))}</div>
            `;
            tipsList.appendChild(tipItem);
        });
        
        tipsSection.appendChild(tipsList);
        contentCard.appendChild(tipsSection);
    }
    
    // Action steps
    if (content.actionSteps && Array.isArray(content.actionSteps) && content.actionSteps.length > 0) {
        const actionSection = document.createElement('div');
        actionSection.className = 'action-section';
        
        const actionTitle = document.createElement('h4');
        actionTitle.textContent = 'Action Steps';
        actionSection.appendChild(actionTitle);
        
        const actionList = document.createElement('ol');
        actionList.className = 'action-list';
        
        content.actionSteps.forEach(step => {
            // Skip empty steps
            if (!step) return;
            
            const actionItem = document.createElement('li');
            actionItem.className = 'action-item';
            actionItem.textContent = String(step);
            actionList.appendChild(actionItem);
        });
        
        actionSection.appendChild(actionList);
        contentCard.appendChild(actionSection);
    }
    
    // Add save/share buttons
    const actionBar = document.createElement('div');
    actionBar.className = 'content-actions';
    
    // Save button
    const saveButton = document.createElement('button');
    saveButton.className = 'btn secondary-btn';
    saveButton.innerHTML = '<span class="btn-icon">📋</span> Save to Profile';
    saveButton.addEventListener('click', () => saveLearnContent(topic, content));
    actionBar.appendChild(saveButton);
    
    // Share button
    const shareButton = document.createElement('button');
    shareButton.className = 'btn secondary-btn';
    shareButton.innerHTML = '<span class="btn-icon">🔗</span> Share';
    shareButton.addEventListener('click', () => shareContent(topic, content));
    actionBar.appendChild(shareButton);
    
    contentCard.appendChild(actionBar);
    
    // Add the content card to the container
    contentDisplay.appendChild(contentCard);
}

/**
 * Sanitize HTML to prevent XSS attacks
 * @param {string} html - HTML string to sanitize
 * @returns {string} - Sanitized HTML
 */
function sanitizeHTML(html) {
    if (!html) return '';
    
    const temp = document.createElement('div');
    temp.textContent = html;
    const sanitized = temp.innerHTML;
    
    // Allow specific HTML tags for formatting
    return sanitized
        .replace(/&lt;p&gt;/g, '<p>')
        .replace(/&lt;\/p&gt;/g, '</p>')
        .replace(/&lt;ul&gt;/g, '<ul>')
        .replace(/&lt;\/ul&gt;/g, '</ul>')
        .replace(/&lt;li&gt;/g, '<li>')
        .replace(/&lt;\/li&gt;/g, '</li>')
        .replace(/&lt;strong&gt;/g, '<strong>')
        .replace(/&lt;\/strong&gt;/g, '</strong>');
}

/**
 * Save learned content to user profile
 * @param {string} topic - Topic title
 * @param {Object} content - Content data
 */
function saveLearnContent(topic, content) {
    // Implement saving to user profile
    // For now, just show notification
    showNotification('Content saved to your profile!');
    
    // Update stats
    updateStats('saved');
    
    // Check for badges
    checkForLearnBadges();
}

/**
 * Share content with others
 * @param {string} topic - Topic title
 * @param {Object} content - Content data
 */
function shareContent(topic, content) {
    // Implement sharing functionality
    // For now, simulate copy to clipboard
    
    // Create shareable text
    const shareText = `${content.title || topic}\n\n${content.introduction || ''}\n\n${content.content || ''}\n\nLearned from Trāṇa - Rescuing Food, Sustaining Life`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareText)
        .then(() => {
            showNotification('Content copied to clipboard!');
        })
        .catch(err => {
            console.error('Failed to copy text: ', err);
            showNotification('Failed to copy content');
        });
}

/**
 * Show loading state
 */
function showLoadingState() {
    loadingIndicator.style.display = 'block';
    contentDisplay.style.display = 'none';
    noContent.style.display = 'none';
    errorMessage.style.display = 'none';
}

/**
 * Show error state
 */
function showErrorState(customMessage) {
    contentDisplay.style.display = 'none';
    loadingIndicator.style.display = 'none';
    noContent.style.display = 'none';
    
    // Update error message if a custom message is provided
    if (customMessage && errorMessage) {
        const errorParagraph = errorMessage.querySelector('p');
        if (errorParagraph) {
            errorParagraph.textContent = customMessage;
        }
    }
    
    errorMessage.style.display = 'block';
}

/**
 * Show no content state
 */
function showNoContentState() {
    loadingIndicator.style.display = 'none';
    contentDisplay.style.display = 'none';
    noContent.style.display = 'block';
    errorMessage.style.display = 'none';
}

/**
 * Update search history
 * @param {string} topic - Search topic
 * @param {Object} content - Content returned from API
 */
function updateSearchHistory(topic, content) {
    // Create history item
    const historyItem = {
        id: Date.now(),
        topic: topic,
        title: content.title || topic,
        timestamp: new Date().toISOString(),
        snippet: content.introduction || content.content?.substring(0, 100) || ''
    };
    
    // Add to history (most recent first)
    searchHistory.unshift(historyItem);
    
    // Limit history size
    if (searchHistory.length > 10) {
        searchHistory = searchHistory.slice(0, 10);
    }
    
    // Save to local storage
    localStorage.setItem('learningHistory', JSON.stringify(searchHistory));
    
    // Update UI
    displaySearchHistory();
}

/**
 * Display search history in the UI
 */
function displaySearchHistory() {
    if (!searchHistoryList) return;
    
    if (searchHistory.length === 0) {
        searchHistoryList.style.display = 'none';
        if (emptyHistoryMessage) emptyHistoryMessage.style.display = 'block';
        return;
    }
    
    searchHistoryList.style.display = 'block';
    if (emptyHistoryMessage) emptyHistoryMessage.style.display = 'none';
    
    // Clear existing content
    searchHistoryList.innerHTML = '';
    
    // Add history items
    searchHistory.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.dataset.id = item.id;
        
        // Format date
        const date = new Date(item.timestamp);
        const formattedDate = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        
        historyItem.innerHTML = `
            <div class="history-content">
                <h4>${item.title}</h4>
                <p class="history-snippet">${item.snippet}...</p>
                <p class="history-date">${formattedDate}</p>
            </div>
        `;
        
        searchHistoryList.appendChild(historyItem);
    });
}

/**
 * Handle history item click
 * @param {Event} event - Click event
 */
function handleHistoryItemClick(event) {
    // Find the closest history item
    const historyItem = event.target.closest('.history-item');
    if (!historyItem) return;
    
    const itemId = parseInt(historyItem.dataset.id);
    
    // Find the item in history
    const item = searchHistory.find(h => h.id === itemId);
    if (item) {
        // Set the input value
        if (topicInput) topicInput.value = item.topic;
        
        // Submit the form
        if (topicForm) topicForm.dispatchEvent(new Event('submit'));
    }
}

/**
 * Load search history from localStorage
 */
function loadSearchHistory() {
    const savedHistory = localStorage.getItem('learningHistory');
    if (savedHistory) {
        searchHistory = JSON.parse(savedHistory);
        displaySearchHistory();
    }
}

/**
 * Load stats from localStorage
 */
function loadStats() {
    const savedStats = localStorage.getItem('learnStats');
    if (savedStats) {
        stats = JSON.parse(savedStats);
    }
    
    updateStatsDisplay();
}

/**
 * Update learning statistics
 * @param {string} type - Type of action (learned, saved)
 */
function updateStats(type) {
    if (type === 'learned') {
        stats.topicsLearned++;
    }
    
    // Save to localStorage
    localStorage.setItem('learnStats', JSON.stringify(stats));
    
    // Update display
    updateStatsDisplay();
}

/**
 * Update stats display in UI
 */
function updateStatsDisplay() {
    if (learnedTopicsCount) {
        learnedTopicsCount.textContent = stats.topicsLearned.toString();
    }
}

/**
 * Check if user qualifies for learning-related badges
 */
function checkForLearnBadges() {
    // Check if badges module is available
    if (typeof badgesModule !== 'undefined' && badgesModule.awardBadge) {
        // Award badges based on learning activity
        
        // First learn topic badge
        if (stats.topicsLearned >= 1) {
            badgesModule.awardBadge('learn_first_topic');
        }
        
        // Learned 5 topics badge
        if (stats.topicsLearned >= 5) {
            badgesModule.awardBadge('learn_five_topics');
        }
        
        // Learned 10 topics badge
        if (stats.topicsLearned >= 10) {
            badgesModule.awardBadge('learn_ten_topics');
        }
    } else {
        console.log('Badges module not available');
    }
}

/**
 * Show a notification message
 * @param {string} message - The message to display
 */
function showNotification(message) {
    // Check if notifications module exists
    if (typeof showToast === 'function') {
        showToast(message);
        return;
    }
    
    // Fallback: create a simple notification
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after timeout
    setTimeout(() => {
        notification.classList.add('hide');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
} 