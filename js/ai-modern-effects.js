/**
 * Modern UI effects for Trāṇa AI Suggestions page
 * Enhances the glassmorphism design with subtle interactive effects
 */

document.addEventListener('DOMContentLoaded', () => {
  // Apply subtle parallax effect to cards
  applyCardParallax();
  
  // Add typing animation to the textarea placeholder
  animateTextareaPlaceholder();
  
  // Add subtle hover effects to UI elements
  enhanceHoverEffects();
  
  // Add glowing purple cursor effect
  addGlowingCursor();
});

/**
 * Creates a subtle parallax effect for the glassmorphism cards
 */
function applyCardParallax() {
  // Select all glassmorphism cards
  const cards = document.querySelectorAll('.suggestion-input-card, .suggestions-results, .suggestion-history, .ai-info-card');
  
  // Apply subtle movement on mouse move
  document.addEventListener('mousemove', (e) => {
    const { clientX, clientY } = e;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    // Calculate mouse position relative to center
    const moveX = (clientX - centerX) / 50;
    const moveY = (clientY - centerY) / 50;
    
    // Apply transform to each card with different intensity for layered effect
    cards.forEach((card, index) => {
      const factor = 1 - (index * 0.2);
      card.style.transform = `translate(${moveX * factor}px, ${moveY * factor}px)`;
    });
  });
}

/**
 * Creates a typing animation for the textarea placeholder
 */
function animateTextareaPlaceholder() {
  const textarea = document.getElementById('ingredients-input');
  if (!textarea) return;
  
  const originalPlaceholder = textarea.placeholder;
  let currentIndex = 0;
  let isDeleting = false;
  let typeTimer;
  
  // Only animate when the textarea is not in focus and empty
  textarea.addEventListener('focus', () => {
    clearInterval(typeTimer);
    textarea.placeholder = originalPlaceholder;
  });
  
  textarea.addEventListener('blur', () => {
    if (textarea.value === '') {
      startTypingAnimation();
    }
  });
  
  function startTypingAnimation() {
    clearInterval(typeTimer);
    currentIndex = 0;
    isDeleting = false;
    typeTimer = setInterval(typePlaceholder, 100);
  }
  
  function typePlaceholder() {
    // If deleting text
    if (isDeleting) {
      currentIndex--;
      textarea.placeholder = originalPlaceholder.substring(0, currentIndex);
      
      // When finished deleting, start typing again after a pause
      if (currentIndex === 0) {
        isDeleting = false;
        clearInterval(typeTimer);
        setTimeout(() => {
          typeTimer = setInterval(typePlaceholder, 100);
        }, 1000);
      }
    } 
    // If typing text
    else {
      currentIndex++;
      textarea.placeholder = originalPlaceholder.substring(0, currentIndex);
      
      // When finished typing, start deleting after a pause
      if (currentIndex === originalPlaceholder.length) {
        isDeleting = true;
        clearInterval(typeTimer);
        setTimeout(() => {
          typeTimer = setInterval(typePlaceholder, 50);
        }, 2000);
      }
    }
  }
  
  // Start the animation if textarea is empty and not focused
  if (textarea.value === '' && document.activeElement !== textarea) {
    startTypingAnimation();
  }
}

/**
 * Enhances hover effects for UI elements
 */
function enhanceHoverEffects() {
  // Add subtle scale effect to suggestion cards
  const suggestionCards = document.querySelectorAll('.suggestion-card');
  suggestionCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-8px) scale(1.03)';
      card.style.zIndex = '1';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.zIndex = '';
    });
  });
  
  // Add ripple effect to primary button
  const buttons = document.querySelectorAll('.primary-btn');
  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      ripple.classList.add('ripple');
      
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      
      this.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  });
  
  // Add styles for the ripple effect
  const style = document.createElement('style');
  style.textContent = `
    .primary-btn {
      position: relative;
      overflow: hidden;
    }
    
    .ripple {
      position: absolute;
      background: rgba(255, 255, 255, 0.4);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
    }
    
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Adds a glowing cursor effect that follows the mouse
 */
function addGlowingCursor() {
  const cursor = document.createElement('div');
  cursor.classList.add('glow-cursor');
  document.body.appendChild(cursor);
  
  // Add styles for the glowing cursor
  const style = document.createElement('style');
  style.textContent = `
    .glow-cursor {
      position: fixed;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: rgba(138, 43, 226, 0.3);
      pointer-events: none;
      mix-blend-mode: screen;
      z-index: 9999;
      transform: translate(-50%, -50%);
      transition: transform 0.1s ease, width 0.2s ease, height 0.2s ease;
      box-shadow: 0 0 20px rgba(138, 43, 226, 0.5);
      backdrop-filter: blur(2px);
    }
    
    .glow-cursor.hover {
      width: 40px;
      height: 40px;
      background: rgba(138, 43, 226, 0.2);
    }
  `;
  document.head.appendChild(style);
  
  // Move the glowing cursor with the mouse
  document.addEventListener('mousemove', (e) => {
    cursor.style.left = `${e.clientX}px`;
    cursor.style.top = `${e.clientY}px`;
  });
  
  // Change cursor size when hovering over interactive elements
  const interactiveElements = document.querySelectorAll('a, button, input, textarea, .suggestion-card, .history-item');
  interactiveElements.forEach(element => {
    element.addEventListener('mouseenter', () => {
      cursor.classList.add('hover');
    });
    
    element.addEventListener('mouseleave', () => {
      cursor.classList.remove('hover');
    });
  });
  
  // Hide cursor when mouse leaves the window
  document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
  });
  
  document.addEventListener('mouseenter', () => {
    cursor.style.opacity = '1';
  });
  
  // Optional: disable on mobile devices
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    cursor.style.display = 'none';
  }
} 