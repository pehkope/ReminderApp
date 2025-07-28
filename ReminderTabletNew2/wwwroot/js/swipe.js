// Touch/Swipe gesture detection for ReminderApp
window.SwipeHandler = {
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    minSwipeDistance: 50,
    maxVerticalDistance: 100,
    
    // Initialize swipe detection on an element
    initialize: function(elementId, dotNetHelper) {
        const element = document.getElementById(elementId) || document.body;
        
        // Store the dotNet helper reference
        element.dotNetHelper = dotNetHelper;
        
        // Touch events for mobile
        element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        
        // Mouse events for desktop testing
        element.addEventListener('mousedown', this.handleMouseDown.bind(this), { passive: false });
        element.addEventListener('mouseup', this.handleMouseUp.bind(this), { passive: false });
        
        console.log('Swipe handler initialized for element:', elementId);
    },
    
    // Remove swipe detection
    cleanup: function(elementId) {
        const element = document.getElementById(elementId) || document.body;
        
        element.removeEventListener('touchstart', this.handleTouchStart);
        element.removeEventListener('touchend', this.handleTouchEnd);
        element.removeEventListener('mousedown', this.handleMouseDown);
        element.removeEventListener('mouseup', this.handleMouseUp);
        
        element.dotNetHelper = null;
    },
    
    handleTouchStart: function(event) {
        this.startX = event.touches[0].clientX;
        this.startY = event.touches[0].clientY;
    },
    
    handleTouchEnd: function(event) {
        this.endX = event.changedTouches[0].clientX;
        this.endY = event.changedTouches[0].clientY;
        this.processSwipe(event.target);
    },
    
    handleMouseDown: function(event) {
        this.startX = event.clientX;
        this.startY = event.clientY;
        event.target.mousePressed = true;
    },
    
    handleMouseUp: function(event) {
        if (!event.target.mousePressed) return;
        
        this.endX = event.clientX;
        this.endY = event.clientY;
        event.target.mousePressed = false;
        this.processSwipe(event.target);
    },
    
    processSwipe: function(element) {
        const deltaX = this.endX - this.startX;
        const deltaY = this.endY - this.startY;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);
        
        // Check if it's a valid horizontal swipe
        if (absDeltaX >= this.minSwipeDistance && absDeltaY <= this.maxVerticalDistance) {
            const direction = deltaX > 0 ? 'right' : 'left';
            
            console.log(`Swipe detected: ${direction}, deltaX: ${deltaX}, deltaY: ${deltaY}`);
            
            // Find the element with dotNetHelper (might be parent)
            let targetElement = element;
            while (targetElement && !targetElement.dotNetHelper) {
                targetElement = targetElement.parentElement;
            }
            
            if (targetElement && targetElement.dotNetHelper) {
                targetElement.dotNetHelper.invokeMethodAsync('HandleSwipe', direction);
            }
        }
    }
}; 