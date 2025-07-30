// Audio notification system for ReminderApp
window.AudioNotification = {
    audioContext: null,
    isInitialized: false,
    
    initialize: function() {
        console.log("🎵 Initializing AudioNotification...");
        
        if (this.isInitialized) {
            console.log("✅ AudioNotification already initialized");
            return true;
        }
        
        try {
            // Check if browser supports Web Audio API
            if (typeof(AudioContext) !== "undefined") {
                this.audioContext = new AudioContext();
            } else if (typeof(webkitAudioContext) !== "undefined") {
                this.audioContext = new webkitAudioContext();
            } else {
                console.warn("⚠️ Web Audio API not supported");
                return false;
            }
            
            this.isInitialized = true;
            console.log("✅ AudioNotification initialized successfully");
            return true;
            
        } catch (error) {
            console.error("❌ Error initializing AudioNotification:", error);
            return false;
        }
    },
    
    playNotification: function(soundType = 'gentle') {
        console.log(`🔊 Playing ${soundType} notification`);
        
        if (!this.isInitialized) {
            console.warn("⚠️ AudioNotification not initialized");
            return;
        }
        
        try {
            // Resume audio context if suspended (required by some browsers)
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            // Generate different tones based on sound type
            const frequencies = {
                'gentle': [440, 554], // A4 and C#5
                'success': [523, 659, 784], // C5, E5, G5
                'alert': [880, 880, 880], // A5 repeated
                'swipe': [330] // E4
            };
            
            const freq = frequencies[soundType] || frequencies['gentle'];
            
            // Play sequence of tones
            freq.forEach((frequency, index) => {
                setTimeout(() => {
                    this.playTone(frequency, 0.1, soundType === 'alert' ? 0.3 : 0.1);
                }, index * 150);
            });
            
        } catch (error) {
            console.error("❌ Error playing notification:", error);
        }
    },
    
    playTone: function(frequency, duration, volume = 0.1) {
        if (!this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
            
        } catch (error) {
            console.error("❌ Error playing tone:", error);
        }
    },
    
    // Fallback method using HTML5 Audio (for older browsers)
    playFallbackSound: function() {
        try {
            // Create a simple beep using data URL
            const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjeh2PHOdyMFLYjT8NiKMQgTY7np46JVEAN");
            audio.play().catch(e => console.log("🔇 Fallback audio failed:", e));
        } catch (error) {
            console.log("🔇 No audio available");
        }
    }
};

// Initialize immediately
document.addEventListener('DOMContentLoaded', function() {
    AudioNotification.initialize();
});