const canvas = document.getElementById('buzzCanvas');
const ctx = canvas.getContext('2d');
const lovePercentageEl = document.getElementById('lovePercentage');
const finalScoreDisplay = document.getElementById('finalScore');
const failMessage = document.getElementById('failMessage');
const startOverlay = document.getElementById('startOverlay');
const startBtn = document.getElementById('startBtn');
const heartLiquid = document.getElementById('heartLiquid');
const beatingHeart = document.querySelector('.beating-heart'); // Wrapper
const heartShape = document.querySelector('.heart-shape'); // Actual shape to shatter

// Audio
const sfxBreak = document.getElementById('sfxBreak');
const sfxWin = document.getElementById('sfxWin');
const sfxPulse = document.getElementById('sfxPulse');

// Effects
const heartBubbles = document.getElementById('heartBubbles');

// Difficulty UI
const diffBtns = document.querySelectorAll('.diff-btn');
const diffDesc = document.getElementById('diffDesc');

// Game State
let isPlaying = false;
let isWaitingForStart = false;
let userPos = { x: 50, y: 50 };
let pathPoints = [];
let totalDistance = 0;
let highestProgressIndex = 0;
let pulsePlaying = false;

// Difficulty Settings
let currentDifficulty = 'medium';
const difficultySettings = {
    easy: { ring: 14, complexity: 1, desc: "Large ring, gentle curves." },
    medium: { ring: 10, complexity: 2, desc: "Standard ring, messier wire." },
    hard: { ring: 7, complexity: 4, desc: "Small ring, chaos everywhere! 😈" }
};

// Configuration
const WIRE_COLOR = '#C0C0C0';
const WIRE_THICKNESS = 6;
const STAND_COLOR = '#444';
const RING_COLOR = '#FFD700';
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const MAX_TETHER_DIST = 60;

// Setup Canvas
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

/* --- Difficulty Selection --- */
diffBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        diffBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        currentDifficulty = btn.dataset.level;
        diffDesc.textContent = difficultySettings[currentDifficulty].desc;
    });
});

/* --- Path Generation --- */
function generatePath() {
    pathPoints = [];
    highestProgressIndex = 0;

    const settings = difficultySettings[currentDifficulty];
    const complexityMult = settings.complexity;

    const startX = 60;
    const startY = 400;
    const endX = 740;
    const endY = 400;

    for (let y = startY; y > 200; y -= 5) pathPoints.push({ x: startX, y: y });

    const loops = 2 + Math.floor(Math.random() * 2) + complexityMult;
    const seed1 = Math.random();
    const seed2 = Math.random();
    const seed3 = Math.random();

    for (let t = 0; t <= 1; t += 0.005) {
        let x = startX + (endX - startX) * t;
        let y = 250;
        y += Math.sin(t * Math.PI * loops + seed1 * 10) * (80 + seed2 * 40);
        if (complexityMult > 1) {
            y += Math.cos(t * Math.PI * (loops * 2.5) + seed3 * 5) * (30 * complexityMult * 0.5);
        }
        y += Math.sin(t * Math.PI * 1.5) * 50;
        y = Math.max(50, Math.min(CANVAS_HEIGHT - 50, y));
        pathPoints.push({ x: x, y: y });
    }

    for (let y = pathPoints[pathPoints.length - 1].y; y < endY; y += 5) {
        pathPoints.push({ x: endX, y: y });
    }

    totalDistance = 0;
    for (let i = 1; i < pathPoints.length; i++) {
        let dx = pathPoints[i].x - pathPoints[i - 1].x;
        let dy = pathPoints[i].y - pathPoints[i - 1].y;
        totalDistance += Math.sqrt(dx * dx + dy * dy);
    }
}

