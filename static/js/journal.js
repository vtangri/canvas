// ===== WEEK PROGRESS TRACKER =====
const currentWeek = 14;
const totalWeeks = 14;
const progressFill = document.getElementById('progressFill');
const currentWeekDisplay = document.getElementById('currentWeek');

// Animate progress bar
const animateProgress = () => {
    const percentage = (currentWeek / totalWeeks) * 100;
    setTimeout(() => {
        progressFill.style.width = percentage + '%';
    }, 500);
};

animateProgress();

// ===== SEARCH FUNCTIONALITY =====
const searchInput = document.getElementById('searchInput');
const journalCards = document.querySelectorAll('.journal-card');

searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();

    journalCards.forEach(card => {
        const title = card.querySelector('.journal-title').textContent.toLowerCase();
        const excerpt = card.querySelector('.journal-excerpt').textContent.toLowerCase();
        const tags = Array.from(card.querySelectorAll('.tag'))
            .map(tag => tag.textContent.toLowerCase())
            .join(' ');

        const matchesSearch = title.includes(searchTerm) ||
            excerpt.includes(searchTerm) ||
            tags.includes(searchTerm);

        if (matchesSearch) {
            card.style.display = 'block';
            card.style.animation = 'fadeIn 0.5s ease';
        } else {
            card.style.display = 'none';
        }
    });
});

// ===== SORT FUNCTIONALITY =====
const sortFilter = document.getElementById('sortFilter');
const journalGrid = document.getElementById('journalGrid');

sortFilter.addEventListener('change', (e) => {
    const sortValue = e.target.value;
    const cardsArray = Array.from(journalCards);

    cardsArray.sort((a, b) => {
        const weekA = parseInt(a.querySelector('.badge-week').textContent.match(/\d+/)[0]);
        const weekB = parseInt(b.querySelector('.badge-week').textContent.match(/\d+/)[0]);

        if (sortValue === 'newest') {
            return weekB - weekA;
        } else {
            return weekA - weekB;
        }
    });

    // Clear and re-append sorted cards
    journalGrid.innerHTML = '';
    cardsArray.forEach(card => {
        journalGrid.appendChild(card);
    });

    // Re-animate cards
    cardsArray.forEach((card, index) => {
        card.style.animation = 'none';
        setTimeout(() => {
            card.style.animation = `fadeIn 0.5s ease ${index * 0.05}s both`;
        }, 10);
    });
});

// ===== COLLAPSIBLE JOURNAL EXCERPTS =====
const COLLAPSED_MAX_HEIGHT = 88; // px ~ 4 lines depending on styles

const prepareExcerpt = (card) => {
    const excerpt = card.querySelector('.journal-excerpt');
    if (!excerpt) return;
    excerpt.style.overflow = 'hidden';
    excerpt.style.transition = 'max-height 240ms ease';
    excerpt.style.maxHeight = COLLAPSED_MAX_HEIGHT + 'px';
    excerpt.style.cursor = 'pointer';
    excerpt.setAttribute('title', 'Click to expand/collapse');
    card.dataset.expanded = 'false';
    excerpt.addEventListener('click', () => toggleCard(card));
};

document.querySelectorAll('.journal-card').forEach(prepareExcerpt);

const toggleCard = (card, btn) => {
    const excerpt = card.querySelector('.journal-excerpt');
    if (!excerpt) return;
    const expanded = card.dataset.expanded === 'true';
    if (expanded) {
        excerpt.style.maxHeight = COLLAPSED_MAX_HEIGHT + 'px';
        card.dataset.expanded = 'false';
        if (btn) btn.textContent = 'Read Full Entry →';
    } else {
        // set to full height smoothly
        excerpt.style.maxHeight = excerpt.scrollHeight + 'px';
        card.dataset.expanded = 'true';
        if (btn) btn.textContent = 'Collapse ↑';
    }
    if (btn) {
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            btn.style.transform = 'scale(1)';
        }, 100);
    }
};

const readMoreBtns = document.querySelectorAll('.read-more-btn');

readMoreBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const card = e.target.closest('.journal-card');
        toggleCard(card, btn);
    });
});

// ===== TAG FILTER (Optional Enhancement) =====
const tags = document.querySelectorAll('.tag');

tags.forEach(tag => {
    tag.addEventListener('click', () => {
        const tagText = tag.textContent.toLowerCase();
        searchInput.value = tagText;
        searchInput.dispatchEvent(new Event('input'));

        // Scroll to top of results
        journalGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // Add hover cursor
    tag.style.cursor = 'pointer';
});

// ===== CARD ENTRANCE ANIMATION =====
const observeJournalCards = () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    journalCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });
};

