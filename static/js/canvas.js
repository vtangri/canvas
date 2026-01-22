/**
 * Main Canvas Module
 * Coordinates all canvas modules and handles UI interactions
 */

const CanvasApp = {
    /**
     * Initialize the canvas application
     */
    init() {
        // Wait for all modules to be ready
        setTimeout(() => {
            this.setupColorPicker();
            this.setupBrushSize();
            this.setupReflection();
            this.setupKeyboardShortcuts();
        }, 100);
    },

    /**
     * Setup color picker and presets
     * Now handled by CanvasColor module for centralized management
     */
    setupColorPicker() {
        // Color picker functionality is now handled by CanvasColor module
        // This ensures consistent color updates across all components
        if (window.CanvasColor && window.CanvasColor.initialized) {
            console.log('Color picker setup delegated to CanvasColor module');
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
        const brushSizeSlider = document.getElementById('brushSize');
        const brushSizeValue = document.getElementById('brushSizeValue');

        if (brushSizeSlider && brushSizeValue) {
            brushSizeSlider.addEventListener('input', (e) => {
                const size = parseInt(e.target.value);
                brushSizeValue.textContent = size;
                
                if (window.CanvasDrawing) {
                    window.CanvasDrawing.setBrushSize(size);
                }
            });
        }
    },

    /**
     * Setup reflection textarea with autosave
     */
    setupReflection() {
        const reflectionTextarea = document.getElementById('reflectionText');
        const reflectionTimestamp = document.getElementById('reflectionTimestamp');

        if (!reflectionTextarea) return;

        let saveTimer = null;

        // Autosave reflection text
        reflectionTextarea.addEventListener('input', () => {
            // Clear existing timer
            if (saveTimer) {
                clearTimeout(saveTimer);
            }

            // Update timestamp
            if (reflectionTimestamp) {
                reflectionTimestamp.textContent = 'Typing...';
            }

            // Save after 1 second of inactivity
            saveTimer = setTimeout(async () => {
                const text = reflectionTextarea.value;
                if (window.CanvasStorage && window.CanvasStorage.saveReflection) {
                    await window.CanvasStorage.saveReflection(text);
                }
                
                if (reflectionTimestamp) {
                    reflectionTimestamp.textContent = `Last saved: ${new Date().toLocaleString()}`;
                }
            }, 1000);
        });

        // Update timestamp on focus
        reflectionTextarea.addEventListener('focus', () => {
            if (reflectionTimestamp) {
                const saved = localStorage.getItem('canvasDrawing');
                if (saved) {
                    try {
                        const data = JSON.parse(saved);
                        if (data.timestamp) {
                            reflectionTimestamp.textContent = `Last saved: ${new Date(data.timestamp).toLocaleString()}`;
                        }
                    } catch (e) {
                        // Ignore
                    }
                }
            }
        });
    },

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Z for undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                if (window.CanvasTools && window.CanvasTools.undo) {
                    window.CanvasTools.undo();
                }
            }

            // Ctrl/Cmd + Shift + Z for redo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
                e.preventDefault();
                if (window.CanvasTools && window.CanvasTools.redo) {
                    window.CanvasTools.redo();
                }
            }

            // Delete key for clear (when not typing)
            if (e.key === 'Delete' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                if (window.CanvasTools && window.CanvasTools.clearCanvas) {
                    if (confirm('Clear the canvas?')) {
                        window.CanvasTools.clearCanvas();
                    }
                }
            }

            // Number keys for tool selection
            if (e.key >= '1' && e.key <= '4' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                const tools = ['brush', 'line', 'rectangle', 'circle'];
                const toolIndex = parseInt(e.key) - 1;
                if (tools[toolIndex] && window.CanvasTools) {
                    window.CanvasTools.selectTool(tools[toolIndex]);
                }
                if (window.CanvasToolbar && window.CanvasToolbar.selectTool) {
                    window.CanvasToolbar.selectTool(tools[toolIndex]);
                }
            }

            // Letter keys for tool selection (B=Brush, L=Line, R=Rectangle, C=Circle)
            if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                const toolMap = {
                    'b': 'brush',
                    'l': 'line',
                    'r': 'rectangle',
                    'c': 'circle'
                };
                const tool = toolMap[e.key.toLowerCase()];
                if (tool && window.CanvasTools) {
                    e.preventDefault();
                    window.CanvasTools.selectTool(tool);
                    if (window.CanvasToolbar && window.CanvasToolbar.selectTool) {
                        window.CanvasToolbar.selectTool(tool);
                    }
                }
            }
        });
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => CanvasApp.init());
} else {
    CanvasApp.init();
}

// Add smooth animations on page load
window.addEventListener('load', () => {
    const canvasContainer = document.querySelector('.canvas-container');
    if (canvasContainer) {
        canvasContainer.style.opacity = '0';
        canvasContainer.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            canvasContainer.style.opacity = '1';
        }, 200);
    }

    const toolsPanel = document.querySelector('.tools-panel');
    const reflectionPanel = document.querySelector('.reflection-panel');
    
    [toolsPanel, reflectionPanel].forEach(panel => {
        if (panel) {
            panel.style.opacity = '0';
            panel.style.transform = 'translateY(20px)';
            panel.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            setTimeout(() => {
                panel.style.opacity = '1';
                panel.style.transform = 'translateY(0)';
            }, 300);
        }
    });
});

