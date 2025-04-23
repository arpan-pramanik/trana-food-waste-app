/**
 * Additional interactive effects for the AI Suggestions page
 * Inspired by the effects on the Learn page
 */

document.addEventListener('DOMContentLoaded', () => {
    // Add hover effects to cards
    addCardHoverEffects();
    
    // Add subtle animations to form elements
    enhanceFormInteractions();
    
    // Add smooth scrolling when suggestions load
    enableSmoothScrolling();
    
    // Add animated typing indicator for "Generating suggestions..."
    enhanceLoadingIndicator();
});

/**
 * Add subtle hover and interaction effects to cards
 */
function addCardHoverEffects() {
    // Select all relevant cards
    const cards = document.querySelectorAll('.suggestion-input-card, .suggestions-results, .suggestion-history, .ai-info-card');
    
    // We no longer modify the border color on hover for the outer containers
    // Instead, just apply the pulse animation to the input area
    
    // Add glow effect to the input area
    const inputArea = document.querySelector('.suggestion-input-card');
    if (inputArea) {
        // Add subtle pulse animation when page loads to draw attention to input
        setTimeout(() => {
            inputArea.classList.add('pulse-attention');
            setTimeout(() => {
                inputArea.classList.remove('pulse-attention');
            }, 2000);
        }, 1000);
    }
    
    // Update CSS for pulse animation to use box-shadow instead of border
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulseGlow {
            0% { box-shadow: 0 0 5px rgba(46, 204, 113, 0.2); }
            50% { box-shadow: 0 0 20px rgba(46, 204, 113, 0.4); }
            100% { box-shadow: 0 0 5px rgba(46, 204, 113, 0.2); }
        }
        
        .pulse-attention {
            animation: pulseGlow 2s ease-in-out;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Enhance form interactions with focus effects
 */
function enhanceFormInteractions() {
    const textarea = document.getElementById('ingredients-input');
    const form = document.getElementById('suggestion-form');
    
    if (textarea) {
        // Focus effect
        textarea.addEventListener('focus', () => {
            const formGroup = textarea.closest('.form-group');
            if (formGroup) {
                formGroup.classList.add('focused');
            }
        });
        
        textarea.addEventListener('blur', () => {
            const formGroup = textarea.closest('.form-group');
            if (formGroup) {
                formGroup.classList.remove('focused');
            }
        });
        
        // Character counter
        textarea.addEventListener('input', () => {
            updateCharacterCount(textarea);
        });
        
        // Initialize character counter
        createCharacterCounter(textarea);
    }
    
    // Add form submission animation
    if (form) {
        form.addEventListener('submit', () => {
            const button = form.querySelector('button[type="submit"]');
            if (button) {
                button.classList.add('submitting');
                // Reset the animation after form processing
                setTimeout(() => {
                    button.classList.remove('submitting');
                }, 1000);
            }
        });
    }
    
    // Add CSS for these effects
    const style = document.createElement('style');
    style.textContent = `
        .form-group.focused label {
            color: var(--green);
            transform: translateY(-2px);
            transition: all 0.3s ease;
        }
        
        .char-counter {
            font-size: 0.8rem;
            color: var(--off-white);
            opacity: 0.7;
            text-align: right;
            margin-top: 5px;
            transition: all 0.3s ease;
        }
        
        .char-counter.limit-close {
            color: #FFA500;
        }
        
        .char-counter.limit-reached {
            color: #FF6B6B;
        }
        
        button.submitting {
            pointer-events: none;
            animation: pulse 1s infinite;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Create character counter for the textarea
 * @param {HTMLTextAreaElement} textarea - The textarea element
 */
function createCharacterCounter(textarea) {
    // Create counter element
    const counter = document.createElement('div');
    counter.className = 'char-counter';
    counter.textContent = `0/${textarea.maxLength || 500} characters`;
    
    // Append counter after textarea
    textarea.insertAdjacentElement('afterend', counter);
    
    // Initial update
    updateCharacterCount(textarea);
}

/**
 * Update character count for textarea
 * @param {HTMLTextAreaElement} textarea - The textarea element
 */
function updateCharacterCount(textarea) {
    const counter = textarea.nextElementSibling;
    if (!counter || !counter.classList.contains('char-counter')) return;
    
    const maxLength = textarea.maxLength || 500;
    const currentLength = textarea.value.length;
    
    counter.textContent = `${currentLength}/${maxLength} characters`;
    
    // Update styling based on limit
    counter.classList.remove('limit-close', 'limit-reached');
    
    if (currentLength >= maxLength) {
        counter.classList.add('limit-reached');
    } else if (currentLength >= maxLength * 0.8) {
        counter.classList.add('limit-close');
    }
}

/**
 * Enable smooth scrolling when suggestions are shown
 */
function enableSmoothScrolling() {
    // Monitor DOM changes to detect when suggestions are loaded
    const suggestionsContainer = document.getElementById('suggestions-container');
    
    if (suggestionsContainer) {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes' || 
                    (mutation.type === 'childList' && mutation.addedNodes.length > 0)) {
                    
                    // Check if suggestions are visible
                    const suggestionsContent = document.getElementById('suggestions-content');
                    if (suggestionsContent && 
                        suggestionsContent.style.display === 'block' && 
                        suggestionsContent.children.length > 0) {
                        
                        // Scroll to suggestions with smooth animation
                        setTimeout(() => {
                            suggestionsContainer.scrollIntoView({ 
                                behavior: 'smooth', 
                                block: 'start' 
                            });
                        }, 300);
                    }
                }
            }
        });
        
        // Observe changes to the suggestions container
        observer.observe(suggestionsContainer, { 
            childList: true, 
            attributes: true,
            subtree: true,
            attributeFilter: ['style', 'class']
        });
    }
}

/**
 * Enhance loading indicator with animated text
 */
function enhanceLoadingIndicator() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (!loadingIndicator) return;
    
    const loadingText = loadingIndicator.querySelector('p');
    if (!loadingText) return;
    
    // Save the original text
    const originalText = loadingText.textContent;
    
    // Create observer to detect when loading indicator becomes visible
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'attributes' && 
                mutation.attributeName === 'style' &&
                loadingIndicator.style.display === 'flex') {
                
                // Start animated dots
                let dots = 0;
                const animateDots = setInterval(() => {
                    dots = (dots + 1) % 4;
                    loadingText.textContent = originalText.replace('...', '.'.repeat(dots));
                }, 300);
                
                // Create another observer to stop animation when loading indicator is hidden
                const hideObserver = new MutationObserver((hideChanges) => {
                    if (loadingIndicator.style.display === 'none') {
                        clearInterval(animateDots);
                        loadingText.textContent = originalText;
                        hideObserver.disconnect();
                    }
                });
                
                hideObserver.observe(loadingIndicator, { attributes: true, attributeFilter: ['style'] });
            }
        }
    });
    
    observer.observe(loadingIndicator, { attributes: true, attributeFilter: ['style'] });
} 