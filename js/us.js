// ========================================
// US PAGE LOGIC - PROFILE CARDS
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.profile-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;

            card.style.transform = `translateY(-15px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = `translateY(0) rotateX(0) rotateY(0)`;
        });
    });

    // Background Music
    const bgMusic = document.getElementById('bgMusic');
    if (bgMusic) {
        bgMusic.volume = 0.4;
        const playMusic = () => {
            bgMusic.play().catch(e => console.log("Autoplay blocked"));
            document.removeEventListener('click', playMusic);
        };
        document.addEventListener('click', playMusic);
        bgMusic.play().catch(() => { });
    }

    // Match/Unmatch Buttons Logic
    const matchBtn = document.getElementById('matchBtn');
    const unmatchBtn = document.getElementById('unmatchBtn');
    const profilesWrapper = document.querySelector('.profiles-wrapper');
    const choiceContainer = document.querySelector('.choice-container');
    const mergedContainer = document.getElementById('mergedCardContainer');
    const blipOverlay = document.getElementById('blipOverlay');
    const countdownDisplay = document.getElementById('countdownDisplay');
    const finalMessage = document.getElementById('finalMessage');

    if (matchBtn) {
        matchBtn.addEventListener('click', () => {
            // 1. Audio: Fade Out Music
            if (bgMusic) {
                let vol = bgMusic.volume;
                const fadeOut = setInterval(() => {
                    if (vol > 0.05) {
                        vol -= 0.05;
                        bgMusic.volume = vol;
                    } else {
                        clearInterval(fadeOut);
                        bgMusic.pause();
                        bgMusic.currentTime = 0;
                    }
                }, 100);
            }

            // PHASE 1: PULSING (0s - 5s)
            const cards = document.querySelectorAll('.profile-card');
            cards.forEach(card => {
                if (card.classList.contains('aalen')) card.classList.add('cosmic-glow', 'aalen');
                if (card.classList.contains('sambit')) card.classList.add('cosmic-glow', 'sambit');
            });

            // Play Slow Heartbeat
            const heartSlow = new Audio('https://assets.mixkit.co/active_storage/sfx/212/212-preview.mp3'); // Fallback or use specific URL if found
            // Using a generic heartbeat placeholder from search results if possible, or a known one.
            // Let's use a standard heartbeat sound.
            const heartbeat = new Audio('https://assets.mixkit.co/active_storage/sfx/2069/2069-preview.mp3'); // Heartbeat slow
            heartbeat.volume = 1.0;
            heartbeat.loop = true;
            heartbeat.play().catch(e => console.log("Heartbeat sound failed:", e));


            // PHASE 2: RUSH (5s - 8s)
            setTimeout(() => {
                // Stop slow heartbeat
                heartbeat.pause();

                // Play Fast Heartbeat
                const heartFast = new Audio('https://assets.mixkit.co/active_storage/sfx/2072/2072-preview.mp3'); // Fast heartbeat
                heartFast.volume = 1.0;
                heartFast.play().catch(e => console.log("Fast heartbeat failed:", e));

                // Start Acceleration
                cards.forEach(card => card.classList.add('accelerate-center'));

                // PHASE 3: IMPACT (8s)
                setTimeout(() => {
                    // Stop fast heartbeat
                    heartFast.pause();

                    // Flash Overlay
                    let flash = document.querySelector('.flash-overlay');
                    if (!flash) {
                        flash = document.createElement('div');
                        flash.classList.add('flash-overlay');
                        document.body.appendChild(flash);
                    }
                    flash.classList.add('flash-active');

                    // Play Magic Boom Sound
                    const boomSound = new Audio('https://assets.mixkit.co/active_storage/sfx/1444/1444-preview.mp3');
                    boomSound.volume = 1.0;
                    boomSound.play().catch(e => console.log("Boom sound failed:", e));

                    // Hide Old Cards
                    profilesWrapper.classList.add('hidden');
                    // Hide Choice Buttons specifically since they are now inside wrapper or separate
                    const choiceBtnContainer = document.querySelector('.choice-container');
                    if (choiceBtnContainer) choiceBtnContainer.classList.add('hidden');

                    // REVEAL PHASE (Wait 1.5s inside flash)
                    setTimeout(() => {
                        // Play Cheering
                        const cheering = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
                        cheering.volume = 1.0;
                        cheering.play().catch(e => console.log("Cheering sound failed:", e));

                        mergedContainer.classList.remove('hidden');
                        mergedContainer.innerHTML = `
                            <div class="profile-card heart-shape">
                                <div class="profile-pic-container">
                                    <img src="pictures/prof-pics/together_prof.jpg" alt="Us" class="profile-pic">
                                </div>
                                <h2 class="card-title">Sambit & Aalen</h2>
                                <div class="card-alias">"The Reality"</div>
                                <p style="font-size: 1.1rem; margin-top: 1rem; font-weight: 500;">
                                    Two chaos agents, one beautiful mess.<br>
                                    Partners in Crime forever.
                                </p>
                            </div>
                        `;

                        // Rose Petal Shower
                        createRoseShower();

                        // Cleanup Flash
                        setTimeout(() => {
                            flash.classList.remove('flash-active');
                            flash.remove();
                        }, 3000);

                    }, 1500); // Reveal starts after flash settles

                }, 3000); // Acceleration duration (matches CSS 3s)
            }, 5000); // Glow duration (5s)
        });
    }

    function createRoseShower() {
        const colors = ['#ff004f', '#ff4d6d', '#ffb3c1', '#c9184a'];
        const duration = 8000;
        const interval = setInterval(() => {
            const petal = document.createElement('div');
            petal.classList.add('rose-petal');
            petal.style.left = `${Math.random() * 100}vw`;
            petal.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            petal.style.animationDuration = `${Math.random() * 3 + 2}s`;
            petal.style.opacity = Math.random();
            petal.style.transform = `scale(${Math.random() * 0.5 + 0.5})`;

            document.body.appendChild(petal);

            setTimeout(() => petal.remove(), 5000);
        }, 100);

        setTimeout(() => clearInterval(interval), duration);
    }

    if (unmatchBtn) {
        unmatchBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent bubbling to document which might start the music
            // Stop background music immediately
            if (bgMusic) {
                bgMusic.pause();
                bgMusic.currentTime = 0;
            }

            // Play crumbling sound effect with a 2s delay to match visuals
            const crumblingSound = new Audio('/pictures/crumbling.mp3');
            setTimeout(() => {
                crumblingSound.play().catch(e => console.log("Crumbling sound failed to play:", e));
            }, 2000);

            blipOverlay.classList.remove('hidden');
            blipOverlay.classList.add('glitching'); // Start the glitch colors
            let count = 10;

            // Disintegrate the content, but keep the overlay visible
            const contentElements = document.querySelectorAll('.nav-bar, .section');
            contentElements.forEach(el => el.classList.add('disintegrating'));

            const timer = setInterval(() => {
                count--;
                countdownDisplay.textContent = count;

                if (count <= 0) {
                    clearInterval(timer);
                    countdownDisplay.classList.add('hidden');
                    document.querySelector('.blip-message').classList.add('hidden');

                    // Display the new farewell message
                    finalMessage.textContent = "It's perfectly alright, maybe this is actually the end... Byeeee !";
                    finalMessage.classList.remove('hidden');

                    setTimeout(() => {
                        window.location.href = "https://www.google.com";
                    }, 3000);
                }
            }, 1000);
        });
    }
});
