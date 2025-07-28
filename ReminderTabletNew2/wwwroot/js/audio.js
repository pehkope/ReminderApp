// Audio notification system for ReminderApp
window.AudioNotification = {
    audioContext: null,
    
    // Initialize audio system
    initialize: function() {
        // Create AudioContext on first user interaction
        document.addEventListener('click', this.initAudioContext.bind(this), { once: true });
        document.addEventListener('touchstart', this.initAudioContext.bind(this), { once: true });
        console.log('Audio notification system initialized');
    },
    
    initAudioContext: function() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('AudioContext created');
        }
    },
    
    // Play notification sound
    playNotification: async function(type = 'default') {
        try {
            this.initAudioContext();
            
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            switch (type) {
                case 'bell':
                    await this.playBellSound();
                    break;
                case 'chime':
                    await this.playChimeSound();
                    break;
                case 'gentle':
                    await this.playGentleSound();
                    break;
                default:
                    await this.playDefaultSound();
            }
        } catch (error) {
            console.error('Error playing notification sound:', error);
        }
    },
    
    // Generate a pleasant bell sound
    playBellSound: async function() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Bell-like sound with harmonics
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.1);
        oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1.5);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 1.5);
    },
    
    // Generate a gentle chime sound
    playChimeSound: async function() {
        const frequencies = [523, 659, 784]; // C, E, G notes
        
        for (let i = 0; i < frequencies.length; i++) {
            setTimeout(() => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.setValueAtTime(frequencies[i], this.audioContext.currentTime);
                
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.8);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.8);
            }, i * 200);
        }
    },
    
    // Generate a gentle notification sound
    playGentleSound: async function() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(550, this.audioContext.currentTime + 0.2);
        oscillator.frequency.linearRampToValueAtTime(440, this.audioContext.currentTime + 0.4);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.6);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.6);
    },
    
    // Default notification sound
    playDefaultSound: async function() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    },
    
    // Play sound sequence for important notifications
    playImportantNotification: async function() {
        await this.playNotification('chime');
        setTimeout(() => this.playNotification('bell'), 1000);
    }
}; 