/**
 * Food Logger Module for Trāṇa
 * Handles food inventory tracking, expiry notifications, and related functionality
 */

// DOM Elements - Form
const foodForm = document.getElementById('food-form');
const foodNameInput = document.getElementById('food-name');
const categorySelect = document.getElementById('food-category');
const quantityInput = document.getElementById('quantity');
const quantityUnitSelect = document.getElementById('quantity-unit');
const storageLocationSelect = document.getElementById('storage-location');
const dateAddedInput = document.getElementById('date-added');
const expiryDateInput = document.getElementById('expiry-date');
const notesInput = document.getElementById('notes');

// DOM Elements - Stats
const totalItemsCount = document.getElementById('total-items-count');
const expiringSoonCount = document.getElementById('expiring-soon-count');
const usedItemsCount = document.getElementById('used-items-count');

// DOM Elements - List
const foodList = document.getElementById('food-list');
const listItems = document.getElementById('list-items');
const emptyListMessage = document.getElementById('empty-list-message');
const filterButtons = document.querySelectorAll('.filter-btn');
const categoryFilter = document.getElementById('category-filter');

// DOM Elements - Actions
const markUsedBtn = document.getElementById('mark-used-btn');
const deleteSelectedBtn = document.getElementById('delete-selected-btn');
const clearAllBtn = document.getElementById('clear-all-btn');

// Constants
const STORAGE_KEY = 'Trāṇa_food_items';
const USED_ITEMS_KEY = 'Trāṇa_used_items';
const EXPIRY_WARNING_DAYS = 3; // Days before expiry to show warning

// State
let foodItems = []; // Current inventory
let usedItems = []; // History of used items
let selectedItems = []; // Currently selected items
let currentFilter = 'all';
let currentCategoryFilter = 'all';

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Set default date to today
    dateAddedInput.valueAsDate = new Date();
    
    // Load food items from localStorage
    loadFoodItems();
    
    // Set up event listeners
    setupEventListeners();
    
    // Check for expiring items on load
    checkExpiringItems();
});

/**
 * Set up event listeners for the page
 */
function setupEventListeners() {
    // Form submission
    foodForm.addEventListener('submit', handleFormSubmit);
    
    // Filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Apply filter
            currentFilter = button.dataset.filter;
            renderFoodItems();
        });
    });
    
    // Category filter
    categoryFilter.addEventListener('change', () => {
        currentCategoryFilter = categoryFilter.value;
        renderFoodItems();
    });
    
    // Action buttons
    markUsedBtn.addEventListener('click', markSelectedAsUsed);
    deleteSelectedBtn.addEventListener('click', deleteSelectedItems);
    clearAllBtn.addEventListener('click', clearAllItems);
    
    // Event delegation for list items
    listItems.addEventListener('click', handleListItemClick);
}

/**
 * Handle form submission for adding a food item
 * @param {Event} event - Form submit event
 */
function handleFormSubmit(event) {
    event.preventDefault();
    
    // Get form values
    const name = foodNameInput.value.trim();
    const category = categorySelect.value;
    const quantity = parseFloat(quantityInput.value);
    const unit = quantityUnitSelect.value;
    const storageLocation = storageLocationSelect.value;
    const dateAdded = dateAddedInput.value;
    const expiryDate = expiryDateInput.value;
    const notes = notesInput.value.trim();
    
    // Create new food item
    const newItem = {
        id: generateId(),
        name,
        category,
        quantity,
        unit,
        storageLocation,
        dateAdded,
        expiryDate,
        notes,
        addedTimestamp: new Date().toISOString(),
    };
    
    // Add to food items array
    foodItems.push(newItem);
    
    // Save to localStorage
    saveFoodItems();
    
    // Clear form
    foodForm.reset();
    dateAddedInput.valueAsDate = new Date();
    
    // Render updated list
    renderFoodItems();
    
    // Update stats
    updateStats();
    
    // Check for badges
    checkForFoodLoggerBadges();
    
    // Show confirmation
    showNotification('Food item added successfully!');
}