observeJournalCards();

// ===== WEEKLY STATS (Optional) =====
const calculateStats = () => {
    const totalHours = Array.from(journalCards).reduce((total, card) => {
        const hoursText = card.querySelector('.meta-item')?.textContent;
        const hours = parseInt(hoursText?.match(/\d+/)?.[0] || 0);
        return total + hours;
    }, 0);

    console.log(`Total learning hours: ${totalHours}`);
};

calculateStats();

// ===== JOURNAL FORM: VALIDATION, STORAGE, RENDERING =====
// Flask API base URL - works for both local development and PythonAnywhere
const API_BASE_URL = window.location.origin;
const PENDING_STORAGE_KEY = 'pendingReflections';

const loadPendingEntries = () => {
    try {
        const stored = localStorage.getItem(PENDING_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Failed to load pending entries', error);
        return [];
    }
};

const savePendingEntries = (entries) => {
    try {
        localStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
        console.error('Failed to persist pending entries', error);
    }
};

// Fetch entries from Flask API (works offline via cache)
const fetchEntriesFromJSON = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/reflections`, {
            cache: 'no-cache' // Let service worker handle caching
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.reflections || [];
    } catch (error) {
        console.warn('Error fetching entries (may be offline):', error);
        // Try to get from cache if offline
        if (!navigator.onLine) {
            try {
                const cache = await caches.open('learning-journal-api-v4');
                const cachedResponse = await cache.match(`${API_BASE_URL}/reflections`);
                if (cachedResponse) {
                    const cachedData = await cachedResponse.json();
                    return cachedData.reflections || [];
                }
            } catch (cacheError) {
                console.error('Cache fetch failed:', cacheError);
            }
        }
        return [];
    }
};

// Save entry to Flask API
const saveEntryToJSON = async (entry) => {
    try {
        const response = await fetch(`${API_BASE_URL}/add_reflection`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(entry)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error saving entry:', error);
        throw error;
    }
};

// Update entry via Flask API
const updateEntryInJSON = async (entryId, entry) => {
    try {
        const response = await fetch(`${API_BASE_URL}/reflection/${entryId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(entry)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error updating entry:', error);
        throw error;
    }
};

// Delete entry from Flask API
const deleteEntryFromJSON = async (entryId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/reflection/${entryId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error deleting entry:', error);
        throw error;
    }
};

// Update entry counter display
const updateEntryCounter = (count) => {
    const counterEl = document.getElementById('totalEntries');
    if (counterEl) {
        counterEl.textContent = count;
    }
};

// Show success modal
const showSuccessModal = (message) => {
    const modal = document.getElementById('journal-modal');
    const modalMessage = document.getElementById('journal-modal-message');
    const closeBtn = document.getElementById('journal-modal-close');

    if (modal && modalMessage) {
        modalMessage.textContent = message;
        modal.classList.remove('hidden');

        const closeModal = () => {
            modal.classList.add('hidden');
        };

        if (closeBtn) {
            closeBtn.onclick = closeModal;
        }

        modal.querySelector('.modal-overlay')?.addEventListener('click', closeModal);
    }
};


const wordCount = (text) => {
    return (text || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;
};

const createCardFromEntry = (entry) => {
    const article = document.createElement('article');
    article.className = 'journal-card';
    article.dataset.entryId = entry.id;
    article.dataset.pending = entry.pending ? 'true' : 'false';

    const dateLabel = new Date(entry.journalDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    const isPending = Boolean(entry.pending);

    article.innerHTML = `
        <div class="journal-badge">
            <span class="badge-week">Week ${entry.weekOfJournal}</span>
            <span class="badge-date">${dateLabel}</span>
        </div>
        <h2 class="journal-title">${entry.journalName}</h2>
        <div class="journal-tags">
            ${entry.technologies.map(t => `<span class="tag">${t}</span>`).join('')}
        </div>
        <p class="journal-excerpt">
            <strong>${entry.taskName}:</strong> ${entry.taskDescription}
        </p>
        <div class="journal-meta">
            ${isPending
                ? '<span class="meta-item">⏳ Pending sync (offline)</span>'
                : '<span class="meta-item">📝 Added this session</span>'}
        </div>
        <div class="journal-actions" style="display: flex; gap: 0.5rem; margin-top: 1rem;">
            <button class="read-more-btn">Read Full Entry →</button>
            ${isPending ? '' : `
            <button class="edit-entry-btn" data-entry-id="${entry.id}" style="padding: 0.5rem 1rem; background: #6366f1; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.875rem;">✏️ Edit</button>
            <button class="delete-entry-btn" data-entry-id="${entry.id}" style="padding: 0.5rem 1rem; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.875rem;">🗑️ Delete</button>
            `}
        </div>
    `;

    return article;
};

const bindReadMoreButtons = (scope) => {
    scope.querySelectorAll('.journal-card').forEach(prepareExcerpt);
    scope.querySelectorAll('.read-more-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.journal-card');
            toggleCard(card, btn);
        });
    });
};

