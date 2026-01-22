/**
 * Canvas History Module
 * Handles save history with named saves and gallery view
 */

window.CanvasHistory = {
    /**
     * Initialize history module
     */
    init() {
        this.setupTabs();
        this.setupSaveButton();
        this.setupExportButtons();
        this.loadHistory();
    },

    /**
     * Setup tab switching
     */
    setupTabs() {
        const tabs = document.querySelectorAll('.panel-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                
                // Update active tab
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Update active content
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                document.getElementById(targetTab + 'Tab').classList.add('active');
            });
        });
    },

    /**
     * Setup save button
     */
    setupSaveButton() {
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveCurrentDrawing());
        }
    },

    /**
     * Setup export buttons
     */
    setupExportButtons() {
        const exportBtn = document.getElementById('exportBtn');
        const exportJpgBtn = document.getElementById('exportJpgBtn');

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportAsPNG());
        }

        if (exportJpgBtn) {
            exportJpgBtn.addEventListener('click', () => this.exportAsJPEG());
        }
    },

    /**
     * Save current drawing with name
     */
    async saveCurrentDrawing() {
        try {
            // Get image data - try multiple methods
            let imageData = null;
            
            // Method 1: Try CanvasDrawing module
            if (window.CanvasDrawing && typeof window.CanvasDrawing.getImageData === 'function') {
                imageData = window.CanvasDrawing.getImageData();
            }
            
            // Method 2: Get directly from canvas
            if (!imageData) {
                const canvas = document.getElementById('drawingCanvas');
                if (canvas) {
                    try {
                        imageData = canvas.toDataURL('image/png');
                    } catch (error) {
                        console.error('Error getting canvas data for save:', error);
                    }
                }
            }

            if (!imageData || imageData === 'data:,') {
                alert('Nothing to save! The canvas is empty.');
                return;
            }

            const reflectionText = document.getElementById('reflectionText')?.value || '';

            // Prompt for name
            const name = prompt('Enter a name for this drawing:', `Drawing ${new Date().toLocaleDateString()}`);
            if (!name || !name.trim()) {
                return;
            }

            // Create thumbnail
            const thumbnail = await this.createThumbnail(imageData);
            
            const drawingData = {
                id: Date.now().toString(),
                name: name.trim(),
                imageData: imageData,
                reflectionText: reflectionText,
                timestamp: new Date().toISOString(),
                thumbnail: thumbnail
            };

            // Save to history
            if (window.CanvasStorage && window.CanvasStorage.saveToHistory) {
                const saved = await window.CanvasStorage.saveToHistory(drawingData);
                if (saved) {
                    this.loadHistory();
                    this.showNotification('Drawing saved successfully!', 'success');
                } else {
                    this.showNotification('Failed to save drawing', 'error');
                }
            } else {
                alert('Storage module not available!');
            }
        } catch (error) {
            console.error('Error saving drawing:', error);
            alert('Failed to save drawing: ' + error.message);
        }
    },

    /**
     * Create thumbnail from image data
     */
    createThumbnail(imageData) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const size = 150;
                
                canvas.width = size;
                canvas.height = size;
                
                // Calculate aspect ratio
                const aspect = img.width / img.height;
                let drawWidth = size;
                let drawHeight = size;
                let offsetX = 0;
                let offsetY = 0;
                
                if (aspect > 1) {
                    drawHeight = size / aspect;
                    offsetY = (size - drawHeight) / 2;
                } else {
                    drawWidth = size * aspect;
                    offsetX = (size - drawWidth) / 2;
                }
                
                ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
                resolve(canvas.toDataURL('image/png'));
            };
            img.src = imageData;
        });
    },

    /**
     * Load and display history
     */
    async loadHistory() {
        const historyList = document.getElementById('historyList');
        const historyEmpty = document.getElementById('historyEmpty');
        
        if (!historyList) return;

        if (window.CanvasStorage && window.CanvasStorage.getHistory) {
            const history = await window.CanvasStorage.getHistory();
            
            if (history.length === 0) {
                if (historyEmpty) historyEmpty.style.display = 'block';
                historyList.innerHTML = '';
                return;
            }

            if (historyEmpty) historyEmpty.style.display = 'none';

            historyList.innerHTML = history.map(item => `
                <div class="history-item" data-id="${item.id}">
                    <div class="history-thumbnail">
                        <img src="${item.thumbnail || item.imageData}" alt="${item.name}">
                        <div class="history-overlay">
                            <button class="history-btn load-btn" data-id="${item.id}" title="Load">
                                <span>📂</span>
                            </button>
                            <button class="history-btn delete-btn" data-id="${item.id}" title="Delete">
                                <span>🗑️</span>
                            </button>
                        </div>
                    </div>
                    <div class="history-info">
                        <h4 class="history-name">${this.escapeHtml(item.name)}</h4>
                        <p class="history-date">${new Date(item.timestamp).toLocaleString()}</p>
                    </div>
                </div>
            `).join('');

            // Bind event listeners
            historyList.querySelectorAll('.load-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.loadDrawing(btn.dataset.id);
                });
            });

            historyList.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteDrawing(btn.dataset.id);
                });
            });
        }
    },

    /**
     * Load a drawing from history
     */
    async loadDrawing(id) {
        if (window.CanvasStorage && window.CanvasStorage.getDrawingById) {
            const drawing = await window.CanvasStorage.getDrawingById(id);
            if (drawing) {
                // Load image
                if (window.CanvasDrawing && window.CanvasDrawing.loadImageData) {
                    window.CanvasDrawing.loadImageData(drawing.imageData);
                }

                // Load reflection
                const reflectionTextarea = document.getElementById('reflectionText');
                if (reflectionTextarea) {
                    reflectionTextarea.value = drawing.reflectionText || '';
                }

                this.showNotification('Drawing loaded!', 'success');
            }
        }
    },

    /**
     * Delete a drawing from history
     */
    async deleteDrawing(id) {
        if (!confirm('Are you sure you want to delete this drawing?')) {
            return;
        }

        if (window.CanvasStorage && window.CanvasStorage.deleteFromHistory) {
            const deleted = await window.CanvasStorage.deleteFromHistory(id);
            if (deleted) {
                this.loadHistory();
                this.showNotification('Drawing deleted', 'success');
            }
        }
    },

    /**
     * Export canvas as PNG
     */
    exportAsPNG() {
        try {
            // Get canvas element directly
            const canvas = document.getElementById('drawingCanvas');
            if (!canvas) {
                alert('Canvas not found!');
                return;
            }

            // Get image data from canvas
            let imageData = null;
            
            // Try getting from CanvasDrawing module first
            if (window.CanvasDrawing && typeof window.CanvasDrawing.getImageData === 'function') {
                imageData = window.CanvasDrawing.getImageData();
            }
            
            // Fallback: get directly from canvas
            if (!imageData) {
                try {
                    imageData = canvas.toDataURL('image/png');
                } catch (error) {
                    console.error('Error getting canvas data:', error);
                    alert('Error exporting canvas. The canvas might be empty or there was an error.');
                    return;
                }
            }

            if (!imageData || imageData === 'data:,') {
                alert('Nothing to export! The canvas is empty.');
                return;
            }

            // Create download link
            const link = document.createElement('a');
            link.download = `canvas-drawing-${Date.now()}.png`;
            link.href = imageData;
            
            // Append to body temporarily (required for some browsers)
            document.body.appendChild(link);
            link.click();
            
            // Clean up
            setTimeout(() => {
                document.body.removeChild(link);
            }, 100);
            
            this.showNotification('Exported as PNG!', 'success');
        } catch (error) {
            console.error('Error exporting PNG:', error);
            alert('Failed to export PNG: ' + error.message);
        }
    },

    /**
     * Export canvas as JPEG
     */
    exportAsJPEG() {
        try {
            const canvas = document.getElementById('drawingCanvas');
            if (!canvas) {
                alert('Canvas not found!');
                return;
            }

            let imageData = null;
            try {
                imageData = canvas.toDataURL('image/jpeg', 0.9);
            } catch (error) {
                console.error('Error getting canvas JPEG data:', error);
                alert('Error exporting canvas as JPEG.');
                return;
            }

            if (!imageData || imageData === 'data:,') {
                alert('Nothing to export! The canvas is empty.');
                return;
            }

            // Create download link
            const link = document.createElement('a');
            link.download = `canvas-drawing-${Date.now()}.jpg`;
            link.href = imageData;
            
            // Append to body temporarily (required for some browsers)
            document.body.appendChild(link);
            link.click();
            
            // Clean up
            setTimeout(() => {
                document.body.removeChild(link);
            }, 100);
            
            this.showNotification('Exported as JPEG!', 'success');
        } catch (error) {
            console.error('Error exporting JPEG:', error);
            alert('Failed to export JPEG: ' + error.message);
        }
    },

    /**
     * Show notification
     */
    showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `canvas-notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 10);

        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.CanvasHistory.init());
} else {
    window.CanvasHistory.init();
}

