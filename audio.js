// Audio Engine using Web Audio API - Zero external dependencies, pure crystal sound
class RomanticAudio {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
    }

    init() {
        if (this.ctx) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
    }

    playTone(freq, time, duration, gainVal, type = 'sine') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.exponentialRampToValueAtTime(gainVal, time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(time);
        osc.stop(time + duration + 0.05);
    }

    // Touch ripple chime
    playTouchChime() {
        this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const now = this.ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
            this.playTone(freq, now + i * 0.05, 1.2, 0.18 / (i + 1));
        });
    }

    // Climax storm whoosh & celestial arpeggio
    playStormWhoosh() {
        this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const now = this.ctx.currentTime;

        // Crystal harp glissando
        const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51, 1760, 2217.46];
        notes.forEach((freq, idx) => {
            this.playTone(freq, now + idx * 0.07, 2.0, 0.22 / (idx * 0.2 + 1));
        });

        // Warm soft swell
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(360, now + 1.2);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.6);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 2.3);
    }

    // Gentle bell when message reveals
    playMessageReveal() {
        this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const now = this.ctx.currentTime;
        const chords = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        chords.forEach((freq, idx) => {
            this.playTone(freq, now + idx * 0.12, 2.8, 0.15);
        });
    }
}

window.romanticAudio = new RomanticAudio();
