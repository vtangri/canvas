/**
 * Canvas Greeting Module
 * Handles personalized greeting based on time of day and user's name
 */

const CanvasGreeting = {
    /**
     * Get greeting based on time of day
     * @returns {Object} Object with greeting text and subtitle
     */
    getGreeting() {
        const hour = new Date().getHours();
        let greeting, subtitle;

        if (hour >= 5 && hour < 12) {
            greeting = 'Good Morning';
            subtitle = 'A fresh start for your creativity';
        } else if (hour >= 12 && hour < 17) {
            greeting = 'Good Afternoon';
            subtitle = 'Perfect time to express yourself';
        } else if (hour >= 17 && hour < 21) {
            greeting = 'Good Evening';
            subtitle = 'Let your imagination flow';
        } else {
            greeting = 'Good Night';
            subtitle = 'Create something beautiful before you rest';
        }

        return { greeting, subtitle };
    },

    /**
     * Get or prompt for user's name
     * @returns {string} User's name
     */
    getUserName() {
        let userName = localStorage.getItem('canvasUserName');
        
        if (!userName) {
            // Prompt for name on first visit
            userName = prompt('Welcome to Creative Canvas! What\'s your name?') || 'Artist';
            if (userName.trim()) {
                localStorage.setItem('canvasUserName', userName.trim());
            } else {
                userName = 'Artist';
            }
        }

        return userName;
    },

    /**
     * Update greeting display
     */
    updateGreeting() {
        const greetingEl = document.getElementById('greetingText');
        const subtitleEl = document.getElementById('greetingSubtitle');

        if (!greetingEl || !subtitleEl) return;

        const userName = this.getUserName();
        const { greeting, subtitle } = this.getGreeting();

        // Create warm, personal greeting
        greetingEl.textContent = `${greeting}, ${userName}!`;
        subtitleEl.textContent = subtitle;

        // Add fade-in animation
        greetingEl.style.opacity = '0';
        subtitleEl.style.opacity = '0';
        
        setTimeout(() => {
            greetingEl.style.transition = 'opacity 0.5s ease';
            subtitleEl.style.transition = 'opacity 0.5s ease';
            greetingEl.style.opacity = '1';
            subtitleEl.style.opacity = '1';
        }, 100);
    },

    /**
     * Initialize greeting module
     */
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.updateGreeting());
        } else {
            this.updateGreeting();
        }
    }
};

// Auto-initialize
CanvasGreeting.init();

