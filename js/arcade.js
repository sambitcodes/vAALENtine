// Arcade Logic

// --- STATE ---
let tickets = 0;
let isUnlocked = localStorage.getItem('arcadeUnlocked') === 'true';
const userPhone = getUser();

// --- DOM ELEMENTS ---
const modal = document.getElementById('gatekeeperModal');
const ticketDisplay = document.getElementById('ticketCount');
const lobby = document.getElementById('gameLobby');
const gameContainer = document.getElementById('activeGameContainer');

// --- AUDIO ---
let arcadeMusic = new Audio('assets/mario-theme.mp3');
arcadeMusic.loop = true;
arcadeMusic.volume = 0.3; // Low volume as requested
let isMusicPlaying = false;

// Register with Global Controller
if (window.AudioController) {
    window.AudioController.register(arcadeMusic);
}

// --- QUESTIONS ---
const quizData = [
    {
        q: "What does Sambit's suffer with?",
        options: ["Amnesia", "Diabetes", "Night Blindness", "Popularity"],
        correct: 2 // 0-based index for "Night Blindness"
    },
    {
        q: "Where does Sambit want to settle later in his life?",
        options: ["Manali", "London", "In your heart", "Kerala"],
        correct: 3 // 0-based index for "Kerala"
    },
    {
        q: "What is Sambit's biggest pet peeve?",
        options: ["Cluttered Wardrobe", "Slow walkers", "Loud chewing", "Being late"],
        correct: 0 // 0-based index for "Cluttered Wardrobe"
    },
    {
        q: "What is Sambit strictly against when it comes to his future child.",
        options: ["Playing sports", "Use of Gadgets", "Eating Junk", "Having a girlfriend"],
        correct: 1 // 0-based index for "Use of Gadgets"
    },
    {
        q: "Which of these will Sambit order when ordering from Burger King?",
        options: ["Whopper", "Hashbrown", "Chicken Wrap", "Chicken Nuggets"],
        correct: 3 // 0-based index for "Chicken Nuggets"
    }
];

let currentQIndex = 0;
let score = 0;

// --- INIT ---
document.addEventListener('DOMContentLoaded', async () => {
    if (userPhone) {
        try {
            const response = await fetch(`/api/user/${userPhone}`);
            const data = await response.json();
            tickets = data.tickets || 0;
            updateTicketDisplay();
        } catch (e) {
            console.error("Failed to fetch tickets:", e);
        }
    } else {
        updateTicketDisplay();
    }

    // SHOW INTRO POPUP (Every Visit)
    const introModal = document.createElement('div');
    introModal.id = 'introModal';
    introModal.style.position = 'fixed';
    introModal.style.top = '0';
    introModal.style.left = '0';
    introModal.style.width = '100%';
    introModal.style.height = '100%';
    introModal.style.background = 'rgba(0,0,0,0.95)';
    introModal.style.zIndex = '20000';
    introModal.style.display = 'flex';
    introModal.style.justifyContent = 'center';
    introModal.style.alignItems = 'center';
    introModal.style.fontFamily = "'Press Start 2P', cursive";

    introModal.innerHTML = `
        <div style="background:#222; border:4px solid #ff0055; padding:40px; text-align:center; color:white; max-width:90%; box-shadow: 0 0 20px #ff0055;">
            <h1 style="color:#ff0055; margin-bottom:30px; line-height:1.5; font-size:1.5rem;">WELCOME TO THE<br>ARCADE OF ERRORS</h1>
            <p style="font-size:1rem; margin-bottom:40px; line-height:1.8; color:#fff;">"Because I could never<br>take you to one!" 💔</p>
            <button id="closeIntroBtn" onmouseenter="SoundFX.playHover()" style="padding:15px 30px; font-family:inherit; font-size:1rem; cursor:pointer; background:#ff0055; border:none; color:white; text-transform:uppercase; font-weight:bold; box-shadow: 0 5px 0 #990033;">ENTER ARCADE</button>
        </div>
    `;

    document.body.appendChild(introModal);
    SoundFX.playHover(); // Play a sound when the modal appears

    document.getElementById('closeIntroBtn').onclick = () => {
        SoundFX.playClick();
        introModal.style.transition = 'opacity 0.5s';
        introModal.style.opacity = '0';
        setTimeout(() => introModal.remove(), 500);
        // Check gatekeeper after intro
        checkGatekeeper();
    };

    function checkGatekeeper() {
        if (!isUnlocked) {
            startGatekeeperQuiz();
        } else {
            modal.classList.add('hidden');
            renderLobby();
        }
    }

    // Add logic to handle returning from a game if needed
    // (e.g. check URL params or state)

    // Attempt autoplay
    playArcadeMusic();

    // Fallback for autoplay policy
    document.addEventListener('click', playArcadeMusic, { once: true });
});

