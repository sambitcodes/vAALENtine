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

// Hints Data - Mapped by ID (lowercase 2-letter codes usually found in svg)
// Using standard ISO codes or observed IDs from SVG analysis
const STATE_HINTS = {
    "ap": "Known for the Tirumala Venkateswara Temple and spicy food!",
    "ar": "The Land of Dawn-Lit Mountains.",
    "as": "Famous for its Tea gardens and One-horned Rhinos.",
    "br": "Ancient seat of learning (Nalanda) and the Bodhi Tree.",
    "cg": "The Rice Bowl of Central India, rich in waterfalls.", // ID might be ct or cg
    "ga": "Sun, Sand, and Spices! Smallest state by area.",
    "gj": "Home of the Asiatic Lion and the Iron Man of India.",
    "hr": "Land of the Gita and Rotis.",
    "hp": "Land of Gods, apples, and snowy peaks.",
    "jk": "Paradise on Earth (Now a UT, but often on the map).",
    "jh": "Land of Forests and waterfalls like Hundru.",
    "ka": "Silicon Valley of India and Coorg coffee.",
    "kl": "God's Own Country with beautiful backwaters.",
    "mp": "The Heart of India, famous for Khajuraho and Tigers.",
    "mh": "Home of Bollywood and the Ajanta-Ellora caves.",
    "mn": "Jewel of India, famous for Loktak Lake.",
    "ml": "Abode of Clouds",
    "mz": "Land of the Blue Mountains.",
    "nl": "Land of Festivals (Hornbill Festival).",
    "or": "Famous for the Jagannath Temple and Konark Sun Temple.",
    "pb": "Land of Five Rivers and the Golden Temple.",
    "rj": "Land of Kings, forts, and the Thar Desert.",
    "sk": "Home to Kanchenjunga and organic farming.",
    "tn": "Land of Temples and Bharatanatyam.",
    "tg": "The newest state, known for Bathukamma festival.",
    "tr": "Famous for its palaces and bamboo crafts.",
    "up": "The most populous state, home to the Taj Mahal.",
    "uk": "Land of the Gods (Devbhoomi) and the Ganges origin.",
    "wb": "Cultural capital, famous for durability, Durga Puja and Rasgulla."
};

// Fallback hint
const DEFAULT_HINT = "Think about the location on the map!";

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
        state.classList.add('state');
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

    // If config lookup fails by ID, try matching name (backup)
    if (!currentStateTarget) {
        const name = stateElement.getAttribute('name');
        if (name) {
            currentStateTarget = CONFIG.indianStates.find(s => s.name.toLowerCase() === name.toLowerCase());
        }
    }

    if (!currentStateTarget) {
        console.warn("State data not found for:", stateId);
        return;
    }

    // Assign temporary ID from SVG if missing in config match
    if (!currentStateTarget.id) currentStateTarget.id = stateId;

    // Randomly choose question type: name or capital
    currentQuestionType = Math.random() > 0.8 ? 'capital' : 'name'; // Mostly names for ID
    showQuestionOverlay(stateId);
}

function showQuestionOverlay(svgId) {
    const overlay = document.getElementById('questionOverlay');
    const questionText = document.getElementById('questionText');
    const optionsGrid = document.getElementById('optionsGrid');
    const hintText = document.getElementById('hintText');
    const hintBtn = document.getElementById('hintBtn');

    overlay.classList.add('active');

    // Reset Hint
    hintText.classList.add('hidden');
    hintBtn.style.display = 'flex';

    // Set Hint Text
    // Try to find hint by 2-letter code (svgId)
    // Map some disparate IDs if needed
    let hintKey = svgId.toLowerCase();
    // Manual mapping for some complex SVG IDs if they exist in `india.svg`
    // Based on standard map files: 'in-MH' -> 'mh' etc. 
    // Our SVG seems to use 'mh', 'ap', 'up' etc. directly.

    const specificHint = STATE_HINTS[hintKey] || DEFAULT_HINT;
    hintText.textContent = specificHint;


    let correctAnswer = currentQuestionType === 'name' ? currentStateTarget.name : currentStateTarget.capital;
    questionText.innerText = currentQuestionType === 'name' ?
        "What is the name of this state?" :
        `What is the capital of ${currentStateTarget.name}?`;

    // Generate options
    let options = [correctAnswer];
    let otherStates = CONFIG.indianStates.filter(s => s.name !== currentStateTarget.name);

    while (options.length < 4) {
        let randomState = otherStates[Math.floor(Math.random() * otherStates.length)];
        let optionValue = currentQuestionType === 'name' ? randomState.name : randomState.capital;
        if (!options.includes(optionValue) && optionValue) {
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
            checkMapAnswer(opt, correctAnswer, svgId);
        };
        optionsGrid.appendChild(btn);
    });
}

function toggleHint() {
    const hintText = document.getElementById('hintText');
    const hintBtn = document.getElementById('hintBtn');

    hintText.classList.remove('hidden');
    hintBtn.style.display = 'none';
    SoundFX.playClick();
}

function checkMapAnswer(selected, correct, svgId) {
    const overlay = document.getElementById('questionOverlay');
    // We use svgId to find the element because currentStateTarget.id might come from DB config
    const stateElement = document.getElementById(svgId);

    mapStats.attempts++;

    if (selected === correct) {
        mapStats.correct++;
        if (stateElement) {
            stateElement.classList.remove('incorrect');
            stateElement.classList.add('correct');
        }
        SoundFX.playCorrect();
        if (typeof triggerConfetti === 'function') triggerConfetti();
    } else {
        mapStats.incorrect++;
        if (stateElement) stateElement.classList.add('incorrect');
        SoundFX.playWrong();
    }

    updateStatsDisplay();
    overlay.classList.remove('active');

    // Check if all states are completed (optional but good for end game)
    if (mapStats.correct >= CONFIG.indianStates.length) {
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
