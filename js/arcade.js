// Arcade Logic

// --- STATE ---
let tickets = 5; // Default reset for testing/fairness
localStorage.setItem('arcadeTickets', '5');
let isUnlocked = localStorage.getItem('arcadeUnlocked') === 'true';

// --- DOM ELEMENTS ---
const modal = document.getElementById('gatekeeperModal');
const ticketDisplay = document.getElementById('ticketCount');
const lobby = document.getElementById('gameLobby');
const gameContainer = document.getElementById('activeGameContainer');

// --- QUESTIONS ---
const quizData = [
    {
        q: "What is Sambit's favorite food?",
        options: ["Pizza", "Biryani", "Burgers", "Tacos"],
        correct: 1 // Example index
    },
    {
        q: "Which fictional character does he relate to most?",
        options: ["Iron Man", "Batman", "Joker", "Deadpool"],
        correct: 1
    },
    {
        q: "What is his biggest pet peeve?",
        options: ["Slow walkers", "Loud chewing", "Being late", "Bad WiFi"],
        correct: 0
    },
    {
        q: "What's his go-to comfort movie?",
        options: ["The Dark Knight", "Inception", "3 Idiots", "Hera Pheri"],
        correct: 3
    },
    {
        q: "If he could have one superpower, what would it be?",
        options: ["Flight", "Invisibility", "Time Travel", "Mind Reading"],
        correct: 2
    }
];

let currentQIndex = 0;
let score = 0;

// --- INIT ---
// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    updateTicketDisplay();

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
            <button id="closeIntroBtn" style="padding:15px 30px; font-family:inherit; font-size:1rem; cursor:pointer; background:#ff0055; border:none; color:white; text-transform:uppercase; font-weight:bold; box-shadow: 0 5px 0 #990033;">ENTER ARCADE</button>
        </div>
    `;

    document.body.appendChild(introModal);

    document.getElementById('closeIntroBtn').onclick = () => {
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
});

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
                <button class="quiz-option" onclick="handleAnswer(${i})">${opt}</button>
            `).join('')}
        </div>
        <p id="quizFeedback" class="quiz-feedback"></p>
    `;
}

window.handleAnswer = (index) => {
    const feedback = document.getElementById('quizFeedback');
    const correct = quizData[currentQIndex].correct;

    if (index === correct) {
        feedback.textContent = "Correct! ✅";
        feedback.className = "quiz-feedback success";
        score++;
    } else {
        feedback.textContent = "Wrong! ❌ (But I'll let it slide because I love you ... maybe)";
        feedback.className = "quiz-feedback error";
        // score++; // Uncomment to force win for testing
        // Strictly enforcing 5/5? Or just pass?
        // Let's be lenient or reset.
        // For now, let's just proceed.
        score++; // Be nice for now, user can change logic.
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
            <button class="quiz-option" onclick="enterLobby()">ENTER</button>
        `;
    } else {
        currentQIndex = 0;
        score = 0;
        document.getElementById('quizContent').innerHTML = `
            <h2 class="error">ACCESS DENIED</h2>
            <p>You don't know me well enough yet!</p>
            <button class="quiz-option" onclick="renderQuestion()">TRY AGAIN</button>
        `;
    }
}

window.enterLobby = () => {
    modal.classList.add('hidden');
    renderLobby();
};

// --- TICKET SYSTEM ---
function addTickets(amount) {
    if (!amount) return;
    tickets += Math.floor(amount);
    localStorage.setItem('arcadeTickets', tickets.toString());
    updateTicketDisplay();
    // Animation/Sound could be added here
}

function deductTicket() {
    if (tickets > 0) {
        tickets--;
        localStorage.setItem('arcadeTickets', tickets.toString());
        updateTicketDisplay();
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
        <div class="game-poster" onclick="launchGame('buzzwire')">
            <div class="game-icon">⚡</div>
            <h3>The Spark That Failed</h3>
            <p>(Avoid the Wire)</p>
        </div>
        <div class="game-poster" onclick="launchGame('breakout')">
            <div class="game-icon">💔</div>
            <h3>Heartbreak Breakout</h3>
            <p>(Destroy Baggage)</p>
        </div>
        <div class="game-poster" onclick="launchGame('frogger')">
            <div class="game-icon">🚩</div>
            <h3>Red Flag Dodger</h3>
            <p>(Survival)</p>
        </div>
        <div class="game-poster" onclick="launchGame('whack')">
            <div class="game-icon">🔨</div>
            <h3>Whack-A-Regret</h3>
            <p>(Hit the Ex)</p>
        </div>
        <div class="game-poster" onclick="launchGame('claw')">
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
                    <button class="exit-btn-small" onclick="addTickets(1); exitGame()">EXIT (Refund)</button>
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
                 <button class="exit-btn-small" onclick="exitGame()">EXIT</button>
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
};

window.openShop = () => {
    alert("🎁 PRIZE SHOP COMING SOON! 🎁\n\nSpend your hard-earned tickets on... nothing yet!");
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