/**
 * Load food items and used items from localStorage
 */
function loadFoodItems() {
    // Load current inventory
    const storedItems = localStorage.getItem(STORAGE_KEY);
    if (storedItems) {
        try {
            foodItems = JSON.parse(storedItems);
        } catch (error) {
            console.error('Error parsing food items:', error);
            foodItems = [];
        }
    }
    
    // Load used items history
    const storedUsedItems = localStorage.getItem(USED_ITEMS_KEY);
    if (storedUsedItems) {
        try {
            usedItems = JSON.parse(storedUsedItems);
        } catch (error) {
            console.error('Error parsing used items:', error);
            usedItems = [];
        }
    }
    
    // Render initial list
    renderFoodItems();
    
    // Update stats
    updateStats();
}

/**
 * Save food items to localStorage
 */
function saveFoodItems() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(foodItems));
    localStorage.setItem(USED_ITEMS_KEY, JSON.stringify(usedItems));
}

/**
 * Render food items in the list
 */
function renderFoodItems() {
    // Clear list
    listItems.innerHTML = '';
    
    // Get filtered items
    const filteredItems = foodItems.filter(item => {
        // Apply category filter
        if (currentCategoryFilter !== 'all' && item.category !== currentCategoryFilter) {
            return false;
        }
        
        // Apply status filter
        if (currentFilter === 'expiring-soon') {
            return isDaysBefore(item.expiryDate, EXPIRY_WARNING_DAYS) && !isExpired(item.expiryDate);
        } else if (currentFilter === 'expired') {
            return isExpired(item.expiryDate);
        }
        
        return true;
    });
    
    // Show empty message if no items
    if (filteredItems.length === 0) {
        emptyListMessage.style.display = 'block';
        return;
    }
    
    // Hide empty message
    emptyListMessage.style.display = 'none';
    
    // Sort items by expiry date (soonest first)
    filteredItems.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
    
    // Create list items
    filteredItems.forEach(item => {
        const itemElement = createFoodItemElement(item);
        listItems.appendChild(itemElement);
    });
    
    // Update action buttons
    updateActionButtons();
}

/**
 * Create a food item element
 * @param {Object} item - Food item data
 * @returns {HTMLElement} - The food item element
 */
function createFoodItemElement(item) {
    const itemEl = document.createElement('div');
    itemEl.className = 'food-item';
    itemEl.dataset.id = item.id;
    
    // Add expired or expiring-soon class
    if (isExpired(item.expiryDate)) {
        itemEl.classList.add('expired');
    } else if (isDaysBefore(item.expiryDate, EXPIRY_WARNING_DAYS)) {
        itemEl.classList.add('expiring-soon');
    }
    
    // Calculate days until expiry
    const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate);
    let expiryText = '';
    
    if (daysUntilExpiry < 0) {
        expiryText = `<span class="expired-text">Expired ${Math.abs(daysUntilExpiry)} days ago</span>`;
    } else if (daysUntilExpiry === 0) {
        expiryText = `<span class="expires-today">Expires today!</span>`;
    } else if (daysUntilExpiry === 1) {
        expiryText = `<span class="expiring-soon-text">Expires tomorrow</span>`;
    } else if (daysUntilExpiry <= EXPIRY_WARNING_DAYS) {
        expiryText = `<span class="expiring-soon-text">Expires in ${daysUntilExpiry} days</span>`;
    } else {
        expiryText = `Expires in ${daysUntilExpiry} days`;
    }
    
    itemEl.innerHTML = `
        <div class="item-select">
            <input type="checkbox" class="item-checkbox" aria-label="Select ${item.name}">
        </div>
        <div class="item-details">
            <div class="item-main">
                <div class="item-name-category">
                    <h4>${item.name}</h4>
                    <span class="item-category">${formatCategory(item.category)}</span>
                </div>
                <div class="item-quantity">
                    ${item.quantity} ${item.unit}
                </div>
            </div>
            <div class="item-meta">
                <div class="item-dates">
                    <span class="item-added">Added: ${formatDate(item.dateAdded)}</span>
                    <span class="item-expiry">${expiryText}</span>
                </div>
                <div class="item-location">
                    <span class="location-icon">📍</span>
                    <span>${formatLocation(item.storageLocation)}</span>
                </div>
            </div>
            ${item.notes ? `<div class="item-notes">${item.notes}</div>` : ''}
        </div>
        <div class="item-actions">
            <button class="btn icon-btn used-btn" aria-label="Mark as Used" title="Mark as Used">✓</button>
            <button class="btn icon-btn delete-btn" aria-label="Delete" title="Delete">✕</button>
        </div>
    `;
    
    // Add selected class if item is selected
    if (selectedItems.includes(item.id)) {
        itemEl.classList.add('selected');
        itemEl.querySelector('.item-checkbox').checked = true;
    }
    
    return itemEl;
}

