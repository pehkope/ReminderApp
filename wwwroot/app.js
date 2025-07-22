// ReminderApp Tablet - JavaScript toiminnot

// Text-to-Speech funktio
window.speakText = (text) => {
    try {
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Suomi-ääni jos saatavilla
        const voices = speechSynthesis.getVoices();
        const finnishVoice = voices.find(voice => 
            voice.lang.includes('fi') || voice.name.toLowerCase().includes('finnish')
        );
        
        if (finnishVoice) {
            utterance.voice = finnishVoice;
        }
        
        utterance.rate = 0.8;
        utterance.pitch = 1.0;
        utterance.volume = 0.9;
        
        speechSynthesis.speak(utterance);
        
        console.log('Text-to-speech started:', text);
    } catch (error) {
        console.error('Text-to-speech error:', error);
    }
};

// Puhelutoiminto
window.makeCall = (phoneNumber) => {
    try {
        const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
        window.location.href = `tel:${cleanNumber}`;
        console.log('Initiating call to:', cleanNumber);
    } catch (error) {
        console.error('Call error:', error);
    }
};

// Testifunktiot
window.testSpeech = () => {
    window.speakText('Tervehdys äidille. Tämä on testiviesvi. Päivä on kaunis ja aurinkoinen.');
};

window.testCall = () => {
    window.makeCall('+358401234567');
};

console.log('ReminderApp Tablet JavaScript loaded');