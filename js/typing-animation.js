/**
 * Typing Animation for Placeholder Text
 * Adds a dynamic typing and backspacing effect to input placeholders
 */

class TypedPlaceholder {
    constructor(inputElement, placeholderTexts, options = {}) {
        this.inputElement = inputElement;
        this.placeholderTexts = placeholderTexts;
        this.currentTextIndex = 0;
        this.currentCharIndex = 0;
        this.isDeleting = false;
        this.isPaused = false;
        
        // Default options
        this.options = {
            typingSpeed: 50,          // Speed of typing in milliseconds (reduced from 80)
            deletingSpeed: 25,        // Speed of deleting in milliseconds (reduced from 40)
            pauseBeforeDelete: 1500,  // Pause time before deleting in milliseconds (reduced from 2000)
            pauseBeforeType: 350,     // Pause time before typing next text in milliseconds (reduced from 500)
            loop: true,               // Whether to loop through the texts
            ...options
        };
        
        // Save the original placeholder
        this.originalPlaceholder = inputElement.getAttribute('placeholder') || '';
        
        // If no placeholder texts were provided, use the original placeholder
        if (!this.placeholderTexts || this.placeholderTexts.length === 0) {
            this.placeholderTexts = [this.originalPlaceholder];
        }
        
        // Add animation class to the input element
        this.inputElement.classList.add('animate-placeholder');
        
        // Start the animation
        this.animate();
        
        // Stop animation when input is focused
        this.inputElement.addEventListener('focus', () => {
            this.stop();
            this.inputElement.setAttribute('placeholder', '');
        });
        
        // Restart animation when input is blurred (if empty)
        this.inputElement.addEventListener('blur', () => {
            if (!this.inputElement.value) {
                this.start();
            } else {
                this.inputElement.setAttribute('placeholder', '');
            }
        });
    }
    
    animate() {
        if (!this.inputElement) return;
        
        const currentText = this.placeholderTexts[this.currentTextIndex];
        let placeholder = '';
        
        if (this.isDeleting) {
            // Deleting
            placeholder = currentText.substring(0, this.currentCharIndex);
            this.currentCharIndex--;
            
            if (this.currentCharIndex < 0) {
                this.isDeleting = false;
                this.isPaused = true;
                
                // Move to the next text
                this.currentTextIndex = (this.currentTextIndex + 1) % this.placeholderTexts.length;
                
                // If we've gone through all the texts and not looping, stop
                if (this.currentTextIndex === 0 && !this.options.loop) {
                    this.inputElement.setAttribute('placeholder', this.originalPlaceholder);
                    return;
                }
                
                // Pause before typing the next text
                setTimeout(() => {
                    this.isPaused = false;
                    this.animate();
                }, this.options.pauseBeforeType);
                
                return;
            }
        } else {
            // Typing
            placeholder = currentText.substring(0, this.currentCharIndex + 1);
            this.currentCharIndex++;
            
            if (this.currentCharIndex >= currentText.length) {
                this.isPaused = true;
                
                // Pause before deleting
                setTimeout(() => {
                    this.isDeleting = true;
                    this.isPaused = false;
                    this.animate();
                }, this.options.pauseBeforeDelete);
                
                return;
            }
        }
        
        // Update the placeholder
        this.inputElement.setAttribute('placeholder', placeholder);
        
        // Schedule the next animation frame
        setTimeout(() => {
            if (!this.isPaused) {
                this.animate();
            }
        }, this.isDeleting ? this.options.deletingSpeed : this.options.typingSpeed);
    }
    
    stop() {
        this.isPaused = true;
    }
    
    start() {
        if (this.isPaused) {
            this.isPaused = false;
            this.animate();
        }
    }
    
    reset() {
        this.currentTextIndex = 0;
        this.currentCharIndex = 0;
        this.isDeleting = false;
        this.isPaused = false;
        this.animate();
    }
}

// Initialize placeholder animations when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check for the AI page ingredients input
    const ingredientsInput = document.getElementById('ingredients-input');
    if (ingredientsInput) {
        new TypedPlaceholder(ingredientsInput, [
            'Ex: rice, half avocado, spinach, leftover chicken',
            'Ex: bread, tomatoes, basil, mozzarella',
            'Ex: potatoes, carrots, peas, onions',
            'Ex: pasta, broccoli, parmesan, olive oil'
        ]);
    }
    
    // Check for the Learn page topic input
    const topicInput = document.getElementById('topic-input');
    if (topicInput) {
        new TypedPlaceholder(topicInput, [
            'e.g., composting, zero waste cooking, food preservation...',
            'e.g., reducing food waste, meal planning, storage tips...',
            'e.g., food waste statistics, environmental impact, leftovers...',
            'e.g., sustainable eating, seasonal foods, local produce...'
        ]);
    }
}); 