/**
 * Handle clicks on list items and their child elements
 * @param {Event} event - Click event
 */
function handleListItemClick(event) {
    const itemEl = event.target.closest('.food-item');
    if (!itemEl) return;
    
    const itemId = itemEl.dataset.id;
    
    // Handle checkbox
    if (event.target.classList.contains('item-checkbox')) {
        toggleItemSelection(itemId, event.target.checked);
        return;
    }
    
    // Handle used button
    if (event.target.classList.contains('used-btn')) {
        markItemAsUsed(itemId);
        return;
    }
    
    // Handle delete button
    if (event.target.classList.contains('delete-btn')) {
        deleteItem(itemId);
        return;
    }
    
    // Toggle selection when clicking on the item (not buttons)
    if (!event.target.closest('.item-actions') && !event.target.closest('.item-select')) {
        const checkbox = itemEl.querySelector('.item-checkbox');
        checkbox.checked = !checkbox.checked;
        toggleItemSelection(itemId, checkbox.checked);
    }
}

/**
 * Toggle item selection
 * @param {string} itemId - Item ID
 * @param {boolean} selected - Whether the item is selected
 */
function toggleItemSelection(itemId, selected) {
    if (selected) {
        if (!selectedItems.includes(itemId)) {
            selectedItems.push(itemId);
        }
    } else {
        selectedItems = selectedItems.filter(id => id !== itemId);
    }
    
    // Update action buttons
    updateActionButtons();
    
    // Update item styling
    const itemEl = document.querySelector(`.food-item[data-id="${itemId}"]`);
    if (itemEl) {
        itemEl.classList.toggle('selected', selected);
    }
}

/**
 * Update action buttons based on selection
 */
function updateActionButtons() {
    const hasSelection = selectedItems.length > 0;
    markUsedBtn.disabled = !hasSelection;
    deleteSelectedBtn.disabled = !hasSelection;
}

/**
 * Mark selected items as used
 */
function markSelectedAsUsed() {
    // Confirm with user
    if (!confirm(`Mark ${selectedItems.length} item(s) as used?`)) {
        return;
    }
    
    // Process each selected item
    selectedItems.forEach(itemId => {
        markItemAsUsed(itemId, false); // Don't confirm individual items
    });
    
    // Clear selection
    selectedItems = [];
    
    // Update UI
    renderFoodItems();
    updateStats();
    
    // Show confirmation
    showNotification(`${selectedItems.length} item(s) marked as used!`);
}

/**
 * Mark a single item as used
 * @param {string} itemId - Item ID
 * @param {boolean} showConfirm - Whether to show confirmation dialog
 */
