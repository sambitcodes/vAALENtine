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
        if (window.AudioController) {
            window.AudioController.register(bgMusic);
        }
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

            // PHASE 1: SLIDE TOGETHER (0s - 1.5s)
            profilesWrapper.style.transition = 'gap 1.5s ease-in-out';
            profilesWrapper.style.gap = '0px';

            const choiceBtnContainer = document.querySelector('.choice-container');
            if (choiceBtnContainer) {
                choiceBtnContainer.style.transition = 'opacity 0.5s';
                choiceBtnContainer.style.opacity = '0';
            }

            // PHASE 2: TAPE SEQUENCE (Starts at 1.5s)
            // Function to add tape with sound
            const addTape = (position, delay) => {
                setTimeout(() => {
                    const stapleSound = new Audio('assets/staple.mp3');
                    stapleSound.volume = 0.8;
                    stapleSound.play().catch(e => console.log("Staple sound failed:", e));

                    const tape = document.createElement('div');
                    tape.classList.add('tape-strip', position);
                    profilesWrapper.appendChild(tape);
                }, delay);
            };

            // Sequence: Top -> Bottom -> Center
            addTape('top', 1500);
            addTape('bottom', 2000); // +500ms
            addTape('center', 2500); // +500ms

            // PHASE 3: REVEAL (Starts after last tape)
            setTimeout(() => {
                // Add Glitch Effect
                profilesWrapper.classList.add('glitch-active');

                setTimeout(() => {
                    // Hide Initial Cards
                    profilesWrapper.classList.add('hidden');
                    profilesWrapper.classList.remove('glitch-active');
                    if (choiceBtnContainer) choiceBtnContainer.classList.add('hidden');
                    // Remove tapes from wrapper (cleanup)
                    document.querySelectorAll('.tape-strip').forEach(t => t.remove());

                    // Show Merged Card (The "Assumption" / Opposite Card)
                    mergedContainer.classList.remove('hidden');
                    mergedContainer.innerHTML = `
                        <div class="profile-card united-card taped-paper-look">
                            <div class="tape-seam"></div>
                            <div class="profile-pic-container heart-frame">
                                <img src="pictures/prof-pics/together_prof.jpg" alt="Us" class="profile-pic">
                            </div>
                            <h2 class="card-title">Sambit & Aalen</h2>
                            <div class="card-alias">"The Dream Team"</div>
                            
                            <div class="roast-section">
                                <h3>What we assume we are...</h3>
                                <div class="roast-grid">
                                    <div class="roast-item">
                                        <span class="icon">📏</span>
                                        <p>5'8" of me + 2'11" of you = A violent ankle-biting duo.</p>
                                    </div>
                                    <div class="roast-item">
                                        <span class="icon">💥</span>
                                        <p>My witty brain + Your strong punches = Unstoppable chaos.</p>
                                    </div>
                                    <div class="roast-item">
                                        <span class="icon">⚖️</span>
                                        <p>Your total lack of empathy + My perfect emotional availability = A perfectly balanced disaster.</p>
                                    </div>
                                    <div class="roast-item">
                                        <span class="icon">🥀</span>
                                        <p>You acting like a 'Touch Me Not' + Me opening up like a lotus = The ultimate gardening challenge.</p>
                                    </div>
                                    <div class="roast-item">
                                        <span class="icon">🎭</span>
                                        <p>My heroic protagonist energy + Your boring normalcy = A movie nobody would watch.</p>
                                    </div>
                                    <div class="roast-item">
                                        <span class="icon">📝</span>
                                        <p>Me being a chaotic mess + You planning every single second = A schedule made of nightmares.</p>
                                    </div>
                                    <div class="roast-item">
                                        <span class="icon">🎢</span>
                                        <p>Me seeking every adrenaline rush + You too scared to leave the house = A solo trip for me.</p>
                                    </div>
                                    <div class="roast-item">
                                        <span class="icon">💭</span>
                                        <p>Me remembering every tiny detail + You forgetting who I am = Infinite arguments.</p>
                                    </div>
                                    <div class="roast-item">
                                        <span class="icon">🍽️</span>
                                        <p>Me saying "I don't know" + You knowing exactly what restaurant you want = A miracle.</p>
                                    </div>
                                </div>

                                <div style="margin-top: 30px; text-align: center;">
                                    <button id="realityBtn" class="btn-choice match" style="font-size: 1rem; padding: 10px 20px;">What Actually Happened 🎬</button>
                                </div>
                            </div>
                        </div>
                    `;

                    // Attach Listener to New Button
                    setTimeout(() => {
                        const realityBtn = document.getElementById('realityBtn');
                        if (realityBtn) {
                            realityBtn.addEventListener('click', () => {
                                // Hide Merged Card
                                mergedContainer.classList.add('hidden');
                                // Play Wedding Sequence (The Failure Reality)
                                playWeddingSequence();
                            });
                        }
                    }, 100);

                }, 500); // Glitch duration
            }, 3000); // 1.5s slide + 1.5s for 3 tapes
        });
    }

    // AUDIO MANAGER
    let currentBuzzer = null;

    const playBuzzer = () => {
        if (currentBuzzer) {
            currentBuzzer.pause();
            currentBuzzer.currentTime = 0;
        }
        currentBuzzer = new Audio('assets/fail_buzzer.mp3');
        currentBuzzer.volume = 1.0;
        currentBuzzer.play().catch(e => console.log("Buzzer failed:", e));
    };

    const stopBuzzer = () => {
        if (currentBuzzer) {
            currentBuzzer.pause();
            currentBuzzer.currentTime = 0;
        }
    };

    // ROBUST TEXT TO SPEECH
    const speakText = (text, gender) => {
        return new Promise((resolve) => {
            const utterance = new SpeechSynthesisUtterance(text);
            const voices = window.speechSynthesis.getVoices();

            // Priority 1: Exact "en-IN" (Indian English)
            let voice = voices.find(v => v.lang === 'en-IN' && v.name.toLowerCase().includes(gender));

            // Priority 2: Any "India" or "Hindi" in name
            if (!voice) voice = voices.find(v => (v.name.includes('India') || v.name.includes('Hindi')) && v.name.toLowerCase().includes(gender));

            // Priority 3: Google voices (common in Chrome)
            if (!voice) {
                if (gender === 'male') {
                    // Try to find a male Indian voice specifically if possible, else generic male
                    voice = voices.find(v => v.lang === 'en-IN') || voices.find(v => v.name.includes('Male'));
                } else {
                    voice = voices.find(v => v.lang === 'en-IN') || voices.find(v => v.name.includes('Female'));
                }
            }

            if (voice) {
                console.log(`Selected Voice for ${gender}:`, voice.name);
                utterance.voice = voice;
            }

            utterance.rate = 0.9;
            utterance.pitch = gender === 'male' ? 0.8 : 1.1;

            utterance.onend = () => resolve();
            utterance.onerror = () => resolve();

            window.speechSynthesis.speak(utterance);
        });
    };

    const playPopSound = () => {
        const audio = new Audio('assets/staple.mp3');
        audio.volume = 0.4;
        audio.play().catch(() => { });
    };

    async function playWeddingSequence() {
        let isAborted = false;

        // Define wait first to avoid temporal dead zone
        const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        // Create Overlay
        const overlay = document.createElement('div');
        overlay.id = 'weddingOverlay';
        overlay.classList.add('wedding-overlay');
        overlay.innerHTML = `
            <div class="wedding-stage">
                <button id="exitWeddingBtn" class="exit-btn">❌ Escape Reality</button>
                <div class="scenario-indicator" id="scenarioIndicator">Scenario 1: usage</div>
                <div class="thunder-flash"></div>
                <div class="character guy" id="guyChar">
                    <img src="pictures/prof-pics/sam_prof.jpg" alt="Groom">
                    <div class="character-body outfit-groom"></div> 
                    <div class="dialogue-box left hidden" id="guyText"></div>
                </div>
                <div class="character girl" id="girlChar">
                    <img src="pictures/prof-pics/aal_prof.jpg" alt="Bride">
                    <div class="character-body outfit-bride"></div>
                    <div class="dialogue-box right hidden" id="girlText"></div>
                </div>
            </div>
            <div class="final-curtain" id="finalCurtain">
                <h1 class="fin-text" id="finText">FIN.</h1>
                <button id="backToRealityBtn" class="btn-choice hidden">Back to Virtuality</button>
            </div>
        `;
        document.body.appendChild(overlay);

        // --- EXIT LOGIC ---
        const exitBtn = document.getElementById('exitWeddingBtn');
        const cleanupAndExit = () => {
            if (isAborted) return;
            isAborted = true;
            stopBuzzer();
            window.speechSynthesis.cancel();
            overlay.classList.add('fade-out'); // Optional: add fade-out css if wanted, otherwise just remove
            setTimeout(() => overlay.remove(), 200);
            const mergedContainer = document.getElementById('mergedCardContainer');
            if (mergedContainer) mergedContainer.classList.remove('hidden');
        };
        exitBtn.addEventListener('click', cleanupAndExit);

        // --- WELCOME SOUND ---
        await wait(500);
        if (isAborted) return;

        // Welcome Effect
        const welcomeAudio = new Audio('assets/supernatural.mp3');
        welcomeAudio.volume = 0.5;
        welcomeAudio.play().catch(() => { });
        speakText("Welcome... to the reality.", 'female');

        await wait(2000);
        if (isAborted) return;

        // Elements
        const guyChar = document.getElementById('guyChar');
        const girlChar = document.getElementById('girlChar');
        const guyText = document.getElementById('guyText');
        const girlText = document.getElementById('girlText');
        const scenarioIndicator = document.getElementById('scenarioIndicator');
        const thunderFlash = document.querySelector('.thunder-flash');
        const finalCurtain = document.getElementById('finalCurtain');
        const finText = document.getElementById('finText');
        const backBtn = document.getElementById('backToRealityBtn');

        // Back Button Logic (Finale Screen)
        backBtn.addEventListener('click', () => {
            cleanupAndExit();
            // Specifically for the finale button, we might want to trigger the "Us" card reveal logic again if needed,
            // but cleanupAndExit does unhide the mergedContainer.
            // We can also trigger confetti here if we want.
            createRoseShower();
        });



        const updateScenario = (text) => {
            if (isAborted) return;
            scenarioIndicator.textContent = text;
            scenarioIndicator.classList.add('pulse-update');
            setTimeout(() => scenarioIndicator.classList.remove('pulse-update'), 500);
        };

        const performLine = async (element, text, gender, duration) => {
            if (isAborted) return;
            stopBuzzer();
            playPopSound(); // Message appears sound
            element.textContent = text;
            element.classList.remove('hidden');
            speakText(text, gender);
            await wait(duration);
            if (isAborted) return;
            element.classList.add('hidden');
        };

        const performFail = async () => {
            if (isAborted) return;
            playBuzzer();
            const failStamp = document.createElement('div');
            failStamp.className = 'fail-stamp';
            failStamp.textContent = 'FAILED ❌';
            document.querySelector('.wedding-stage').appendChild(failStamp);
            await wait(1500);
            if (isAborted) return;
            failStamp.remove();
        };

        // Enter Stage
        updateScenario("INTRO: The Setup");
        await wait(1000);
        if (isAborted) return;

        playPopSound();
        guyChar.classList.add('enter');

        setTimeout(() => {
            if (!isAborted) {
                playPopSound();
                girlChar.classList.add('enter');
            }
        }, 200);

        await wait(2000);
        if (isAborted) return;

        // --- SCENARIO 1 ---
        updateScenario("SCENARIO 1/4: Aggression");
        await performLine(guyText, "I'm the boss here! *Aggressive*", 'male', 3000);
        if (isAborted) return;
        await performLine(girlText, "Hey, can you be a bit softer?", 'female', 3000);
        if (isAborted) return;
        await performLine(guyText, "I don't care.", 'male', 2500);
        if (isAborted) return;
        await performFail();
        if (isAborted) return;
        await wait(1000);
        if (isAborted) return;

        // --- SCENARIO 2 ---
        updateScenario("SCENARIO 2/4: Commitment");
        await performLine(guyText, "I'll introduce you when the time is right.", 'male', 3500);
        if (isAborted) return;
        await performLine(girlText, "I need time to get used to them. Let's meet early.", 'female', 4000);
        if (isAborted) return;
        await performLine(guyText, "Do you wanna sleep with them ?", 'male', 3000);
        if (isAborted) return;
        await performFail();
        if (isAborted) return;
        await wait(1000);
        if (isAborted) return;

        // --- SCENARIO 3 ---
        updateScenario("SCENARIO 3/4: Secrets");
        await performLine(guyText, "*Hides feelings* I'm hiding this so you don't get hurt.", 'male', 4000);
        if (isAborted) return;
        await performLine(girlText, "If you can't share, what's the point of me being here?", 'female', 4000);
        if (isAborted) return;
        await performLine(guyText, "I am  like this , I can't change myself.", 'male', 3000);
        if (isAborted) return;
        await performFail();
        if (isAborted) return;
        await wait(1000);
        if (isAborted) return;

        // --- SCENARIO 4 ---
        updateScenario("SCENARIO 4/4: Prejudice");
        await performLine(guyText, "I won't get along with your friend. Period.", 'male', 3500);
        if (isAborted) return;
        await performLine(girlText, "Please just give it a try?", 'female', 3000);
        if (isAborted) return;
        await performLine(guyText, "No chance! I will be a hater.", 'male', 2500);
        if (isAborted) return;
        await performFail();
        if (isAborted) return;


        // --- GRAND FINALE ---
        updateScenario("THE END");
        stopBuzzer();
        await wait(500);
        if (isAborted) return;

        // 1. Thunder & Lightning
        const thunderSound = new Audio('assets/thunder.mp3');
        thunderSound.volume = 1.0;
        thunderSound.play().catch(e => console.log("Thunder failed:", e));
        thunderFlash.classList.add('flash-now');

        // 2. Magnetic Repulsion
        await wait(200);
        if (isAborted) return;
        guyChar.classList.add('repel-right');
        girlChar.classList.add('repel-left');

        await wait(4000);
        if (isAborted) return;

        // 3. Curtains Fall
        finalCurtain.classList.add('curtain-dropped');

        await wait(1500);
        if (isAborted) return;
        finText.classList.add('show-fin');

        await wait(1000);
        if (isAborted) return;
        backBtn.classList.remove('hidden');

        // Back Button Logic
        backBtn.addEventListener('click', () => {
            // Show Final Card
            mergedContainer.classList.remove('hidden');
            overlay.remove();

            mergedContainer.innerHTML = `
                <div class="profile-card united-card taped-paper-look">
                    <!-- Horizontal Tapes -->
                    <div class="tape-strip top"></div>
                    <div class="tape-strip center"></div>
                    <div class="tape-strip bottom"></div>
                    
                    <!-- Crack Effect -->
                    <div class="crack-effect"></div>

                    <div class="profile-pic-container heart-frame">
                        <img src="pictures/prof-pics/together_prof.jpg" alt="Us" class="profile-pic">
                    </div>
                    <h2 class="card-title">Sambit & Aalen</h2>
                    <div class="card-alias">"If reality didn't hit hard."</div>
                    
                    <div class="roast-section">
                        <h3>What we could have been together...</h3>
                        <div class="roast-grid">
                            <div class="roast-item">
                                <span class="icon">📏</span>
                                <p>5'8" of me + 2'11" of you = A violent ankle-biting duo.</p>
                            </div>
                            <div class="roast-item">
                                <span class="icon">💥</span>
                                <p>My witty brain + Your strong punches = Unstoppable chaos.</p>
                            </div>
                            <div class="roast-item">
                                <span class="icon">⚖️</span>
                                <p>Your sharp empathy + My emotional unavailability = A perfectly balanced disaster.</p>
                            </div>
                            <div class="roast-item">
                                <span class="icon">🥀</span>
                                <p>You opening like a fresh flower + Me acting like a 'Touch Me Not' = The ultimate gardening challenge.</p>
                            </div>
                            <div class="roast-item">
                                <span class="icon">🎭</span>
                                <p>My antagonistic villain energy + Your dramatic protagonistic flair = A movie waiting to be directed.</p>
                            </div>
                            <div class="roast-item">
                                <span class="icon">📝</span>
                                <p>Me being tip toe organized + You saying "you do it for me" = A schedule made of dreams.</p>
                            </div>
                            <div class="roast-item">
                                <span class="icon">🎢</span>
                                <p>Me being afraid of every adventure + You trying to convince me into it = A late night session on drame.</p>
                            </div>
                            <div class="roast-item">
                                <span class="icon">💭</span>
                                <p>Me forgetting every conversation we had + You remembering when I breathed on a random day.= Infinite arguments.</p>
                            </div>
                            <div class="roast-item">
                                <span class="icon">🍽️</span>
                                <p>Me knowing what to eat + You saying "I don't know" = Starving together in the car.</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Rose Petal Shower for Finale
            createRoseShower();
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
