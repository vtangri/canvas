/**
 * Canvas Toolbar Module
 * Handles the top toolbar for quick access to tools while drawing
 */

window.CanvasToolbar = {
    /**
     * Initialize toolbar
     */
    init() {
        this.setupToolButtons();
        this.setupColorPicker();
        this.setupBrushSize();
        this.setupActionButtons();
        this.setupFiltersDropdown();
        this.syncWithSidebar();
    },

    /**
     * Setup tool buttons
     */
    setupToolButtons() {
        const toolbarButtons = document.querySelectorAll('.toolbar-btn[data-tool]');
        toolbarButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const tool = btn.dataset.tool;
                console.log('Toolbar tool clicked:', tool);
                this.selectTool(tool);
            });
        });
    },

    /**
     * Select a tool
     */
    selectTool(tool) {
        // Update toolbar buttons
        document.querySelectorAll('.toolbar-btn[data-tool]').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tool === tool) {
                btn.classList.add('active');
            }
        });

        // Update sidebar buttons
        document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tool === tool) {
                btn.classList.add('active');
            }
        });

        // Update canvas tools
        if (window.CanvasTools) {
            window.CanvasTools.selectTool(tool);
        }
    },

    /**
     * Setup color picker
     * Now handled by CanvasColor module for centralized management
     */
    setupColorPicker() {
        // Color picker functionality is now handled by CanvasColor module
        // This ensures consistent color updates across all components
        if (window.CanvasColor && window.CanvasColor.initialized) {
            console.log('Toolbar color picker setup delegated to CanvasColor module');
        } else {
            // Fallback: wait for CanvasColor module
            setTimeout(() => {
                if (window.CanvasColor) {
                    window.CanvasColor.init();
                }
            }, 100);
        }
    },

    /**
     * Setup brush size slider
     */
    setupBrushSize() {
        const toolbarSlider = document.getElementById('toolbarBrushSize');
        const toolbarValue = document.getElementById('toolbarBrushSizeValue');
        const sidebarSlider = document.getElementById('brushSize');
        const sidebarValue = document.getElementById('brushSizeValue');

        if (toolbarSlider && toolbarValue) {
            toolbarSlider.addEventListener('input', (e) => {
                const size = parseInt(e.target.value);
                toolbarValue.textContent = size;
                
                // Sync with sidebar
                if (sidebarSlider) {
                    sidebarSlider.value = size;
                }
                if (sidebarValue) {
                    sidebarValue.textContent = size;
                }
                
                // Update canvas
                if (window.CanvasDrawing) {
                    window.CanvasDrawing.setBrushSize(size);
                }
            });
        }

        // Sync from sidebar to toolbar
        if (sidebarSlider) {
            sidebarSlider.addEventListener('input', (e) => {
                if (toolbarSlider) {
                    toolbarSlider.value = e.target.value;
                }
                if (toolbarValue) {
                    toolbarValue.textContent = e.target.value;
                }
            });
        }
    },

    /**
     * Setup action buttons
     */
    setupActionButtons() {
        const undoBtn = document.getElementById('toolbarUndoBtn');
        const redoBtn = document.getElementById('toolbarRedoBtn');
        const clearBtn = document.getElementById('toolbarClearBtn');
        const saveBtn = document.getElementById('toolbarSaveBtn');
        const exportBtn = document.getElementById('toolbarExportBtn');

        if (undoBtn) {
            undoBtn.addEventListener('click', () => {
                if (window.CanvasTools && window.CanvasTools.undo) {
                    window.CanvasTools.undo();
                }
            });
        }

        if (redoBtn) {
            redoBtn.addEventListener('click', () => {
                if (window.CanvasTools && window.CanvasTools.redo) {
                    window.CanvasTools.redo();
                }
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear the canvas?')) {
                    if (window.CanvasTools && window.CanvasTools.clearCanvas) {
                        window.CanvasTools.clearCanvas();
                    }
                }
            });
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                if (window.CanvasHistory && window.CanvasHistory.saveCurrentDrawing) {
                    window.CanvasHistory.saveCurrentDrawing();
                }
            });
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                if (window.CanvasHistory && window.CanvasHistory.exportAsPNG) {
                    window.CanvasHistory.exportAsPNG();
                }
            });
        }
    },

    /**
     * Setup filters buttons
     */
    setupFiltersDropdown() {
        // Setup toolbar filter buttons
        const toolbarFilterButtons = document.querySelectorAll('.toolbar-filters .filter-btn');
        toolbarFilterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                if (window.CanvasFilters && window.CanvasFilters.applyFilter) {
                    window.CanvasFilters.applyFilter(filter);
                }
                
                // Visual feedback
                btn.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    btn.style.transform = 'scale(1)';
                }, 150);
            });
        });

        // Also sync with sidebar filter buttons
        const sidebarFilterButtons = document.querySelectorAll('.filter-btn[data-filter]');
        sidebarFilterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                // Visual feedback on toolbar button
                const toolbarBtn = document.querySelector(`.toolbar-filters .filter-btn[data-filter="${filter}"]`);
                if (toolbarBtn) {
                    toolbarBtn.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        toolbarBtn.style.transform = 'scale(1)';
                    }, 150);
                }
            });
        });
    },

    /**
     * Sync toolbar state with sidebar
     */
    syncWithSidebar() {
        // Sync tool selection from sidebar to toolbar
        document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
            btn.addEventListener('click', () => {
                const tool = btn.dataset.tool;
                document.querySelectorAll('.toolbar-btn[data-tool]').forEach(tb => {
                    tb.classList.remove('active');
                    if (tb.dataset.tool === tool) {
                        tb.classList.add('active');
                    }
                });
            });
        });

        // Sync color from sidebar presets
        document.querySelectorAll('.color-preset').forEach(preset => {
            preset.addEventListener('click', () => {
                const color = preset.dataset.color;
                const toolbarColorPicker = document.getElementById('toolbarColorPicker');
                const toolbarColorDisplay = document.getElementById('toolbarColorDisplay');
                
                if (toolbarColorPicker) {
                    toolbarColorPicker.value = color;
                }
                if (toolbarColorDisplay) {
                    toolbarColorDisplay.style.background = color;
                }
            });
        });

        // Sync undo/redo button states
        const updateButtonStates = () => {
            const undoBtn = document.getElementById('toolbarUndoBtn');
            const redoBtn = document.getElementById('toolbarRedoBtn');
            const sidebarUndoBtn = document.getElementById('undoBtn');
            const sidebarRedoBtn = document.getElementById('redoBtn');
            
            if (window.CanvasTools) {
                const canUndo = window.CanvasTools.undoStack && window.CanvasTools.undoStack.length > 1;
                const canRedo = window.CanvasTools.redoStack && window.CanvasTools.redoStack.length > 0;
                
                if (undoBtn) {
                    undoBtn.disabled = !canUndo;
                    undoBtn.style.opacity = canUndo ? '1' : '0.5';
                }
                
                if (redoBtn) {
                    redoBtn.disabled = !canRedo;
                    redoBtn.style.opacity = canRedo ? '1' : '0.5';
                }

                // Sync sidebar buttons too
                if (sidebarUndoBtn) {
                    sidebarUndoBtn.disabled = !canUndo;
                    sidebarUndoBtn.style.opacity = canUndo ? '1' : '0.5';
                }
                
                if (sidebarRedoBtn) {
                    sidebarRedoBtn.disabled = !canRedo;
                    sidebarRedoBtn.style.opacity = canRedo ? '1' : '0.5';
                }
            }
        };

        // Update periodically
        setInterval(updateButtonStates, 500);
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.CanvasToolbar.init());
} else {
    window.CanvasToolbar.init();
}