function markItemAsUsed(itemId, showConfirm = true) {
    // Find the item
    const itemIndex = foodItems.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;
    
    // Confirm with user (for individual marking)
    if (showConfirm && !confirm(`Mark "${foodItems[itemIndex].name}" as used?`)) {
        return;
    }
    
    // Add to used items with timestamp
    const usedItem = {
        ...foodItems[itemIndex],
        usedTimestamp: new Date().toISOString()
    };
    usedItems.push(usedItem);
    
    // Remove from current inventory
    foodItems.splice(itemIndex, 1);
    
    // Remove from selected items if present
    selectedItems = selectedItems.filter(id => id !== itemId);
    
    // Save changes
    saveFoodItems();
    
    // Update UI if showing confirmation
    if (showConfirm) {
        renderFoodItems();
        updateStats();
        showNotification('Item marked as used!');
    }
    
    // Check for badges
    checkForFoodSaverBadges();
}

/**
 * Delete selected items
 */
function deleteSelectedItems() {
    // Confirm with user
    if (!confirm(`Delete ${selectedItems.length} item(s)?`)) {
        return;
    }
    
    // Remove selected items
    foodItems = foodItems.filter(item => !selectedItems.includes(item.id));
    
    // Clear selection
    selectedItems = [];
    
    // Save changes
    saveFoodItems();
    
    // Update UI
    renderFoodItems();
    updateStats();
    
    // Show confirmation
    showNotification('Selected items deleted!');
}

/**
 * Delete a single item
 * @param {string} itemId - Item ID
 */
function deleteItem(itemId) {
    // Find the item
    const itemIndex = foodItems.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;
    
    // Confirm with user
    if (!confirm(`Delete "${foodItems[itemIndex].name}"?`)) {
        return;
    }
    
    // Remove the item
    foodItems.splice(itemIndex, 1);
    
    // Remove from selected items if present
    selectedItems = selectedItems.filter(id => id !== itemId);
    
    // Save changes
    saveFoodItems();
    
    // Update UI
    renderFoodItems();
    updateStats();
    
    // Show confirmation
    showNotification('Item deleted!');
}

/**
 * Clear all items
 */
function clearAllItems() {
    // Confirm with user
    if (!confirm('Are you sure you want to clear all food items? This cannot be undone.')) {
        return;
    }
    
    // Clear items
    foodItems = [];
    selectedItems = [];
    
    // Save changes
    saveFoodItems();
    
    // Update UI
    renderFoodItems();
    updateStats();
    
    // Show confirmation
    showNotification('All items cleared!');
}

/**
 * Update statistics
 */
function updateStats() {
    // Update counts
    totalItemsCount.textContent = foodItems.length;
    
    // Count expiring soon items
    const expiringSoonItems = foodItems.filter(item => 
        isDaysBefore(item.expiryDate, EXPIRY_WARNING_DAYS) && !isExpired(item.expiryDate)
    );
    expiringSoonCount.textContent = expiringSoonItems.length;
    
    // Count used items
    usedItemsCount.textContent = usedItems.length;
}

/**
 * Check for expiring items and notify user
 */
function checkExpiringItems() {
    const expiredItems = foodItems.filter(item => isExpired(item.expiryDate));
    const expiringSoonItems = foodItems.filter(item => 
        isDaysBefore(item.expiryDate, EXPIRY_WARNING_DAYS) && !isExpired(item.expiryDate)
    );
    
    // Show notifications if there are expiring items
    if (expiredItems.length > 0) {
        alert(`Warning: You have ${expiredItems.length} expired item(s) in your inventory. Please check your food list.`);
    } else if (expiringSoonItems.length > 0) {
        alert(`Heads up: You have ${expiringSoonItems.length} item(s) expiring soon. Check your food list to avoid waste.`);
    }
}

/**
 * Check for food logger badges and award if conditions are met
 */