const renderStoredEntries = async () => {
    const grid = document.getElementById('journalGrid');
    if (!grid) return;

    const renderPendingEntriesFromQueue = (pendingEntries) => {
        if (!pendingEntries.length) return;
        pendingEntries.forEach((entry, index) => {
            const card = createCardFromEntry(entry);
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = `opacity 0.6s ease ${index * 0.05}s, transform 0.6s ease ${index * 0.05}s`;
            grid.prepend(card);
            requestAnimationFrame(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            });
            bindReadMoreButtons(card);
        });
    };

    // Show loading state
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-message';
    loadingDiv.textContent = 'Loading journal entries...';
    loadingDiv.style.textAlign = 'center';
    loadingDiv.style.padding = '2rem';
    loadingDiv.style.color = '#888';
    grid.appendChild(loadingDiv);

    try {
        // Load pending entries from localStorage
        const pendingEntries = loadPendingEntries();
        
        // Fetch entries from API (will use cache if offline)
        const entries = await fetchEntriesFromJSON();

        // Remove loading message
        loadingDiv.remove();

        // Combine entries and pending entries, removing duplicates
        const allEntries = [...entries];
        pendingEntries.forEach(pending => {
            // Only add if not already in entries (avoid duplicates)
            if (!allEntries.find(e => e.id === pending.id)) {
                allEntries.push(pending);
            }
        });

        if (!allEntries.length) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-message';
            emptyDiv.innerHTML = `
                <p style="text-align: center; padding: 2rem; color: #888;">
                    No journal entries yet. Add your first entry below! 📝
                </p>
            `;
            grid.appendChild(emptyDiv);
            return;
        }

        // Sort by timestamp (newest first)
        allEntries.sort((a, b) => {
            const timeA = new Date(a.timestamp || a.journalDate || 0).getTime();
            const timeB = new Date(b.timestamp || b.journalDate || 0).getTime();
            return timeB - timeA;
        });

        // Render all entries
        allEntries.forEach((entry, index) => {
            const card = createCardFromEntry(entry);
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
            grid.appendChild(card);
            requestAnimationFrame(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            });
        });

        bindReadMoreButtons(grid);
        bindEditDeleteButtons(grid);
        updateEntryCounter(allEntries.length);
        
        // Show offline indicator if offline and has pending entries
        if (!navigator.onLine && pendingEntries.length > 0) {
            const offlineIndicator = document.createElement('div');
            offlineIndicator.style.cssText = 'padding: 1rem; margin: 1rem 0; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; color: #ef4444; text-align: center;';
            offlineIndicator.innerHTML = `📡 Offline Mode: ${pendingEntries.length} entry/entries pending sync`;
            grid.insertBefore(offlineIndicator, grid.firstChild);
        }
    } catch (error) {
        // Even if fetch fails, show pending entries
        const pendingEntries = loadPendingEntries();
        
        if (pendingEntries.length > 0 || !navigator.onLine) {
            loadingDiv.remove();
            
            if (pendingEntries.length > 0) {
                pendingEntries.forEach((entry, index) => {
                    const card = createCardFromEntry(entry);
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(30px)';
                    card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
                    grid.appendChild(card);
                    requestAnimationFrame(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    });
                });
                bindReadMoreButtons(grid);
                bindEditDeleteButtons(grid);
                updateEntryCounter(pendingEntries.length);
                
                const offlineMsg = document.createElement('div');
                offlineMsg.style.cssText = 'padding: 1rem; margin: 1rem 0; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; color: #ef4444; text-align: center;';
                offlineMsg.innerHTML = `📡 Offline Mode: Showing cached entries. ${pendingEntries.length} entry/entries pending sync.`;
                grid.insertBefore(offlineMsg, grid.firstChild);
            } else {
                loadingDiv.textContent = 'Offline mode: No cached entries available.';
                loadingDiv.style.color = '#888';
            }
        } else {
            loadingDiv.textContent = 'Error loading entries. Please make sure the API server is running.';
            loadingDiv.style.color = '#dc2626';
        }
        console.error('Failed to render entries:', error);
    }
};