/* --- Rendering --- */
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Stands
    drawStand(60, 400, '#ff3333');
    drawStand(740, 400, '#00ff88');

    // Wire
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    drawPathPoints();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = WIRE_THICKNESS + 4;
    ctx.stroke();

    ctx.beginPath();
    drawPathPoints();
    ctx.strokeStyle = WIRE_COLOR;
    ctx.lineWidth = WIRE_THICKNESS;
    ctx.stroke();

    ctx.beginPath();
    drawPathPoints();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // VISUAL GUIDES (Arrows)
    if (isWaitingForStart) {
        drawArrow(60, 350, 60, 380, "#fff"); // Down to start
        ctx.fillStyle = "#fff";
        ctx.font = "bold 14px Poppins";
        ctx.fillText("START HERE", 20, 340);
    }

    // End Guide
    // drawArrow(740, 350, 740, 380, "#00ff88");
    ctx.fillStyle = "#00ff88";
    ctx.font = "bold 14px Poppins";
    ctx.fillText("GOAL", 720, 340);

    // Prompt
    if (isWaitingForStart) {
        const pulse = (Date.now() % 1000) / 1000;
        ctx.beginPath();
        ctx.arc(pathPoints[0].x, pathPoints[0].y, 10 + pulse * 10, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${1 - pulse})`;
        ctx.stroke();
    }

    // Player Ring
    if (isPlaying || isWaitingForStart) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
        ctx.strokeStyle = isWaitingForStart ? '#fff' : RING_COLOR;
        ctx.lineWidth = 3;

        ctx.beginPath();
        const r = difficultySettings[currentDifficulty].ring;
        ctx.moveTo(userPos.x, userPos.y + r);
        ctx.lineTo(userPos.x, userPos.y + 100);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(userPos.x, userPos.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
}

function drawArrow(x1, y1, x2, y2, color) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Arrowhead
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 10 * Math.cos(angle - Math.PI / 6), y2 - 10 * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - 10 * Math.cos(angle + Math.PI / 6), y2 - 10 * Math.sin(angle + Math.PI / 6));
    ctx.fill();
}

function drawPathPoints() {
    if (pathPoints.length === 0) return;
    ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
    pathPoints.forEach(p => ctx.lineTo(p.x, p.y));
}

function drawStand(x, y, bulbColor) {
    ctx.fillStyle = '#eee';
    ctx.fillRect(x - 20, y, 40, 10);
    ctx.fillStyle = '#666';
    ctx.fillRect(x - 3, 200, 6, y - 200);
    ctx.beginPath();
    ctx.arc(x, 190, 10, 0, Math.PI * 2);
    ctx.fillStyle = bulbColor;
    ctx.fill();
    ctx.shadowBlur = 20;
    ctx.shadowColor = bulbColor;
    ctx.stroke();
    ctx.shadowBlur = 0;
}

/* --- Logic --- */
function checkCollision() {
    if (isWaitingForStart) {
        let dx = userPos.x - pathPoints[0].x;
        let dy = userPos.y - pathPoints[0].y;
        if (Math.sqrt(dx * dx + dy * dy) < 30) {
            isPlaying = true;
            isWaitingForStart = false;
        }
        return;
    }

    if (!isPlaying) return;

    // Strict Path
    let searchRadius = 40;
    let minIdx = Math.max(0, highestProgressIndex - 5);
    let maxIdx = Math.min(pathPoints.length - 1, highestProgressIndex + searchRadius);
    let closestDistSq = Infinity;
    let closestIndex = highestProgressIndex;

    for (let i = minIdx; i <= maxIdx; i++) {
        let dx = userPos.x - pathPoints[i].x;
        let dy = userPos.y - pathPoints[i].y;
        let dSq = dx * dx + dy * dy;
        if (dSq < closestDistSq) {
            closestDistSq = dSq;
            closestIndex = i;
        }
    }

    if (closestDistSq > (MAX_TETHER_DIST * MAX_TETHER_DIST)) {
        gameOver(getCurrentScore());
        return;
    }

    if (closestIndex > highestProgressIndex) {
        highestProgressIndex = closestIndex;
    }

    // UPDATE UI
    let completion = getCurrentScore();
    lovePercentageEl.textContent = completion + '%';

    if (heartLiquid) heartLiquid.style.height = completion + '%';
    if (beatingHeart) {
        let duration = 1.5 - (completion / 100);
        beatingHeart.style.animationDuration = `${Math.max(0.4, duration)}s`;
    }

    // Audio Pulse (Endgame tension)
    if (completion > 80 && !pulsePlaying) {
        // sfxPulse.play().catch(e => console.log("Audio play failed", e));
        // pulsePlaying = true;
    }

    // Ring Collision
    let distToWire = Math.sqrt(closestDistSq);
    let r = difficultySettings[currentDifficulty].ring;
    let safeDistance = r - (WIRE_THICKNESS / 2);

    if (distToWire > safeDistance + 1) {
        gameOver(completion);
    }

    // Win
    if (completion >= 99) {
        gameWin();
    }
}

function getCurrentScore() {
    return Math.floor((highestProgressIndex / pathPoints.length) * 100);
}

function gameOver(score) {
    isPlaying = false;
    finalScoreDisplay.textContent = score;

    // EFFECTS
    // 1. Shatter Heart
    heartShape.classList.add('shattered');

    // 2. Play Shatter Sound
    sfxBreak.currentTime = 0;
    sfxBreak.play().catch(e => console.error(e));

    // 3. Stop Pulse
    sfxPulse.pause();
    pulsePlaying = false;

    if (score < 25) {
        failMessage.innerHTML = "You don't love me enough yet...<br>Play more to unlock the road to my heart!";
    } else {
        failMessage.textContent = "You touched the wire!";
    }

    setTimeout(() => {
        document.getElementById('failPopup').classList.remove('hidden');
    }, 1000); // Delay popup to see shatter
}

function gameWin() {
    isPlaying = false;

    // EFFECTS
    // 1. Bubbling Hearts
    startHeartBubbles();

    // 2. Play Win Sound
    sfxWin.currentTime = 0;
    sfxWin.play().catch(e => console.error(e));

    sfxPulse.pause();
    pulsePlaying = false;

    setTimeout(() => {
        document.getElementById('winPopup').classList.remove('hidden');
    }, 1000); // Delay popup to enjoy bubbles
}

function startHeartBubbles() {
    heartBubbles.classList.remove('hidden');
    heartBubbles.innerHTML = ''; // Clear prev

    // Spawn 50 bubbles
    for (let i = 0; i < 50; i++) {
        const d = document.createElement('div');
        d.className = 'heart-bubble';
        d.innerHTML = '❤️';
        d.style.left = Math.random() * 100 + '%';
        d.style.animationDelay = Math.random() * 2 + 's';
        d.style.fontSize = (1 + Math.random() * 2) + 'rem';
        heartBubbles.appendChild(d);
    }
}

/* --- Controls --- */
canvas.addEventListener('mousemove', (e) => {
    if (!isPlaying && !isWaitingForStart) return;
    const rect = canvas.getBoundingClientRect();
    userPos.x = e.clientX - rect.left;
    userPos.y = e.clientY - rect.top;
    checkCollision();
    requestAnimationFrame(draw);
});

window.addEventListener('keydown', (e) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }
    if (!isPlaying && !isWaitingForStart) return;
    const speed = 5;
    if (e.key === 'ArrowUp') userPos.y -= speed;
    if (e.key === 'ArrowDown') userPos.y += speed;
    if (e.key === 'ArrowLeft') userPos.x -= speed;
    if (e.key === 'ArrowRight') userPos.x += speed;
    checkCollision();
    requestAnimationFrame(draw);
});

/* --- Initialization --- */
function initGame() {
    generatePath();
    userPos = { x: 50, y: 50 };
    draw();
}

function startGame() {
    startOverlay.style.display = 'none';
    generatePath();
    highestProgressIndex = 0;

    // Reset State & UI
    lovePercentageEl.textContent = '0%';
    heartLiquid.style.height = '0%';
    beatingHeart.style.animationDuration = '1.5s';
    heartShape.classList.remove('shattered'); // Remove shatter
    heartBubbles.classList.add('hidden'); // Hide bubbles
    heartBubbles.innerHTML = '';

    isWaitingForStart = true;
    isPlaying = false;
    pulsePlaying = false;

    draw();
}

function resetGame() {
    document.getElementById('failPopup').classList.add('hidden');
    document.getElementById('winPopup').classList.add('hidden');
    startOverlay.style.display = 'flex';
    heartShape.classList.remove('shattered');
    initGame();
}

startBtn.addEventListener('click', startGame);
window.onload = initGame;
