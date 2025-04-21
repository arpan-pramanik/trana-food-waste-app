/**
 * Badges Module for Trana
 * Manages the gamification system, badge display, and badge unlock logic
 */

// DOM Elements
const badgesContainer = document.getElementById('badges-container');
const noBadgesMessage = document.getElementById('no-badges-message');
const lockedBadgesContainer = document.getElementById('locked-badges-container');
const totalBadgesCount = document.getElementById('total-badges-count');
const badgesPercentage = document.getElementById('badges-percentage');
const badgesProgressFill = document.getElementById('badges-progress-fill');
const categoryTabs = document.querySelectorAll('.tab-btn');

// Badge definitions - all possible badges in the system
const BADGE_DEFINITIONS = [
    // Food Logger Badges
    {
        id: 'food_logger_basic',
        title: 'Logger Novice',
        description: 'Logged your first food item',
        icon: '📝',
        category: 'food',
        requirement: 'Log 1 food item',
        backgroundColor: '#e0f7fa'
    },
    {
        id: 'food_logger_intermediate',
        title: 'Inventory Master',
        description: 'Logged 5 or more food items',
        icon: '📚',
        category: 'food',
        requirement: 'Log 5 food items',
        backgroundColor: '#b2ebf2'
    },
    {
        id: 'food_logger_advanced',
        title: 'Tracking Pro',
        description: 'Logged 20 or more food items',
        icon: '📊',
        category: 'food',
        requirement: 'Log 20 food items',
        backgroundColor: '#80deea'
    },
    {
        id: 'food_saver_basic',
        title: 'Food Saver',
        description: 'Used 3 or more food items before expiry',
        icon: '🍎',
        category: 'food',
        requirement: 'Use 3 items before they expire',
        backgroundColor: '#e8f5e9'
    },
    {
        id: 'food_saver_intermediate',
        title: 'Waste Warrior',
        description: 'Used 10 or more food items before expiry',
        icon: '🥕',
        category: 'food',
        requirement: 'Use 10 items before they expire',
        backgroundColor: '#c8e6c9'
    },
    
    // Carbon Calculator Badges
    {
        id: 'carbon_basic',
        title: 'Carbon Counter',
        description: 'Used the carbon calculator for the first time',
        icon: '🔢',
        category: 'carbon',
        requirement: 'Calculate carbon impact once',
        backgroundColor: '#f1f8e9'
    },
    {
        id: 'carbon_intermediate',
        title: 'Climate Champion',
        description: 'Used the carbon calculator 5 times',
        icon: '🌡️',
        category: 'carbon',
        requirement: 'Calculate carbon impact 5 times',
        backgroundColor: '#dcedc8'
    },
    {
        id: 'carbon_saver',
        title: 'Earth Protector',
        description: 'Saved 10kg of CO₂ emissions',
        icon: '🌍',
        category: 'carbon',
        requirement: 'Save 10kg of CO₂ emissions',
        backgroundColor: '#c5e1a5'
    },
    
    // AI Suggestion Badges
    {
        id: 'ai_basic',
        title: 'AI Apprentice',
        description: 'Generated your first AI suggestion',
        icon: '💡',
        category: 'ai',
        requirement: 'Get 1 AI suggestion',
        backgroundColor: '#fff8e1'
    },
    {
        id: 'ai_intermediate',
        title: 'AI Expert',
        description: 'Generated 3 or more AI suggestions',
        icon: '🤖',
        category: 'ai',
        requirement: 'Get 3 AI suggestions',
        backgroundColor: '#ffecb3'
    }
];

// State
let userBadges = [];
let selectedCategory = 'all';

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Load badges from localStorage
    loadBadges();
    
    // Set up event listeners
    setupEventListeners();
    
    // Render badges
    renderBadges();
});

/**
 * Set up event listeners for the page
 */
function setupEventListeners() {
    // Category tab buttons
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active tab
            categoryTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update selected category
            selectedCategory = tab.dataset.category;
            
            // Re-render badges
            renderBadges();
        });
    });
}

/**
 * Load badges from localStorage
 */
function loadBadges() {
    // Load from localStorage using the prefix from config
    const storagePrefix = CONFIG ? CONFIG.app.storagePrefix : 'trana_';
    const storedBadges = localStorage.getItem(`${storagePrefix}badges`);
    
    if (storedBadges) {
        try {
            userBadges = JSON.parse(storedBadges);
        } catch (error) {
            console.error('Error parsing badges:', error);
            userBadges = [];
        }
    } else {
        userBadges = [];
    }
    
    // Update stats
    updateBadgeStats();
}

/**
 * Update badge statistics
 */
function updateBadgeStats() {
    // Set total badges count
    totalBadgesCount.textContent = userBadges.length;
    
    // Calculate and set percentage
    const totalPossibleBadges = BADGE_DEFINITIONS.length;
    const completionPercentage = totalPossibleBadges > 0 
        ? Math.round((userBadges.length / totalPossibleBadges) * 100) 
        : 0;
    badgesPercentage.textContent = `${completionPercentage}%`;
    
    // Update progress bar
    badgesProgressFill.style.width = `${completionPercentage}%`;
}

/**
 * Render badges based on current category filter
 */