// Bind edit and delete buttons
const bindEditDeleteButtons = (scope) => {
    // Delete buttons
    scope.querySelectorAll('.delete-entry-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const entryId = e.target.dataset.entryId;
            if (!entryId) return;

            if (!confirm('Are you sure you want to delete this entry?')) {
                return;
            }

            try {
                await deleteEntryFromJSON(entryId);
                // Remove the card from DOM
                const card = e.target.closest('.journal-card');
                if (card) {
                    card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    card.style.opacity = '0';
                    card.style.transform = 'translateX(-100px)';
                    setTimeout(() => {
                        card.remove();
                        // Update counter
                        const grid = document.getElementById('journalGrid');
                        const remainingCards = grid.querySelectorAll('.journal-card').length;
                        updateEntryCounter(remainingCards);
                    }, 300);
                }
                showSuccessModal('Entry deleted successfully!');
            } catch (error) {
                alert('Failed to delete entry: ' + error.message);
            }
        });
    });

    // Edit buttons
    scope.querySelectorAll('.edit-entry-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const entryId = e.target.dataset.entryId;
            if (!entryId) return;

            try {
                const entries = await fetchEntriesFromJSON();
                const entry = entries.find(e => e.id === entryId);
                if (!entry) {
                    alert('Entry not found');
                    return;
                }

                // Populate form with entry data
                populateFormForEdit(entry);
                // Scroll to form
                const form = document.getElementById('journalForm');
                if (form) {
                    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            } catch (error) {
                alert('Failed to load entry for editing: ' + error.message);
            }
        });
    });
};

// Populate form for editing
const populateFormForEdit = (entry) => {
    const form = document.getElementById('journalForm');
    if (!form) return;

    // Set form data
    const weekEl = document.getElementById('weekOfJournal');
    const nameEl = document.getElementById('journalName');
    const dateEl = document.getElementById('journalDate');
    const taskNameEl = document.getElementById('taskName');
    const descEl = document.getElementById('taskDescription');
    const techGroup = document.getElementById('technologies');

    if (weekEl) weekEl.value = entry.weekOfJournal;
    if (nameEl) nameEl.value = entry.journalName;
    if (dateEl) dateEl.value = entry.journalDate;
    if (taskNameEl) taskNameEl.value = entry.taskName;
    if (descEl) descEl.value = entry.taskDescription;

    // Set technologies checkboxes
    if (techGroup) {
        techGroup.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = entry.technologies.includes(checkbox.value);
        });
    }

    // Store entry ID for update
    form.dataset.editingEntryId = entry.id;

    // Change submit button text
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.textContent = 'Update Entry';
        submitBtn.dataset.isEditing = 'true';
    }
};

const syncPendingEntries = async () => {
    if (!navigator.onLine) {
        console.log('Cannot sync: offline');
        return;
    }
    
    const pendingEntries = loadPendingEntries();
    if (!pendingEntries.length) {
        console.log('No pending entries to sync');
        return;
    }

    const grid = document.getElementById('journalGrid');
    if (!grid) return;

    // Show notification that sync started
    const showNotification = async (title, body) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                const notification = new Notification(title, {
                    body: body,
                    icon: '/img/icon-192x192.png',
                    tag: 'sync-status',
                    requireInteraction: false
                });
                setTimeout(() => notification.close(), 5000);
            } catch (error) {
                console.error('Error showing notification:', error);
            }
        }
    };

    await showNotification('Syncing Entries', `Syncing ${pendingEntries.length} offline entry/entries...`);

    const remaining = [];
    let successCount = 0;
    
    for (const entry of pendingEntries) {
        try {
            const result = await saveEntryToJSON(entry);
            const reflection = result.reflection || result;
            const newCard = createCardFromEntry(reflection);
            const existingCard = grid.querySelector(`[data-entry-id="${entry.id}"]`);
            if (existingCard) {
                existingCard.replaceWith(newCard);
            } else {
                grid.prepend(newCard);
            }
            bindReadMoreButtons(newCard);
            bindEditDeleteButtons(grid);
            successCount++;
        } catch (error) {
            console.error('Failed to sync entry', entry.id, error);
            remaining.push(entry);
        }
    }
    
    savePendingEntries(remaining);
    updateEntryCounter(grid.querySelectorAll('.journal-card').length);

    if (!remaining.length) {
        showSuccessModal('All offline entries were synced successfully!');
        await showNotification('Sync Complete', `Successfully synced ${successCount} entry/entries!`);
    } else {
        await showNotification('Sync Partial', `Synced ${successCount} entries. ${remaining.length} failed and will retry later.`);
    }
};

