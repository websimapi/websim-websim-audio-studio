class InstrumentSimulator {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.activeNotes = new Set();
        this.setupKeyboard();
        this.setupDrums();
        this.setupBass();
    }

    setupKeyboard() {
        const keys = document.querySelectorAll('#keyboardSim .key');
        keys.forEach(key => {
            key.addEventListener('mousedown', (e) => this.playNote(e.target.dataset.note));
            key.addEventListener('mouseup', (e) => this.stopNote(e.target.dataset.note));
            key.addEventListener('mouseleave', (e) => this.stopNote(e.target.dataset.note));
        });

        // Computer keyboard support
        document.addEventListener('keydown', (e) => {
            const keyMap = {
                'a': 'C4', 'w': 'C#4', 's': 'D4', 'e': 'D#4', 'd': 'E4',
                'f': 'F4', 't': 'F#4', 'g': 'G4', 'y': 'G#4', 'h': 'A4',
                'u': 'A#4', 'j': 'B4'
            };
            
            const note = keyMap[e.key.toLowerCase()];
            if (note && !this.activeNotes.has(note)) {
                this.playNote(note);
                this.visualizeKeyPress(note);
            }
        });

        document.addEventListener('keyup', (e) => {
            const keyMap = {
                'a': 'C4', 'w': 'C#4', 's': 'D4', 'e': 'D#4', 'd': 'E4',
                'f': 'F4', 't': 'F#4', 'g': 'G4', 'y': 'G#4', 'h': 'A4',
                'u': 'A#4', 'j': 'B4'
            };
            
            const note = keyMap[e.key.toLowerCase()];
            if (note) {
                this.stopNote(note);
                this.removeKeyPress(note);
            }
        });
    }

    setupDrums() {
        const drumPads = document.querySelectorAll('#drumSim .drum-pad');
        drumPads.forEach(pad => {
            pad.addEventListener('click', (e) => {
                this.playDrum(e.target.dataset.drum);
                this.visualizeDrumHit(e.target);
            });
        });

        // Drum key mappings
        document.addEventListener('keydown', (e) => {
            const drumMap = {
                ' ': 'kick',    // spacebar
                'Enter': 'snare',
                'ArrowUp': 'hihat',
                'ArrowDown': 'crash'
            };
            
            const drum = drumMap[e.key];
            if (drum) {
                e.preventDefault();
                this.playDrum(drum);
                this.visualizeDrumHit(document.querySelector(`[data-drum="${drum}"]`));
            }
        });
    }

    setupBass() {
        const bassStrings = document.querySelectorAll('#bassSim .bass-string');
        bassStrings.forEach(string => {
            string.addEventListener('click', (e) => {
                this.playBass(e.target.dataset.note);
                this.visualizeBassPluck(e.target);
            });
        });
    }

    playNote(note) {
        if (this.activeNotes.has(note)) return;
        
        const frequency = this.noteToFrequency(note);
        const synth = this.audioEngine.createOscillator(frequency, 'sawtooth');
        
        if (synth) {
            this.activeNotes.add(note);
            // Store the synth for potential stopping
            synth.note = note;
        }
    }

    stopNote(note) {
        this.activeNotes.delete(note);
    }

    playDrum(type) {
        this.audioEngine.createDrumSound(type);
    }

    playBass(note) {
        const frequency = this.noteToFrequency(note);
        this.audioEngine.createOscillator(frequency, 'triangle');
    }

    noteToFrequency(note) {
        const noteMap = {
            'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13,
            'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00,
            'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
            'E2': 82.41, 'A2': 110.00, 'D3': 146.83, 'G3': 196.00
        };
        return noteMap[note] || 440;
    }

    visualizeKeyPress(note) {
        const key = document.querySelector(`[data-note="${note}"]`);
        if (key) {
            key.classList.add('pressed');
        }
    }

    removeKeyPress(note) {
        const key = document.querySelector(`[data-note="${note}"]`);
        if (key) {
            key.classList.remove('pressed');
        }
    }

    visualizeDrumHit(pad) {
        pad.classList.add('pressed');
        setTimeout(() => pad.classList.remove('pressed'), 150);
    }

    visualizeBassPluck(string) {
        string.classList.add('pressed');
        setTimeout(() => string.classList.remove('pressed'), 200);
    }
}

