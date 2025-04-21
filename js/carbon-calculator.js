/**
 * Carbon Calculator Module for Trāṇa
 * Calculates carbon footprint of food waste and tracks savings
 */

// DOM Elements
const carbonForm = document.getElementById('carbon-calculator-form');
const foodTypeSelect = document.getElementById('food-type');
const quantityInput = document.getElementById('quantity');
const resultValue = document.getElementById('result-value');
const resultDetails = document.getElementById('result-details');
const addToListBtn = document.getElementById('add-to-list');
const calculateTotalBtn = document.getElementById('calculate-total');
const wasteList = document.getElementById('waste-list');
const listItems = document.getElementById('list-items');
const emptyListMessage = document.getElementById('empty-list-message');
const totalResult = document.getElementById('total-result');
const totalCO2 = document.getElementById('total-co2');
const totalEquivalent = document.getElementById('total-equivalent');
const totalSavedKg = document.getElementById('total-saved-kg');
const carEquivalent = document.getElementById('car-equivalent');

// Carbon emissions data for different food types (kg CO₂ per kg of food)
const carbonData = {
    beef: 27.0,      // Beef has a very high carbon footprint
    lamb: 39.2,      // Lamb has one of the highest carbon footprints
    cheese: 13.5,    // Cheese is quite carbon-intensive
    pork: 12.1,      // Pork has a moderate-high carbon footprint
    poultry: 6.9,    // Chicken and other poultry
    eggs: 4.8,       // Eggs have a moderate carbon footprint
    rice: 2.7,       // Rice, especially from flooded paddies
    milk: 1.9,       // Cow's milk
    bread: 1.4,      // Bread and bakery products
    vegetables: 0.4, // Average for vegetables
    fruits: 0.5,     // Average for fruits
    potatoes: 0.3,   // Potatoes have a relatively low footprint
    nuts: 2.3,       // Nuts (average)
    beans: 0.8,      // Beans and legumes
    tofu: 2.0,       // Tofu and soy products
    fish: 5.4,       // Fish (average)
    other: 3.0       // Default value for other foods
};

// State
let wasteItems = [];
let totalSavedEmissions = 0;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Load any previously saved waste items
    loadWasteItems();
    
    // Load saved carbon stats
    loadCarbonStats();
    
    // Set up event listeners
    setupEventListeners();
});

/**
 * Set up event listeners for the page
 */
function setupEventListeners() {
    // Form submission (calculate single item)
    carbonForm.addEventListener('submit', (event) => {
        event.preventDefault();
        calculateSingleItemEmissions();
    });
    
    // Add item to list
    addToListBtn.addEventListener('click', addItemToWasteList);
    
    // Calculate total emissions
    calculateTotalBtn.addEventListener('click', calculateTotalEmissions);
    
    // Event delegation for removing items from list
    listItems.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-item')) {
            const index = parseInt(event.target.dataset.index);
            removeWasteItem(index);
        }
    });
}

/**
 * Calculate emissions for a single food item
 */
function calculateSingleItemEmissions() {
    const foodType = foodTypeSelect.value;
    const quantity = parseFloat(quantityInput.value);
    
    if (!foodType || isNaN(quantity) || quantity <= 0) {
        resultDetails.innerHTML = '<p class="error">Please select a food type and enter a valid quantity.</p>';
        resultValue.textContent = '';
        return;
    }
    
    const emissions = carbonData[foodType] * quantity;
    
    // Display result
    resultDetails.innerHTML = `
        <p><strong>${quantity} kg of ${formatFoodTypeName(foodType)}</strong> produces:</p>
    `;
    
    resultValue.innerHTML = `
        <span class="co2-value">${emissions.toFixed(2)} kg CO₂</span>
        <span class="co2-equivalent">Equivalent to driving a car for ${(emissions * 4).toFixed(1)} km</span>
    `;
    
    // Show the results content
    document.getElementById('no-results').style.display = 'none';
    document.getElementById('results-content').style.display = 'block';
    
    // Increment calculation count
    let calculationCount = parseInt(localStorage.getItem('trana_carbon_calculations') || '0');
    calculationCount++;
    localStorage.setItem('trana_carbon_calculations', calculationCount.toString());
    
    // Update stats display
    document.getElementById('total-calculations').textContent = calculationCount;
}