// Expose for connectivity listeners
window.syncPendingEntries = syncPendingEntries;
window.loadPendingEntries = loadPendingEntries;

const bindJournalForm = () => {
    const form = document.getElementById('journalForm');
    if (!form) return;

    const weekEl = document.getElementById('weekOfJournal');
    const nameEl = document.getElementById('journalName');
    const dateEl = document.getElementById('journalDate');
    const taskNameEl = document.getElementById('taskName');
    const descEl = document.getElementById('taskDescription');
    const techGroup = document.getElementById('technologies');
    const errorEl = document.getElementById('formError');
    const successEl = document.getElementById('formSuccess');

    const showError = (msg) => {
        if (errorEl) {
            errorEl.textContent = msg;
            errorEl.style.display = 'block';
        }
        if (successEl) successEl.style.display = 'none';
    };

    const showSuccess = (msg) => {
        if (successEl) {
            successEl.textContent = msg;
            successEl.style.display = 'block';
        }
        if (errorEl) errorEl.style.display = 'none';
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const weekOfJournal = parseInt(weekEl.value, 10);
        const journalName = nameEl.value.trim();
        const journalDate = dateEl.value;
        const taskName = taskNameEl.value.trim();
        const taskDescription = descEl.value.trim();
        const technologies = Array.from(techGroup.querySelectorAll('input[type="checkbox"]:checked')).map(i => i.value);

        // Validation rules
        if (!Number.isFinite(weekOfJournal) || weekOfJournal < 1) {
            return showError('Please enter a valid Week number (1 or higher).');
        }
        if (!journalName) {
            return showError('Please provide your Journal Name.');
        }
        if (!journalDate) {
            return showError('Please select a Journal Date.');
        }
        if (!taskName) {
            return showError('Please enter a Journal Task Name.');
        }
        if (wordCount(taskDescription) < 10) {
            return showError('Description must contain at least 10 words.');
        }
        if (technologies.length === 0) {
            return showError('Select at least one technology used.');
        }

        const entryData = { weekOfJournal, journalName, journalDate, taskName, taskDescription, technologies };

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        const isEditing = form.dataset.editingEntryId;

        // Offline handling: queue new entries for sync
        if (!navigator.onLine) {
            if (isEditing) {
                return showError('You are offline. Reconnect to update an existing entry.');
            }

            const pendingEntry = {
                ...entryData,
                id: `pending-${Date.now()}`,
                pending: true,
                timestamp: new Date().toISOString()
            };

            const pendingEntries = loadPendingEntries();
            pendingEntries.push(pendingEntry);
            savePendingEntries(pendingEntries);

            const grid = document.getElementById('journalGrid');
            if (grid) {
                const card = createCardFromEntry(pendingEntry);
                card.style.opacity = '0';
                card.style.transform = 'translateY(30px)';
                card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                grid.prepend(card);
                requestAnimationFrame(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                });
                bindReadMoreButtons(card);
                updateEntryCounter(grid.querySelectorAll('.journal-card').length);
            }

            showSuccess('Saved offline. We will sync this entry when you are back online.');
            showSuccessModal('Entry saved offline. It will sync automatically once you reconnect.');
            
            // Show notification
            if ('Notification' in window && Notification.permission === 'granted') {
                try {
                    const notification = new Notification('Entry Saved Offline', {
                        body: 'Your entry has been saved offline and will sync automatically when you reconnect.',
                        icon: '/img/icon-192x192.png',
                        tag: 'entry-saved-offline',
                        requireInteraction: false
                    });
                    setTimeout(() => notification.close(), 5000);
                } catch (error) {
                    console.error('Error showing notification:', error);
                }
            }
            
            form.reset();
            submitBtn.textContent = originalBtnText;
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = isEditing ? 'Updating...' : 'Saving...';

        try {
            const grid = document.getElementById('journalGrid');
            let result;

            if (isEditing) {
                // Update existing entry
                result = await updateEntryInJSON(isEditing, entryData);
                
                // Find and update the card in the grid
                const existingCard = grid.querySelector(`[data-entry-id="${isEditing}"]`);
                if (existingCard) {
                    const updatedCard = createCardFromEntry(result.reflection);
                    existingCard.replaceWith(updatedCard);
                    bindReadMoreButtons(updatedCard);
                    bindEditDeleteButtons(updatedCard.parentElement);
                }

                showSuccess('✅ Journal entry updated successfully!');
                showSuccessModal('Your journal entry has been updated successfully');
            } else {
                // Create new entry
                result = await saveEntryToJSON(entryData);

                // Remove empty message if it exists
                const emptyMsg = grid.querySelector('.empty-message');
                if (emptyMsg) emptyMsg.remove();

                // Handle both 'reflection' and 'entry' response formats for compatibility
                const entry = result.reflection || result.entry;
                const card = createCardFromEntry(entry);
                card.style.opacity = '0';
                card.style.transform = 'translateY(30px)';
                card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';

                // Prepend to show newest first (at the top)
                grid.prepend(card);

                requestAnimationFrame(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                });
                bindReadMoreButtons(card);
                bindEditDeleteButtons(card.parentElement);

                // Update counter
                updateEntryCounter(result.totalReflections || result.totalEntries || 0);

                showSuccess('✅ Journal entry saved successfully!');
                showSuccessModal('Your journal entry has been saved successfully');
            }

            // Reset form
            form.reset();
            delete form.dataset.editingEntryId;
            if (submitBtn) {
                submitBtn.textContent = 'Submit Journal Entry';
                delete submitBtn.dataset.isEditing;
            }
        } catch (error) {
            showError(`Failed to ${isEditing ? 'update' : 'save'} entry: ${error.message}. Make sure the Flask server is running.`);
        } finally {
            // Reset button
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    });
};

