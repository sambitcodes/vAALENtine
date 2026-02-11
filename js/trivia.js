// ========================================
// TRIVIA PAGE LOGIC
// ========================================

let currentCategory = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let correctCount = 0;
let wrongCount = 0;
let seenQuestions = JSON.parse(localStorage.getItem('triviaSeen')) || {}; // { category: [qIndex1, qIndex2] }

// Multimedia Assets (Placeholders - Replace with real URLs)
const MEDIA = {
    sounds: {
        correct: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', // Ding
        incorrect: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3' // Buzz
    },
    gifs: {
        'Modern Family': {
            correct: 'https://media.giphy.com/media/l2JhL1AzTxORUTDl6/giphy.gif', // Phil thumbs up
            incorrect: 'https://media.giphy.com/media/3o7TKr3nzbh5WgCFxe/giphy.gif' // Claire annoyed
        },
        "Grey's Anatomy": {
            correct: 'https://media.giphy.com/media/3o7Tvr4po4Fn6QV0kM/giphy.gif', // Dancing
            incorrect: 'https://media.giphy.com/media/26ufcVAp3AiJJsrIs/giphy.gif' // Crying
        },
        'Hospital Playlist': {
            correct: 'https://media.tenor.com/images/1c8c83e38707d5737d94065672265955/tenor.gif',
            incorrect: 'https://media.tenor.com/images/a6a6825000572863B8c7512752766076/tenor.gif'
        },
        'Reply 1988': {
            correct: 'https://media.giphy.com/media/l41lO3g5K1Q52kXDi/giphy.gif',
            incorrect: 'https://media.giphy.com/media/3o6ZTpWvWDba8jlGXC/giphy.gif'
        },
        'When Life Gives you Tangerines': {
            correct: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif', // General happy
            incorrect: 'https://media.giphy.com/media/l41lJWLk28fPYwLdA/giphy.gif' // General sad
        },
        'Supernatural': {
            correct: 'https://media.giphy.com/media/agwRgmFXiy51e/giphy.gif', // Dean "Awesome"
            incorrect: 'https://media.giphy.com/media/Hpv4rN2N48S64/giphy.gif' // Dean crying
        },
        default: {
            correct: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif', // Thumbs up
            incorrect: 'https://media.giphy.com/media/14hmBhqTX0kSTm/giphy.gif' // Sad face
        }
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    if (!CONFIG.triviaQuestions) {
        await loadConfig();
    }
    loadCategories();

    document.getElementById('backButton').addEventListener('click', () => {
        document.getElementById('gameArea').classList.add('hidden');
        document.getElementById('triviaResult').classList.add('hidden');
        document.getElementById('categorySelection').classList.remove('hidden');

        // Reset state and reload categories to clear loading spinner
        currentCategory = null;
        currentQuestions = [];
        loadCategories();
    });
});

function loadCategories() {
    const categories = [...new Set(CONFIG.triviaQuestions.map(q => q.category))];
    const container = document.getElementById('categorySelection');
    container.innerHTML = '';

    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'category-card';
        btn.innerHTML = `<h3>${cat}</h3><p>${getCategoryCount(cat)} Questions</p>`;
        btn.onclick = () => startCategory(cat);
        container.appendChild(btn);
    });
}

function getCategoryCount(category) {
    return CONFIG.triviaQuestions.filter(q => q.category === category).length;
}

async function startCategory(category) {
    currentCategory = category;
    correctCount = 0;
    wrongCount = 0;
    currentQuestionIndex = 0;

    // Show Loading
    const container = document.getElementById('categorySelection');
    container.innerHTML = '<div class="loading-spinner"><h3>✨ Conjugating with the Trivia Gods...</h3><p>Picking the best 10 questions for ' + category + '</p></div>';

    // Simulate thinking/fetching delay for effect
    await new Promise(r => setTimeout(r, 1000));

    // Get 10 random questions for this category
    const allCatQuestions = CONFIG.triviaQuestions.filter(q => q.category === category);

    if (allCatQuestions.length === 0) {
        container.innerHTML = `<h3>😕 No questions found for ${category}.</h3><button onclick="loadCategories()" class="btn-primary">Back</button>`;
        return;
    }

    // Shuffle and pick 10
    currentQuestions = allCatQuestions.sort(() => 0.5 - Math.random()).slice(0, 10);

    document.getElementById('categorySelection').classList.add('hidden');
    document.getElementById('gameArea').classList.remove('hidden');
    document.getElementById('currentCategoryTitle').textContent = category;
    updateScoreDisplay();

    showQuestion();
}

function updateScoreDisplay() {
    document.getElementById('correctCount').textContent = correctCount;
    document.getElementById('wrongCount').textContent = wrongCount;
}

function showQuestion() {
    if (currentQuestionIndex >= currentQuestions.length) {
        showResult();
        return;
    }

    const q = currentQuestions[currentQuestionIndex];
    const container = document.getElementById('questionContainer');

    container.innerHTML = `
        <div class="trivia-question-card">
            <h2>${q.question}</h2>
            <div class="options-grid">
                ${q.options.map((opt, i) => `
                    <button class="option-btn" onclick="handleAnswer(${i})">${opt}</button>
                `).join('')}
            </div>
            <div class="progress-indicator">Question ${currentQuestionIndex + 1} of ${currentQuestions.length}</div>
        </div>
    `;
}

function handleAnswer(selectedIndex) {
    const q = currentQuestions[currentQuestionIndex];
    const isCorrect = selectedIndex === q.correctIndex;

    if (isCorrect) {
        correctCount++;
    } else {
        wrongCount++;
    }
    updateScoreDisplay();

    showFeedback(isCorrect);
}

function showFeedback(isCorrect) {
    const overlay = document.getElementById('feedbackOverlay');
    const title = document.getElementById('feedbackTitle');
    const gif = document.getElementById('feedbackGif');
    const text = document.getElementById('feedbackText');

    // Sound
    const audio = new Audio(isCorrect ? MEDIA.sounds.correct : MEDIA.sounds.incorrect);
    audio.play().catch(e => console.log('Audio play failed', e));

    // GIF
    const catMedia = MEDIA.gifs[currentCategory] || MEDIA.gifs.default;
    gif.src = isCorrect ? catMedia.correct : catMedia.incorrect;

    title.textContent = isCorrect ? "YAY! Correct! 🎉" : "Oops! Wrong! 😅";
    title.style.color = isCorrect ? "var(--success)" : "var(--error)";
    text.textContent = isCorrect ? "You nailed it!" : "Better luck next time!";

    overlay.classList.remove('hidden');

    setTimeout(() => {
        overlay.classList.add('hidden');
        currentQuestionIndex++;
        showQuestion();
    }, 3000); // Show for 3 seconds
}

function showResult() {
    document.getElementById('gameArea').classList.add('hidden');
    document.getElementById('triviaResult').classList.remove('hidden');

    const percentage = (correctCount / currentQuestions.length) * 100;

    document.getElementById('triviaResultTitle').textContent =
        percentage >= 80 ? '🌟 Absolute Legend!' :
            percentage >= 50 ? 'Op Nice Try!' : '😅 Needs a Rewatch!';

    document.getElementById('triviaResultMessage').textContent =
        `You scored ${correctCount} out of ${currentQuestions.length} in ${currentCategory}.`;

    if (percentage >= 80) triggerConfetti(3000);
}
