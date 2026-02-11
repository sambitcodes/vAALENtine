// ========================================
// ESCAPE ROOM LOGIC
// ========================================

let currentStage = 0;

// LEVEL 1: PATTERN DATA
// Player must click buttons in specific order (1->9)
const patternSequence = [1, 2, 3, 4, 5, 6, 7, 8, 9];
let playerPattern = [];

// LEVEL 2: CIPHER DATA
const CIPHER_ANSWER = "FEBRUARY"; // Simple for demo, can be dynamic
const CIPHER_HINT = "It's the month of love...";

// LEVEL 3: SCRAMBLE DATA
const FINAL_PHRASE = "I LOVE YOU";
const SCRAMBLED_PHRASE = "L O V E   I   O Y U"; // Deliberately easy-ish

document.addEventListener('DOMContentLoaded', () => {
    initPatternGrid();

    // Allow 'Enter' key to submit inputs
    document.getElementById('cipher-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkCipher();
    });
    document.getElementById('final-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkFinal();
    });
});

function startGame() {
    switchStage(0, 1);
}

function switchStage(from, to) {
    const current = document.getElementById(`stage-${from === 0 ? 'intro' : from}`);
    const next = document.getElementById(`stage-${to}`);

    if (current) current.classList.add('hidden');
    if (next) {
        next.classList.remove('hidden');
        next.classList.add('active');
    }

    currentStage = to;
}

// ========================================
// STAGE 1: PATTERN LOCK
// ========================================
function initPatternGrid() {
    const grid = document.getElementById('pattern-grid');
    // Randomize the numbers 1-9 on the grid content, but logic checks pure order
    // Actually, let's make it a memory game: Click 1 to 9 in order
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);

    grid.innerHTML = '';
    numbers.forEach(num => {
        const btn = document.createElement('button');
        btn.className = 'pattern-btn';
        btn.textContent = num;
        btn.onclick = () => handlePatternClick(btn, num);
        grid.appendChild(btn);
    });
}

function handlePatternClick(btn, num) {
    // If button already selected, ignore
    if (btn.classList.contains('selected')) return;

    const expectedNum = playerPattern.length + 1;

    if (num === expectedNum) {
        // Correct
        btn.classList.add('selected');
        playerPattern.push(num);

        if (playerPattern.length === 9) {
            document.getElementById('pattern-feedback').textContent = "SYSTEM UNLOCKED";
            document.getElementById('pattern-feedback').className = "feedback-text success";
            setTimeout(() => switchStage(1, 2), 1000);
        }
    } else {
        // Incorrect - Reset
        document.getElementById('pattern-feedback').textContent = "INVALID SEQUENCE. RESETTING...";
        document.getElementById('pattern-feedback').className = "feedback-text error";

        // Shake animation
        const grid = document.getElementById('pattern-grid');
        grid.classList.add('shake');

        setTimeout(() => {
            grid.classList.remove('shake');
            document.querySelectorAll('.pattern-btn').forEach(b => b.classList.remove('selected'));
            playerPattern = [];
            document.getElementById('pattern-feedback').textContent = "";
        }, 1000);
    }
}

// ========================================
// STAGE 2: CIPHER
// ========================================
function checkCipher() {
    const input = document.getElementById('cipher-input').value.toUpperCase().trim();
    const feedback = document.getElementById('cipher-feedback');

    if (input === CIPHER_ANSWER) {
        feedback.textContent = "ACCESS GRANTED";
        feedback.className = "feedback-text success";
        setTimeout(() => switchStage(2, 3), 1000);
    } else {
        feedback.textContent = "ACCESS DENIED";
        feedback.className = "feedback-text error";
        document.getElementById('stage-2').querySelector('.glass-panel').classList.add('shake');
        setTimeout(() => document.getElementById('stage-2').querySelector('.glass-panel').classList.remove('shake'), 500);
    }
}

function showHint(stage) {
    const hintEl = document.getElementById(`hint-${stage}`);
    hintEl.classList.remove('hidden');
    hintEl.textContent = stage === 2 ? CIPHER_HINT : "Look at the letters carefully...";
}

// ========================================
// STAGE 3: FINAL KEY
// ========================================
function checkFinal() {
    const input = document.getElementById('final-input').value.toUpperCase().trim();
    const feedback = document.getElementById('final-feedback');

    // Allow variations
    if (input === FINAL_PHRASE || input === "I LOVE YOU!" || input === "I LUV U") {
        triggerConfetti();
        feedback.textContent = "VAULT OPENING...";
        feedback.className = "feedback-text success";
        setTimeout(() => switchStage(3, 'success'), 1500);
    } else {
        feedback.textContent = "INCORRECT PASSPHRASE";
        feedback.className = "feedback-text error";
    }
}

function triggerConfetti() {
    const end = Date.now() + 3 * 1000;
    const colors = ['#00f260', '#0575E6', '#ffffff'];

    (function frame() {
        confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: colors
        });
        confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: colors
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
}
