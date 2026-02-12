export function launchBuzzwire(container, callbacks) {
    // 1. Inject HTML Structure
    container.innerHTML = `
        <div class="buzzwire-game-wrapper" style="position: relative; width: 100%; height: 100%; overflow: hidden; background: #000;">
            <!-- UI Layer (Score/Love) -->
            <div id="ui-layer" style="position:absolute; top:10px; left:0; z-index:20; width:100%; pointer-events:none; display:flex; justify-content:space-between; padding:0 20px; box-sizing:border-box;">
                <div id="scoreBoard" style="font-family:monospace; font-size:1.2rem; color:#00ff00;">LEVEL: MEDIUM</div>
                <div id="loveMeter" style="text-align:right;">
                    <div style="font-size:0.8rem; color:#ff0055;">LOVE LEVEL</div>
                    <div id="lovePercentageDisplay" style="font-size:1.5rem; color:#fff; font-weight:bold;">0%</div>
                </div>
            </div>

            <!-- Start / Difficulty Overlay -->
            <div id="startOverlay" class="overlay" style="position: absolute; top:0; left:0; width:100%; height:100%; z-index: 30; background: rgba(0,0,0,0.85); display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                <h2>Choose Your Fate</h2>
                <div class="difficulty-selector" style="margin: 20px 0; display:flex; gap:10px;">
                    <button class="diff-btn" data-level="easy" style="padding:10px; cursor:pointer;">Easy 🟢</button>
                    <button class="diff-btn selected" data-level="medium" style="padding:10px; cursor:pointer; background:#555; border:2px solid gold;">Medium 🟡</button>
                    <button class="diff-btn" data-level="hard" style="padding:10px; cursor:pointer;">Hard 🔴</button>
                </div>
                <p class="difficulty-desc" id="diffDesc" style="margin-bottom: 10px; color: #ccc;">Medium ring, curvy wire.</p>
                <p style="font-size:0.8rem; margin-top:0; margin-bottom:20px; color:#aaa;">Instruction: Guide the ring without touching the wire.<br>Don't be shaky!</p>
                <div style="display:flex; flex-direction:column; gap:10px;">
                    <button id="startBtn" class="primary-start-btn" style="padding: 15px 30px; font-size: 1.2rem; background: #ff0055; color: white; border: none; cursor: pointer; border-radius: 5px;">START GAME</button>
                    <button id="exitBtnSmall" class="exit-btn-small" style="padding: 10px; background: #333; color: #bbb; border: 1px solid #555; cursor: pointer;">EXIT TO LOBBY</button>
                </div>
            </div>

            <canvas id="buzzCanvas" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:10; display:block;"></canvas>

            <!-- Popups -->
            <div id="failPopup" class="popup" style="position: absolute; top:0; left:0; width:100%; height:100%; z-index: 40; background: rgba(50,0,0,0.9); display: none; flex-direction: column; justify-content: center; align-items: center;">
                <div class="popup-content fail" style="text-align:center;">
                    <h2 style="color: red; font-size: 2rem;">💔 Ouch!</h2>
                    <p id="failMessage" style="margin: 20px;">You touched the wire!</p>
                    <div style="display:flex; gap:10px; justify-content: center;">
                        <button id="retryBtn" style="padding:15px; cursor:pointer;">Try Again</button>
                        <button id="giveUpBtn" style="padding:15px; cursor:pointer;">Give Up</button>
                    </div>
                </div>
            </div>

            <div id="winPopup" class="popup" style="position: absolute; top:0; left:0; width:100%; height:100%; z-index: 40; background: rgba(0,50,0,0.9); display: none; flex-direction: column; justify-content: center; align-items: center;">
                <div class="popup-content win" style="text-align:center;">
                    <h2 style="color: #00ff00; font-size: 2rem;">❤️ Pure Love! ❤️</h2>
                    <p style="margin: 20px;">You made it all the way to my heart!</p>
                    <div style="display:flex; gap:10px; justify-content: center;">
                        <button id="playAgainBtn" style="padding:15px; cursor:pointer;">Play Again</button>
                        <button id="claimPrizeBtn" style="padding:15px; cursor:pointer; background: gold; color: black; font-weight: bold;">Claim 1 Ticket 🎟️</button>
                    </div>
                </div>
            </div>
            
            <div id="heartBubbles" class="heart-bubbles-container hidden"></div>
        </div>
    `;

    // 2. Styles (Scoped if possible, or assume global CSS handles most)
    // We already have CSS for .popup, .overlay etc in arcade.css or global.
    // Need canvas dimensions.

    // 3. Logic
    const canvas = container.querySelector('#buzzCanvas');
    const ctx = canvas.getContext('2d');
    const lovePercEl = container.querySelector('#lovePercentageDisplay');
    const failPopup = container.querySelector('#failPopup');
    const winPopup = container.querySelector('#winPopup');
    const startOverlay = container.querySelector('#startOverlay');
    const heartLiquid = container.querySelector('#heartLiquid');
    const heartShape = container.querySelector('.heart-shape');
    const diffDesc = container.querySelector('#diffDesc');

    // Audio (Create new instances to avoid conflict)
    const sfxBreak = new Audio('assets/glass_break.mp3');
    const sfxWin = new Audio('assets/success.mp3');
    // const sfxPulse = new Audio('assets/heartbeat_fast.mp3');

    // State
    let isPlaying = false;
    let isWaitingForStart = false;
    let userPos = { x: 50, y: 50 };
    let pathPoints = [];
    let highestProgressIndex = 0;
    let currentDifficulty = 'medium';
    let animationFrameId;

    const difficultySettings = {
        easy: { ring: 14, complexity: 1, desc: "Large ring, gentle curves." },
        medium: { ring: 10, complexity: 2, desc: "Standard ring, messier wire." },
        hard: { ring: 7, complexity: 4, desc: "Small ring, chaos everywhere! 😈" }
    };

    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 500;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // --- FUNCTIONS ---
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

        for (let t = 0; t <= 1; t += 0.005) {
            let x = startX + (endX - startX) * t;
            let y = 250 + Math.sin(t * Math.PI * loops + seed1 * 10) * (80 + seed2 * 40);
            if (complexityMult > 1) {
                y += Math.cos(t * Math.PI * (loops * 2.5)) * (30 * complexityMult * 0.5);
            }
            y = Math.max(50, Math.min(CANVAS_HEIGHT - 50, y));
            pathPoints.push({ x: x, y: y });
        }

        for (let y = pathPoints[pathPoints.length - 1].y; y < endY; y += 5) {
            pathPoints.push({ x: endX, y: y });
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // REMOVED EARLY RETURN TO FIX RENDERING BUG

        // Wire
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        if (pathPoints.length > 0) {
            ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
            pathPoints.forEach(p => ctx.lineTo(p.x, p.y));
        }
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 10;
        ctx.stroke();

        ctx.strokeStyle = '#C0C0C0';
        ctx.lineWidth = 6;
        ctx.stroke();

        if (isWaitingForStart) {
            ctx.fillStyle = "#fff";
            ctx.font = "bold 14px monospace";
            ctx.fillText("START HERE", 20, 340);
        }

        // Ring
        if (isPlaying || isWaitingForStart) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.beginPath();
            const r = difficultySettings[currentDifficulty].ring;
            ctx.moveTo(userPos.x, userPos.y + r); // Handle
            ctx.lineTo(userPos.x, userPos.y + 100);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(userPos.x, userPos.y, r, 0, Math.PI * 2); // Loop
            ctx.stroke();
        }
    }

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

        // Path Checking (Simplified for brevity)
        let closestDistSq = Infinity;
        let closestIndex = highestProgressIndex;
        let searchRadius = 50;

        // Optimization: only search around current progress
        let minIdx = Math.max(0, highestProgressIndex - 10);
        let maxIdx = Math.min(pathPoints.length - 1, highestProgressIndex + searchRadius);

        for (let i = minIdx; i <= maxIdx; i++) {
            let dx = userPos.x - pathPoints[i].x;
            let dy = userPos.y - pathPoints[i].y;
            let dSq = dx * dx + dy * dy;
            if (dSq < closestDistSq) {
                closestDistSq = dSq;
                closestIndex = i;
            }
        }

        if (closestIndex > highestProgressIndex) highestProgressIndex = closestIndex;

        // Progress
        let completion = Math.floor((highestProgressIndex / pathPoints.length) * 100);
        lovePercEl.textContent = completion + '%';
        if (heartLiquid) heartLiquid.style.height = completion + '%';

        // Collision
        let distToWire = Math.sqrt(closestDistSq);
        let r = difficultySettings[currentDifficulty].ring;

        if (distToWire > r - 3) { // 3 is half wire thickness approx
            gameOver(completion);
        }

        if (completion >= 99) gameWin();
    }

    function calculateTickets(percentage) {
        // 5 tickets for every 20%. Max 25.
        // 0-19% -> 0
        // 20-39% -> 5
        // ...
        // 100% -> 25
        return Math.floor(percentage / 20) * 5;
    }

    function gameOver(score) {
        console.log("Buzzwire: Game Over triggered! Score (Percentage):", score);
        isPlaying = false;

        const ticketsWon = calculateTickets(score);

        try {
            if (heartShape) heartShape.classList.add('shattered');
            sfxBreak.play().catch(e => console.warn("Audio play failed:", e));
        } catch (e) {
            console.error("Visual/Audio error:", e);
        }

        // AUTOMATIC TICKET TALLY
        if (ticketsWon > 0) {
            callbacks.onWin(ticketsWon);
        }

        const failTitle = failPopup.querySelector('h2');
        const failMsg = failPopup.querySelector('#failMessage');
        const failBtnContainer = failPopup.querySelector('.popup-content div');

        if (failTitle) failTitle.textContent = `⚡ ZAPPED! ⚡`;
        if (failMsg) failMsg.innerHTML = ` Progress: ${score}%<br><h1 style="color:#00ff00; margin:10px 0;">+${ticketsWon} TICKETS</h1>`;

        // Update Buttons
        failBtnContainer.innerHTML = `
            <button id="retryBtn" style="padding:15px; cursor:pointer; font-family:inherit; background:#ff0055; color:white; border:none; border-radius:5px;">PLAY AGAIN</button>
            <button id="failQuitBtn" style="padding:15px; cursor:pointer; font-family:inherit; background:#333; color:white; border:none; border-radius:5px;">QUIT</button>
        `;

        failPopup.style.display = 'flex';

        failPopup.querySelector('#retryBtn').onclick = () => {
            failPopup.style.display = 'none';
            startOverlay.style.display = 'flex';
            generatePath();
            isWaitingForStart = true;
            draw();
        };
        failPopup.querySelector('#failQuitBtn').onclick = () => callbacks.onExit();
    }

    function gameWin() {
        isPlaying = false;
        sfxWin.play().catch(() => { });
        const ticketsWon = 25; // 100% win
        callbacks.onWin(ticketsWon);

        const winContent = winPopup.querySelector('.popup-content');
        winContent.innerHTML = `
            <h2 style="color: #00ff00; font-size: 2rem;">❤️ PURE LOVE! ❤️</h2>
            <p style="margin: 20px;">You made it all the way to my heart!</p>
            <h1 style="color:#ffd700; margin-bottom:20px;">+${ticketsWon} TICKETS</h1>
            <div style="display:flex; gap:10px; justify-content: center;">
                <button id="winPlayAgainBtn" style="padding:15px; cursor:pointer; font-family:inherit; background:#ff0055; color:white; border:none; border-radius:5px;">PLAY AGAIN</button>
                <button id="winQuitBtn" style="padding:15px; cursor:pointer; font-family:inherit; background:#333; color:white; border:none; border-radius:5px;">QUIT</button>
            </div>
        `;
        winPopup.style.display = 'flex';

        winPopup.querySelector('#winPlayAgainBtn').onclick = () => {
            winPopup.style.display = 'none';
            startOverlay.style.display = 'flex';
        };
        winPopup.querySelector('#winQuitBtn').onclick = () => callbacks.onExit();
    }

    function startGame() {
        startOverlay.style.display = 'none'; // Explicit hide
        generatePath();
        highestProgressIndex = 0;
        lovePercEl.textContent = '0%';
        if (heartLiquid) heartLiquid.style.height = '0%';
        if (heartShape) heartShape.classList.remove('shattered');

        isWaitingForStart = true;
        isPlaying = false;

        draw();
        loop();
    }

    function loop() {
        if (!isPlaying && !isWaitingForStart) return;
        draw(); // Actually draw is static mostly unless animated wire
        animationFrameId = requestAnimationFrame(loop);
    }

    // --- EVENT LISTENERS ---
    const handleMouse = (e) => {
        if (!isPlaying && !isWaitingForStart) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        // Fix typo:
        const scaleY = canvas.height / rect.height;
        userPos.x = (e.clientX - rect.left) * scaleX;
        userPos.y = (e.clientY - rect.top) * scaleY;
        checkCollision();
        requestAnimationFrame(draw);
    };

    const handleTouch = (e) => {
        if (!isPlaying && !isWaitingForStart) return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const touch = e.touches[0];
        userPos.x = (touch.clientX - rect.left) * scaleX;
        userPos.y = (touch.clientY - rect.top) * scaleY;
        checkCollision();
        requestAnimationFrame(draw);
    };

    canvas.addEventListener('mousemove', handleMouse);
    canvas.addEventListener('touchmove', handleTouch, { passive: false });

    // UI Buttons - Use explicit references from container
    const difficultyBtns = container.querySelectorAll('.diff-btn');
    difficultyBtns.forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation(); // Prevent canvas clicks?
            difficultyBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            currentDifficulty = btn.dataset.level;
            const settings = difficultySettings[currentDifficulty];
            if (diffDesc) diffDesc.textContent = settings.desc;

            // FIX: Update the visual label in UI layer
            const scoreBoard = container.querySelector('#scoreBoard');
            if (scoreBoard) scoreBoard.textContent = `LEVEL: ${currentDifficulty.toUpperCase()}`;
        };
    });

    const sBtn = container.querySelector('#startBtn');
    if (sBtn) sBtn.onclick = (e) => {
        e.stopPropagation();
        startGame();
    };

    const rBtn = container.querySelector('#retryBtn');
    if (rBtn) rBtn.onclick = (e) => {
        e.stopPropagation();
        failPopup.style.display = 'none';
        winPopup.style.display = 'none';
        startOverlay.style.display = 'flex'; // Go back to start
        // Reset path visualization if needed
    };

    const guBtn = container.querySelector('#giveUpBtn');
    if (guBtn) guBtn.onclick = callbacks.onExit;

    const exBtn = container.querySelector('#exitBtnSmall');
    if (exBtn) exBtn.onclick = callbacks.onExit;

    const paBtn = container.querySelector('#playAgainBtn');
    if (paBtn) paBtn.onclick = () => {
        winPopup.style.display = 'none';
        startOverlay.style.display = 'flex';
        // Let's show overlay to choose diff again
    };

    const cpBtn = container.querySelector('#claimPrizeBtn');
    if (cpBtn) cpBtn.onclick = () => {
        const tickets = calculateTickets(100); // 25 tickets
        callbacks.onWin(tickets);
        callbacks.onExit();
    };

    // Instruction Step (User Request)
    // integrated into HTML above

    // Initial Draw
    generatePath();
    draw();

    return () => {
        cancelAnimationFrame(animationFrameId);
        canvas.removeEventListener('mousemove', handleMouse);
        canvas.removeEventListener('touchmove', handleTouch);
        if (activeGameCleanup) {
            // ... any other cleanup
        }
    };
}
function getCurrentScore() { return 100; }
