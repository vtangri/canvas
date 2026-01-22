/**
 * Storage API Implementation
 * Handles LocalStorage/SessionStorage/IndexedDB for journal entries and theme preference
 */

// Storage keys
const STORAGE_KEYS = {
    ENTRIES: 'journal_entries',
    THEME: 'theme_preference',
    USE_INDEXEDDB: 'use_indexeddb'
};

// Storage configuration
const STORAGE_CONFIG = {
    useIndexedDB: false, // Set to true to use IndexedDB instead of LocalStorage
    dbName: 'LearningJournalDB',
    dbVersion: 1,
    storeName: 'journalEntries'
};

/**
 * LocalStorage Implementation
 */
const LocalStorageAPI = {
    /**
     * Save journal entries to LocalStorage
     * @param {Array} entries - Array of journal entries
     */
    saveEntries(entries) {
        try {
            localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
            return true;
        } catch (error) {
            console.error('Error saving entries to LocalStorage:', error);
            return false;
        }
    },

    /**
     * Retrieve journal entries from LocalStorage
     * @returns {Array} Array of journal entries
     */
    getEntries() {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.ENTRIES);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error retrieving entries from LocalStorage:', error);
            return [];
        }
    },

    /**
     * Save theme preference to LocalStorage
     * @param {string} theme - 'light' or 'dark'
     */
    saveTheme(theme) {
        try {
            localStorage.setItem(STORAGE_KEYS.THEME, theme);
            return true;
        } catch (error) {
            console.error('Error saving theme to LocalStorage:', error);
            return false;
        }
    },

    /**
     * Get theme preference from LocalStorage
     * @returns {string} 'light' or 'dark'
     */
    getTheme() {
        try {
            return localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
        } catch (error) {
            console.error('Error retrieving theme from LocalStorage:', error);
            return 'dark';
        }
    },

    /**
     * Clear all journal entries
     */
    clearEntries() {
        try {
            localStorage.removeItem(STORAGE_KEYS.ENTRIES);
            return true;
        } catch (error) {
            console.error('Error clearing entries from LocalStorage:', error);
            return false;
        }
    }
};

/**
 * IndexedDB Implementation (Optional - for larger datasets)
 */
const IndexedDBAPI = {
    db: null,

    /**
     * Initialize IndexedDB
     * @returns {Promise<IDBDatabase>}
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(STORAGE_CONFIG.dbName, STORAGE_CONFIG.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORAGE_CONFIG.storeName)) {
                    const objectStore = db.createObjectStore(STORAGE_CONFIG.storeName, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    objectStore.createIndex('date', 'date', { unique: false });
                    objectStore.createIndex('title', 'title', { unique: false });
                }
            };
        });
    },

    /**
     * Save journal entries to IndexedDB
     * @param {Array} entries - Array of journal entries
     */
    async saveEntries(entries) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORAGE_CONFIG.storeName], 'readwrite');
            const store = transaction.objectStore(STORAGE_CONFIG.storeName);
            const clearRequest = store.clear();

            clearRequest.onsuccess = () => {
                const requests = entries.map(entry => store.add(entry));
                Promise.all(requests.map(req => new Promise((res, rej) => {
                    req.onsuccess = () => res();
                    req.onerror = () => rej(req.error);
                }))).then(() => resolve(true)).catch(reject);
            };

            clearRequest.onerror = () => reject(clearRequest.error);
        });
    },

    /**
     * Retrieve journal entries from IndexedDB
     * @returns {Promise<Array>} Array of journal entries
     */
    async getEntries() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORAGE_CONFIG.storeName], 'readonly');
            const store = transaction.objectStore(STORAGE_CONFIG.storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }
};

/**
 * Main Storage API - Abstracts LocalStorage and IndexedDB
 */
const StorageAPI = {
    /**
     * Save journal entry
     * @param {Object} entry - Journal entry object
     */
    async saveEntry(entry) {
        const entries = await this.getEntries();
        const newEntry = {
            id: entry.id || Date.now(),
            title: entry.title,
            content: entry.content,
            date: entry.date || new Date().toISOString().split('T')[0],
            timestamp: entry.timestamp || Date.now()
        };
        entries.unshift(newEntry); // Add to beginning
        return await this.saveEntries(entries);
    },

    /**
     * Save all journal entries
     * @param {Array} entries - Array of journal entries
     */
    async saveEntries(entries) {
        if (STORAGE_CONFIG.useIndexedDB && 'indexedDB' in window) {
            try {
                await IndexedDBAPI.saveEntries(entries);
                return true;
            } catch (error) {
                console.error('IndexedDB save failed, falling back to LocalStorage:', error);
                return LocalStorageAPI.saveEntries(entries);
            }
        }
        return LocalStorageAPI.saveEntries(entries);
    },

    /**
     * Get all journal entries
     * @returns {Promise<Array>} Array of journal entries
     */
    async getEntries() {
        if (STORAGE_CONFIG.useIndexedDB && 'indexedDB' in window) {
            try {
                return await IndexedDBAPI.getEntries();
            } catch (error) {
                console.error('IndexedDB get failed, falling back to LocalStorage:', error);
                return LocalStorageAPI.getEntries();
            }
        }
        return Promise.resolve(LocalStorageAPI.getEntries());
    },

    /**
     * Delete journal entry by ID
     * @param {string|number} id - Entry ID
     */
    async deleteEntry(id) {
        const entries = await this.getEntries();
        const filtered = entries.filter(entry => entry.id !== id);
        return await this.saveEntries(filtered);
    },

    /**
     * Save theme preference
     * @param {string} theme - 'light' or 'dark'
     */
    saveTheme(theme) {
        return LocalStorageAPI.saveTheme(theme);
    },

    /**
     * Get theme preference
     * @returns {string} 'light' or 'dark'
     */
    getTheme() {
        return LocalStorageAPI.getTheme();
    },

    /**
     * Clear all entries
     */
    async clearEntries() {
        if (STORAGE_CONFIG.useIndexedDB && 'indexedDB' in window) {
            try {
                if (!IndexedDBAPI.db) await IndexedDBAPI.init();
                const transaction = IndexedDBAPI.db.transaction([STORAGE_CONFIG.storeName], 'readwrite');
                const store = transaction.objectStore(STORAGE_CONFIG.storeName);
                await store.clear();
                return true;
            } catch (error) {
                console.error('IndexedDB clear failed, falling back to LocalStorage:', error);
                return LocalStorageAPI.clearEntries();
            }
        }
        return LocalStorageAPI.clearEntries();
    }
};

// Export for use in other scripts
window.StorageAPI = StorageAPI;

