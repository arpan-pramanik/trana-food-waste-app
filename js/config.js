/**
 * Configuration file for Trana application
 * Contains API keys and other configuration settings
 */

const CONFIG = {
    // Gemini AI API configuration
    gemini: {
        apiKey: "AIzaSyDYi5bEBmzFMmYV7u9Cpcj-fjKcZuqMy8o", // Your Gemini API key
        apiEndpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
        model: "gemini-pro",
        temperature: 0.7,
        maxOutputTokens: 500,
        topK: 40,
        topP: 0.95,
    },
    
    // Application settings
    app: {
        name: "Trana",
        version: "1.0.0",
        storagePrefix: "trana_",
        expiryWarningDays: 3, // Days before expiry to show warning
    },
    
    // Badge thresholds
    badges: {
        foodLoggerBasic: 1,  // Log 1 item
        foodLoggerIntermediate: 5,  // Log 5 items
        foodLoggerAdvanced: 20,  // Log 20 items
        
        carbonBasic: 1,  // Calculate carbon impact once
        carbonIntermediate: 5,  // Calculate carbon impact 5 times
        
        aiSuggestionsBasic: 1,  // Use AI suggestions once
        aiSuggestionsIntermediate: 3,  // Use AI suggestions 3 times
        
        foodSaverBasic: 3,  // Save 3 items from waste
        foodSaverIntermediate: 10, // Save 10 items from waste
    }
};

// Prevent direct manipulation of the CONFIG object
Object.freeze(CONFIG);