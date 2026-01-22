/**
 * Browser API Implementation
 * Includes: Validation API, Clipboard API, Notifications API, and Geolocation API
 */

/**
 * Validation API - Form validation with modal alerts
 */
const ValidationAPI = {
    /**
     * Validate form using Constraint Validation API
     * @param {HTMLFormElement} form - Form element to validate
     * @returns {boolean} True if valid, false otherwise
     */
    validateForm(form) {
        if (!form.checkValidity()) {
            // Find first invalid field
            const firstInvalid = form.querySelector(':invalid');
            if (firstInvalid) {
                firstInvalid.focus();
                firstInvalid.reportValidity();
            }
            return false;
        }
        return true;
    },

    /**
     * Show validation feedback in modal
     * @param {string} title - Modal title
     * @param {string} message - Modal message
     * @param {string} type - 'success' or 'error'
     */
    showModal(title, message, type = 'success') {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');

        if (!modal || !modalTitle || !modalMessage) return;

        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modal.classList.remove('hidden');
        modal.setAttribute('data-type', type);

        // Auto-close after 3 seconds for success messages
        if (type === 'success') {
            setTimeout(() => {
                this.hideModal();
            }, 3000);
        }
    },

    /**
     * Hide validation modal
     */
    hideModal() {
        const modal = document.getElementById('modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    },

    /**
     * Setup form validation with real-time feedback
     * @param {HTMLFormElement} form - Form element
     */
    setupFormValidation(form) {
        if (!form) return;

        const inputs = form.querySelectorAll('input, textarea');
        
        inputs.forEach(input => {
            // Real-time validation on blur
            input.addEventListener('blur', () => {
                this.validateField(input);
            });

            // Clear validation on input
            input.addEventListener('input', () => {
                if (input.validity.valid) {
                    input.classList.remove('invalid');
                    input.classList.add('valid');
                }
            });
        });

        // Form submission validation
        form.addEventListener('submit', (e) => {
            if (!this.validateForm(form)) {
                e.preventDefault();
                this.showModal('Validation Error', 'Please fill in all required fields correctly.', 'error');
            }
        });
    },

    /**
     * Validate individual field
     * @param {HTMLElement} field - Input/textarea element
     */
    validateField(field) {
        if (!field.validity.valid) {
            field.classList.add('invalid');
            field.classList.remove('valid');
            
            let message = '';
            if (field.validity.valueMissing) {
                message = `${field.labels[0]?.textContent || 'This field'} is required.`;
            } else if (field.validity.tooShort) {
                message = `Please enter at least ${field.minLength} characters.`;
            } else if (field.validity.tooLong) {
                message = `Please enter no more than ${field.maxLength} characters.`;
            } else if (field.validity.typeMismatch) {
                message = `Please enter a valid ${field.type}.`;
            } else {
                message = 'Please check this field.';
            }
            
            field.setCustomValidity(message);
        } else {
            field.classList.remove('invalid');
            field.classList.add('valid');
            field.setCustomValidity('');
        }
    }
};

/**
 * Clipboard API - Copy journal entries to clipboard
 */
const ClipboardAPI = {
    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise<boolean>} True if successful
     */
    async copyToClipboard(text) {
        if (!navigator.clipboard) {
            // Fallback for older browsers
            return this.fallbackCopyToClipboard(text);
        }

        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Clipboard API error:', error);
            return this.fallbackCopyToClipboard(text);
        }
    },

    /**
     * Fallback copy method for older browsers
     * @param {string} text - Text to copy
     * @returns {boolean} True if successful
     */
    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            return successful;
        } catch (error) {
            console.error('Fallback copy failed:', error);
            document.body.removeChild(textArea);
            return false;
        }
    },

    /**
     * Copy journal entry to clipboard
     * @param {Object} entry - Journal entry object
     */
    async copyEntry(entry) {
        const text = `Title: ${entry.title}\nDate: ${entry.date}\n\n${entry.content}`;
        const success = await this.copyToClipboard(text);
        
        if (success) {
            ValidationAPI.showModal('Copied!', 'Journal entry copied to clipboard.', 'success');
        } else {
            ValidationAPI.showModal('Error', 'Failed to copy to clipboard.', 'error');
        }
        
        return success;
    }
};

/**
 * Notifications API - Alert when new entry is saved
 */
const NotificationsAPI = {
    permission: null,

    /**
     * Request notification permission
     * @returns {Promise<string>} Permission status
     */
    async requestPermission() {
        if (!('Notification' in window)) {
            console.warn('This browser does not support notifications');
            return 'denied';
        }

        if (Notification.permission === 'granted') {
            this.permission = 'granted';
            return 'granted';
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            return permission;
        }

        this.permission = 'denied';
        return 'denied';
    },

    /**
     * Show notification
     * @param {string} title - Notification title
     * @param {Object} options - Notification options
     */
    async showNotification(title, options = {}) {
        await this.requestPermission();

        if (this.permission !== 'granted') {
            console.warn('Notification permission not granted');
            return;
        }

        const notification = new Notification(title, {
            body: options.body || 'Your journal entry has been saved successfully!',
            icon: options.icon || '/img/icon-192x192.png',
            badge: '/img/icon-192x192.png',
            tag: options.tag || 'journal-entry',
            requireInteraction: false,
            ...options
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };

        // Auto-close after 5 seconds
        setTimeout(() => {
            notification.close();
        }, 5000);
    },

    /**
     * Show notification for saved journal entry
     * @param {Object} entry - Journal entry object
     */
    async notifyEntrySaved(entry) {
        await this.showNotification('Journal Entry Saved', {
            body: `"${entry.title}" has been saved successfully!`,
            tag: `entry-${entry.id}`
        });
    }
};

/**
 * Geolocation API - Get user's location
 */
const GeolocationAPI = {
    /**
     * Get current position
     * @param {Object} options - Geolocation options
     * @returns {Promise<GeolocationPosition>} Position object
     */
    async getCurrentPosition(options = {}) {
        if (!navigator.geolocation) {
            throw new Error('Geolocation is not supported by this browser');
        }

        const defaultOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                { ...defaultOptions, ...options }
            );
        });
    },

    /**
     * Get position with error handling
     * @returns {Promise<Object>} Position data with lat/lng
     */
    async getPosition() {
        try {
            const position = await this.getCurrentPosition();
            return {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
            };
        } catch (error) {
            // Only log detailed error if it's not a permission denial
            if (error.code !== error.PERMISSION_DENIED) {
                console.debug('Geolocation error:', error);
            }
            let message = 'Unable to retrieve your location.';
            
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    message = 'Location access denied by user.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    message = 'Location information unavailable.';
                    break;
                case error.TIMEOUT:
                    message = 'Location request timed out.';
                    break;
            }
            
            throw new Error(message);
        }
    }
};

// Export for use in other scripts
window.ValidationAPI = ValidationAPI;
window.ClipboardAPI = ClipboardAPI;
window.NotificationsAPI = NotificationsAPI;
window.GeolocationAPI = GeolocationAPI;

