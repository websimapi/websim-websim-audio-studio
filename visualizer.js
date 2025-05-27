class AudioVisualizer {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.canvas = document.getElementById('visualizer');
        this.ctx = this.canvas.getContext('2d');
        this.analyzer = null;
        this.dataArray = null;
        this.isAnimating = false;
        
        this.setupAnalyzer();
        this.resizeCanvas();
        this.startVisualization();
        
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    setupAnalyzer() {
        if (this.audioEngine.audioContext) {
            this.analyzer = this.audioEngine.audioContext.createAnalyser();
            this.analyzer.fftSize = 256;
            this.dataArray = new Uint8Array(this.analyzer.frequencyBinCount);
            
            // Connect the master gain to the analyzer
            this.audioEngine.masterGain.connect(this.analyzer);
        }
    }

    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    startVisualization() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        this.animate();
    }

    animate() {
        if (!this.isAnimating) return;

        requestAnimationFrame(() => this.animate());

        if (this.analyzer && this.dataArray) {
            this.analyzer.getByteFrequencyData(this.dataArray);
        }

        this.draw();
    }

    draw() {
        const width = this.canvas.width / window.devicePixelRatio;
        const height = this.canvas.height / window.devicePixelRatio;

        // Clear canvas with gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(26, 26, 46, 0.8)');
        gradient.addColorStop(1, 'rgba(15, 15, 35, 0.8)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, width, height);

        if (!this.dataArray) {
            this.drawIdleVisualization(width, height);
            return;
        }

        // Draw frequency bars
        const barWidth = width / this.dataArray.length;
        let x = 0;

        for (let i = 0; i < this.dataArray.length; i++) {
            const barHeight = (this.dataArray[i] / 255) * height * 0.8;
            
            // Create colorful gradient for each bar
            const barGradient = this.ctx.createLinearGradient(0, height, 0, height - barHeight);
            const hue = (i / this.dataArray.length) * 360;
            barGradient.addColorStop(0, `hsla(${hue}, 70%, 50%, 0.8)`);
            barGradient.addColorStop(1, `hsla(${hue + 60}, 70%, 70%, 0.9)`);
            
            this.ctx.fillStyle = barGradient;
            this.ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
            
            // Add glow effect
            this.ctx.shadowColor = `hsla(${hue}, 70%, 60%, 0.5)`;
            this.ctx.shadowBlur = 10;
            this.ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
            this.ctx.shadowBlur = 0;
            
            x += barWidth;
        }

        // Draw waveform overlay
        this.drawWaveform(width, height);
    }

    drawWaveform(width, height) {
        if (!this.analyzer) return;

        const bufferLength = this.analyzer.fftSize;
        const dataArray = new Uint8Array(bufferLength);
        this.analyzer.getByteTimeDomainData(dataArray);

        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = 'rgba(78, 205, 196, 0.8)';
        this.ctx.beginPath();

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = v * height / 2;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        this.ctx.stroke();
    }

    drawIdleVisualization(width, height) {
        const time = Date.now() * 0.005;
        
        // Draw animated sine waves
        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.lineWidth = 2 - i * 0.5;
            this.ctx.strokeStyle = `hsla(${180 + i * 60}, 70%, 60%, ${0.5 - i * 0.1})`;
            
            for (let x = 0; x < width; x++) {
                const y = height / 2 + Math.sin((x * 0.01) + time + i) * (30 - i * 10) + 
                         Math.sin((x * 0.005) + time * 1.5 + i) * (20 - i * 5);
                
                if (x === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            
            this.ctx.stroke();
        }
    }

    stop() {
        this.isAnimating = false;
    }
}

