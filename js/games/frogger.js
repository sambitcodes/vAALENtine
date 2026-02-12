export function launchFrogger(container, callbacks) {
    // 1. Structure
    container.innerHTML = `
        <div class="frogger-game-wrapper" style="position:relative; width:100%; height:100%; background:#222; overflow:hidden;">
            <canvas id="froggerCanvas" style="display:block; width:100%; height:100%;"></canvas>
            
            <div id="frOverlay" style="position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:flex; flex-direction:column; justify-content:center; align-items:center; color:white; font-family:'Press Start 2P'; z-index:200; pointer-events:auto;">
                <h2 style="color:#ff0055; margin-bottom:20px; text-align:center;">RED FLAG DODGER</h2>
                <p style="margin-bottom:30px; font-size:0.8rem; text-align:center; line-height:1.5;">Dodge the 🚩 Red Flags!<br>Reach the 🏁 Green Flag!</p>
                <div style="background:#222; padding:10px; border:1px solid #444; margin-bottom:20px; font-size:0.7rem; color:#ccc;">
                    <strong>INSTRUCTIONS:</strong><br>
                    Use Arrow Keys / Swipe to Move.<br>
                    Avoid Red Flags 🚩.<br>
                    Reach Top to Win.<br>
                    <strong>Reward:</strong> 1 Ticket per Round.
                </div>
                <button id="frStartBtn" style="padding:15px 30px; font-family:inherit; font-size:1rem; cursor:pointer; background:linear-gradient(45deg, #ff0055, #ff4d6d); border:none; color:white; margin-bottom:10px; pointer-events:auto; position:relative; z-index:201;">START DODGING</button>
                <button id="frExitBtn" style="padding:10px 20px; font-family:inherit; font-size:0.8rem; cursor:pointer; background:#333; border:1px solid #555; color:#ccc; pointer-events:auto; position:relative; z-index:201;">EXIT TO LOBBY</button>
            </div>

            <div id="frScore" style="position:absolute; top:20px; left:20px; color:white; font-family:'Press Start 2P'; pointer-events:none;">SCORE: 0</div>
            <div id="frLives" style="position:absolute; top:20px; right:20px; color:white; font-family:'Press Start 2P'; pointer-events:none;">❤️ x 3</div>
        </div>
    `;

    // 2. Setup
    const canvas = container.querySelector('#froggerCanvas');
    const ctx = canvas.getContext('2d');
    const overlay = container.querySelector('#frOverlay');
    const scoreEl = container.querySelector('#frScore');
    const livesEl = container.querySelector('#frLives');

    // Audio
    const sfxJump = new Audio('assets/blip.mp3'); // Reuse existing
    const sfxDie = new Audio('assets/fail_buzzer.mp3');
    const sfxWin = new Audio('assets/success.mp3');

    // Game Variables
    let width, height;
    let grid = 40;
    let rows = 10;
    let cols = 10;
    let player = { x: 0, y: 0, w: 0, h: 0 };
    let lanes = []; // Array of lane objects
    let score = 0;
    let lives = 3;
    let isPlaying = false;
    let animationId;
    let speedMultiplier = 1;

    // Resize & Init Grid
    function resize() {
        if (!container.isConnected) return;
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        width = canvas.width;
        height = canvas.height;

        // Calculate grid based on height (aim for 10-12 rows)
        grid = Math.floor(height / 12);
        rows = 12;
        cols = Math.floor(width / grid);

        // Reset player if needed, but usually resetGame handles this
    }
    resize();
    window.addEventListener('resize', resize);

    // Initialize Game State
    function initGame() {
        score = 0;
        lives = 3;
        speedMultiplier = 1;
        scoreEl.textContent = `SCORE: 0`;
        livesEl.textContent = `❤️ x 3`;

        initLevel();
    }

    // Quotes
    const redFlagQuotes = [
        "Trust me, she means nothing 🚩",
        "I'm not ready for labels 🚩",
        "My ex was crazy 🚩",
        "You're too good for me 🚩",
        "I don't believe in Valentine's 🚩",
        "Crypto is the future babe 🚩",
        "I'm fluent in sarcasm 🚩",
        "My mom controls my finances 🚩",
        "I sent 'u up?' at 2 AM 🚩",
        "I ghosted her for her own good 🚩"
    ];

    let floatingTexts = [];

    function initLevel() {
        // Reset player to bottom center
        player = {
            c: Math.floor(cols / 2), // Column index
            r: rows - 1,             // Row index (bottom)
        };

        // Generate Lanes
        // Row 0: Goal (Safe)
        // Row 1-4: Obstacles
        // Row 5: Safe Zone
        // Row 6-10: Obstacles
        // Row 11: Start (Safe)

        lanes = [];

        for (let r = 0; r < rows; r++) {
            let type = 'safe';
            let speed = 0;
            let obstacles = [];

            if (r === 0) type = 'goal';
            else if (r === rows - 1) type = 'start';
            else if (r === Math.floor(rows / 2)) type = 'safe'; // Safety in middle
            else {
                type = 'road';
                // Random speed and direction
                const dir = (r % 2 === 0) ? 1 : -1;
                const baseSpeed = (2 + Math.random() * 2) * speedMultiplier;
                speed = dir * baseSpeed;

                // Create obstacles logic (stored as relative positions 0.0 to 1.0?)
                // Or absolute pixels? Pixels is easier for smooth movement.
                // Let's use array of obstacle objects {x, type}

                let numObstacles = 2 + Math.floor(Math.random() * 2); // 2 or 3
                let spacing = width / numObstacles;

                for (let i = 0; i < numObstacles; i++) {
                    obstacles.push({
                        x: i * spacing + Math.random() * (spacing / 2),
                        w: grid * 0.8, // Slightly smaller than grid
                        icon: '🚩'
                    });
                }
            }

            lanes[r] = {
                type: type,
                speed: speed, // pixels per frame
                obstacles: obstacles
            };
        }
    }

    // Input Handling
    function movePlayer(dc, dr) {
        if (!isPlaying) return;

        const newC = player.c + dc;
        const newR = player.r + dr;

        if (newC >= 0 && newC < cols && newR >= 0 && newR < rows) {
            player.c = newC;
            player.r = newR;
            // sfxJump.play().catch(()=>{}); // Optional jump sound

            // Check Win (Top Row)
            if (player.r === 0) {
                winRound();
            }
        }
    }

    function handleKey(e) {
        // Prevent default scrolling for arrow keys
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) > -1) {
            e.preventDefault();
        }

        switch (e.code) {
            case 'ArrowUp': movePlayer(0, -1); break;
            case 'ArrowDown': movePlayer(0, 1); break;
            case 'ArrowLeft': movePlayer(-1, 0); break;
            case 'ArrowRight': movePlayer(1, 0); break;
        }
    }

    // Touch Handling (Swipe)
    let touchStartX = 0;
    let touchStartY = 0;

    function handleTouchStart(e) {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }

    function handleTouchEnd(e) {
        if (!isPlaying) return;
        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;

        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;

        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal
            if (Math.abs(dx) > 30) { // Threshold
                movePlayer(dx > 0 ? 1 : -1, 0);
            }
        } else {
            // Vertical
            if (Math.abs(dy) > 30) {
                movePlayer(0, dy > 0 ? 1 : -1);
            }
        }
    }

    // Drawing
    function draw() {
        ctx.clearRect(0, 0, width, height);

        // Draw Lanes
        for (let r = 0; r < rows; r++) {
            const lane = lanes[r];
            const y = r * grid;

            // Background
            if (lane.type === 'goal') ctx.fillStyle = '#228822'; // Green goal
            else if (lane.type === 'start' || lane.type === 'safe') ctx.fillStyle = '#444'; // Safe zone
            else ctx.fillStyle = '#111'; // Road

            ctx.fillRect(0, y, width, grid);

            // Border
            ctx.strokeStyle = '#333';
            ctx.strokeRect(0, y, width, grid);

            // Obstacles
            if (lane.obstacles) {
                ctx.font = `${grid * 0.7}px serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                lane.obstacles.forEach(obs => {
                    // Draw Flag
                    ctx.fillText(obs.icon, obs.x + obs.w / 2, y + grid / 2);

                    // Debug Hitbox
                    // ctx.strokeStyle = 'red';
                    // ctx.strokeRect(obs.x, y + 5, obs.w, grid - 10);
                });
            }
        }

        // Draw Player (Bigger)
        const px = player.c * grid;
        const py = player.r * grid;

        // Shadow/Glow
        ctx.shadowColor = 'pink';
        ctx.shadowBlur = 15;

        ctx.font = `${grid * 0.9}px serif`; // Bigger font
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💖', px + grid / 2, py + grid / 2); // Use Sparkle Heart

        ctx.shadowBlur = 0; // Reset

        // Draw Floating Texts
        ctx.font = "bold 14px 'Press Start 2P', sans-serif"; // Arcade font
        ctx.fillStyle = "#ffff00"; // Neon Yellow
        ctx.strokeStyle = "black"; // Black outline
        ctx.lineWidth = 3;

        floatingTexts.forEach(txt => {
            ctx.strokeText(txt.text, txt.x, txt.y);
            ctx.fillText(txt.text, txt.x, txt.y);
        });
    }

    // Update Loop
    function update() {
        if (!isPlaying) return;

        // Update Obstacles
        for (let r = 0; r < rows; r++) {
            const lane = lanes[r];
            if (lane.type === 'road') {
                lane.obstacles.forEach(obs => {
                    obs.x += lane.speed;

                    // Wrap around
                    if (lane.speed > 0 && obs.x > width) obs.x = -obs.w;
                    if (lane.speed < 0 && obs.x + obs.w < 0) obs.x = width;
                });
            }
        }

        // Update Floating Texts
        for (let i = floatingTexts.length - 1; i >= 0; i--) {
            floatingTexts[i].y -= 0.5; // Float up slower
            floatingTexts[i].life--;
            if (floatingTexts[i].life <= 0) floatingTexts.splice(i, 1);
        }

        checkCollision();
        draw();
        animationId = requestAnimationFrame(update);
    }

    function checkCollision() {
        // Player hitbox (simplified center point)
        const pCX = player.c * grid + grid / 2;
        const pCY = player.r * grid + grid / 2;
        const pRadius = grid * 0.25; // Smaller hitbox for player (center point radius)

        const lane = lanes[player.r];
        if (lane && lane.type === 'road') {
            for (let obs of lane.obstacles) {
                const obsCX = obs.x + obs.w / 2;
                const obsCY = player.r * grid + grid / 2; // Same row

                // Distance check (Circle to Rect approximation or just simple overlap)
                // Simple AABB for flag:
                // Flag is roughly grid height.

                // Check overlap
                if (pCX + pRadius > obs.x && pCX - pRadius < obs.x + obs.w) {
                    // HIT!
                    die(obs); // Pass obstacle to die() for context
                    return;
                }
            }
        }
    }

    function die(obstacle) {
        lives--;
        livesEl.textContent = `❤️ x ${lives}`;

        // Sfx REMOVED - Loop is handled in gameOver() only!
        // sfxDie.play().catch(()=>{});

        // Pick random quote
        const quote = redFlagQuotes[Math.floor(Math.random() * redFlagQuotes.length)];

        // Spawn Floating Text at collision point
        const px = player.c * grid + grid / 2;
        const py = player.r * grid;

        floatingTexts.push({
            text: quote,
            x: width / 2, // Center text horizontally for readability
            y: py - 20,
            life: 240 // 4 seconds (Longer duration)
        });

        // Flash screen red
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fillRect(0, 0, width, height);

        if (lives <= 0) {
            gameOver();
        } else {
            // Respawn at start
            player.c = Math.floor(cols / 2);
            player.r = rows - 1;
        }
    }

    function winRound() {
        sfxWin.play().catch(() => { });
        score++; // Internal round counter
        scoreEl.textContent = `ROUNDS: ${score}`; // Or "ROUNDS: ${score}"
        speedMultiplier += 0.1; // Increase difficulty

        // Reset player
        initLevel();
    }

    function gameOver() {
        isPlaying = false;

        // AUDIO FIX: Only play on full Game Over
        sfxDie.loop = true;
        sfxDie.play().catch(() => { });

        // REWARD UPDATE: 3 tickets per round cleared
        const ticketsWon = score * 3;

        // AUTOMATIC TICKET TALLY
        if (ticketsWon > 0) {
            callbacks.onWin(ticketsWon);
        }

        overlay.innerHTML = `
            <h2 style="color:red; margin-bottom:20px;">TOO MANY RED FLAGS!</h2>
            <p>Rounds Cleared: ${score}</p>
            <h1 style="color:#00ff00; margin-bottom:20px;">+${ticketsWon} TICKETS</h1>
            <div style="display:flex; gap:10px; justify-content:center;">
                <button id="frRetryBtn" style="padding:15px; cursor:pointer; font-family:inherit; background:#ff0055; color:white; border:none; border-radius:5px;">PLAY AGAIN</button>
                <button id="frQuitBtn" style="padding:15px; cursor:pointer; font-family:inherit; background:#333; color:white; border:none; border-radius:5px;">QUIT</button>
            </div>
        `;
        overlay.style.display = 'flex';

        // Reassert listeners
        const retryBtn = container.querySelector('#frRetryBtn');
        if (retryBtn) retryBtn.onclick = () => {
            sfxDie.pause();
            sfxDie.currentTime = 0;
            startGame();
        };
        const quitBtn = container.querySelector('#frQuitBtn');
        if (quitBtn) quitBtn.onclick = () => {
            sfxDie.pause();
            sfxDie.currentTime = 0;
            callbacks.onExit();
        };
    }

    function showStartScreen() {
        // Overlay is already in HTML, just ensure it has listeners
        overlay.style.display = 'flex';

        const sBtn = container.querySelector('#frStartBtn');
        if (sBtn) sBtn.onclick = (e) => {
            e.stopPropagation();
            startGame();
        };

        const eBtn = container.querySelector('#frExitBtn');
        if (eBtn) eBtn.onclick = (e) => {
            e.stopPropagation();
            callbacks.onExit();
        };
    }

    function startGame() {
        overlay.style.display = 'none';
        initGame();
        isPlaying = true;
        update();
    }

    // Event Listeners
    window.addEventListener('keydown', handleKey);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);

    // Initial Show
    showStartScreen();

    // Cleanup
    return () => {
        isPlaying = false;
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', resize);
        window.removeEventListener('keydown', handleKey);
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchend', handleTouchEnd);
    };
}
