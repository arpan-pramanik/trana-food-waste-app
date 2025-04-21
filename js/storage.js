// This file manages Local Storage operations, including saving and retrieving logged food items and user data.

const storageKey = 'tranaFoodLogger';

// Save food items to Local Storage
function saveFoodItems(items) {
    localStorage.setItem(storageKey, JSON.stringify(items));
}

// Retrieve food items from Local Storage
function getFoodItems() {
    const items = localStorage.getItem(storageKey);
    return items ? JSON.parse(items) : [];
}

// Clear food items from Local Storage
function clearFoodItems() {
    localStorage.removeItem(storageKey);
}

// Save user profile data to Local Storage
function saveUserProfile(profile) {
    localStorage.setItem('tranaUserProfile', JSON.stringify(profile));
}

// Retrieve user profile data from Local Storage
function getUserProfile() {
    const profile = localStorage.getItem('tranaUserProfile');
    return profile ? JSON.parse(profile) : {};
}

// Clear user profile data from Local Storage
function clearUserProfile() {
    localStorage.removeItem('tranaUserProfile');
}