// ===== EXPORT FUNCTIONALITY =====
const bindExportButton = () => {
    const exportBtn = document.getElementById('exportBtn');
    if (!exportBtn) return;

    exportBtn.addEventListener('click', async () => {
        try {
            const entries = await fetchEntriesFromJSON();

            if (entries.length === 0) {
                alert('No entries to export!');
                return;
            }

            // Create downloadable JSON file
            const dataStr = JSON.stringify(entries, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);

            // Create download link
            const link = document.createElement('a');
            link.href = url;
            const timestamp = new Date().toISOString().split('T')[0];
            link.download = `journal-entries-${timestamp}.json`;

            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up
            URL.revokeObjectURL(url);

            showSuccessModal(`Successfully exported ${entries.length} journal entries!`);
        } catch (error) {
            alert('Failed to export entries: ' + error.message);
        }
    });
};

// ===== DATE FILTER FUNCTIONALITY =====
let allEntries = []; // Store all entries for filtering

const bindDateFilter = () => {
    const applyBtn = document.getElementById('applyDateFilter');
    const clearBtn = document.getElementById('clearFilters');
    const startDateInput = document.getElementById('filterStartDate');
    const endDateInput = document.getElementById('filterEndDate');

    if (!applyBtn || !clearBtn) return;

    applyBtn.addEventListener('click', () => {
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;

        if (!startDate && !endDate) {
            alert('Please select at least one date to filter');
            return;
        }

        const grid = document.getElementById('journalGrid');
        const cards = Array.from(grid.querySelectorAll('.journal-card'));

        cards.forEach(card => {
            const dateEl = card.querySelector('.badge-date');
            if (!dateEl) return;

            const cardDateText = dateEl.textContent.trim();
            const cardDate = new Date(cardDateText);

            let show = true;

            if (startDate) {
                const start = new Date(startDate);
                if (cardDate < start) show = false;
            }

            if (endDate) {
                const end = new Date(endDate);
                if (cardDate > end) show = false;
            }

            card.style.display = show ? 'block' : 'none';
        });
    });

    clearBtn.addEventListener('click', () => {
        startDateInput.value = '';
        endDateInput.value = '';

        const grid = document.getElementById('journalGrid');
        const cards = Array.from(grid.querySelectorAll('.journal-card'));

        cards.forEach(card => {
            card.style.display = 'block';
        });

        // Also clear search
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
        }
    });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        renderStoredEntries();
        bindJournalForm();
        bindExportButton();
        bindDateFilter();
        syncPendingEntries();
    });
} else {
    renderStoredEntries();
    bindJournalForm();
    bindExportButton();
    bindDateFilter();
    syncPendingEntries();
}

// Attempt to sync queued entries whenever connection returns
window.addEventListener('online', syncPendingEntries);