function playArcadeMusic() {
    if (isMusicPlaying) return;
    arcadeMusic.play().then(() => {
        isMusicPlaying = true;
        console.log("Arcade music started");
    }).catch(e => {
        console.warn("Autoplay blocked or file missing", e);
    });
}

function stopArcadeMusic() {
    arcadeMusic.pause();
    isMusicPlaying = false;
}

// --- GATEKEEPER QUIZ ---
function startGatekeeperQuiz() {
    modal.classList.remove('hidden');
    renderQuestion();
}

function renderQuestion() {
    const qContainer = document.getElementById('quizContent');
    const q = quizData[currentQIndex];

    qContainer.innerHTML = `
        <h2>Entry Challenge ${currentQIndex + 1}/5</h2>
        <p style="margin-bottom: 20px;">${q.q}</p>
        <div class="options-grid">
            ${q.options.map((opt, i) => `
                <button class="quiz-option" onmouseenter="SoundFX.playHover()" onclick="SoundFX.playClick(); handleAnswer(${i})">${opt}</button>
            `).join('')}
        </div>
        <p id="quizFeedback" class="quiz-feedback"></p>
    `;
}

window.handleAnswer = (index) => {
    const feedback = document.getElementById('quizFeedback');
    const correct = quizData[currentQIndex].correct;

    if (index === correct) {
        SoundFX.playCorrect();
        feedback.textContent = "Correct! ✅";
        feedback.className = "quiz-feedback success";
        score++;
    } else {
        SoundFX.playWrong();
        feedback.textContent = "Wrong! ❌ (But I'll let it slide because I love you ... maybe)";
        feedback.className = "quiz-feedback error";
        // score++; // Be nice logic removed to enforce correctness
    }

    setTimeout(() => {
        currentQIndex++;
        if (currentQIndex < quizData.length) {
            renderQuestion();
        } else {
            finishQuiz();
        }
    }, 1000);
};

function finishQuiz() {
    // Determine pass/fail
    if (score >= 4) { // 4/5 to pass
        localStorage.setItem('arcadeUnlocked', 'true');
        isUnlocked = true;
        addTickets(5); // Bonus
        document.getElementById('quizContent').innerHTML = `
            <h2 class="success">ACCESS GRANTED</h2>
            <p>Welcome to the Arcade of Our Errors.</p>
            <p>+5 Tickets added!</p>
            <button class="quiz-option" onmouseenter="SoundFX.playHover()" onclick="SoundFX.playClick(); enterLobby()">ENTER</button>
        `;
    } else {
        currentQIndex = 0;
        score = 0;
        document.getElementById('quizContent').innerHTML = `
            <h2 class="error">ACCESS DENIED</h2>
            <p>You don't know me well enough yet!</p>
            <button class="quiz-option" onmouseenter="SoundFX.playHover()" onclick="SoundFX.playClick(); renderQuestion()">TRY AGAIN</button>
        `;
    }
}

window.enterLobby = () => {
    modal.classList.add('hidden');
    renderLobby();
};

