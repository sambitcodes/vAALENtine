// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Smoothly scrolls to the target element.
 * @param {string} target - CSS selector for the target element.
 */
function smoothScroll(target) {
    const element = document.querySelector(target);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/**
 * Shuffles a string.
 * @param {string} str - The string to shuffle.
 * @returns {string} - The shuffled string.
 */
function shuffle(str) {
    const arr = str.split('');
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
}

/**
 * Triggers a confetti animation.
 * @param {number} duration - Duration of the animation in milliseconds.
 */
function triggerConfetti(duration = 3000) {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const confettiPieces = [];
    const colors = ['#ff6b9d', '#c44569', '#f8b500', '#00d2d3', '#ffa8c5'];

    for (let i = 0; i < 100; i++) {
        confettiPieces.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            r: Math.random() * 6 + 4,
            d: Math.random() * 10 + 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            tilt: Math.random() * 10 - 10,
            tiltAngle: 0,
            tiltAngleIncrement: Math.random() * 0.07 + 0.05
        });
    }

    let startTime = Date.now();

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        confettiPieces.forEach((p, index) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();

            p.tiltAngle += p.tiltAngleIncrement;
            p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
            p.x += Math.sin(p.tiltAngle) * 2;

            if (p.y > canvas.height) {
                confettiPieces[index] = {
                    ...p,
                    y: -20,
                    x: Math.random() * canvas.width
                };
            }
        });

        if (Date.now() - startTime < duration) {
            requestAnimationFrame(draw);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    draw();
}

/**
 * Persists the user's name to localStorage.
 * @param {string} name - The user's name.
 */
function saveUserName(name) {
    localStorage.setItem('vArcade_userName', name);
}

/**
 * Gets the user's name from localStorage.
 * @returns {string|null} - The user's name or null.
 */
function getUserName() {
    return localStorage.getItem('vArcade_userName');
}

/**
 * Tracks completed games in localStorage.
 * @param {string} gameId - The ID of the completed game.
 */
function markGameCompleted(gameId) {
    let completed = JSON.parse(localStorage.getItem('vArcade_completedGames') || '[]');
    if (!completed.includes(gameId)) {
        completed.push(gameId);
        localStorage.setItem('vArcade_completedGames', JSON.stringify(completed));
    }
}

/**
 * Gets the list of completed games.
 * @returns {string[]} - Array of completed game IDs.
 */
function getCompletedGames() {
    return JSON.parse(localStorage.getItem('vArcade_completedGames') || '[]');
}

/**
 * Simple Sound Effects using Web Audio API
 */
const SoundFX = {
    ctx: null,

    init: function () {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    },

    playTone: function (freq, type, duration, startTime = 0) {
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.value = freq;

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        const now = this.ctx.currentTime + startTime;

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc.start(now);
        osc.stop(now + duration);
    },

    playDiceShake: function () {
        this.init();
        // Simulate shaking with random noisebursts
        for (let i = 0; i < 10; i++) {
            this.playTone(200 + Math.random() * 500, 'square', 0.05, i * 0.06);
        }
    },

    playLand: function () {
        // "Pop" sound
        this.playTone(600, 'sine', 0.1);
    },

    playMemoryOpen: function () {
        // Magical chime
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            this.playTone(freq, 'sine', 0.3, i * 0.1);
        });
    },

    playCorrect: function () {
        // Sweet success chime
        [659.25, 830.61, 987.77].forEach((freq, i) => {
            this.playTone(freq, 'sine', 0.4, i * 0.08);
        });
    },

    playWrong: function () {
        // Low buzz
        this.playTone(150, 'sawtooth', 0.1);
        this.playTone(110, 'sawtooth', 0.3, 0.1);
    },

    playClick: function () {
        // Sharp high tap
        this.playTone(800, 'sine', 0.05);
    },

    playChoice: function () {
        // Lower tech click
        this.playTone(400, 'square', 0.05);
    }
};
