export function launchBreakout(container, callbacks) {
    // 1. Structure
    container.innerHTML = `
        <div class="breakout-game-wrapper" style="position:relative; width:100%; height:100%; background:#111; overflow:hidden;">
            <canvas id="breakoutCanvas" style="display:block; width:100%; height:100%;"></canvas>
            
            <div id="boOverlay" style="position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:flex; flex-direction:column; justify-content:center; align-items:center; color:white; font-family:'Press Start 2P'; z-index:200; pointer-events:auto;">
                <h2 style="color:#ff0055; margin-bottom:20px; text-align:center;">HEARTBREAK BREAKOUT</h2>
                <p style="margin-bottom:30px; font-size:0.8rem; text-align:center; line-height:1.5;">Smash the emotional baggage!<br>Don't let your heart drop.</p>
                <div style="background:#222; padding:10px; border:1px solid #444; margin-bottom:20px; font-size:0.7rem; color:#ccc;">
                    <strong>INSTRUCTIONS:</strong><br>
                    Use Mouse/Touch to move Paddle.<br>
                    Hit bricks to earn points.<br>
                    Don't lose the ball!<br>
                    <strong>Reward:</strong> 1 Ticket per 50 points.
                </div>
                <!-- Added explicit IDs and z-indices -->
                <button id="boStartBtn" style="padding:15px 30px; font-family:inherit; font-size:1rem; cursor:pointer; background:linear-gradient(45deg, #ff0055, #ff4d6d); border:none; color:white; margin-bottom:10px; pointer-events:auto; position:relative; z-index:201;">START THERAPY</button>
                <button id="boExitBtn" style="padding:10px 20px; font-family:inherit; font-size:0.8rem; cursor:pointer; background:#333; border:1px solid #555; color:#ccc; pointer-events:auto; position:relative; z-index:201;">EXIT TO LOBBY</button>
            </div>

            <div id="boScore" style="position:absolute; top:20px; left:20px; color:white; font-family:'Press Start 2P'; pointer-events:none;">SCORE: 0</div>
            <div id="boLives" style="position:absolute; top:20px; right:20px; color:white; font-family:'Press Start 2P'; pointer-events:none;">❤️ x 3</div>
        </div>
    `;

    // 2. Setup
    const canvas = container.querySelector('#breakoutCanvas');
    const ctx = canvas.getContext('2d');
    const overlay = container.querySelector('#boOverlay');
    const scoreEl = container.querySelector('#boScore');
    const livesEl = container.querySelector('#boLives');

    // Audio
    const sfxPaddle = new Audio('https://assets.mixkit.co/active_storage/sfx/1084/1084-preview.mp3');
    const sfxWall = new Audio('https://assets.mixkit.co/active_storage/sfx/1085/1085-preview.mp3');
    const sfxBrick = new Audio('assets/glass_break.mp3'); // Shuttering baggage
    const sfxLose = new Audio('assets/fail_buzzer.mp3');
    const sfxWin = new Audio('assets/success.mp3');

    sfxPaddle.volume = 0.5;
    sfxWall.volume = 0.4;
    sfxBrick.volume = 0.4;

    // Resize
    let width, height;
    function resize() {
        if (!container.isConnected) return; // Safety check
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        width = canvas.width;
        height = canvas.height;
    }
    resize();
    window.addEventListener('resize', resize);

    // Game Config - SLOWER SPEED
    let paddle = { w: 120, h: 20, x: width / 2 - 60, y: height - 40, color: '#00ffff' };

    // Reduced speed from 6 to 3, dx/dy from 4 to 2
    let ball = { x: width / 2, y: height / 2, r: 8, dx: 2, dy: -2, speed: 3 };
    let bricks = [];
    let score = 0;
    let lives = 3;
    let animationId;
    let isPlaying = false;
    let maxScorePossible = 0;

    const brickLabels = ["EGO", "DRAMA", "EXES", "LIES", "FEAR", "DOUBT", "PAST", "PAIN"];
    const brickColors = ["#ff0055", "#aa00aa", "#ffcc00", "#00ff88"];

    function initBricks() {
        bricks = [];
        const rows = 4;
        const cols = 8;
        const padding = 10;
        const brickWidth = (width - (cols + 1) * padding) / cols;
        const brickHeight = 30;
        const offsetTop = 80;
        const offsetLeft = padding;

        maxScorePossible = rows * cols * 10;

        for (let c = 0; c < cols; c++) {
            for (let r = 0; r < rows; r++) {
                bricks.push({
                    x: (c * (brickWidth + padding)) + offsetLeft,
                    y: (r * (brickHeight + padding)) + offsetTop,
                    w: brickWidth,
                    h: brickHeight,
                    status: 1,
                    label: brickLabels[(c + r) % brickLabels.length],
                    color: brickColors[r % brickColors.length]
                });
            }
        }
    }

    function drawBall() {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
        ctx.closePath();
    }

    function drawPaddle() {
        ctx.beginPath();
        ctx.rect(paddle.x, paddle.y, paddle.w, paddle.h);
        ctx.fillStyle = paddle.color;
        ctx.fill();
        ctx.closePath();
    }

    function drawBricks() {
        bricks.forEach(b => {
            if (b.status === 1) {
                ctx.beginPath();
                ctx.rect(b.x, b.y, b.w, b.h);
                ctx.fillStyle = b.color;
                ctx.fill();
                ctx.closePath();

                ctx.fillStyle = "#000";
                ctx.font = "10px monospace";
                ctx.fillText(b.label, b.x + 5, b.y + 20);
            }
        });
    }

    function collisionDetection() {
        bricks.forEach(b => {
            if (b.status === 1) {
                if (ball.x > b.x && ball.x < b.x + b.w && ball.y > b.y && ball.y < b.y + b.h) {
                    ball.dy = -ball.dy;
                    b.status = 0;
                    score += 10;
                    scoreEl.textContent = `SCORE: ${score}`;
                    sfxBrick.currentTime = 0;
                    sfxBrick.play().catch(() => { });
                    if (score >= maxScorePossible) {
                        winGame();
                    }
                }
            }
        });
    }

    function update() {
        if (!isPlaying) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBricks();
        drawBall();
        drawPaddle();
        collisionDetection();

        // Wall collisions
        if (ball.x + ball.dx > width - ball.r || ball.x + ball.dx < ball.r) {
            ball.dx = -ball.dx;
            sfxWall.currentTime = 0;
            sfxWall.play().catch(() => { });
        }
        if (ball.y + ball.dy < ball.r) {
            ball.dy = -ball.dy;
            sfxWall.currentTime = 0;
            sfxWall.play().catch(() => { });
        }

        // Paddle Collision - Check if ball is moving DOWN and about to cross paddle Y
        else if (ball.dy > 0 && ball.y + ball.r + ball.dy >= paddle.y && ball.y + ball.r <= paddle.y + paddle.h) {

            // Check Horizontal Overlap
            if (ball.x >= paddle.x && ball.x <= paddle.x + paddle.w) {
                // HIT!
                ball.dy = -ball.dy;
                ball.y = paddle.y - ball.r; // SNAP to top of paddle (Fixes leak)

                sfxPaddle.currentTime = 0;
                sfxPaddle.play().catch(() => { });

                // Add some english
                let hitPoint = ball.x - (paddle.x + paddle.w / 2);
                ball.dx = hitPoint * 0.1; // Spin effect
            }
        }

        // Floor Collision (Life Loss)
        if (ball.y + ball.r > height) {
            lives--;
            livesEl.textContent = `❤️ x ${lives}`;
            if (lives <= 0) {
                gameOver();
            } else {
                resetBall();
            }
        }

        ball.x += ball.dx;
        ball.y += ball.dy;

        // Paddle Move (Mouse is updated by event listener, but keep paddle bounds)
        // Ensure paddle inside
        if (paddle.x < 0) paddle.x = 0;
        if (paddle.x + paddle.w > width) paddle.x = width - paddle.w;

        animationId = requestAnimationFrame(update);
    }

    function resetBall() {
        ball.x = width / 2;
        ball.y = height / 2;
        // Randomize start direction slightly
        ball.dx = (Math.random() < 0.5 ? -1 : 1) * ball.speed;
        ball.dy = -ball.speed;
        paddle.x = (width - paddle.w) / 2;
    }

    // Check for "Reward Threshold" even if lost
    function checkRewardThreshold() {
        // If score > 50% of max, give partial reward?
        // Let's say if score > 100 (10 bricks), give 1 ticket.
        if (score >= 100) {
            const partialReward = Math.floor(score / 50); // 1 ticket per 50 points (5 bricks)
            return partialReward;
        }
        return 0;
    }

    function gameOver() {
        isPlaying = false;
        sfxLose.play().catch(() => { });
        const reward = checkRewardThreshold();

        // AUTOMATIC TICKET TALLY
        if (reward > 0) {
            callbacks.onWin(score);
        }

        overlay.innerHTML = `
            <h2 style="color:red; margin-bottom:20px;">EMOTIONS OVERWHELMING</h2>
            <p>Score: ${score}</p>
            <h1 style="color:#00ff00; margin-bottom:20px;">+${reward} TICKETS</h1>
            <div style="display:flex; gap:10px; justify-content:center;">
                <button id="boRetryBtn" style="padding:15px; cursor:pointer; font-family:inherit; background:#ff0055; color:white; border:none; border-radius:5px;">PLAY AGAIN</button>
                <button id="boQuitBtn" style="padding:15px; cursor:pointer; font-family:inherit; background:#333; color:white; border:none; border-radius:5px;">QUIT</button>
            </div>
        `;
        overlay.style.display = 'flex';

        const retryBtn = container.querySelector('#boRetryBtn');
        if (retryBtn) retryBtn.onclick = () => startGame();
        const quitBtn = container.querySelector('#boQuitBtn');
        if (quitBtn) quitBtn.onclick = () => callbacks.onExit();
    }

    function winGame() {
        isPlaying = false;
        sfxWin.play().catch(() => { });
        const t = Math.floor(score / 50) * 3;
        callbacks.onWin(score);

        overlay.innerHTML = `
            <h2 style="color:#00ff00; margin-bottom:20px;">HEART HEALED!</h2>
            <p>Score: ${score}</p>
            <h1 style="color:#00ff00; margin-bottom:20px;">+${t} TICKETS</h1>
            <div style="display:flex; gap:10px; justify-content:center;">
                <button id="boWinRetryBtn" style="padding:15px; cursor:pointer; font-family:inherit; background:#ff0055; color:white; border:none; border-radius:5px;">PLAY AGAIN</button>
                <button id="boWinQuitBtn" style="padding:15px; cursor:pointer; font-family:inherit; background:#333; color:white; border:none; border-radius:5px;">QUIT</button>
            </div>
        `;
        overlay.style.display = 'flex';

        container.querySelector('#boWinRetryBtn').onclick = () => startGame();
        container.querySelector('#boWinQuitBtn').onclick = () => callbacks.onExit();
    }

    // RENAMED from setupOverlayOriginal to match our plan
    function showStartScreen() {
        overlay.innerHTML = `
            <h2 style="color:#ff0055; margin-bottom:20px; text-align:center;">HEARTBREAK BREAKOUT</h2>
            <p style="margin-bottom:10px; font-size:0.8rem; text-align:center; line-height:1.5;">Smash the emotional baggage!<br>Don't let your heart drop.</p>
            <div style="background:#222; padding:10px; border:1px solid #444; margin-bottom:20px; font-size:0.7rem; color:#ccc;">
                <strong>INSTRUCTIONS:</strong><br>
                Use Mouse/Touch to move Paddle.<br>
                Hit bricks to earn points.<br>
                Don't lose the ball!<br>
                <strong>Reward:</strong> 1 Ticket per 50 points.
            </div>
            <button id="boStartBtn" style="padding:15px 30px; font-family:inherit; font-size:1rem; cursor:pointer; background:linear-gradient(45deg, #ff0055, #ff4d6d); border:none; color:white; margin-bottom:10px; pointer-events:auto; position:relative; z-index:201;">START THERAPY</button>
            <button id="boExitBtn" style="padding:10px 20px; font-family:inherit; font-size:0.8rem; cursor:pointer; background:#333; border:1px solid #555; color:#ccc; pointer-events:auto; position:relative; z-index:201;">EXIT TO LOBBY</button>
        `;
        overlay.style.display = 'flex';

        console.log("Breakout: Start Screen Rendered");

        const sBtn = container.querySelector('#boStartBtn');
        if (sBtn) {
            sBtn.onclick = (e) => {
                console.log("Breakout: Start Button Clicked!");
                e.preventDefault();
                e.stopPropagation();
                try {
                    startGame();
                } catch (err) {
                    console.error("Start Error:", err);
                    alert("Error starting game: " + err.message);
                }
            };
            sBtn.ontouchstart = (e) => {
                console.log("Breakout: Start Button Touched!");
                e.preventDefault();
                e.stopPropagation();
                startGame();
            };
        } else {
            console.error("Breakout: Start Button NOT found in DOM!");
        }

        const eBtn = container.querySelector('#boExitBtn');
        if (eBtn) {
            eBtn.onclick = (e) => {
                console.log("Breakout: Exit Clicked");
                e.preventDefault();
                callbacks.onExit();
            };
        }
    }

    // Handlers
    const mouseMoveHandler = (e) => {
        if (!isPlaying) return;
        const rect = canvas.getBoundingClientRect();
        const relativeX = e.clientX - rect.left;
        if (relativeX > 0 && relativeX < canvas.width) {
            paddle.x = relativeX - paddle.w / 2;
        }
    };

    // Touch support for paddle
    const touchMoveHandler = (e) => {
        if (!isPlaying) return;
        e.preventDefault(); // Stop scroll
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const relativeX = touch.clientX - rect.left;
        if (relativeX > 0 && relativeX < canvas.width) {
            paddle.x = relativeX - paddle.w / 2;
        }
    };

    document.addEventListener("mousemove", mouseMoveHandler);
    // Add touch listener to canvas only, or document? Canvas is better.
    canvas.addEventListener("touchmove", touchMoveHandler, { passive: false });

    // Run setup
    showStartScreen();

    // Cleanup
    const cleanup = () => {
        isPlaying = false;
        cancelAnimationFrame(animationId);
        document.removeEventListener("mousemove", mouseMoveHandler);
        canvas.removeEventListener("touchmove", touchMoveHandler);
        window.removeEventListener("resize", resize);
        sfxLose.pause();
        sfxLose.currentTime = 0;
    };

    function startGame() {
        console.log("Breakout: startGame() called");
        resize();
        initBricks();
        score = 0;
        lives = 3;
        scoreEl.textContent = `SCORE: 0`;
        livesEl.textContent = `❤️ x 3`;
        overlay.style.display = 'none';
        isPlaying = true;
        resetBall();
        update();
        console.log("Breakout: Game Loop Started");
    }

    return cleanup;
}
