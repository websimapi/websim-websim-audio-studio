class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.masterGain = null;
        this.metronome = null;
        this.bpm = 120;
        this.isMetronomeActive = false;
        
        this.initializeAudio();
    }

    async initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.75;

            // Get user media for recording
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                }
            });
        } catch (error) {
            console.warn('Audio initialization failed:', error);
        }
    }

    async resumeAudio() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    setMasterVolume(value) {
        if (this.masterGain) {
            this.masterGain.gain.value = value / 100;
        }
    }

    createOscillator(frequency, type = 'sine') {
        if (!this.audioContext) return null;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        // Envelope
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 1);
        
        return { oscillator, gainNode };
    }

    createDrumSound(type) {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);

        switch (type) {
            case 'kick':
                oscillator.frequency.setValueAtTime(60, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(20, this.audioContext.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.8, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
                break;
            case 'snare':
                const noise = this.createNoise();
                oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
                filter.frequency.setValueAtTime(2000, this.audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.6, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
                break;
            case 'hihat':
                const hihatNoise = this.createNoise();
                filter.type = 'highpass';
                filter.frequency.setValueAtTime(8000, this.audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
                return; // Skip oscillator for hi-hat
            case 'crash':
                const crashNoise = this.createNoise();
                filter.frequency.setValueAtTime(5000, this.audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.8);
                return; // Skip oscillator for crash
        }

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 1);
    }

    createNoise() {
        if (!this.audioContext) return null;

        const bufferSize = this.audioContext.sampleRate * 0.1;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;
        return noise;
    }

    startRecording() {
        if (!this.stream) return false;

        this.recordedChunks = [];
        this.mediaRecorder = new MediaRecorder(this.stream);
        
        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.recordedChunks.push(event.data);
            }
        };

        this.mediaRecorder.start();
        this.isRecording = true;
        return true;
    }

    stopRecording() {
        return new Promise((resolve) => {
            if (!this.mediaRecorder || !this.isRecording) {
                resolve(null);
                return;
            }

            this.mediaRecorder.onstop = () => {
                const blob = new Blob(this.recordedChunks, { type: 'audio/wav' });
                const audioURL = URL.createObjectURL(blob);
                this.isRecording = false;
                resolve(audioURL);
            };

            this.mediaRecorder.stop();
        });
    }

    toggleMetronome() {
        this.isMetronomeActive = !this.isMetronomeActive;
        
        if (this.isMetronomeActive) {
            this.startMetronome();
        } else {
            this.stopMetronome();
        }
        
        return this.isMetronomeActive;
    }

    startMetronome() {
        const interval = (60 / this.bpm) * 1000;
        
        this.metronome = setInterval(() => {
            this.createMetronomeClick();
        }, interval);
    }

    stopMetronome() {
        if (this.metronome) {
            clearInterval(this.metronome);
            this.metronome = null;
        }
    }

    createMetronomeClick() {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.type = 'square';
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.05);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.05);
    }

    setBPM(bpm) {
        this.bpm = bpm;
        if (this.isMetronomeActive) {
            this.stopMetronome();
            this.startMetronome();
        }
    }
}

