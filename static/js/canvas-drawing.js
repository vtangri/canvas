/**
 * Canvas Drawing Module
 * Handles freehand drawing with brush tool
 * Supports high DPI (retina) displays for crisp rendering
 */

const CanvasDrawing = {
    canvas: null,
    ctx: null,
    isDrawing: false,
    lastX: 0,
    lastY: 0,
    currentTool: 'brush',
    currentColor: '#6366f1',
    brushSize: 5,
    devicePixelRatio: window.devicePixelRatio || 1,

    /**
     * Get current color - reads directly from CanvasColor module
     */
    getCurrentColor() {
        // Read directly from CanvasColor module
        if (window.CanvasColor && window.CanvasColor.currentColor) {
            return window.CanvasColor.currentColor;
        }
        if (window.CanvasColor && typeof window.CanvasColor.getColor === 'function') {
            return window.CanvasColor.getColor();
        }
        return this.currentColor || '#6366f1';
    },

    /**
     * Initialize canvas with high DPI support
     */
    init() {
        this.canvas = document.getElementById('drawingCanvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.resizeCanvas();
        
        // Listen for window resize
        window.addEventListener('resize', () => this.resizeCanvas());

        // Drawing event listeners
        this.setupDrawingEvents();
    },

    /**
     * Resize canvas to fit container with high DPI support
     */
    resizeCanvas() {
        if (!this.canvas) return;

        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth - 32; // Account for padding
        const containerHeight = Math.max(600, window.innerHeight - 400);

        // Set display size (CSS pixels)
        this.canvas.style.width = containerWidth + 'px';
        this.canvas.style.height = containerHeight + 'px';

        // Set actual size in memory (scaled for device pixel ratio)
        this.canvas.width = containerWidth * this.devicePixelRatio;
        this.canvas.height = containerHeight * this.devicePixelRatio;

        // Scale the drawing context to match device pixel ratio
        this.ctx.scale(this.devicePixelRatio, this.devicePixelRatio);

        // Set default drawing styles
        // Get initial color from CanvasColor module if available
        const initialColor = (window.CanvasColor && window.CanvasColor.getColor) 
            ? window.CanvasColor.getColor() 
            : this.currentColor;
        
        this.currentColor = initialColor;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = initialColor;
        this.ctx.lineWidth = this.brushSize;

        // Load saved drawing if available
        this.loadDrawing();
    },

    /**
     * Setup drawing event listeners for mouse and touch
     */
    setupDrawingEvents() {
        if (!this.canvas) return;

        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup', {});
            this.canvas.dispatchEvent(mouseEvent);
        });
    },

    /**
     * Get coordinates relative to canvas
     */
    getCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        return {
            x: (e.clientX - rect.left) * scaleX / this.devicePixelRatio,
            y: (e.clientY - rect.top) * scaleY / this.devicePixelRatio
        };
    },

    /**
     * Start drawing
     */
    startDrawing(e) {
        // Only draw if brush tool is active
        if (this.currentTool !== 'brush') {
            return;
        }
        
        // Check if shape tool is active in CanvasTools, if so don't draw
        if (window.CanvasTools && window.CanvasTools.currentTool !== 'brush') {
            return;
        }
        
        // Check if CanvasTools is already handling a shape
        if (window.CanvasTools && window.CanvasTools.isDrawing && window.CanvasTools.currentTool !== 'brush') {
            return;
        }
        
        this.isDrawing = true;
        const coords = this.getCoordinates(e);
        this.lastX = coords.x;
        this.lastY = coords.y;

        // Get current color using helper method
        const currentColor = this.getCurrentColor();
        
        // Update local property
        this.currentColor = currentColor;
        
        // Set context properties IMMEDIATELY before starting to draw
        if (this.ctx) {
            this.ctx.strokeStyle = currentColor;
            this.ctx.lineWidth = this.brushSize;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
        } else {
            console.error('Canvas context not available in startDrawing()');
        }

        // Save state for undo
        if (window.CanvasTools && window.CanvasTools.saveState) {
            window.CanvasTools.saveState();
        }
    },

    /**
     * Draw on canvas
     */
    draw(e) {
        if (!this.isDrawing || this.currentTool !== 'brush') return;

        const coords = this.getCoordinates(e);

        // CRITICAL: Get fresh color using helper method
        // This ensures we always get the latest color value
        const drawColor = this.getCurrentColor();
        
        // Update local property to keep it in sync
        this.currentColor = drawColor;
        
        // CRITICAL: Always set context properties BEFORE each stroke
        // This MUST happen before beginPath() to ensure color is applied
        if (!this.ctx) {
            console.error('Canvas context not available in draw()');
            return;
        }
        
        // Set all context properties fresh before each stroke
        // This is the KEY - setting strokeStyle right before drawing
        this.ctx.strokeStyle = drawColor;
        this.ctx.lineWidth = this.brushSize;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // Draw the stroke - color is already set on context
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(coords.x, coords.y);
        this.ctx.stroke();

        this.lastX = coords.x;
        this.lastY = coords.y;

        // Auto-save after drawing
        if (window.CanvasStorage && window.CanvasStorage.autoSave) {
            window.CanvasStorage.autoSave();
        }
    },

    /**
     * Stop drawing
     */
    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
        }
    },

    /**
     * Update brush color
     */
    setColor(color) {
        if (!color) {
            console.warn('setColor called with invalid color:', color);
            return;
        }
        
        this.currentColor = color;
        
        // Update CanvasColor module to keep it in sync
        if (window.CanvasColor) {
            window.CanvasColor.currentColor = color;
        }
        
        // Update context immediately
        if (this.ctx) {
            this.ctx.strokeStyle = color;
            console.log('CanvasDrawing: Color set to', color, 'Context strokeStyle:', this.ctx.strokeStyle);
        } else {
            console.warn('CanvasDrawing: Context not available when setting color');
        }
    },

    /**
     * Update brush size
     */
    setBrushSize(size) {
        this.brushSize = size;
        if (this.ctx) {
            this.ctx.lineWidth = size;
        }
    },

    /**
     * Set current tool
     */
    setTool(tool) {
        this.currentTool = tool;
        this.stopDrawing(); // Stop any ongoing drawing
    },

    /**
     * Clear canvas
     */
    clear() {
        if (!this.ctx) return;
        
        // Save state before clearing
        if (window.CanvasTools && window.CanvasTools.saveState) {
            window.CanvasTools.saveState();
        }

        const width = this.canvas.width / this.devicePixelRatio;
        const height = this.canvas.height / this.devicePixelRatio;
        
        this.ctx.clearRect(0, 0, width, height);

        // Auto-save after clearing
        if (window.CanvasStorage && window.CanvasStorage.autoSave) {
            window.CanvasStorage.autoSave();
        }
    },

    /**
     * Get canvas image data for saving
     */
    getImageData() {
        if (!this.canvas) {
            console.warn('Canvas not available in getImageData()');
            return null;
        }
        
        try {
            // Get image data as PNG
            const imageData = this.canvas.toDataURL('image/png');
            
            // Check if canvas is empty (data URL will be 'data:,')
            if (!imageData || imageData === 'data:,') {
                console.warn('Canvas appears to be empty');
                return null;
            }
            
            return imageData;
        } catch (error) {
            console.error('Error getting image data:', error);
            return null;
        }
    },

    /**
     * Load image data onto canvas
     */
    loadImageData(imageData) {
        if (!this.ctx || !imageData) return;

        const img = new Image();
        img.onload = () => {
            const width = this.canvas.width / this.devicePixelRatio;
            const height = this.canvas.height / this.devicePixelRatio;
            this.ctx.clearRect(0, 0, width, height);
            this.ctx.drawImage(img, 0, 0, width, height);
        };
        img.src = imageData;
    },

    /**
     * Load saved drawing
     */
    loadDrawing() {
        if (window.CanvasStorage && window.CanvasStorage.loadDrawing) {
            window.CanvasStorage.loadDrawing();
        }
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => CanvasDrawing.init());
} else {
    CanvasDrawing.init();
}

