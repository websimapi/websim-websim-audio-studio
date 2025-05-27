class Track {
    constructor(name, type, audioEngine) {
        this.name = name;
        this.type = type;
        this.audioEngine = audioEngine;
        this.isRecording = false;
        this.isPlaying = false;
        this.isLooping = false;
        this.isMuted = false;
        this.isSolo = false;
        this.volume = 75;
        this.audioData = null;
        this.audioElement = null;
        this.gainNode = null;
        this.loopStartTime = 0;
        this.loopDuration = 0;
        this.recordingStartTime = 0;
        
        this.setupAudioNodes();
    }

    setupAudioNodes() {
        if (this.audioEngine.audioContext) {
            this.gainNode = this.audioEngine.audioContext.createGain();
            this.gainNode.connect(this.audioEngine.masterGain);
            this.setVolume(this.volume);
        }
    }

    async startRecording() {
        if (this.isRecording) return false;
        
        await this.audioEngine.resumeAudio();
        const success = this.audioEngine.startRecording();
        if (success) {
            this.isRecording = true;
            this.recordingStartTime = Date.now();
            return true;
        }
        return false;
    }

    async stopRecording() {
        if (!this.isRecording) return null;
        
        this.isRecording = false;
        const audioURL = await this.audioEngine.stopRecording();
        
        if (audioURL) {
            this.audioData = audioURL;
            this.setupAudioElement();
            this.loopDuration = (Date.now() - this.recordingStartTime) / 1000;
        }
        
        return audioURL;
    }

    setupAudioElement() {
        if (this.audioData) {
            this.audioElement = new Audio(this.audioData);
            this.audioElement.loop = this.isLooping;
            
            // Connect to Web Audio API for volume control
            if (this.audioEngine.audioContext && this.gainNode) {
                const source = this.audioEngine.audioContext.createMediaElementSource(this.audioElement);
                source.connect(this.gainNode);
            }
        }
    }

    play() {
        if (this.audioElement && !this.isMuted) {
            this.audioElement.currentTime = 0;
            this.audioElement.play();
            this.isPlaying = true;
            this.loopStartTime = Date.now();
        }
    }

    pause() {
        if (this.audioElement) {
            this.audioElement.pause();
            this.isPlaying = false;
        }
    }

    stop() {
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.currentTime = 0;
            this.isPlaying = false;
        }
    }

    toggleLoop() {
        this.isLooping = !this.isLooping;
        if (this.audioElement) {
            this.audioElement.loop = this.isLooping;
        }
        return this.isLooping;
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.updateVolume();
        return this.isMuted;
    }

    toggleSolo() {
        this.isSolo = !this.isSolo;
        return this.isSolo;
    }

    setVolume(volume) {
        this.volume = volume;
        this.updateVolume();
    }

    updateVolume() {
        if (this.gainNode) {
            const effectiveVolume = this.isMuted ? 0 : this.volume / 100;
            this.gainNode.gain.setValueAtTime(effectiveVolume, this.audioEngine.audioContext.currentTime);
        }
    }
}

class TrackManager {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.tracks = [];
        this.isPlaying = false;
        this.soloTracks = [];
    }

    createTrack(name, type) {
        const track = new Track(name, type, this.audioEngine);
        this.tracks.push(track);
        return track;
    }

    removeTrack(track) {
        const index = this.tracks.indexOf(track);
        if (index > -1) {
            track.stop();
            this.tracks.splice(index, 1);
        }
    }

    playAllTracks() {
        this.isPlaying = true;
        this.tracks.forEach(track => {
            if (this.shouldTrackPlay(track)) {
                track.play();
            }
        });
    }

    pauseAllTracks() {
        this.isPlaying = false;
        this.tracks.forEach(track => track.pause());
    }

    stopAllTracks() {
        this.isPlaying = false;
        this.tracks.forEach(track => track.stop());
    }

    shouldTrackPlay(track) {
        // If there are solo tracks, only play solo tracks
        const soloTracks = this.tracks.filter(t => t.isSolo);
        if (soloTracks.length > 0) {
            return track.isSolo && !track.isMuted;
        }
        return !track.isMuted;
    }

    updateSoloStates() {
        // Update all tracks based on solo states
        this.tracks.forEach(track => {
            track.updateVolume();
        });
    }
}

