/**
 * Canvas Storage Module
 * Handles saving and loading canvas drawings and reflections
 * Uses IndexedDB for scalable storage, with localStorage fallback
 */

window.CanvasStorage = {
    dbName: 'CreativeCanvasDB',
    dbVersion: 2,
    storeName: 'drawings',
    historyStoreName: 'history',
    db: null,
    autoSaveTimer: null,
    autoSaveDelay: 2000, // 2 seconds

    /**
     * Initialize IndexedDB
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.warn('IndexedDB not available, using localStorage');
                resolve(false);
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve(true);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(this.historyStoreName)) {
                    const historyStore = db.createObjectStore(this.historyStoreName, { keyPath: 'id' });
                    historyStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    },

    /**
     * Save drawing to storage
     * Uses IndexedDB if available, falls back to localStorage
     */
    async saveDrawing(imageData, reflectionText = '') {
        const drawingData = {
            id: 'current',
            imageData: imageData,
            reflectionText: reflectionText,
            timestamp: new Date().toISOString()
        };

        try {
            // Try IndexedDB first
            if (this.db) {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                await store.put(drawingData);
                return true;
            } else {
                // Fallback to localStorage
                localStorage.setItem('canvasDrawing', JSON.stringify(drawingData));
                return true;
            }
        } catch (error) {
            console.error('Error saving drawing:', error);
            // Final fallback to localStorage
            try {
                localStorage.setItem('canvasDrawing', JSON.stringify(drawingData));
                return true;
            } catch (e) {
                console.error('Failed to save to localStorage:', e);
                return false;
            }
        }
    },

    /**
     * Load drawing from storage
     */
    async loadDrawing() {
        try {
            let drawingData = null;

            // Try IndexedDB first
            if (this.db) {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const request = store.get('current');
                
                drawingData = await new Promise((resolve, reject) => {
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });
            }

            // Fallback to localStorage
            if (!drawingData) {
                const stored = localStorage.getItem('canvasDrawing');
                if (stored) {
                    drawingData = JSON.parse(stored);
                }
            }

            if (drawingData && drawingData.imageData) {
                // Load image onto canvas
                if (window.CanvasDrawing && window.CanvasDrawing.loadImageData) {
                    window.CanvasDrawing.loadImageData(drawingData.imageData);
                }

                // Load reflection text
                if (drawingData.reflectionText) {
                    const reflectionTextarea = document.getElementById('reflectionText');
                    if (reflectionTextarea) {
                        reflectionTextarea.value = drawingData.reflectionText;
                    }
                }

                // Update timestamp
                const timestampEl = document.getElementById('reflectionTimestamp');
                if (timestampEl && drawingData.timestamp) {
                    timestampEl.textContent = `Last saved: ${new Date(drawingData.timestamp).toLocaleString()}`;
                }

                return true;
            }
        } catch (error) {
            console.error('Error loading drawing:', error);
            return false;
        }
    },

    /**
     * Auto-save drawing after a delay
     */
    autoSave() {
        // Clear existing timer
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }

        // Update save status
        this.updateSaveStatus('saving');

        // Set new timer
        this.autoSaveTimer = setTimeout(async () => {
            const imageData = window.CanvasDrawing?.getImageData();
            const reflectionText = document.getElementById('reflectionText')?.value || '';

            if (imageData) {
                const saved = await this.saveDrawing(imageData, reflectionText);
                if (saved) {
                    this.updateSaveStatus('saved');
                    
                    // Update timestamp
                    const timestampEl = document.getElementById('reflectionTimestamp');
                    if (timestampEl) {
                        timestampEl.textContent = `Last saved: ${new Date().toLocaleString()}`;
                    }
                } else {
                    this.updateSaveStatus('error');
                }
            }
        }, this.autoSaveDelay);
    },

    /**
     * Update save status indicator
     */
    updateSaveStatus(status) {
        const saveStatus = document.getElementById('saveStatus');
        const saveText = document.getElementById('saveText');

        if (!saveStatus || !saveText) return;

        saveStatus.className = 'save-status ' + status;

        switch (status) {
            case 'saving':
                saveText.textContent = 'Saving...';
                break;
            case 'saved':
                saveText.textContent = 'Saved';
                break;
            case 'error':
                saveText.textContent = 'Error';
                break;
            default:
                saveText.textContent = 'Saved';
        }
    },

    /**
     * Save reflection text separately
     */
    async saveReflection(text) {
        const imageData = window.CanvasDrawing?.getImageData() || '';
        return await this.saveDrawing(imageData, text);
    },

    /**
     * Save drawing to history
     */
    async saveToHistory(drawingData) {
        try {
            if (this.db) {
                const transaction = this.db.transaction([this.historyStoreName], 'readwrite');
                const store = transaction.objectStore(this.historyStoreName);
                await store.put(drawingData);
                return true;
            } else {
                // Fallback to localStorage
                const history = this.getHistorySync();
                history.push(drawingData);
                // Keep only last 50 items
                if (history.length > 50) {
                    history.shift();
                }
                localStorage.setItem('canvasHistory', JSON.stringify(history));
                return true;
            }
        } catch (error) {
            console.error('Error saving to history:', error);
            // Fallback to localStorage
            try {
                const history = this.getHistorySync();
                history.push(drawingData);
                if (history.length > 50) {
                    history.shift();
                }
                localStorage.setItem('canvasHistory', JSON.stringify(history));
                return true;
            } catch (e) {
                console.error('Failed to save to localStorage:', e);
                return false;
            }
        }
    },

    /**
     * Get history (sync version for fallback)
     */
    getHistorySync() {
        try {
            const stored = localStorage.getItem('canvasHistory');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    },

    /**
     * Get all saved drawings from history
     */
    async getHistory() {
        try {
            if (this.db) {
                const transaction = this.db.transaction([this.historyStoreName], 'readonly');
                const store = transaction.objectStore(this.historyStoreName);
                const index = store.index('timestamp');
                const request = index.openCursor(null, 'prev'); // Descending order
                
                const history = [];
                return new Promise((resolve, reject) => {
                    request.onsuccess = (e) => {
                        const cursor = e.target.result;
                        if (cursor) {
                            history.push(cursor.value);
                            cursor.continue();
                        } else {
                            resolve(history);
                        }
                    };
                    request.onerror = () => reject(request.error);
                });
            } else {
                // Fallback to localStorage
                return this.getHistorySync();
            }
        } catch (error) {
            console.error('Error getting history:', error);
            return this.getHistorySync();
        }
    },

    /**
     * Get drawing by ID from history
     */
    async getDrawingById(id) {
        try {
            if (this.db) {
                const transaction = this.db.transaction([this.historyStoreName], 'readonly');
                const store = transaction.objectStore(this.historyStoreName);
                const request = store.get(id);
                
                return new Promise((resolve, reject) => {
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });
            } else {
                // Fallback to localStorage
                const history = this.getHistorySync();
                return history.find(item => item.id === id) || null;
            }
        } catch (error) {
            console.error('Error getting drawing:', error);
            const history = this.getHistorySync();
            return history.find(item => item.id === id) || null;
        }
    },

    /**
     * Delete drawing from history
     */
    async deleteFromHistory(id) {
        try {
            if (this.db) {
                const transaction = this.db.transaction([this.historyStoreName], 'readwrite');
                const store = transaction.objectStore(this.historyStoreName);
                await store.delete(id);
                return true;
            } else {
                // Fallback to localStorage
                const history = this.getHistorySync();
                const filtered = history.filter(item => item.id !== id);
                localStorage.setItem('canvasHistory', JSON.stringify(filtered));
                return true;
            }
        } catch (error) {
            console.error('Error deleting from history:', error);
            try {
                const history = this.getHistorySync();
                const filtered = history.filter(item => item.id !== id);
                localStorage.setItem('canvasHistory', JSON.stringify(filtered));
                return true;
            } catch (e) {
                return false;
            }
        }
    }
};

/**
 * Tradeoffs between localStorage and IndexedDB:
 * 
 * localStorage:
 * - Simple API, synchronous
 * - Limited storage (~5-10MB)
 * - Good for small data
 * - Blocking operations
 * 
 * IndexedDB:
 * - Asynchronous, non-blocking
 * - Much larger storage capacity
 * - Better for binary data (images)
 * - More complex API
 * - Better performance for large files
 * 
 * This implementation uses IndexedDB when available for scalability,
 * with localStorage as a fallback for compatibility.
 */

// Initialize storage when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        await window.CanvasStorage.init();
        // Load saved drawing after a short delay to ensure canvas is initialized
        setTimeout(() => window.CanvasStorage.loadDrawing(), 500);
    });
} else {
    window.CanvasStorage.init().then(() => {
        setTimeout(() => window.CanvasStorage.loadDrawing(), 500);
    });
}