// --- TICKET SYSTEM ---
async function addTickets(amount) {
    if (!amount) return;
    tickets += Math.floor(amount);
    updateTicketDisplay();

    // Sync to backend
    if (userPhone) {
        try {
            await fetch(`/api/user/${userPhone}/tickets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tickets })
            });
        } catch (e) {
            console.error("Failed to sync tickets to backend:", e);
        }
    }
}

async function deductTicket(amount = 1) {
    if (tickets >= amount) {
        tickets -= amount;
        updateTicketDisplay();

        // Sync to backend
        if (userPhone) {
            try {
                await fetch(`/api/user/${userPhone}/tickets`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tickets })
                });
            } catch (e) {
                console.error("Failed to sync tickets to backend:", e);
            }
        }
        return true;
    }
    return false;
}

function updateTicketDisplay() {
    ticketDisplay.textContent = `🎟️ ${tickets}`;
}

// --- LOBBY ---
function renderLobby() {
    lobby.innerHTML = `
        <div class="game-poster" onmouseenter="SoundFX.playHover()" onclick="SoundFX.playClick(); launchGame('buzzwire')">
            <div class="game-icon">⚡</div>
            <h3>The Spark That Failed</h3>
            <p>(Avoid the Wire)</p>
        </div>
        <div class="game-poster" onmouseenter="SoundFX.playHover()" onclick="SoundFX.playClick(); launchGame('breakout')">
            <div class="game-icon">💔</div>
            <h3>Heartbreak Breakout</h3>
            <p>(Destroy Baggage)</p>
        </div>
        <div class="game-poster" onmouseenter="SoundFX.playHover()" onclick="SoundFX.playClick(); launchGame('frogger')">
            <div class="game-icon">🚩</div>
            <h3>Red Flag Dodger</h3>
            <p>(Survival)</p>
        </div>
        <div class="game-poster" onmouseenter="SoundFX.playHover()" onclick="SoundFX.playClick(); launchGame('whack')">
            <div class="game-icon">🔨</div>
            <h3>Whack-A-Regret</h3>
            <p>(Hit the Ex)</p>
        </div>
        <div class="game-poster" onmouseenter="SoundFX.playHover()" onclick="SoundFX.playClick(); launchGame('claw')">
            <div class="game-icon">🕹️</div>
            <h3>Clumsy Claw</h3>
            <p>(Catch the Dream)</p>
        </div>
    `;
}

// Game State to handle cleanup
let activeGameCleanup = null;

window.launchGame = async (gameId) => {
    // 1. Check Balance
    if (tickets <= 0) {
        alert("INSUFFICIENT TICKETS! 🎟️\nGo to the Prize Shop or beg for more!");
        return;
    }

    // 2. Confirm & Deduct
    if (!confirm(`Play ${gameId.toUpperCase()} for 1 Ticket?`)) return;
    deductTicket();

    // Stop Music
    stopArcadeMusic();

    // Hide Lobby, Show Game Container
    lobby.classList.add('hidden');
    gameContainer.classList.remove('hidden');

    gameContainer.innerHTML = '<div style="color:white;text-align:center;padding:50px;"><h2>Loading...</h2></div>';

    try {
        if (gameId === 'buzzwire') {
            // Dynamic Import
            const module = await import('./games/buzzwire.js');
            activeGameCleanup = module.launchBuzzwire(gameContainer, {
                onWin: (score) => {
                    // Score is % completion. Reward: 1 ticket per 10%? 
                    // Or just flat reward? User asked for "25 tickets for 25%".
                    // That's huge inflation. Let's do Score/10 or something. 
                    // User said: "25 tickets for 25%". Okay I will obey.
                    animateTicketGain(score);
                    addTickets(score);
                },
                onExit: () => exitGame()
            });
        } else if (gameId === 'breakout') {
            const module = await import('./games/breakout.js');
            activeGameCleanup = module.launchBreakout(gameContainer, {
                onWin: (score) => {
                    // Score is points. Reward: 1 ticket per 50 points.
                    // User requested generous rewards, but 500 tickets is too much.
                    // 1 per 50 is reasonable (10 tickets for 500 pts).
                    const t = Math.floor(score / 50) * 3; // 3 tickets per 50 points
                    animateTicketGain(t);
                    addTickets(t);
                },
                onExit: () => exitGame()
            });
        } else if (gameId === 'frogger') {
            const module = await import('./games/frogger.js');
            activeGameCleanup = module.launchFrogger(gameContainer, {
                onWin: (score) => {
                    // Reward: 1 Ticket per Screen Cleared (Score)
                    const t = Math.floor(score); // 1:1
                    animateTicketGain(t);
                    addTickets(t);
                },
                onExit: () => exitGame()
            });
        } else if (gameId === 'whack') {
            const module = await import('./games/whack.js');
            activeGameCleanup = module.launchWhack(gameContainer, {
                onWin: (tickets) => {
                    animateTicketGain(tickets);
                    addTickets(tickets);
                },
                onExit: () => exitGame()
            });
        } else if (gameId === 'claw') {
            const module = await import('./games/claw.js');
            activeGameCleanup = module.launchClaw(gameContainer, {
                onWin: (tickets) => {
                    animateTicketGain(tickets);
                    addTickets(tickets);
                },
                onExit: () => exitGame()
            });
        } else {
            gameContainer.innerHTML = `
                <div style="text-align:center; padding: 50px;">
                    <h2>${gameId.toUpperCase()} Coming Soon!</h2>
                    <p>Under Construction 🚧</p>
                    <button class="exit-btn-small" onmouseenter="SoundFX.playHover()" onclick="SoundFX.playClick(); addTickets(1); exitGame()">EXIT (Refund)</button>
                </div>
            `;
        }
    } catch (e) {
        console.error("Game Load Failed:", e);
        // Refund on error
        addTickets(1);
        gameContainer.innerHTML = `
            <div style="text-align:center; color:red;">
                <h2>Error Loading Game</h2>
                <p>${e.message}</p>
                 <button class="exit-btn-small" onmouseenter="SoundFX.playHover()" onclick="SoundFX.playClick(); exitGame()">EXIT</button>
            </div>
        `;
    }
};

window.exitGame = () => {
    if (activeGameCleanup) {
        activeGameCleanup(); // Run cleanup (remove listeners etc)
        activeGameCleanup = null;
    }
    gameContainer.classList.add('hidden');
    lobby.classList.remove('hidden');
    gameContainer.innerHTML = ''; // Cleanup DOM

    // Resume Music
    playArcadeMusic();
};

window.openShop = async () => {
    // 1. Fetch latest history
    let history = [];
    if (userPhone) {
        try {
            const res = await fetch(`/api/user/${userPhone}`);
            const data = await res.json();
            history = data.purchases || [];
        } catch (e) { console.error(e); }
    }

    const shopModal = document.createElement('div');
    shopModal.id = 'shopModal';
    shopModal.style.cssText = `
        position: fixed; top:0; left:0; width:100%; height:100%;
        background: rgba(0,0,0,0.9); z-index: 2000;
        display: flex; justify-content: center; align-items: center;
        font-family: 'Outfit', sans-serif;
    `;

    const inventory = [
        { name: "A Sweet Text", cost: 50, icon: "📱", desc: "I'll text you something nice right away." },
        { name: "A 5-min Phone Call", cost: 100, icon: "📞", desc: "Redeem for a quick catchup session." },
        { name: "Digital Letter", cost: 150, icon: "✉️", desc: "A personal hand-written note in PNG." },
        { name: "Personal Masterclass", cost: 300, icon: "🎓", desc: "Pick a topic, I'll teach it to you." },
        { name: "Virtual Date Night", cost: 500, icon: "🍷", desc: "Dinner over video call with activities." }
    ];

    shopModal.innerHTML = `
        <div style="background:#1a1a1a; width: 600px; max-height:80vh; overflow-y:auto; border: 2px solid #00f2ff; border-radius: 20px; padding: 40px; position:relative; box-shadow: 0 0 30px rgba(0,242,255,0.2);">
            <button onclick="SoundFX.playClick(); document.getElementById('shopModal').remove()" onmouseenter="SoundFX.playHover()" style="position:absolute; top:20px; right:20px; background:none; border:none; color:white; font-size:1.5rem; cursor:pointer;">&times;</button>
            <h2 style="color:#00f2ff; text-align:center; margin-bottom:30px;">🎁 PRIZE SHOP</h2>
            
            <div style="display:flex; justify-content:center; gap:20px; margin-bottom:30px;">
                <button id="shopTabBtn" onmouseenter="SoundFX.playHover()" onclick="SoundFX.playClick(); toggleShopView('items')" style="background:#00f2ff; color:black; border:none; padding:10px 20px; border-radius:5px; cursor:pointer; font-weight:bold;">STORE</button>
                <button id="historyTabBtn" onmouseenter="SoundFX.playHover()" onclick="SoundFX.playClick(); toggleShopView('history')" style="background:#333; color:white; border:none; padding:10px 20px; border-radius:5px; cursor:pointer; font-weight:bold;">HISTORY</button>
            </div>

            <div id="shopItems">
                ${inventory.map(item => `
                    <div style="background:rgba(255,255,255,0.05); border-radius:12px; padding:20px; margin-bottom:15px; display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <div style="font-size:1.5rem; margin-bottom:5px;">${item.icon} ${item.name}</div>
                            <div style="color:#888; font-size:0.85rem;">${item.desc}</div>
                        </div>
                        <button onmouseenter="SoundFX.playHover()" onclick="SoundFX.playClick(); buyItem('${item.name}', ${item.cost})" style="background:#ff0055; color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; font-weight:bold;">🎟️ ${item.cost}</button>
                    </div>
                `).join('')}
            </div>

            <div id="shopHistory" class="hidden">
                ${history.length === 0 ? '<p style="text-align:center; color:#666;">No purchases yet.</p>' :
            history.map(p => `
                        <div style="border-bottom:1px solid #333; padding:10px 0;">
                            <div style="display:flex; justify-content:space-between;">
                                 <span>${p.item_name}</span>
                                <span style="color:#888; font-size:0.8rem;">${new Date(p.timestamp).toLocaleDateString()}</span>
                            </div>
                        </div>
                    `).join('')
        }
            </div>
        </div>
    `;

    document.body.appendChild(shopModal);

    window.toggleShopView = (view) => {
        const items = document.getElementById('shopItems');
        const historyDiv = document.getElementById('shopHistory');
        const shopBtn = document.getElementById('shopTabBtn');
        const histBtn = document.getElementById('historyTabBtn');

        if (view === 'items') {
            items.classList.remove('hidden');
            historyDiv.classList.add('hidden');
            shopBtn.style.background = '#00f2ff'; shopBtn.style.color = 'black';
            histBtn.style.background = '#333'; histBtn.style.color = 'white';
        } else {
            items.classList.add('hidden');
            historyDiv.classList.remove('hidden');
            shopBtn.style.background = '#333'; shopBtn.style.color = 'white';
            histBtn.style.background = '#00f2ff'; histBtn.style.color = 'black';
        }
    };

    window.buyItem = async (name, cost) => {
        if (tickets < cost) {
            alert("Not enough tickets! Go win some more!");
            return;
        }

        if (confirm(`Buy "${name}" for ${cost} tickets?`)) {
            try {
                const res = await fetch(`/api/user/${userPhone}/purchase`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ itemName: name, cost: cost })
                });
                const data = await res.json();

                if (data.success) {
                    const sfxPurchase = new Audio('https://assets.mixkit.co/active_storage/sfx/2252/2252-preview.mp3');
                    if (window.AudioController) window.AudioController.register(sfxPurchase);
                    sfxPurchase.play().catch(e => console.warn("Purchase sound failed:", e));

                    tickets = data.newBalance;
                    updateTicketDisplay();
                    alert(`Purchased! 🎉 ${name} has been added to your history.`);
                    document.getElementById('shopModal').remove();
                }
            } catch (e) {
                alert("Purchase failed: " + e.message);
            }
        }
    };
};

// --- ANIMATION ---
function animateTicketGain(amount) {
    if (amount <= 0) return;

    // Create particles
    const particleCount = Math.min(amount, 20); // Cap at 20 particles
    const startX = window.innerWidth / 2;
    const startY = window.innerHeight / 2;
    const target = ticketDisplay.getBoundingClientRect();
    const targetX = target.left + target.width / 2;
    const targetY = target.top + target.height / 2;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.textContent = '🎟️';
        particle.style.position = 'fixed';
        particle.style.left = `${startX}px`;
        particle.style.top = `${startY}px`;
        particle.style.fontSize = '1.5rem';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '10000';
        particle.style.transition = `all 0.8s cubic-bezier(0.25, 1, 0.5, 1)`;
        // Random scatter initially
        const scatterX = (Math.random() - 0.5) * 100;
        const scatterY = (Math.random() - 0.5) * 100;

        document.body.appendChild(particle);

        // Stage 1: Scatter
        requestAnimationFrame(() => {
            particle.style.transform = `translate(${scatterX}px, ${scatterY}px) scale(1.2)`;

            // Stage 2: Fly to target
            setTimeout(() => {
                particle.style.left = `${targetX}px`;
                particle.style.top = `${targetY}px`;
                particle.style.transform = `translate(0, 0) scale(0.5)`;
                particle.style.opacity = '0';
            }, 400 + Math.random() * 200); // Slight delay stagger

            // Cleanup
            setTimeout(() => {
                particle.remove();
                // Pulse target
                ticketDisplay.style.transform = 'translateY(-50%) scale(1.2)';
                setTimeout(() => ticketDisplay.style.transform = 'translateY(-50%) scale(1)', 100);
            }, 1200);
        });
    }
}
