export function launchClaw(container, callbacks) {
    // 1. Structure
    container.innerHTML = `
        <div class="claw-game-wrapper" style="position:relative; width:100%; height:100%; background:#1a1a2e; overflow:hidden;">
            <canvas id="clawCanvas" style="display:block; width:100%; height:100%;"></canvas>
            
            <div id="clawOverlay" style="position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:flex; flex-direction:column; justify-content:center; align-items:center; color:white; font-family:'Press Start 2P'; z-index:200; pointer-events:auto;">
                <h2 style="color:#00f2ff; margin-bottom:20px; text-align:center;">CLUMSY CLAW</h2>
                <div class="clumsy-instructions" style="background:#000; padding:20px; border:2px solid #00f2ff; margin-bottom:20px; font-size:0.7rem; color:#00f2ff; line-height:1.6; max-width:80%;">
                    <strong>HOW TO PLAY:</strong><br><br>
                    1. The claw moves automatically.<br>
                    2. Click or tap to <strong>DROP</strong> IT!<br>
                    3. Catch rare prizes for big tickets!<br>
                    4. Warning: This claw is <strong>VERY CLUMSY</strong>.
                </div>
                <button id="clawStartBtn" style="padding:15px 30px; font-family:inherit; font-size:1rem; cursor:pointer; background:linear-gradient(45deg, #00f2ff, #0077ff); border:none; color:white; margin-bottom:10px; pointer-events:auto; position:relative; z-index:201; box-shadow: 0 4px 0 #004488;">START GRABBING</button>
                <button id="clawExitBtn" style="padding:10px 20px; font-family:inherit; font-size:0.8rem; cursor:pointer; background:#333; border:1px solid #555; color:#ccc; pointer-events:auto; position:relative; z-index:201;">EXIT TO LOBBY</button>
            </div>

            <div id="clawScore" style="position:absolute; top:20px; left:20px; color:#00f2ff; font-family:'Press Start 2P'; pointer-events:none;">SCORE: 0</div>
            <div id="clawTimer" style="position:absolute; top:20px; right:20px; color:#ff0055; font-family:'Press Start 2P'; pointer-events:none;">60s</div>
        </div>
    `;

    // 2. Setup
    const canvas = container.querySelector('#clawCanvas');
    const ctx = canvas.getContext('2d');
    const overlay = container.querySelector('#clawOverlay');
    const scoreEl = container.querySelector('#clawScore');
    const timerEl = container.querySelector('#clawTimer');

    // Audio placeholders
    // Audio
    const sfxGrab = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
    const sfxDrop = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'); // Descending whistle/drop
    const sfxSlide = new Audio('https://assets.mixkit.co/active_storage/sfx/2190/2190-preview.mp3'); // Mechanical hum
    const sfxRelease = new Audio('https://assets.mixkit.co/active_storage/sfx/2005/2005-preview.mp3'); // Clumsy drop/clink
    sfxSlide.loop = true;

    let width, height;
    let isPlaying = false;
    let animationId;
    let score = 0;
    let timeLeft = 60;
    let timerInterval = null;

    // Game Objects
    const claw = {
        x: 0,
        y: 50,
        w: 60,
        h: 40,
        state: 'moving', // moving, dropping, grabbing, returning
        grabbedItem: null,
        targetY: 0,
        speed: 4,
        dir: 1,
        prongAngle: 0.3, // Visual angle of prongs
        gripStrength: 1.0 // How well we held it (based on center)
    };

    let prizes = [];
    const prizeEmojis = [
        { char: '🧸', val: 5, rar: 0.8 },
        { char: '🎁', val: 10, rar: 0.6 },
        { char: '💎', val: 30, rar: 0.3 },
        { char: '🦄', val: 50, rar: 0.1 },
        { char: '🤖', val: 15, rar: 0.5 }
    ];

    function resize() {
        if (!container.isConnected) return;
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        width = canvas.width;
        height = canvas.height;
        claw.targetY = height - 100;
        initPrizes();
    }

    function initPrizes() {
        prizes = [];
        const count = 10;
        for (let i = 0; i < count; i++) {
            const p = prizeEmojis[Math.floor(Math.random() * prizeEmojis.length)];
            prizes.push({
                x: Math.random() * width,
                y: height - 50,
                char: p.char,
                val: p.val,
                rar: p.rar,
                speed: 1 + Math.random() * 2,
                dir: Math.random() > 0.5 ? 1 : -1
            });
        }
    }

    function updateLogic() {
        if (!isPlaying) return;

        // Claw Movement
        if (claw.state === 'moving') {
            claw.x += claw.speed * claw.dir;
            if (claw.x <= 0 || claw.x >= width - claw.w) claw.dir *= -1;

            // SFX Slide Management
            if (sfxSlide.paused) sfxSlide.play().catch(() => { });
        } else if (claw.state === 'dropping') {
            if (!sfxSlide.paused) sfxSlide.pause();
            claw.y += claw.speed * 2;
            claw.prongAngle = 0.5; // Wide open
            if (claw.y >= claw.targetY) {
                checkGrab();
                claw.state = 'returning';
                sfxGrab.currentTime = 0;
                sfxGrab.play().catch(() => { });
            }
        } else if (claw.state === 'returning') {
            claw.y -= claw.speed;
            claw.prongAngle = 0.1; // Closed
            if (claw.grabbedItem) {
                claw.grabbedItem.y = claw.y + claw.h;

                // PRECISION-BASED CLUMSINESS CHECK
                // Scale drop chance by how poor the grip is
                // REDUCED CHANCE: 0.001 base + up to 0.01 extra (was 0.05)
                const dropChance = 0.001 + (1 - claw.gripStrength) * 0.01;
                if (Math.random() < dropChance) {
                    claw.grabbedItem = null;
                    sfxRelease.play().catch(() => { });
                }
            }
            if (claw.y <= 50) {
                if (claw.grabbedItem) {
                    addScore(claw.grabbedItem.val);
                    claw.grabbedItem = null;
                }
                claw.state = 'moving';
                claw.y = 50;
            }
        }

        // Prize Movement
        prizes.forEach(p => {
            p.x += p.speed * p.dir;
            if (p.x <= -20) p.x = width + 20;
            if (p.x >= width + 20) p.x = -20;
        });
    }

    function checkGrab() {
        prizes.forEach((p, index) => {
            const dx = (claw.x + claw.w / 2) - p.x;
            const dy = (claw.y + claw.h) - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // "Make pickup a bit easier" - slightly larger hit detection (50 instead of 40)
            if (dist < 50 && !claw.grabbedItem) {
                // Rarity check
                if (Math.random() < p.rar) {
                    claw.grabbedItem = p;
                    // CALCULATE PRECISION (0.0 to 1.0)
                    // 1.0 means perfectly centered, 0.0 means edge of grab radius
                    claw.gripStrength = Math.max(0.1, 1 - (dist / 50));

                    prizes.splice(index, 1);
                    // Add new prize back
                    const newP = prizeEmojis[Math.floor(Math.random() * prizeEmojis.length)];
                    prizes.push({
                        x: Math.random() > 0.5 ? -20 : width + 20,
                        y: height - 50,
                        char: newP.char,
                        val: newP.val,
                        rar: newP.rar,
                        speed: 1 + Math.random() * 2,
                        dir: Math.random() > 0.5 ? 1 : -1
                    });
                }
            }
        });
    }

    function addScore(val) {
        score += val;
        scoreEl.textContent = `SCORE: ${score}`;
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);

        // 1. Draw Crane Track
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(0, 45);
        ctx.lineTo(width, 45);
        ctx.stroke();

        // 2. Draw Wire
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(claw.x + claw.w / 2, 45);
        ctx.lineTo(claw.x + claw.w / 2, claw.y);
        ctx.stroke();

        // 3. Draw Claw
        ctx.fillStyle = '#666';
        ctx.fillRect(claw.x, claw.y, claw.w, 10); // Base

        ctx.strokeStyle = '#444';
        ctx.lineWidth = 4;
        // Left prong
        ctx.beginPath();
        ctx.moveTo(claw.x, claw.y + 10);
        ctx.lineTo(claw.x - (claw.prongAngle * 60), claw.y + claw.h);
        ctx.stroke();
        // Right prong
        ctx.beginPath();
        ctx.moveTo(claw.x + claw.w, claw.y + 10);
        ctx.lineTo(claw.x + claw.w + (claw.prongAngle * 60), claw.y + claw.h);
        ctx.stroke();

        // 4. Draw Prizes
        prizes.forEach(p => {
            ctx.font = '30px serif';
            ctx.textAlign = 'center';
            ctx.fillText(p.char, p.x, p.y);
        });

        // 5. Draw Grabbed item in claw
        if (claw.grabbedItem) {
            ctx.font = '30px serif';
            ctx.textAlign = 'center';
            ctx.fillText(claw.grabbedItem.char, claw.x + claw.w / 2, claw.y + claw.h + 10);
        }
    }

    function update() {
        if (!isPlaying) return;
        updateLogic();
        draw();
        animationId = requestAnimationFrame(update);
    }

    function gameOver() {
        isPlaying = false;
        if (timerInterval) clearInterval(timerInterval);
        sfxSlide.pause();

        // Final reward
        const rand = Math.random();
        let multiplier = 1;
        let luckMsg = "Normal Luck";
        if (rand > 0.9) { multiplier = 3; luckMsg = "MEGA LUCK! (3x)"; }
        else if (rand > 0.7) { multiplier = 2; luckMsg = "SUPER LUCK! (2x)"; }

        const totalTickets = score * multiplier;

        // AUTOMATIC TICKET TALLY
        if (totalTickets > 0) {
            callbacks.onWin(totalTickets);
        }

        overlay.innerHTML = `
            <h2 style="color:#00f2ff; margin-bottom:20px;">TIME'S UP!</h2>
            <p style="font-size:0.8rem; margin-bottom:10px;">Prizes Value: ${score}</p>
            <p style="color:#ffff00; font-size:1rem; margin-bottom:20px;">${luckMsg}</p>
            <h1 style="color:#00ff00; margin-bottom:30px;">+${totalTickets} TICKETS</h1>
            <div style="display:flex; gap:10px; justify-content:center;">
                <button id="clawRetryBtn" style="padding:15px; cursor:pointer; font-family:inherit; background:#00f2ff; color:black; border:none; border-radius:5px;">PLAY AGAIN</button>
                <button id="clawQuitBtn" style="padding:15px; cursor:pointer; font-family:inherit; background:#333; color:white; border:none; border-radius:5px;">QUIT</button>
            </div>
        `;
        overlay.style.display = 'flex';

        overlay.querySelector('#clawRetryBtn').onclick = startGame;
        overlay.querySelector('#clawQuitBtn').onclick = () => callbacks.onExit();
    }

    function startGame() {
        overlay.style.display = 'none';
        isPlaying = true;
        score = 0;
        timeLeft = 60;
        scoreEl.textContent = `SCORE: 0`;
        timerEl.textContent = `${timeLeft}s`;
        update();

        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            if (!isPlaying) {
                clearInterval(timerInterval);
                return;
            }
            timeLeft--;
            timerEl.textContent = `${timeLeft}s`;
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                gameOver();
            }
        }, 1000);
    }

    function handleInput() {
        if (!isPlaying) return;
        if (claw.state === 'moving') {
            claw.state = 'dropping';
            sfxDrop.currentTime = 0;
            sfxDrop.play().catch(() => { });
        }
    }

    // Listeners
    canvas.addEventListener('mousedown', handleInput);
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleInput();
    });

    resize();
    overlay.querySelector('#clawStartBtn').onclick = startGame;
    overlay.querySelector('#clawExitBtn').onclick = callbacks.onExit;

    window.addEventListener('resize', resize);

    return () => {
        isPlaying = false;
        if (timerInterval) clearInterval(timerInterval);
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', resize);
        sfxSlide.pause();
    };
}
