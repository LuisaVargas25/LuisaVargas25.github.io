class TapSymphony {
    constructor() {
        this.audioContext = null;
        this.isRecording = false;
        this.sequence = [];
        this.isPlaying = false;
        this.playbackInterval = null;
        
        // Colores para cada pad
        this.padColors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
            '#FFEAA7', '#DDA0DD', '#98D8E8', '#F7DC6F',
            '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA',
            '#F1948A', '#85D3C4', '#A569BD', '#5DADE2'
        ];

        // Notas musicales para cada pad (escala pentatónica expandida)
        this.notes = [
            261.63, 293.66, 329.63, 392.00, // Do, Re, Mi, Sol
            440.00, 523.25, 587.33, 659.25, // La, Do, Re, Mi
            698.46, 783.99, 880.00, 987.77, // Fa, Sol, La, Si
            1046.5, 1174.7, 1318.5, 1567.9  // Do, Re, Mi, Sol (octava alta)
        ];

        this.initAudio();
        this.createPads();
        this.bindEvents();
    }

    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio no disponible');
        }
    }

    createPads() {
        const grid = document.getElementById('padGrid');
        
        for (let i = 0; i < 16; i++) {
            const pad = document.createElement('div');
            pad.className = 'pad';
            pad.style.background = `linear-gradient(135deg, ${this.padColors[i]}, ${this.darkenColor(this.padColors[i])})`;
            pad.textContent = `${i + 1}`;
            pad.dataset.index = i;
            
            pad.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.playPad(i);
            });
            
            pad.addEventListener('click', (e) => {
                this.playPad(i);
            });
            
            grid.appendChild(pad);
        }
    }

    darkenColor(color) {
        // Función simple para oscurecer un color hex
        const r = parseInt(color.substr(1,2), 16);
        const g = parseInt(color.substr(3,2), 16);
        const b = parseInt(color.substr(5,2), 16);
        
        const factor = 0.7;
        const newR = Math.floor(r * factor);
        const newG = Math.floor(g * factor);
        const newB = Math.floor(b * factor);
        
        return `rgb(${newR}, ${newG}, ${newB})`;
    }

    playPad(index) {
        // Reproducir sonido
        this.playSound(this.notes[index]);
        
        // Efectos visuales
        const pad = document.querySelector(`[data-index="${index}"]`);
        pad.classList.add('active');
        
        // Crear efecto ripple
        this.createRipple(pad);
        
        setTimeout(() => {
            pad.classList.remove('active');
        }, 300);
        
        // Grabar si está en modo grabación
        if (this.isRecording) {
            this.sequence.push({
                index: index,
                time: Date.now(),
                color: this.padColors[index]
            });
            this.updateSequenceDisplay();
        }
    }

    createRipple(element) {
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = '50%';
        ripple.style.top = '50%';
        ripple.style.transform = 'translate(-50%, -50%) scale(0)';
        
        element.appendChild(ripple);
        
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);
    }

    playSound(frequency) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        filter.type = 'lowpass';
        filter.frequency.value = frequency * 2;
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.8);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.8);
    }

    updateSequenceDisplay() {
        const track = document.getElementById('sequenceTrack');
        
        if (this.sequence.length > 0) {
            const lastNote = this.sequence[this.sequence.length - 1];
            const indicator = document.createElement('div');
            indicator.className = 'note-indicator';
            indicator.style.backgroundColor = lastNote.color;
            track.appendChild(indicator);
            
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
            }, 4000);
        }
    }

    bindEvents() {
        document.getElementById('playBtn').addEventListener('click', () => {
            this.playSequence();
        });
        
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearSequence();
        });
        
        document.getElementById('recordBtn').addEventListener('click', () => {
            this.toggleRecording();
        });
    }

    playSequence() {
        if (this.sequence.length === 0 || this.isPlaying) return;
        
        this.isPlaying = true;
        const playBtn = document.getElementById('playBtn');
        playBtn.textContent = '⏸️ STOP';
        playBtn.style.background = 'rgba(255, 99, 99, 0.3)';
        
        let startTime = this.sequence[0].time;
        
        this.sequence.forEach((note, i) => {
            const delay = note.time - startTime;
            setTimeout(() => {
                this.playPad(note.index);
            }, delay / 4); // Reproducir 4x más rápido
        });
        
        // Calcular duración total
        const totalDuration = (this.sequence[this.sequence.length - 1].time - startTime) / 4 + 1000;
        
        setTimeout(() => {
            this.isPlaying = false;
            playBtn.textContent = '▶️ PLAY';
            playBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        }, totalDuration);
    }

    clearSequence() {
        this.sequence = [];
        document.getElementById('sequenceTrack').innerHTML = '';
    }

    toggleRecording() {
        const recordBtn = document.getElementById('recordBtn');
        
        if (this.isRecording) {
            this.isRecording = false;
            recordBtn.textContent = '🔴 REC';
            recordBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        } else {
            this.isRecording = true;
            this.clearSequence();
            recordBtn.textContent = '⏹️ STOP';
            recordBtn.style.background = 'rgba(255, 99, 99, 0.3)';
        }
    }
}

// Inicializar cuando se carga la página
window.addEventListener('load', () => {
    new TapSymphony();
});

// Manejar el contexto de audio en móviles
document.addEventListener('touchstart', function() {
    // Esto ayuda a inicializar el audio en dispositivos móviles
}, {once: true});