/**
 * Add current item to waste list
 */
function addItemToWasteList() {
    const foodType = foodTypeSelect.value;
    const quantity = parseFloat(quantityInput.value);
    
    if (!foodType || isNaN(quantity) || quantity <= 0) {
        alert('Please select a food type and enter a valid quantity.');
        return;
    }
    
    // Add to waste items array
    wasteItems.push({
        foodType,
        quantity,
        emissions: carbonData[foodType] * quantity
    });
    
    // Save to local storage
    saveWasteItems();
    
    // Render the list
    renderWasteList();
}

/**
 * Render the waste list in the UI
 */
function renderWasteList() {
    // Get the list items container
    const listItems = document.getElementById('list-items');
    
    // Get the empty list message
    const emptyListMessage = document.getElementById('empty-list-message');
    
    // Get the total result container
    const totalResult = document.getElementById('total-result');
    
    if (!listItems || !emptyListMessage) {
        console.error('List items container or empty message element not found');
        return;
    }
    
    // Clear the list
    listItems.innerHTML = '';
    
    if (wasteItems.length === 0) {
        // Show empty message, hide the list
        emptyListMessage.style.display = 'block';
        if (totalResult) totalResult.style.display = 'none';
        return;
    }
    
    // Hide empty message, show the list
    emptyListMessage.style.display = 'none';
    
    // Add each waste item to the list
    wasteItems.forEach((item, index) => {
        const listItem = document.createElement('div');
        listItem.className = 'waste-item';
        listItem.innerHTML = `
            <div class="waste-item-details">
                <span class="food-type">${formatFoodTypeName(item.foodType)}</span>
                <span class="food-quantity">${item.quantity} kg</span>
            </div>
            <div class="waste-item-emissions">
                <span class="emissions-value">${item.emissions.toFixed(2)} kg CO₂</span>
            </div>
            <button class="remove-item" data-index="${index}">✕</button>
        `;
        
        listItems.appendChild(listItem);
    });
}

/**
 * Calculate total emissions for all items in the waste list
 */
function calculateTotalEmissions() {
    if (wasteItems.length === 0) {
        alert('Please add food items to your waste list first.');
        return;
    }
    
    let totalEmissions = 0;
    
    wasteItems.forEach(item => {
        totalEmissions += item.emissions;
    });
    
    // Display total result
    totalCO2.innerHTML = `
        <span class="total-label">Total Carbon Footprint:</span>
        <span class="total-value">${totalEmissions.toFixed(2)} kg CO₂</span>
    `;
    
    totalEquivalent.innerHTML = `
        <div class="equivalent-item">
            <span class="equivalent-icon">🚗</span>
            <span class="equivalent-text">Driving a car for ${(totalEmissions * 4).toFixed(1)} km</span>
        </div>
        <div class="equivalent-item">
            <span class="equivalent-icon">💡</span>
            <span class="equivalent-text">Powering a home for ${(totalEmissions * 0.8).toFixed(1)} days</span>
        </div>
    `;
    
    totalResult.style.display = 'block';
    
    // Update carbon savings if the user is logging this as saved food
    const saveEmissions = confirm("Would you like to track these emissions as 'saved' because you've prevented this food waste?");
    
    if (saveEmissions) {
        // Update saved emissions
        updateCarbonSavings(totalEmissions);
        
        // Clear the waste list
        wasteItems = [];
        saveWasteItems();
        renderWasteList();
        
        // Show confirmation
        showNotification('Carbon savings recorded!');
        
        // Check for badges
        checkForCarbonBadges();
    }
}