function renderBadges() {
    // Clear badge containers
    badgesContainer.innerHTML = '';
    lockedBadgesContainer.innerHTML = '';
    
    // Get earned badge IDs
    const earnedBadgeIds = userBadges.map(badge => badge.id);
    
    // Filter badge definitions based on selected category
    const filteredBadges = BADGE_DEFINITIONS.filter(badge => 
        selectedCategory === 'all' || badge.category === selectedCategory
    );
    
    // Split into earned and locked badges
    const earnedBadges = filteredBadges.filter(badge => earnedBadgeIds.includes(badge.id));
    const lockedBadges = filteredBadges.filter(badge => !earnedBadgeIds.includes(badge.id));
    
    // Show empty state if no badges earned in current category
    if (earnedBadges.length === 0) {
        if (selectedCategory === 'all' && userBadges.length === 0) {
            // No badges at all
            noBadgesMessage.style.display = 'block';
        } else {
            // No badges in this category
            badgesContainer.innerHTML = `
                <div class="category-empty">
                    <p>You haven't earned any badges in this category yet.</p>
                </div>
            `;
        }
    } else {
        // Hide empty message
        noBadgesMessage.style.display = 'none';
        
        // Render earned badges
        earnedBadges.forEach(badge => {
            const userBadge = userBadges.find(b => b.id === badge.id);
            const badgeElement = createBadgeElement(badge, userBadge);
            badgesContainer.appendChild(badgeElement);
        });
    }
    
    // Render locked badges
    if (lockedBadges.length > 0) {
        lockedBadges.forEach(badge => {
            const lockedBadgeElement = createLockedBadgeElement(badge);
            lockedBadgesContainer.appendChild(lockedBadgeElement);
        });
    } else {
        // All badges in this category are earned
        lockedBadgesContainer.innerHTML = `
            <div class="all-badges-earned">
                <p>Congratulations! You've earned all available badges in this category.</p>
            </div>
        `;
    }
}

/**
 * Create a badge element for an earned badge
 * @param {Object} badgeDefinition - Badge definition
 * @param {Object} userBadge - User's earned badge data
 * @returns {HTMLElement} - Badge element
 */
function createBadgeElement(badgeDefinition, userBadge) {
    const badgeEl = document.createElement('div');
    badgeEl.className = 'badge-card earned';
    badgeEl.style.backgroundColor = badgeDefinition.backgroundColor || '#f5f5f5';
    
    // Format date earned
    const earnedDate = new Date(userBadge.dateAwarded);
    const formattedDate = earnedDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
    
    badgeEl.innerHTML = `
        <div class="badge-icon">${badgeDefinition.icon}</div>
        <div class="badge-content">
            <h4 class="badge-title">${badgeDefinition.title}</h4>
            <p class="badge-description">${badgeDefinition.description}</p>
            <div class="badge-earned-date">Earned: ${formattedDate}</div>
        </div>
    `;
    
    return badgeEl;
}

/**
 * Create a badge element for a locked badge
 * @param {Object} badgeDefinition - Badge definition
 * @returns {HTMLElement} - Badge element
 */
function createLockedBadgeElement(badgeDefinition) {
    const badgeEl = document.createElement('div');
    badgeEl.className = 'badge-card locked';
    
    badgeEl.innerHTML = `
        <div class="badge-icon">🔒</div>
        <div class="badge-content">
            <h4 class="badge-title">${badgeDefinition.title}</h4>
            <p class="badge-requirement">${badgeDefinition.requirement}</p>
        </div>
    `;
    
    return badgeEl;
}

/**
 * Check if user has earned a specific badge
 * @param {string} badgeId - Badge identifier
 * @returns {boolean} - Whether the badge is earned
 */
function hasBadge(badgeId) {
    return userBadges.some(badge => badge.id === badgeId);
}

/**
 * Award a badge to the user
 * @param {string} badgeId - Badge identifier
 */
function awardBadge(badgeId) {
    // Check if badge exists and is not already earned
    const badgeDefinition = BADGE_DEFINITIONS.find(badge => badge.id === badgeId);
    if (!badgeDefinition || hasBadge(badgeId)) {
        return;
    }
    
    // Add badge to user's collection
    const newBadge = {
        id: badgeId,
        dateAwarded: new Date().toISOString()
    };
    
    userBadges.push(newBadge);
    
    // Save to localStorage
    saveBadges();
    
    // Update UI
    updateBadgeStats();
    renderBadges();
    
    // Show notification
    showBadgeNotification(badgeDefinition);
}

/**
 * Save badges to localStorage
 */
function saveBadges() {
    const storagePrefix = CONFIG ? CONFIG.app.storagePrefix : 'trana_';
    localStorage.setItem(`${storagePrefix}badges`, JSON.stringify(userBadges));
}

/**
 * Show a notification when a badge is earned
 * @param {Object} badge - Badge definition
 */
function showBadgeNotification(badge) {
    // Create notification element if not on badges page
    if (!document.body.classList.contains('badges-page')) {
        const notification = document.createElement('div');
        notification.className = 'badge-notification';
        notification.innerHTML = `
            <div class="notification-icon">${badge.icon}</div>
            <div class="notification-content">
                <h4>New Badge Earned!</h4>
                <p>${badge.title}</p>
                <p class="notification-description">${badge.description}</p>
            </div>
            <button class="notification-close">✕</button>
        `;
        
        document.body.appendChild(notification);
        
        // Show notification after a small delay (for transition)
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Add event listener to close button
        const closeButton = notification.querySelector('.notification-close');
        closeButton.addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
        
        // Auto-close after 5 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);
    }
}