function checkForFoodLoggerBadges() {
    const storagePrefix = 'Trāṇa_'; // Should match your config
    const badgeData = JSON.parse(localStorage.getItem(`${storagePrefix}badges`) || '[]');
    
    // Count total items logged (current + used)
    const totalLogged = foodItems.length + usedItems.length;
    
    // Check for basic badge (first item logged)
    if (totalLogged >= 1) {
        awardBadgeIfNotExists(badgeData, 'food_logger_basic', 'Logger Novice', 'Logged your first food item');
    }
    
    // Check for intermediate badge (5+ items logged)
    if (totalLogged >= 5) {
        awardBadgeIfNotExists(badgeData, 'food_logger_intermediate', 'Inventory Master', 'Logged 5 or more food items');
    }
    
    // Check for advanced badge (20+ items logged)
    if (totalLogged >= 20) {
        awardBadgeIfNotExists(badgeData, 'food_logger_advanced', 'Tracking Pro', 'Logged 20 or more food items');
    }
    
    // Save updated badge data
    localStorage.setItem(`${storagePrefix}badges`, JSON.stringify(badgeData));
}

/**
 * Check for food saver badges and award if conditions are met
 */
function checkForFoodSaverBadges() {
    const storagePrefix = 'Trāṇa_'; // Should match your config
    const badgeData = JSON.parse(localStorage.getItem(`${storagePrefix}badges`) || '[]');
    
    // Check for basic food saver badge (3+ items used)
    if (usedItems.length >= 3) {
        awardBadgeIfNotExists(badgeData, 'food_saver_basic', 'Food Saver', 'Used 3 or more food items before expiry');
    }
    
    // Check for intermediate food saver badge (10+ items used)
    if (usedItems.length >= 10) {
        awardBadgeIfNotExists(badgeData, 'food_saver_intermediate', 'Waste Warrior', 'Used 10 or more food items before expiry');
    }
    
    // Save updated badge data
    localStorage.setItem(`${storagePrefix}badges`, JSON.stringify(badgeData));
}

/**
 * Generate a unique ID
 * @returns {string} - Unique ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Check if a date is within a certain number of days
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @param {number} days - Number of days
 * @returns {boolean} - Whether the date is within the specified number of days
 */
function isDaysBefore(dateStr, days) {
    const date = new Date(dateStr);
    const now = new Date();
    
    // Reset hours to compare just the dates
    date.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= 0 && diffDays <= days;
}

/**
 * Check if a date is in the past
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {boolean} - Whether the date is in the past
 */
function isExpired(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    
    // Reset hours to compare just the dates
    date.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    
    return date < now;
}

/**
 * Get days until expiry
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {number} - Days until expiry (negative if expired)
 */
function getDaysUntilExpiry(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    
    // Reset hours to compare just the dates
    date.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    
    const diffTime = date - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format a date for display
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {string} - Formatted date string
 */
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
        day: 'numeric',
        month: 'short', 
        year: 'numeric'
    });
}

/**
 * Format a category for display
 * @param {string} category - Category value
 * @returns {string} - Formatted category
 */
function formatCategory(category) {
    // Replace hyphens with spaces and capitalize first letter
    return category.replace(/-/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Format a storage location for display
 * @param {string} location - Storage location value
 * @returns {string} - Formatted location
 */
function formatLocation(location) {
    // Replace hyphens with spaces and capitalize first letter
    return location.replace(/-/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Award a badge if it doesn't already exist in the user's collection
 * @param {Array} badgeData - Array of existing badges
 * @param {string} id - Badge identifier
 * @param {string} title - Badge title
 * @param {string} description - Badge description
 */
function awardBadgeIfNotExists(badgeData, id, title, description) {
    // Check if badge already exists
    const badgeExists = badgeData.some(badge => badge.id === id);
    
    if (!badgeExists) {
        // Add badge to collection
        badgeData.push({
            id,
            title,
            description,
            dateAwarded: new Date().toISOString()
        });
        
        // Show notification
        showNotification(`New Badge: ${title}`);
    }
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