/**
 * Update carbon savings statistics
 * @param {number} emissions - Emissions saved in kg CO₂
 */
function updateCarbonSavings(emissions) {
    // Add to total saved emissions
    totalSavedEmissions += emissions;
    
    // Save to local storage
    localStorage.setItem('trana_carbon_savings', totalSavedEmissions.toString());
    
    // Update display
    updateSavingsDisplay();
}

/**
 * Update the savings display
 */
function updateSavingsDisplay() {
    // Update the carbon prevented display
    const carbonPrevented = document.getElementById('carbon-prevented');
    if (carbonPrevented) {
        carbonPrevented.textContent = `${totalSavedEmissions.toFixed(2)} kg`;
    }
    
    // Update the car savings equivalent
    const carSavings = document.getElementById('car-savings');
    if (carSavings) {
        carSavings.textContent = `${(totalSavedEmissions * 4).toFixed(1)} km`;
    }
    
    // Update other displays if available
    if (totalSavedKg) {
        totalSavedKg.textContent = `${totalSavedEmissions.toFixed(2)} kg`;
    }
    
    if (carEquivalent) {
        carEquivalent.textContent = `${(totalSavedEmissions * 4).toFixed(1)} km`;
    }
}

/**
 * Remove an item from the waste list
 * @param {number} index - Index of the item to remove
 */
function removeWasteItem(index) {
    if (index >= 0 && index < wasteItems.length) {
        wasteItems.splice(index, 1);
        saveWasteItems();
        renderWasteList();
    }
}

/**
 * Save waste items to local storage
 */
function saveWasteItems() {
    localStorage.setItem('trana_waste_items', JSON.stringify(wasteItems));
}

/**
 * Load waste items from local storage
 */
function loadWasteItems() {
    const savedItems = localStorage.getItem('trana_waste_items');
    if (savedItems) {
        try {
            wasteItems = JSON.parse(savedItems);
            renderWasteList();
        } catch (error) {
            console.error('Error loading waste items:', error);
            wasteItems = [];
        }
    }
}

/**
 * Load carbon statistics from local storage
 */
function loadCarbonStats() {
    const savedEmissions = localStorage.getItem('trana_carbon_savings');
    if (savedEmissions) {
        totalSavedEmissions = parseFloat(savedEmissions);
        updateSavingsDisplay();
    }
}

/**
 * Format food type name for display
 * @param {string} foodType - Food type key
 * @returns {string} - Formatted food type name
 */
function formatFoodTypeName(foodType) {
    // Capitalize first letter and replace hyphens with spaces
    return foodType
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Check for carbon-related badges and award if conditions are met
 */
function checkForCarbonBadges() {
    const storagePrefix = 'trana_'; // Should match your config
    const badgeData = JSON.parse(localStorage.getItem(`${storagePrefix}badges`) || '[]');
    
    // Count carbon calculations
    let carbonCalculations = parseInt(localStorage.getItem(`${storagePrefix}carbon_calculations`) || '0');
    carbonCalculations++;
    localStorage.setItem(`${storagePrefix}carbon_calculations`, carbonCalculations.toString());
    
    // Check for carbon calculator basic badge
    if (carbonCalculations >= 1) {
        awardBadgeIfNotExists(badgeData, 'carbon_basic', 'Carbon Counter', 'Used the carbon calculator for the first time');
    }
    
    // Check for carbon calculator intermediate badge
    if (carbonCalculations >= 5) {
        awardBadgeIfNotExists(badgeData, 'carbon_intermediate', 'Climate Champion', 'Used the carbon calculator 5 times');
    }
    
    // Check for carbon savings badge
    if (totalSavedEmissions >= 10) {
        awardBadgeIfNotExists(badgeData, 'carbon_saver', 'Earth Protector', 'Saved 10kg of CO₂ emissions');
    }
    
    // Save updated badge data
    localStorage.setItem(`${storagePrefix}badges`, JSON.stringify(badgeData));
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