/**
 * Canvas Tools Module
 * Handles tool selection, shape drawing, and undo/redo functionality
 */

window.CanvasTools = {
    canvas: null,
    ctx: null,
    currentTool: 'brush',
    startX: 0,
    startY: 0,
    isDrawing: false,
    undoStack: [],
    redoStack: [],
    maxUndoSteps: 50,

    /**
     * Initialize tools module
     */
    init() {
        this.canvas = document.getElementById('drawingCanvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        
        // Set initial tool to brush
        this.currentTool = 'brush';
        
        // Setup tool buttons
        this.setupToolButtons();
        
        // Setup action buttons
        this.setupActionButtons();
        
        // Setup shape drawing events
        this.setupShapeEvents();
        
        // Save initial state after canvas is ready
        setTimeout(() => {
            this.saveState();
        }, 500);
    },

    /**
     * Setup tool selection buttons
     */
    setupToolButtons() {
        const toolButtons = document.querySelectorAll('.tool-btn');
        toolButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tool = btn.dataset.tool;
                this.selectTool(tool);
            });
        });
    },

    /**
     * Select a tool
     */
    selectTool(tool) {
        console.log('Selecting tool:', tool);
        this.currentTool = tool;
        
        // Update UI - sidebar buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tool === tool) {
                btn.classList.add('active');
            }
        });

        // Update UI - toolbar buttons
        document.querySelectorAll('.toolbar-btn[data-tool]').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tool === tool) {
                btn.classList.add('active');
            }
        });

        // Update canvas drawing module
        if (window.CanvasDrawing) {
            window.CanvasDrawing.setTool(tool);
        }

        // Update cursor
        if (this.canvas) {
            this.canvas.style.cursor = 'crosshair';
        }
    },

    /**
     * Setup action buttons (undo, redo, clear)
     */
    setupActionButtons() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        const clearBtn = document.getElementById('clearBtn');

        if (undoBtn) {
            undoBtn.addEventListener('click', () => this.undo());
        }

        if (redoBtn) {
            redoBtn.addEventListener('click', () => this.redo());
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear the canvas?')) {
                    this.clearCanvas();
                }
            });
        }
    },

    /**
     * Setup shape drawing events
     */
    setupShapeEvents() {
        if (!this.canvas) return;

        // Use capture phase to handle shape tools before brush tool
        this.canvas.addEventListener('mousedown', (e) => this.startShape(e), true);
        this.canvas.addEventListener('mousemove', (e) => this.drawShape(e), true);
        this.canvas.addEventListener('mouseup', () => this.finishShape(), true);
        this.canvas.addEventListener('mouseout', () => this.finishShape(), true);

        // Touch events
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
        const devicePixelRatio = window.devicePixelRatio || 1;

        return {
            x: (e.clientX - rect.left) * scaleX / devicePixelRatio,
            y: (e.clientY - rect.top) * scaleY / devicePixelRatio
        };
    },

    /**
     * Start drawing a shape
     */
    startShape(e) {
        // Only handle shape tools, brush is handled by CanvasDrawing
        if (this.currentTool === 'brush') {
            return; // Let CanvasDrawing handle brush
        }

        // Prevent default and stop propagation for shape tools
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation(); // Prevent other handlers
        
        this.isDrawing = true;
        const coords = this.getCoordinates(e);
        this.startX = coords.x;
        this.startY = coords.y;

        // Save state for undo before starting shape
        this.saveState();
        
        console.log(`Starting ${this.currentTool} at (${this.startX}, ${this.startY})`);
    },

    /**
     * Draw shape preview
     */
    drawShape(e) {
        if (!this.isDrawing || this.currentTool === 'brush') return;

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation(); // Prevent other handlers
        
        const coords = this.getCoordinates(e);
        const currentX = coords.x;
        const currentY = coords.y;

        // Get color from CanvasColor module or fallback
        const color = (window.CanvasColor && window.CanvasColor.getColor) 
            ? window.CanvasColor.getColor() 
            : (window.CanvasDrawing?.currentColor || '#6366f1');
        
        const brushSize = window.CanvasDrawing?.brushSize || 5;

        // Redraw canvas from last saved state (synchronous for preview)
        this.restoreStateSync();

        // Set drawing style
        if (this.ctx) {
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = brushSize;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
        }

        // Draw shape based on current tool
        switch (this.currentTool) {
            case 'line':
                this.drawLine(this.startX, this.startY, currentX, currentY);
                break;
            case 'rectangle':
                this.drawRectangle(this.startX, this.startY, currentX, currentY);
                break;
            case 'circle':
                this.drawCircle(this.startX, this.startY, currentX, currentY);
                break;
        }
    },

    /**
     * Finish drawing shape
     */
    finishShape() {
        if (this.isDrawing && this.currentTool !== 'brush') {
            this.isDrawing = false;
            
            // Final shape is already drawn, just save state
            this.saveState();
            
            console.log(`Finished ${this.currentTool}`);
            
            // Auto-save
            if (window.CanvasStorage && window.CanvasStorage.autoSave) {
                window.CanvasStorage.autoSave();
            }
        }
    },

    /**
     * Draw a line
     */
    drawLine(x1, y1, x2, y2) {
        if (!this.ctx) return;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    },

    /**
     * Draw a rectangle
     */
    drawRectangle(x1, y1, x2, y2) {
        if (!this.ctx) return;
        const width = x2 - x1;
        const height = y2 - y1;
        this.ctx.strokeRect(x1, y1, width, height);
    },

    /**
     * Draw a circle
     */
    drawCircle(x1, y1, x2, y2) {
        if (!this.ctx) return;
        const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        this.ctx.beginPath();
        this.ctx.arc(x1, y1, radius, 0, Math.PI * 2);
        this.ctx.stroke();
    },

    /**
     * Save current canvas state for undo
     */
    saveState() {
        if (!this.canvas) return;

        // Get current image data
        const imageData = this.canvas.toDataURL();

        // Add to undo stack
        this.undoStack.push(imageData);

        // Limit stack size
        if (this.undoStack.length > this.maxUndoSteps) {
            this.undoStack.shift();
        }

        // Clear redo stack when new action is performed
        this.redoStack = [];

        // Update button states
        this.updateButtonStates();
    },

    /**
     * Restore canvas state synchronously (for preview during shape drawing)
     */
    restoreStateSync() {
        if (!this.canvas || !this.ctx || this.undoStack.length === 0) return;

        const lastState = this.undoStack[this.undoStack.length - 1];
        const devicePixelRatio = window.devicePixelRatio || 1;
        const width = this.canvas.width / devicePixelRatio;
        const height = this.canvas.height / devicePixelRatio;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, width, height);
        
        // Draw saved state - use ImageData if available, otherwise use Image
        const img = new Image();
        // Set src immediately - browser will cache it
        img.src = lastState;
        
        // If image is already loaded, draw immediately
        if (img.complete) {
            this.ctx.drawImage(img, 0, 0, width, height);
        } else {
            // Otherwise wait for load
            img.onload = () => {
                this.ctx.drawImage(img, 0, 0, width, height);
            };
        }
    },

    /**
     * Restore canvas state (for undo/redo)
     */
    restoreState() {
        if (!this.canvas || this.undoStack.length === 0) return;

        const lastState = this.undoStack[this.undoStack.length - 1];
        const img = new Image();
        
        img.onload = () => {
            const devicePixelRatio = window.devicePixelRatio || 1;
            const width = this.canvas.width / devicePixelRatio;
            const height = this.canvas.height / devicePixelRatio;
            
            this.ctx.clearRect(0, 0, width, height);
            this.ctx.drawImage(img, 0, 0, width, height);
        };
        
        img.src = lastState;
    },

    /**
     * Undo last action
     */
    undo() {
        if (this.undoStack.length <= 1) return; // Keep at least one state

        // Move current state to redo stack
        const currentState = this.undoStack.pop();
        this.redoStack.push(currentState);

        // Restore previous state
        if (this.undoStack.length > 0) {
            const previousState = this.undoStack[this.undoStack.length - 1];
            this.loadState(previousState);
        }

        this.updateButtonStates();

        // Auto-save after undo
        if (window.CanvasStorage && window.CanvasStorage.autoSave) {
            window.CanvasStorage.autoSave();
        }
    },

    /**
     * Redo last undone action
     */
    redo() {
        if (this.redoStack.length === 0) return;

        // Get state from redo stack
        const state = this.redoStack.pop();
        this.undoStack.push(state);
        this.loadState(state);

        this.updateButtonStates();

        // Auto-save after redo
        if (window.CanvasStorage && window.CanvasStorage.autoSave) {
            window.CanvasStorage.autoSave();
        }
    },

    /**
     * Load a canvas state
     */
    loadState(imageData) {
        if (!this.canvas || !imageData) return;

        const img = new Image();
        img.onload = () => {
            const devicePixelRatio = window.devicePixelRatio || 1;
            const width = this.canvas.width / devicePixelRatio;
            const height = this.canvas.height / devicePixelRatio;
            
            this.ctx.clearRect(0, 0, width, height);
            this.ctx.drawImage(img, 0, 0, width, height);
        };
        img.src = imageData;
    },

    /**
     * Clear canvas
     */
    clearCanvas() {
        if (!this.canvas) return;

        // Save state before clearing
        this.saveState();

        // Clear canvas
        const devicePixelRatio = window.devicePixelRatio || 1;
        const width = this.canvas.width / devicePixelRatio;
        const height = this.canvas.height / devicePixelRatio;
        this.ctx.clearRect(0, 0, width, height);

        // Save empty state
        this.saveState();

        // Auto-save
        if (window.CanvasStorage && window.CanvasStorage.autoSave) {
            window.CanvasStorage.autoSave();
        }
    },

    /**
     * Update undo/redo button states
     */
    updateButtonStates() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');

        if (undoBtn) {
            undoBtn.disabled = this.undoStack.length <= 1;
            undoBtn.style.opacity = this.undoStack.length <= 1 ? '0.5' : '1';
        }

        if (redoBtn) {
            redoBtn.disabled = this.redoStack.length === 0;
            redoBtn.style.opacity = this.redoStack.length === 0 ? '0.5' : '1';
        }
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.CanvasTools.init());
} else {
    window.CanvasTools.init();
}

