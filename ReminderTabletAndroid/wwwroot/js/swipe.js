// Touch/Swipe gesture detection for ReminderApp
window.SwipeHandler = {
    isInitialized: false,
    activeElements: new Map(),
    
    initialize: function(elementId, dotNetObjectRef) {
        console.log(`👆 Initializing SwipeHandler for: ${elementId}`);
        
        const element = document.getElementById(elementId);
        if (!element) {
            console.error(`❌ Element not found: ${elementId}`);
            return false;
        }
        
        if (this.activeElements.has(elementId)) {
            console.log(`✅ SwipeHandler already active for: ${elementId}`);
            return true;
        }
        
        const swipeConfig = {
            element: element,
            dotNetRef: dotNetObjectRef,
            startX: 0,
            startY: 0,
            endX: 0,
            endY: 0,
            minSwipeDistance: 50,
            maxVerticalDistance: 100
        };
        
        // Touch events
        element.addEventListener('touchstart', (e) => this.handleTouchStart(e, swipeConfig), { passive: true });
        element.addEventListener('touchmove', (e) => this.handleTouchMove(e, swipeConfig), { passive: true });
        element.addEventListener('touchend', (e) => this.handleTouchEnd(e, swipeConfig), { passive: true });
        
        // Mouse events for desktop testing
        element.addEventListener('mousedown', (e) => this.handleMouseStart(e, swipeConfig));
        element.addEventListener('mousemove', (e) => this.handleMouseMove(e, swipeConfig));
        element.addEventListener('mouseup', (e) => this.handleMouseEnd(e, swipeConfig));
        element.addEventListener('mouseleave', (e) => this.handleMouseEnd(e, swipeConfig));
        
        this.activeElements.set(elementId, swipeConfig);
        this.isInitialized = true;
        
        console.log(`✅ SwipeHandler initialized for: ${elementId}`);
        return true;
    },
    
    handleTouchStart: function(e, config) {
        if (e.touches.length === 1) {
            config.startX = e.touches[0].clientX;
            config.startY = e.touches[0].clientY;
            config.isTracking = true;
        }
    },
    
    handleTouchMove: function(e, config) {
        if (config.isTracking && e.touches.length === 1) {
            config.endX = e.touches[0].clientX;
            config.endY = e.touches[0].clientY;
        }
    },
    
    handleTouchEnd: function(e, config) {
        if (config.isTracking) {
            this.processSwipe(config);
            config.isTracking = false;
        }
    },
    
    handleMouseStart: function(e, config) {
        config.startX = e.clientX;
        config.startY = e.clientY;
        config.isTracking = true;
        config.element.style.cursor = 'grabbing';
    },
    
    handleMouseMove: function(e, config) {
        if (config.isTracking) {
            config.endX = e.clientX;
            config.endY = e.clientY;
        }
    },
    
    handleMouseEnd: function(e, config) {
        if (config.isTracking) {
            this.processSwipe(config);
            config.isTracking = false;
            config.element.style.cursor = '';
        }
    },
    
    processSwipe: function(config) {
        const deltaX = config.endX - config.startX;
        const deltaY = config.endY - config.startY;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);
        
        // Check if it's a valid swipe
        if (absDeltaX < config.minSwipeDistance) {
            return; // Not enough horizontal movement
        }
        
        if (absDeltaY > config.maxVerticalDistance) {
            return; // Too much vertical movement
        }
        
        // Determine swipe direction
        const direction = deltaX > 0 ? 'right' : 'left';
        
        console.log(`👆 Swipe detected: ${direction} (${deltaX}px)`);
        
        // Call back to .NET
        try {
            config.dotNetRef.invokeMethodAsync('HandleSwipe', direction);
        } catch (error) {
            console.error('❌ Error calling .NET swipe handler:', error);
        }
    },
    
    cleanup: function(elementId) {
        console.log(`🗑️ Disposing SwipeHandler for: ${elementId}`);
        
        const config = this.activeElements.get(elementId);
        if (config) {
            // Remove event listeners would require storing references
            // For now, just remove from active elements
            this.activeElements.delete(elementId);
        }
    },
    
    // Utility method for keyboard navigation
    handleKeyboard: function(elementId, dotNetObjectRef) {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                console.log('⌨️ Keyboard: Left arrow');
                dotNetObjectRef.invokeMethodAsync('HandleSwipe', 'left');
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                console.log('⌨️ Keyboard: Right arrow');
                dotNetObjectRef.invokeMethodAsync('HandleSwipe', 'right');
            }
        });
    }
};

// Global CSS for visual feedback
const style = document.createElement('style');
style.textContent = `
    .swipe-container {
        touch-action: pan-y pinch-zoom;
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
    }
    
    .swipe-container:active {
        cursor: grabbing !important;
    }
`;
document.head.appendChild(style);