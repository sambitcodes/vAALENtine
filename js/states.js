/* ========================================
   INDIAN MAP GAME LOGIC
   ======================================== */

let mapStats = {
    correct: 0,
    attempts: 0,
    incorrect: 0
};
let currentStateTarget = null;
let currentQuestionType = 'name'; // 'name' or 'capital'


document.addEventListener('DOMContentLoaded', async () => {
    if (!CONFIG.indianStates) {
        await loadConfig();
    }

    await loadMapSVG();
    setupNavigation();
    initMapMusic();
});

async function loadMapSVG() {
    try {
        const response = await fetch('assets/india.svg');
        const svgText = await response.text();
        document.getElementById('india-map-container').innerHTML = svgText;

        // Remove width/height to make it responsive via CSS
        const svg = document.querySelector('#india-map-container svg');
        if (svg) {
            svg.removeAttribute('width');
            svg.removeAttribute('height');
            svg.classList.add('india-map-svg');
        }

        initMapGame();
    } catch (e) {
        console.error("Failed to load map:", e);
        document.getElementById('india-map-container').innerHTML = "<p>Error loading map. Please refresh.</p>";
    }
}

function initMapGame() {
    const states = document.querySelectorAll('#india-map-container path');
    states.forEach(state => {
        state.classList.add('state'); // Ensure class is added
        state.addEventListener('click', (e) => {
            if (state.classList.contains('correct')) return;
            SoundFX.playClick();
            handleStateClick(state);
        });
    });
}

function handleStateClick(stateElement) {
    const stateId = stateElement.id;
    currentStateTarget = CONFIG.indianStates.find(s => s.id === stateId);

    if (!currentStateTarget) return;

    // Randomly choose question type: name or capital
    currentQuestionType = Math.random() > 0.5 ? 'name' : 'capital';
    showQuestionOverlay();
}

function showQuestionOverlay() {
    const overlay = document.getElementById('questionOverlay');
    const questionText = document.getElementById('questionText');
    const optionsGrid = document.getElementById('optionsGrid');

    overlay.classList.add('active');

    let correctAnswer = currentQuestionType === 'name' ? currentStateTarget.name : currentStateTarget.capital;
    questionText.innerText = currentQuestionType === 'name' ?
        "What is the name of this state?" :
        `What is the capital of ${currentStateTarget.name}?`;

    // Generate options
    let options = [correctAnswer];
    let otherStates = CONFIG.indianStates.filter(s => s.id !== currentStateTarget.id);

    while (options.length < 4) {
        let randomState = otherStates[Math.floor(Math.random() * otherStates.length)];
        let optionValue = currentQuestionType === 'name' ? randomState.name : randomState.capital;
        if (!options.includes(optionValue)) {
            options.push(optionValue);
        }
    }

    // Shuffle options
    options = options.sort(() => Math.random() - 0.5);

    optionsGrid.innerHTML = '';
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => {
            SoundFX.playChoice();
            checkMapAnswer(opt, correctAnswer);
        };
        optionsGrid.appendChild(btn);
    });
}

function checkMapAnswer(selected, correct) {
    const overlay = document.getElementById('questionOverlay');
    const stateElement = document.getElementById(currentStateTarget.id);

    mapStats.attempts++;

    if (selected === correct) {
        mapStats.correct++;
        stateElement.classList.remove('incorrect');
        stateElement.classList.add('correct');
        SoundFX.playCorrect();
        triggerConfetti();
    } else {
        mapStats.incorrect++;
        stateElement.classList.add('incorrect');
        SoundFX.playWrong();
    }

    updateStatsDisplay();
    overlay.classList.remove('active');

    // Check if all states are completed (optional but good for end game)
    if (mapStats.correct === CONFIG.indianStates.length) {
        showMapEndGame();
    }
}

function updateStatsDisplay() {
    document.getElementById('correctCount').innerText = mapStats.correct;
    document.getElementById('attemptCount').innerText = mapStats.attempts;
    document.getElementById('wrongCount').innerText = mapStats.incorrect;
}

function showMapEndGame() {
    SoundFX.playClick();
    const percentage = mapStats.attempts > 0 ? (mapStats.correct / mapStats.attempts) * 100 : 0;

    let message = "";
    if (percentage >= 80) {
        message = "You have got a good teacher !, just kidding you learnt well";
    } else {
        message = "You have been a naughty naughty student, you deserve a spanking - just kidding you can do better.";
    }

    document.getElementById('finalGuesses').innerText = mapStats.attempts;
    document.getElementById('finalCorrect').innerText = mapStats.correct;
    document.getElementById('resultMessage').innerText = message;
    document.getElementById('gameResultModal').classList.remove('hidden');
}

function closeResultModal() {
    SoundFX.playClick();
    document.getElementById('gameResultModal').classList.add('hidden');
    // Reset game
    mapStats = { correct: 0, attempts: 0, incorrect: 0 };
    updateStatsDisplay();
    document.querySelectorAll('.state').forEach(s => s.classList.remove('correct', 'incorrect'));
}

function setupNavigation() {
    document.getElementById('endGameBtn').addEventListener('click', () => {
        showMapEndGame();
    });
}

function initMapMusic() {
    const music = new Audio('pictures/anand-map.mp3');
    music.loop = true;
    music.volume = 0.4; // Subtle volume

    const startMusic = () => {
        music.play().then(() => {
            console.log("Map music started!");
        }).catch(err => {
            console.warn("Autoplay blocked:", err);
        });
        document.removeEventListener('click', startMusic);
    };

    document.addEventListener('click', startMusic);
}
