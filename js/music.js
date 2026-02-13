// ========================================
// MUSIC PAGE - RETRO CASSETTE DECK LOGIC
// ========================================

window.MusicPlayer = {
    isPlaying: false,
    currentTapeIndex: -1,
    audio: null,
    volume: 0.5,

    // The Tapes (Songs)
    tracks: [
        {
            title: "Home / Welcome",
            artist: "CDR",
            file: "pictures/cdr-home.mp3",
            color: "#f1c40f" // Yellow
        },
        {
            title: "Us / Together",
            artist: "Arad",
            file: "pictures/arad-us.mp3",
            color: "#e74c3c" // Red
        },
        {
            title: "The Memory Train",
            artist: "TDN",
            file: "pictures/tdn-memories.mp3",
            color: "#3498db" // Blue
        },
        {
            title: "Map of Our World",
            artist: "Anand",
            file: "pictures/anand-map.mp3",
            color: "#2ecc71" // Green
        },
        {
            title: "Grand Finale",
            artist: "vAALENtine",
            file: "pictures/finale.mp3",
            color: "#9b59b6" // Purple
        }
    ],

    init() {
        this.audio = document.getElementById('bgMusic');
        this.audio.volume = this.volume;
        this.renderTapes();

        // Mechanical Click Sounds
        document.querySelectorAll('.deck-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                SoundFX.playClick();
                btn.classList.add('active');
                setTimeout(() => btn.classList.remove('active'), 150);
            });
        });

        // Initialize Volume Knob
        const volSlider = document.getElementById('volumeKnob');
        if (volSlider) volSlider.value = this.volume;

        // Mark game completion status
        if (typeof markGameCompleted === 'function') {
            markGameCompleted('music');
        }

        // Auto-eject state check
        this.updateDeckVisuals();
    },

    renderTapes() {
        const container = document.getElementById('tapeCollection');
        container.innerHTML = '';

        this.tracks.forEach((track, index) => {
            const tape = document.createElement('div');
            tape.className = 'cassette-tape';
            tape.id = `tape-${index}`;
            tape.onclick = () => this.loadTape(index);

            tape.innerHTML = `
                <div class="tape-label" style="background-color: ${track.color}">
                    <div class="tape-text">
                        ${track.title}<br>
                        <small>${track.artist}</small>
                    </div>
                </div>
                <div class="tape-circles">
                    <div class="tape-circle"></div>
                    <div class="tape-circle"></div>
                </div>
            `;

            container.appendChild(tape);
        });
    },

    loadTape(index) {
        if (this.currentTapeIndex === index && this.isPlaying) return;

        // SFX: Slide in
        SoundFX.playHover();

        this.currentTapeIndex = index;
        const track = this.tracks[index];

        // Update Deck UI
        document.getElementById('currentTapeLabel').textContent = `${track.title} - ${track.artist}`;
        this.updateDeckVisuals(track.color);

        // Update Audio
        this.audio.src = track.file;
        this.play();

        this.updateDeckVisuals(track.color);
    },

    ejectTape() {
        if (this.currentTapeIndex === -1) return;

        // Stop Music
        this.pause();
        this.audio.src = "";
        this.currentTapeIndex = -1;

        // Reset UI
        document.getElementById('currentTapeLabel').textContent = "NO TAPE";
        this.updateDeckVisuals(null);

        // SFX: Eject Sound (Mechanical Clunk)
        SoundFX.playClick();
    },

    play() {
        this.isPlaying = true;
        this.audio.play().catch(e => console.log("Playback failed:", e));

        document.getElementById('playBtn').textContent = '⏸';
        document.querySelectorAll('.spool').forEach(s => s.classList.add('spinning'));

        // Initial Bump
        const speakers = document.querySelectorAll('.speakers');
        speakers.forEach(s => s.classList.add('bumping'));
        setTimeout(() => speakers.forEach(s => s.classList.remove('bumping')), 200);

        this.startSpeakerBounce();
    },

    pause() {
        this.isPlaying = false;
        this.audio.pause();

        document.getElementById('playBtn').textContent = '▶';
        document.querySelectorAll('.spool').forEach(s => s.classList.remove('spinning'));
        this.stopSpeakerBounce();
    },

    togglePlay() {
        if (this.currentTapeIndex === -1 && this.tracks.length > 0) {
            // Load first tape if none loaded
            this.loadTape(0);
        } else if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    },

    nextTrack() {
        let nextIndex = this.currentTapeIndex + 1;
        if (nextIndex >= this.tracks.length) nextIndex = 0;
        this.loadTape(nextIndex);
    },

    prevTrack() {
        let prevIndex = this.currentTapeIndex - 1;
        if (prevIndex < 0) prevIndex = this.tracks.length - 1;
        this.loadTape(prevIndex);
    },



    setVolume(val) {
        this.volume = val;
        if (this.audio) this.audio.volume = val;
    },

    updateDeckVisuals() {
        // Handle "Inserted" visual state for tapes in the stack
        document.querySelectorAll('.cassette-tape').forEach((tape, index) => {
            if (index === this.currentTapeIndex) {
                tape.classList.add('inserted');
            } else {
                tape.classList.remove('inserted');
            }
        });
    },

    // Simulated Visualizer
    bounceInterval: null,
    startSpeakerBounce() {
        if (this.bounceInterval) clearInterval(this.bounceInterval);

        this.bounceInterval = setInterval(() => {
            if (!this.isPlaying) return;
            const speakers = document.querySelectorAll('.speakers');
            // Random chance to bounce
            if (Math.random() > 0.3) {
                speakers.forEach(s => {
                    s.style.transform = `scale(${1 + Math.random() * 0.05})`;
                    setTimeout(() => s.style.transform = 'scale(1)', 100);
                });
            }
        }, 400); // 400ms = approx 150bpm beat check
    },

    stopSpeakerBounce() {
        if (this.bounceInterval) clearInterval(this.bounceInterval);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    MusicPlayer.init();
});
