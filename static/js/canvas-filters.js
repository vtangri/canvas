/**
 * Canvas Filters Module
 * Photoshop-like filters and effects
 */

window.CanvasFilters = {
    canvas: null,
    ctx: null,
    originalImageData: null,

    /**
     * Initialize filters module
     */
    init() {
        this.canvas = document.getElementById('drawingCanvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.setupFilterButtons();
    },

    /**
     * Setup filter buttons
     */
    setupFilterButtons() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                this.applyFilter(filter);
            });
        });
    },

    /**
     * Save current canvas state before applying filter
     */
    saveState() {
        if (!this.canvas || !this.ctx) return;
        
        const devicePixelRatio = window.devicePixelRatio || 1;
        const width = this.canvas.width / devicePixelRatio;
        const height = this.canvas.height / devicePixelRatio;
        
        this.originalImageData = this.ctx.getImageData(0, 0, width, height);
    },

    /**
     * Restore canvas state
     */
    restoreState() {
        if (!this.originalImageData || !this.ctx) return;
        
        const devicePixelRatio = window.devicePixelRatio || 1;
        const width = this.canvas.width / devicePixelRatio;
        const height = this.canvas.height / devicePixelRatio;
        
        this.ctx.putImageData(this.originalImageData, 0, 0);
    },

    /**
     * Apply filter to canvas
     */
    applyFilter(filterName) {
        if (!this.canvas || !this.ctx) return;

        // Save state for undo
        if (window.CanvasTools && window.CanvasTools.saveState) {
            window.CanvasTools.saveState();
        }

        // Save current state
        this.saveState();

        const devicePixelRatio = window.devicePixelRatio || 1;
        const width = this.canvas.width / devicePixelRatio;
        const height = this.canvas.height / devicePixelRatio;
        
        const imageData = this.ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        switch (filterName) {
            case 'grayscale':
                this.grayscale(data);
                break;
            case 'sepia':
                this.sepia(data);
                break;
            case 'invert':
                this.invert(data);
                break;
            case 'blur':
                this.blur(imageData, width, height);
                break;
            case 'brightness':
                this.brightness(data, 1.2);
                break;
            case 'contrast':
                this.contrast(data, 1.5);
                break;
        }

        this.ctx.putImageData(imageData, 0, 0);

        // Auto-save
        if (window.CanvasStorage && window.CanvasStorage.autoSave) {
            window.CanvasStorage.autoSave();
        }
    },

    /**
     * Grayscale filter
     */
    grayscale(data) {
        for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            data[i] = gray;     // R
            data[i + 1] = gray; // G
            data[i + 2] = gray; // B
        }
    },

    /**
     * Sepia filter
     */
    sepia(data) {
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
            data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
            data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
        }
    },

    /**
     * Invert colors filter
     */
    invert(data) {
        for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];         // R
            data[i + 1] = 255 - data[i + 1]; // G
            data[i + 2] = 255 - data[i + 2]; // B
        }
    },

    /**
     * Blur filter (simple box blur)
     */
    blur(imageData, width, height) {
        const data = imageData.data;
        const tempData = new Uint8ClampedArray(data);
        const radius = 5;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let r = 0, g = 0, b = 0, a = 0, count = 0;

                for (let dy = -radius; dy <= radius; dy++) {
                    for (let dx = -radius; dx <= radius; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;

                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            const idx = (ny * width + nx) * 4;
                            r += tempData[idx];
                            g += tempData[idx + 1];
                            b += tempData[idx + 2];
                            a += tempData[idx + 3];
                            count++;
                        }
                    }
                }

                const idx = (y * width + x) * 4;
                data[idx] = r / count;
                data[idx + 1] = g / count;
                data[idx + 2] = b / count;
                data[idx + 3] = a / count;
            }
        }
    },

    /**
     * Brightness filter
     */
    brightness(data, factor) {
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * factor);         // R
            data[i + 1] = Math.min(255, data[i + 1] * factor); // G
            data[i + 2] = Math.min(255, data[i + 2] * factor); // B
        }
    },

    /**
     * Contrast filter
     */
    contrast(data, factor) {
        const intercept = 128 * (1 - factor);
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, Math.max(0, data[i] * factor + intercept));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * factor + intercept));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * factor + intercept));
        }
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.CanvasFilters.init());
} else {
    window.CanvasFilters.init();
}

