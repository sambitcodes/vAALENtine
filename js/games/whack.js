export function launchWhack(container, callbacks) {
    // 1. Structure
    container.innerHTML = `
        <div class="whack-game-wrapper" style="position:relative; width:100%; height:100%; background:#2c2c2c; overflow:hidden;">
            <canvas id="whackCanvas" style="display:block; width:100%; height:100%;"></canvas>
            
            <div id="whOverlay" style="position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:flex; flex-direction:column; justify-content:center; align-items:center; color:white; font-family:'Press Start 2P'; z-index:200; pointer-events:auto;">
                <h2 style="color:#ff0055; margin-bottom:20px; text-align:center;">WHACK-A-REGRET</h2>
                <p style="margin-bottom:30px; font-size:0.8rem; text-align:center; line-height:1.5;">Smash the Exes! 🔨<br>Save the Chicken! 🍗</p>
                <div style="background:#222; padding:10px; border:1px solid #444; margin-bottom:20px; font-size:0.7rem; color:#ccc;">
                    <strong>INSTRUCTIONS:</strong><br>
                    Tap 😈 to SMASH (+10 pts)<br>
                    Avoid 🍗, 💄, 👗, 👶, 🐶 (-10 pts)<br>
                    Time Limit: 60s<br>
                    <strong>Reward:</strong> Random Luck Multiplier!
                </div>
                <button id="whStartBtn" style="padding:15px 30px; font-family:inherit; font-size:1rem; cursor:pointer; background:linear-gradient(45deg, #ff0055, #ff4d6d); border:none; color:white; margin-bottom:10px; pointer-events:auto; position:relative; z-index:201;">START SMASHING</button>
                <button id="whExitBtn" style="padding:10px 20px; font-family:inherit; font-size:0.8rem; cursor:pointer; background:#333; border:1px solid #555; color:#ccc; pointer-events:auto; position:relative; z-index:201;">EXIT TO LOBBY</button>
            </div>

            <div id="whScore" style="position:absolute; top:20px; left:20px; color:white; font-family:'Press Start 2P'; pointer-events:none;">SCORE: 0</div>
            <div id="whTimer" style="position:absolute; top:20px; right:20px; color:white; font-family:'Press Start 2P'; pointer-events:none;">⏱️ 60</div>
        </div>
    `;

    // 2. Setup
    const canvas = container.querySelector('#whackCanvas');
    const ctx = canvas.getContext('2d');
    const overlay = container.querySelector('#whOverlay');
    const scoreEl = container.querySelector('#whScore');
    const timerEl = container.querySelector('#whTimer');

    // Audio
    const sfxHit = new Audio('assets/boom.mp3'); // Heavy hit
    const sfxMiss = new Audio('assets/fail_buzzer.mp3'); // Pizza hit
    const sfxSpawn = new Audio('assets/blip.mp3'); // Pop up
    const sfxWin = new Audio('assets/success.mp3');

    // Game Variables
    let width, height;
    let holes = []; // Array of hole objects {x, y, r, state, entity, timer}
    let score = 0;
    let timeLeft = 60;
    let isPlaying = false;
    let animationId;
    let gameLoopOffset = 0;
    let difficultyMultiplier = 1;
    let userPos = { x: 0, y: 0 };

    // Entity Types
    const ENTITY = {
        NONE: 0,
        REGRET: 1, // Ex
        JOY: 2     // Pizza
    };

    // Resize & Init Grid
    function resize() {
        if (!container.isConnected) return;
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        width = canvas.width;
        height = canvas.height;

        initGrid();
    }
    resize();
    window.addEventListener('resize', resize);

    function initGrid() {
        holes = [];
        const cols = 3;
        const rows = 3;
        const padding = 20;
        const holeSize = Math.min(width, height) / 4; // Dynamic size
        const startX = (width - (cols * holeSize + (cols - 1) * padding)) / 2;
        const startY = (height - (rows * holeSize + (rows - 1) * padding)) / 2 + 30; // Push down slightly

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                holes.push({
                    x: startX + c * (holeSize + padding),
                    y: startY + r * (holeSize + padding),
                    w: holeSize,
                    h: holeSize,
                    state: 0, // 0: Hidden, 1: Rising, 2: Full, 3: Hiding, 4: Hit
                    entity: ENTITY.NONE,
                    animTimer: 0,
                    type: null // '😈' or '🍕'
                });
            }
        }
    }

    function spawnEntity() {
        if (!isPlaying) return;

        // Pick random hole that is idle
        const idleHoles = holes.filter(h => h.state === 0);
        if (idleHoles.length > 0) {
            const hole = idleHoles[Math.floor(Math.random() * idleHoles.length)];

            // Determine Type
            const rand = Math.random();
            if (rand < 0.6) { // 60% chance for protected items (more frequent)
                hole.entity = ENTITY.JOY;
                const joyItems = ['🍗', '💄', '👗', '👶', '🐶'];
                hole.type = joyItems[Math.floor(Math.random() * joyItems.length)];
            } else { // 40% chance for Regret (Ex)
                hole.entity = ENTITY.REGRET;
                hole.type = '😈';
            }

            hole.state = 1; // Rising
            hole.animTimer = 0;
            // sfxSpawn.play().catch(()=>{});
        }

        // Schedule next spawn (faster as time goes on)
        const nextTime = (500 + Math.random() * 1000) / difficultyMultiplier;
        setTimeout(spawnEntity, nextTime);
    }

    function initGame() {
        score = 0;
        timeLeft = 60;
        difficultyMultiplier = 1;
        scoreEl.textContent = `SCORE: 0`;
        timerEl.textContent = `⏱️ 60`;
        holes.forEach(h => {
            h.state = 0;
            h.entity = ENTITY.NONE;
        });

        // Start Timer
        const timerInterval = setInterval(() => {
            if (!isPlaying) {
                clearInterval(timerInterval);
                return;
            }
            timeLeft--;
            timerEl.textContent = `⏱️ ${timeLeft}`;

            // Increase difficulty every 10s
            if (timeLeft % 10 === 0) difficultyMultiplier += 0.2;

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                gameOver();
            }
        }, 1000);
    }

    // Input Handling
    function handleClick(e) {
        if (!isPlaying) return;

        let clientX, clientY;
        if (e.changedTouches) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        // Check holes
        holes.forEach(h => {
            if (h.state >= 1 && h.state <= 3) { // Visible
                // IMPROVED HIT DETECTION:
                // Check if click is within the hole width AND between the current top of the entity and the hole bottom.
                const riseHeight = h.h * 0.8;
                let entityTopY = h.y;

                if (h.state === 1) entityTopY = h.y + h.h - (riseHeight * h.animTimer) - 40;
                else if (h.state === 2) entityTopY = h.y + h.h - riseHeight - 40;
                else if (h.state === 3) entityTopY = (h.y + h.h - riseHeight) + (riseHeight * h.animTimer) - 40;

                const hitBuffer = 20; // Extra forgiveness
                if (x >= h.x - hitBuffer && x <= h.x + h.w + hitBuffer && y >= entityTopY - hitBuffer && y <= h.y + h.h + hitBuffer) {
                    processHit(h);
                }
            }
        });
    }

    function handleMouseMove(e) {
        const rect = canvas.getBoundingClientRect();
        userPos.x = e.clientX - rect.left;
        userPos.y = e.clientY - rect.top;
    }

    function processHit(hole) {
        if (hole.state === 4) return; // Already hit

        if (hole.entity === ENTITY.REGRET) {
            // Good Hit
            score += 10;
            scoreEl.textContent = `SCORE: ${score}`;
            hole.state = 4; // Hit state
            hole.animTimer = 0;
            hole.hitText = "+10";
            hole.hitColor = "#00ff00";

            // Reset sfx to allow rapid fire
            sfxHit.currentTime = 0;
            sfxHit.play().catch(() => { });
        } else if (hole.entity === ENTITY.JOY) {
            // Bad Hit
            score -= 10; // Penalize
            scoreEl.textContent = `SCORE: ${score}`;
            hole.state = 4;
            hole.animTimer = 0;
            hole.hitText = "-10";
            hole.hitColor = "#ff0000";

            sfxMiss.currentTime = 0;
            sfxMiss.play().catch(() => { });
        }
    }

    // Logic Loop
    function updateLogic() {
        if (!isPlaying) return;

        holes.forEach(h => {
            // Calculate rise height
            const riseHeight = h.h * 0.8;

            if (h.state === 1) { // Rising
                h.animTimer += 0.08 * difficultyMultiplier;
                if (h.animTimer >= 1) {
                    h.state = 2; // Full
                    h.animTimer = 0;
                }
            } else if (h.state === 2) { // Full (Wait)
                h.animTimer += 0.02 * difficultyMultiplier;
                if (h.animTimer >= 1) {
                    h.state = 3; // Hiding
                    h.animTimer = 0;
                }
            } else if (h.state === 3) { // Hiding
                h.animTimer += 0.08 * difficultyMultiplier;
                if (h.animTimer >= 1) {
                    h.state = 0; // Gone
                    h.entity = ENTITY.NONE;
                }
            } else if (h.state === 4) { // Hit
                h.animTimer += 0.02;
                if (h.animTimer >= 1) {
                    h.state = 0;
                    h.entity = ENTITY.NONE;
                }
            }
        });
    }

    // Drawing
    function draw() {
        ctx.clearRect(0, 0, width, height);

        // Draw Holes
        holes.forEach(h => {
            const holecx = h.x + h.w / 2;
            const holecy = h.y + h.h - 10;
            const holeRw = h.w / 2;
            const holeRh = h.h / 4;

            // 1. Hole Back (Interior)
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.ellipse(holecx, holecy, holeRw, holeRh, 0, 0, Math.PI * 2);
            ctx.fill();

            // 2. Entity
            if (h.state !== 0) {
                let entityY = holecy; // Start at hole center
                let opacity = 1;
                const riseHeight = h.h * 0.8;

                if (h.state === 1) { // Rising
                    entityY = holecy - (riseHeight * h.animTimer);
                } else if (h.state === 2) { // Full
                    entityY = holecy - riseHeight;
                } else if (h.state === 3) { // Hiding
                    entityY = (holecy - riseHeight) + (riseHeight * h.animTimer);
                } else if (h.state === 4) { // Hit
                    entityY = (holecy - riseHeight) + (h.animTimer * 20);
                    opacity = 1 - h.animTimer;

                    // Hit Text
                    if (opacity > 0) {
                        ctx.font = "bold 20px 'Press Start 2P'";
                        ctx.fillStyle = h.hitColor;
                        ctx.textAlign = 'center';
                        ctx.fillText(h.hitText, holecx, entityY - 40);
                    }
                }

                if (opacity > 0) {
                    ctx.globalAlpha = opacity;
                    ctx.font = `${h.w * 0.6}px serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'bottom';

                    // Wobble if alive
                    const wobble = (h.state === 2) ? Math.sin(Date.now() / 100) * 3 : 0;
                    ctx.fillText(h.type || '?', holecx + wobble, entityY);
                    ctx.globalAlpha = 1;
                }
            }

            // 3. Hole Front (Rim - Mask bottom of entity)
            // Draw lower half of ellipse to act as 'front lip'
            ctx.beginPath();
            ctx.ellipse(holecx, holecy + 5, holeRw, holeRh, 0, 0, Math.PI); // Bottom half arc
            ctx.lineTo(holecx - holeRw, holecy + 5); // Close path?
            // Actually just drawing an arc with stroke is confusing visually.
            // Better strategy: draw a rect below the hole to cover entity bottom?
            // Or just redraw the bottom half of the hole ellipse with background/rim color?

            // Rim Style
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.ellipse(holecx, holecy, holeRw, holeRh, 0, 0, Math.PI * 2);
            ctx.stroke();

            // To mask effectively without complex clipping, we rely on the entity being drawn
            // *behind* a foreground element if possible. 
            // But since the hole is flat on the ground...
            // Let's rely on entityY staying logically correct.
            // If entityY > holecy, it shouldn't be drawn? 
            // We can clip to the area ABOVE the hole center line.
        });

        // 4. Hammer Cursor
        if (isPlaying) {
            ctx.save();
            ctx.translate(userPos.x, userPos.y);
            // Draw a quick hammer emoji/icon
            ctx.font = "40px serif";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // Simple rotation effect on click could be added later
            ctx.fillText('🔨', 0, 0);
            ctx.restore();
        }
    }

    // Main Loop
    function update() {
        if (!isPlaying) return;
        updateLogic();
        draw();
        animationId = requestAnimationFrame(update);
    }

    function gameOver() {
        isPlaying = false;

        // REWARD LOGIC: Random Multiplier
        // Base: Score / 20 (e.g., 200 score = 10 base)
        let base = Math.max(1, Math.floor(score / 20));
        if (score <= 0) base = 0;

        // Luck
        const rand = Math.random();
        let multiplier = 1;
        let luckMsg = "Luck: Normal";

        if (rand > 0.95) {
            multiplier = 5;
            luckMsg = "Luck: JACKPOT! (5x)";
        } else if (rand > 0.7) {
            multiplier = 2;
            luckMsg = "Luck: Lucky! (2x)";
        }

        const ticketsWon = base * multiplier;

        // AUTOMATIC TICKET TALLY
        if (ticketsWon > 0) {
            callbacks.onWin(ticketsWon);
        }

        overlay.innerHTML = `
            <h2 style="color:red; margin-bottom:20px;">TIME'S UP!</h2>
            <p>Score: ${score}</p>
            <p style="color:#ffff00; margin-bottom:10px;">${luckMsg}</p>
            <h1 style="color:#00ff00; margin-bottom:20px;">+${ticketsWon} TICKETS</h1>
            <div style="display:flex; gap:10px; justify-content:center;">
                <button id="whRetryBtn" style="padding:15px; cursor:pointer; font-family:inherit; background:#ff0055; color:white; border:none; border-radius:5px;">PLAY AGAIN</button>
                <button id="whQuitBtn" style="padding:15px; cursor:pointer; font-family:inherit; background:#333; color:white; border:none; border-radius:5px;">QUIT</button>
            </div>
        `;
        overlay.style.display = 'flex';

        const retryBtn = container.querySelector('#whRetryBtn');
        if (retryBtn) retryBtn.onclick = () => startGame();
        const quitBtn = container.querySelector('#whQuitBtn');
        if (quitBtn) quitBtn.onclick = () => callbacks.onExit();
    }

    function showStartScreen() {
        overlay.style.display = 'flex';

        const sBtn = container.querySelector('#whStartBtn');
        if (sBtn) sBtn.onclick = (e) => {
            e.stopPropagation();
            startGame();
        };

        const eBtn = container.querySelector('#whExitBtn');
        if (eBtn) eBtn.onclick = (e) => {
            e.stopPropagation();
            callbacks.onExit();
        };
    }

    function startGame() {
        overlay.style.display = 'none';
        canvas.style.cursor = 'none'; // Hide real cursor
        initGame();
        isPlaying = true;
        spawnEntity();
        update();
    }

    // Listeners
    canvas.addEventListener('mousedown', handleClick);
    canvas.addEventListener('touchstart', handleClick, { passive: false });
    canvas.addEventListener('mousemove', handleMouseMove);

    resize();
    showStartScreen();

    return () => {
        isPlaying = false;
        canvas.style.cursor = 'default';
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', resize);
        canvas.removeEventListener('mousedown', handleClick);
        canvas.removeEventListener('touchstart', handleClick);
        canvas.removeEventListener('mousemove', handleMouseMove);
    };
}
