/**
 * Canvas Color Module
 * Centralized color management for canvas drawing
 * Handles all color updates from pickers and presets
 */

window.CanvasColor = {
    currentColor: '#6366f1',
    initialized: false,

    /**
     * Initialize color module
     */
    init() {
        if (this.initialized) return;
        this.initialized = true;

        // Wait for canvas to be ready
        this.waitForCanvas().then(() => {
            this.setupColorPickers();
            this.setupColorPresets();
            console.log('CanvasColor module initialized successfully');
            
            // Set initial color
            this.applyColor(this.currentColor, 'init');
            
            // Test after a short delay
            setTimeout(() => {
                this.test();
            }, 500);
        }).catch((error) => {
            console.error('CanvasColor initialization error:', error);
            // Still try to setup pickers even if canvas isn't ready
            this.setupColorPickers();
            this.setupColorPresets();
        });
    },

    /**
     * Wait for canvas to be initialized
     */
    waitForCanvas() {
        return new Promise((resolve) => {
            const checkCanvas = () => {
                if (window.CanvasDrawing && window.CanvasDrawing.ctx) {
                    resolve();
                } else {
                    setTimeout(checkCanvas, 50);
                }
            };
            checkCanvas();
        });
    },

    /**
     * Setup color pickers
     */
    setupColorPickers() {
        const sidebarColorPicker = document.getElementById('colorPicker');
        const toolbarColorPicker = document.getElementById('toolbarColorPicker');
        const toolbarColorDisplay = document.getElementById('toolbarColorDisplay');

        // Sidebar color picker - main color input
        if (sidebarColorPicker) {
            // Remove any existing listeners by cloning
            const newPicker = sidebarColorPicker.cloneNode(true);
            sidebarColorPicker.parentNode.replaceChild(newPicker, sidebarColorPicker);
            
            // Add input event listener
            newPicker.addEventListener('input', (e) => {
                const color = e.target.value;
                console.log('Sidebar color picker changed:', color);
                this.applyColor(color, 'sidebar-picker');
            });
            
            // Add change event listener as backup
            newPicker.addEventListener('change', (e) => {
                const color = e.target.value;
                console.log('Sidebar color picker changed (change event):', color);
                this.applyColor(color, 'sidebar-picker');
            });
            
            // Set initial value
            newPicker.value = this.currentColor;
            
            console.log('Sidebar color picker initialized');
        } else {
            console.warn('Sidebar color picker not found');
        }

        // Toolbar color picker
        if (toolbarColorPicker) {
            toolbarColorPicker.addEventListener('input', (e) => {
                const color = e.target.value;
                console.log('Toolbar color picker changed:', color);
                this.applyColor(color, 'toolbar-picker');
            });
        }

        // Toolbar color display click
        if (toolbarColorDisplay) {
            toolbarColorDisplay.addEventListener('click', () => {
                if (toolbarColorPicker) {
                    toolbarColorPicker.click();
                }
            });
        }
    },

    /**
     * Setup color preset buttons
     */
    setupColorPresets() {
        // Use event delegation for reliability - ensure it only runs once
        if (window.colorPresetsHandlerAdded) {
            return; // Already set up
        }
        window.colorPresetsHandlerAdded = true;

        document.addEventListener('click', (e) => {
            const preset = e.target.closest('.color-preset');
            if (!preset) return;

            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            const color = preset.dataset.color;
            if (!color) {
                console.warn('Color preset missing data-color attribute');
                return;
            }

            console.log('Color preset clicked:', color);
            this.applyColor(color, 'preset');
            
            // Visual feedback
            preset.style.transform = 'scale(1.15)';
            setTimeout(() => {
                preset.style.transform = 'scale(1)';
            }, 150);
        }, true); // Capture phase

        // Also attach direct listeners as backup
        setTimeout(() => {
            const presets = document.querySelectorAll('.color-preset');
            presets.forEach(preset => {
                preset.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const color = preset.dataset.color;
                    if (color) {
                        console.log('Color preset direct click:', color);
                        this.applyColor(color, 'preset');
                        
                        // Visual feedback
                        preset.style.transform = 'scale(1.15)';
                        setTimeout(() => {
                            preset.style.transform = 'scale(1)';
                        }, 150);
                    }
                });
            });
            console.log(`Attached direct listeners to ${presets.length} color presets`);
        }, 300);
    },

    /**
     * Apply color to all components
     */
    applyColor(color, source = 'unknown') {
        if (!color) {
            console.warn('Invalid color:', color);
            return;
        }

        // Normalize color format (ensure it's a valid hex color)
        if (!color.startsWith('#')) {
            console.warn('Color format invalid, expected hex:', color);
            return;
        }

        // Store current color - this is the source of truth
        // CRITICAL: This must be set first before anything else
        const previousColor = this.currentColor;
        this.currentColor = color;
        
        // Verify the color was stored correctly
        if (this.currentColor !== color) {
            console.error('Color storage failed!', this.currentColor, '!=', color);
            return; // Don't continue if storage failed
        }
        
        // If color didn't actually change, skip updates
        if (previousColor === color) {
            return;
        }

        // Update sidebar color picker (without triggering events to avoid loops)
        const sidebarColorPicker = document.getElementById('colorPicker');
        if (sidebarColorPicker) {
            if (sidebarColorPicker.value !== color) {
                // Temporarily remove listeners to avoid infinite loop
                const oldValue = sidebarColorPicker.value;
                sidebarColorPicker.value = color;
                console.log(`Sidebar picker updated: ${oldValue} -> ${color}`);
            }
        }

        // Update toolbar color picker
        const toolbarColorPicker = document.getElementById('toolbarColorPicker');
        const toolbarColorDisplay = document.getElementById('toolbarColorDisplay');
        if (toolbarColorPicker && toolbarColorPicker.value !== color) {
            toolbarColorPicker.value = color;
        }
        if (toolbarColorDisplay) {
            toolbarColorDisplay.style.background = color;
        }

        // Update canvas drawing module - ensure it's updated immediately
        // This is CRITICAL - must update even if user is currently drawing
        if (window.CanvasDrawing) {
            // Update property first
            window.CanvasDrawing.currentColor = color;

            // Update context immediately if available - CRITICAL for drawing
            // This ensures color changes apply even while user is drawing
            if (window.CanvasDrawing.ctx) {
                // Force update the context strokeStyle immediately
                // This is CRITICAL - must happen synchronously
                window.CanvasDrawing.ctx.strokeStyle = color;
                
                // Also update other context properties to ensure consistency
                if (window.CanvasDrawing.brushSize) {
                    window.CanvasDrawing.ctx.lineWidth = window.CanvasDrawing.brushSize;
                }
                window.CanvasDrawing.ctx.lineCap = 'round';
                window.CanvasDrawing.ctx.lineJoin = 'round';
                
                // Verify it was set correctly
                if (window.CanvasDrawing.ctx.strokeStyle !== color) {
                    console.error('Failed to set strokeStyle! Expected:', color, 'Got:', window.CanvasDrawing.ctx.strokeStyle);
                    // Try again
                    window.CanvasDrawing.ctx.strokeStyle = color;
                }
            } else {
                console.warn('CanvasDrawing context not available, will retry');
                // Retry after a short delay
                setTimeout(() => {
                    if (window.CanvasDrawing && window.CanvasDrawing.ctx) {
                        window.CanvasDrawing.ctx.strokeStyle = color;
                        window.CanvasDrawing.currentColor = color;
                        console.log('CanvasDrawing context updated on retry');
                    }
                }, 100);
            }

            // Call setColor method to ensure all updates are applied and synced
            if (typeof window.CanvasDrawing.setColor === 'function') {
                window.CanvasDrawing.setColor(color);
            }
        } else {
            console.error('CanvasDrawing module not available');
        }

        // Update canvas tools module for shape drawing
        if (window.CanvasTools) {
            if (window.CanvasTools.ctx) {
                window.CanvasTools.ctx.strokeStyle = color;
                console.log('CanvasTools context strokeStyle updated');
            }
        }

        // Visual feedback - update any active tool indicators
        this.updateColorVisualFeedback(color);
    },

    /**
     * Update visual feedback for color changes
     */
    updateColorVisualFeedback(color) {
        // Update color preset buttons to show which is active
        document.querySelectorAll('.color-preset').forEach(preset => {
            if (preset.dataset.color === color) {
                preset.style.border = '2px solid rgba(255, 255, 255, 0.8)';
                preset.style.boxShadow = '0 0 10px rgba(99, 102, 241, 0.5)';
            } else {
                preset.style.border = '';
                preset.style.boxShadow = '';
            }
        });
    },

    /**
     * Get current color - always returns the latest color
     */
    getColor() {
        // Ensure we always return a valid color
        // Read directly from the property to avoid any delays
        const color = this.currentColor || '#6366f1';
        return color;
    },

    /**
     * Test color functionality
     */
    test() {
        console.log('=== CanvasColor Module Test ===');
        console.log('Current color:', this.currentColor);
        console.log('Initialized:', this.initialized);
        
        const sidebarPicker = document.getElementById('colorPicker');
        const presets = document.querySelectorAll('.color-preset');
        
        console.log('Sidebar picker found:', !!sidebarPicker);
        console.log('Color presets found:', presets.length);
        
        if (sidebarPicker) {
            console.log('Sidebar picker value:', sidebarPicker.value);
        }
        
        presets.forEach((preset, index) => {
            console.log(`Preset ${index}:`, preset.dataset.color, 'Element:', preset);
        });
        
        console.log('CanvasDrawing available:', !!window.CanvasDrawing);
        console.log('CanvasDrawing ctx available:', !!(window.CanvasDrawing && window.CanvasDrawing.ctx));
        console.log('CanvasTools available:', !!window.CanvasTools);
        console.log('CanvasTools ctx available:', !!(window.CanvasTools && window.CanvasTools.ctx));
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => window.CanvasColor.init(), 200);
    });
} else {
    setTimeout(() => window.CanvasColor.init(), 200);
}

