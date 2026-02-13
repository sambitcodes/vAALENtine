// ========================================
// FINALE PAGE LOGIC
// ========================================

let noClickCount = 0;
let isNoDisappeared = false;

document.addEventListener('DOMContentLoaded', async () => {
    if (!CONFIG.valentineFinal) {
        await loadConfig();
    }
    const yesBtn = document.getElementById('yesBtn');
    const noBtn = document.getElementById('noBtn');
    const reallyNoBtn = document.getElementById('reallyNoBtn');
    const fallbackLanternContainer = document.getElementById('fallbackLanternContainer');
    const droppedNoBtn = document.getElementById('droppedNoBtn');
    const selfDestructOverlay = document.getElementById('selfDestructOverlay');
    const destructTitle = document.getElementById('destructTitle');
    const destructText = document.getElementById('destructText');
    const destructCountdown = document.getElementById('destructCountdown');
    const destructReveal = document.getElementById('destructReveal');
    const glitchSound = document.getElementById('glitchSound');
    const sirenSound = document.getElementById('sirenSound');

    // Create background lanterns
    const createBackgroundLanterns = () => {
        const lanternContainer = document.getElementById('backgroundLanterns');
        const lanternCount = 30;

        for (let i = 0; i < lanternCount; i++) {
            const lantern = document.createElement('div');
            lantern.classList.add('bg-lantern');

            // Random positioning and delay
            const randomLeft = Math.random() * 100;
            const randomDelay = Math.random() * 15;
            const randomDuration = 10 + Math.random() * 10;

            lantern.style.left = `${randomLeft}%`;
            lantern.style.animationDelay = `${randomDelay}s`;
            lantern.style.animationDuration = `${randomDuration}s`;

            lanternContainer.appendChild(lantern);
        }
    };

    createBackgroundLanterns();

    // Background Music Setup
    const bgMusic = document.getElementById('bgMusic');
    if (bgMusic) {
        bgMusic.volume = 0.4; // Reduced volume
        const playMusic = () => {
            bgMusic.play().catch(e => console.log("Audio play failed (waiting for interaction):", e));
            document.removeEventListener('click', playMusic);
        };
        // Try to play immediately, or wait for interaction
        playMusic();
        document.addEventListener('click', playMusic);
    }

    const startMatrixRain = () => {
        const canvas = document.getElementById('matrixCanvas');
        const ctx = canvas.getContext('2d');

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
        const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const nums = '0123456789';
        const alphabet = katakana + latin + nums;

        const fontSize = 16;
        const columns = canvas.width / fontSize;

        const rainDrops = [];
        for (let x = 0; x < columns; x++) {
            rainDrops[x] = 1;
        }

        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#0F0';
            ctx.font = fontSize + 'px monospace';

            for (let i = 0; i < rainDrops.length; i++) {
                const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
                ctx.fillText(text, i * fontSize, rainDrops[i] * fontSize);

                if (rainDrops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    rainDrops[i] = 0;
                }
                rainDrops[i]++;
            }
        };

        setInterval(draw, 30);
    };

    const startSelfDestruct = () => {
        // Stop background music - FORCEFULLY
        const music = document.getElementById('bgMusic');
        if (music) {
            music.pause();
            music.currentTime = 0;
            music.src = ""; // Nuke the source to be sure
        }

        // Play chaos sounds
        if (glitchSound) {
            glitchSound.currentTime = 0;
            glitchSound.volume = 0.6;
            glitchSound.play().catch(e => console.log("Glitch sound failed:", e));
        }
        if (sirenSound) {
            sirenSound.currentTime = 0;
            sirenSound.volume = 0.5;
            sirenSound.play().catch(e => console.log("Siren sound failed:", e));
        }

        // Hide main UI
        document.querySelector('.container').style.display = 'none';
        document.querySelector('.bouquet-overlay').style.display = 'none';
        document.getElementById('backgroundLanterns').style.display = 'none';

        // Show overlay
        selfDestructOverlay.classList.remove('hidden');

        // Start Matrix Rain
        startMatrixRain();

        // Warning Sequence
        let countdown = 7;
        const countdownInterval = setInterval(() => {
            countdown--;
            destructCountdown.textContent = `T-MINUS ${countdown}s`;

            if (countdown <= 0) {
                clearInterval(countdownInterval);
                // Reveal Phase
                document.querySelector('.destruct-message-container').style.display = 'none';

                // Stop chaos
                if (glitchSound) { glitchSound.pause(); glitchSound.currentTime = 0; }
                if (sirenSound) { sirenSound.pause(); sirenSound.currentTime = 0; }

                document.querySelector('.siren-overlay').style.animation = 'none'; // Stop flashing
                document.querySelector('.siren-overlay').style.opacity = '0.3';
                // Update reveal text
                document.querySelector('.reveal-subtext').innerHTML = "But I tried! Thank you for playing! ❤️<br><br><strong>Happy Valentine's Day!</strong>";
                destructReveal.classList.remove('hidden');
            }
        }, 1000);
    };

    const handleYes = () => {
        // Stop background music
        if (bgMusic) {
            bgMusic.pause();
            bgMusic.currentTime = 0;
            bgMusic.src = "";
        }

        // Play fireworks sound
        if (fireworksSound) {
            fireworksSound.currentTime = 0;
            fireworksSound.volume = 0.6;
            fireworksSound.play().catch(e => console.log("Fireworks sound failed:", e));
        }

        // Play cheering sound
        const cheeringSound = document.getElementById('cheeringSound');
        if (cheeringSound) {
            cheeringSound.currentTime = 0;
            cheeringSound.volume = 0.7; // Loud cheering
            cheeringSound.play().catch(e => console.log("Cheering sound failed:", e));
        }

        // Hide Main UI
        document.querySelector('.container').style.display = 'none';
        document.querySelector('.bouquet-overlay').style.display = 'none';
        document.getElementById('backgroundLanterns').style.display = 'none';
        document.getElementById('fallbackLanternContainer').style.display = 'none'; // Ensure fallback is hidden

        // Show Celebration Overlay
        const celebrationOverlay = document.getElementById('celebrationOverlay');
        celebrationOverlay.classList.remove('hidden');

        // Trigger Massive Confetti / Fireworks
        const duration = 15 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }; // Higher z-index to be above overlay

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);

            // Random bursts from random places
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } })); // More randomness
        }, 250);

        // Add a "School Pride" style cannon from corners
        const end = Date.now() + (15 * 1000);
        const colors = ['#ff4081', '#ffffff'];

        (function frame() {
            confetti({
                particleCount: 2,
                angle: 60,
                spread: 55,
                origin: { x: 0, y: 0.8 }, // Bottom Left
                colors: colors,
                zIndex: 9999
            });
            confetti({
                particleCount: 2,
                angle: 120,
                spread: 55,
                origin: { x: 1, y: 0.8 }, // Bottom Right
                colors: colors,
                zIndex: 9999
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    };

    const handleNo = () => {
        SoundFX.playClick();
        startSelfDestruct();
    };

    yesBtn.addEventListener('click', handleYes);

    const updateScales = () => {
        if (isNoDisappeared) return;

        noClickCount++;
        const noScale = Math.max(0, 1 - noClickCount * 0.15);
        const yesScale = 1 + noClickCount * 0.2;

        noBtn.style.position = 'absolute';

        // Random "running away" logic within the buttons container
        const container = document.getElementById('finaleButtons');
        const padding = 30;

        // Get Yes button bounds relative to container
        const yesRect = yesBtn.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        const yesLeft = yesRect.left - containerRect.left;
        const yesTop = yesRect.top - containerRect.top;
        const yesRight = yesLeft + yesRect.width;
        const yesBottom = yesTop + yesRect.height;

        let randomX, randomY;
        let attempts = 0;
        const maxAttempts = 50;

        // Attempt to find a position that doesn't overlap with Yes button
        do {
            const maxX = container.offsetWidth - noBtn.offsetWidth - padding;
            const maxY = container.offsetHeight - noBtn.offsetHeight - padding;
            randomX = padding + Math.random() * (maxX - padding);
            randomY = padding + Math.random() * (maxY - padding);

            const noRight = randomX + noBtn.offsetWidth;
            const noBottom = randomY + noBtn.offsetHeight;

            // Overlap check
            const isOverlapping = !(randomX > yesRight ||
                noRight < yesLeft ||
                randomY > yesBottom ||
                noBottom < yesTop);

            if (!isOverlapping) break;
            attempts++;
        } while (attempts < maxAttempts);

        noBtn.style.left = `${randomX}px`;
        noBtn.style.top = `${randomY}px`;
        noBtn.style.transform = `scale(${noScale})`;
        yesBtn.style.transform = `scale(${yesScale})`;

        if (noScale <= 0.15) {
            noBtn.style.opacity = '0';
            noBtn.style.pointerEvents = 'none';
            isNoDisappeared = true;

            // Wait 1 second before dropping the lantern
            setTimeout(() => {
                fallbackLanternContainer.classList.remove('hidden');
                // Allow reflow
                void fallbackLanternContainer.offsetWidth;
                fallbackLanternContainer.classList.add('descend');

                // Show note after lantern settles
                setTimeout(() => {
                    const note = document.getElementById('finaleNote');
                    note.classList.remove('hidden');
                    note.classList.add('visible');
                }, 2500);
            }, 800);
        }
    };

    noBtn.addEventListener('mouseover', () => {
        SoundFX.playHover();
        updateScales();
    });

    noBtn.addEventListener('click', (e) => {
        e.preventDefault();
        SoundFX.playClick();
        updateScales();
    });

    droppedNoBtn.addEventListener('click', handleNo);
    reallyNoBtn.addEventListener('click', handleNo);
});
