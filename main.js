class WebSimAudioStudio {
    constructor() {
        this.audioEngine = new AudioEngine();
        this.trackManager = new TrackManager(this.audioEngine);
        this.instrumentSimulator = new InstrumentSimulator(this.audioEngine);
        this.visualizer = new AudioVisualizer(this.audioEngine);
        this.currentTrack = null;
        this.activeInstrument = null;
        
        this.initializeEventListeners();
        this.showWelcomeMessage();
    }

    initializeEventListeners() {
        // Master controls
        document.getElementById('playAllBtn').addEventListener('click', () => {
            this.audioEngine.resumeAudio();
            this.trackManager.playAllTracks();
        });

        document.getElementById('pauseAllBtn').addEventListener('click', () => {
            this.trackManager.pauseAllTracks();
        });

        document.getElementById('stopAllBtn').addEventListener('click', () => {
            this.trackManager.stopAllTracks();
        });

        document.getElementById('masterVolume').addEventListener('input', (e) => {
            this.audioEngine.setMasterVolume(e.target.value);
        });

        // Metronome
        document.getElementById('metronomeBtn').addEventListener('click', () => {
            const isActive = this.audioEngine.toggleMetronome();
            const btn = document.getElementById('metronomeBtn');
            btn.classList.toggle('loop-active', isActive);
            btn.textContent = isActive ? '🥁 Metronome ON' : '🥁 Metronome';
        });

        // Tempo control
        document.getElementById('tempoSlider').addEventListener('input', (e) => {
            const bpm = e.target.value;
            document.getElementById('bpmDisplay').textContent = bpm;
            this.audioEngine.setBPM(parseInt(bpm));
        });

        // Import buttons
        document.querySelectorAll('.import-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                this.importInstrument(type);
            });
        });
    }

    importInstrument(type) {
        // Show the appropriate instrument simulator
        this.hideAllInstruments();
        this.showInstrument(type);
        
        // Create a new track for this instrument
        const trackName = this.generateTrackName(type);
        const track = this.trackManager.createTrack(trackName, type);
        this.renderTrack(track);
        
        this.showImportMessage(type);
    }

    generateTrackName(type) {
        const trackCount = this.trackManager.tracks.filter(t => t.type === type).length;
        const names = {
            keyboard: `Synth ${trackCount + 1}`,
            drums: `Drums ${trackCount + 1}`,
            bass: `Bass ${trackCount + 1}`,
            microphone: `Vocal ${trackCount + 1}`
        };
        return names[type] || `Track ${trackCount + 1}`;
    }

    hideAllInstruments() {
        document.querySelectorAll('.instrument-sim').forEach(sim => {
            sim.style.display = 'none';
        });
    }

    showInstrument(type) {
        const instrumentMap = {
            keyboard: 'keyboardSim',
            drums: 'drumSim',
            bass: 'bassSim',
            microphone: 'keyboardSim' // Use keyboard for mic demo
        };
        
        const simId = instrumentMap[type];
        if (simId) {
            const sim = document.getElementById(simId);
            sim.style.display = 'block';
            this.activeInstrument = type;
        }
    }

    renderTrack(track) {
        const tracksList = document.getElementById('tracksList');
        const trackElement = document.createElement('div');
        trackElement.className = 'track';
        trackElement.dataset.trackId = track.name;
        
        trackElement.innerHTML = `
            <div class="track-header">
                <div class="track-name">${track.name}</div>
                <div class="track-controls">
                    <button class="track-btn record-btn" data-action="record">🔴 Rec</button>
                    <button class="track-btn play-btn" data-action="play">▶️</button>
                    <button class="track-btn loop-btn" data-action="loop">🔄</button>
                    <button class="track-btn mute-btn" data-action="mute">🔇</button>
                    <button class="track-btn solo-btn" data-action="solo">S</button>
                    <button class="track-btn delete-btn" data-action="delete">🗑️</button>
                    <div class="track-volume">
                        <input type="range" min="0" max="100" value="75" class="volume-slider">
                    </div>
                </div>
            </div>
            <div class="track-waveform">
                <canvas class="waveform-canvas" width="400" height="60"></canvas>
            </div>
        `;
        
        tracksList.appendChild(trackElement);
        this.setupTrackEvents(trackElement, track);
    }

    setupTrackEvents(trackElement, track) {
        const buttons = trackElement.querySelectorAll('.track-btn');
        const volumeSlider = trackElement.querySelector('.volume-slider');
        
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleTrackAction(track, action, e.target);
            });
        });
        
        volumeSlider.addEventListener('input', (e) => {
            track.setVolume(e.target.value);
        });
    }

    async handleTrackAction(track, action, button) {
        switch (action) {
            case 'record':
                if (track.isRecording) {
                    await track.stopRecording();
                    button.textContent = '🔴 Rec';
                    button.classList.remove('recording');
                    this.renderWaveform(track);
                } else {
                    const success = await track.startRecording();
                    if (success) {
                        button.textContent = '⏹️ Stop';
                        button.classList.add('recording');
                    }
                }
                break;
                
            case 'play':
                if (track.isPlaying) {
                    track.pause();
                    button.textContent = '▶️';
                    button.classList.remove('playing');
                } else {
                    track.play();
                    button.textContent = '⏸️';
                    button.classList.add('playing');
                }
                break;
                
            case 'loop':
                const isLooping = track.toggleLoop();
                button.classList.toggle('loop-active', isLooping);
                break;
                
            case 'mute':
                const isMuted = track.toggleMute();
                button.textContent = isMuted ? '🔊' : '🔇';
                button.classList.toggle('loop-active', isMuted);
                break;
                
            case 'solo':
                const isSolo = track.toggleSolo();
                button.classList.toggle('loop-active', isSolo);
                this.trackManager.updateSoloStates();
                break;
                
            case 'delete':
                this.deleteTrack(track);
                break;
        }
    }

    renderWaveform(track) {
        const trackElement = document.querySelector(`[data-track-id="${track.name}"]`);
        const canvas = trackElement.querySelector('.waveform-canvas');
        const ctx = canvas.getContext('2d');
        
        // Simple waveform visualization
        ctx.fillStyle = 'rgba(78, 205, 196, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add some visual feedback that recording occurred
        ctx.fillStyle = 'rgba(78, 205, 196, 0.8)';
        for (let i = 0; i < canvas.width; i += 4) {
            const height = Math.random() * canvas.height * 0.6 + 10;
            ctx.fillRect(i, (canvas.height - height) / 2, 2, height);
        }
    }

    deleteTrack(track) {
        const trackElement = document.querySelector(`[data-track-id="${track.name}"]`);
        if (trackElement) {
            trackElement.remove();
        }
        this.trackManager.removeTrack(track);
    }

    showImportMessage(type) {
        const messages = {
            keyboard: '🎹 Keyboard imported! Use AWSD keys or click the keys to play.',
            drums: '🥁 Drums imported! Use spacebar (kick), Enter (snare), arrows for hi-hat/crash.',
            bass: '🎸 Bass imported! Click the strings to play bass notes.',
            microphone: '🎤 Microphone ready! Click record to capture audio.'
        };
        
        this.showNotification(messages[type] || 'Instrument imported!');
    }

    showWelcomeMessage() {
        setTimeout(() => {
            this.showNotification('🎵 Welcome to WebSim Audio Studio! Import instruments to start creating music.', 5000);
        }, 1000);
    }

    showNotification(message, duration = 3000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(78, 205, 196, 0.9);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            font-weight: bold;
            z-index: 1000;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after duration
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
}

// Initialize the studio when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.studio = new WebSimAudioStudio();
});

// Handle audio context resume on user interaction
document.addEventListener('click', () => {
    if (window.studio && window.studio.audioEngine) {
        window.studio.audioEngine.resumeAudio();
    }
}, { once: true });

