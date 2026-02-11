// ========================================
// WORD SCRAMBLE LOGIC
// ========================================

let currentGameRound = 0;
let gameScore = 0;

document.addEventListener('DOMContentLoaded', async () => {
    if (!CONFIG.favGame) {
        await loadConfig();
    }
    loadGame();

    document.getElementById('gameSubmit').addEventListener('click', checkAnswer);
    document.getElementById('gameInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkAnswer();
    });

    document.getElementById('gameRestart').addEventListener('click', () => {
        currentGameRound = 0;
        gameScore = 0;
        document.getElementById('gameComplete').classList.add('hidden');
        loadGame();
    });
});

function loadGame() {
    if (currentGameRound >= CONFIG.favGame.words.length) {
        showGameComplete();
        return;
    }

    const wordData = CONFIG.favGame.words[currentGameRound];
    let scrambled = shuffle(wordData.word);
    while (scrambled === wordData.word) {
        scrambled = shuffle(wordData.word);
    }

    document.getElementById('gameScore').textContent = gameScore;
    document.getElementById('gameRound').textContent = currentGameRound + 1;
    document.getElementById('scrambledWord').textContent = scrambled;
    document.getElementById('gameHint').textContent = `Hint: ${wordData.hint}`;
    document.getElementById('gameInput').value = '';
    document.getElementById('gameFeedback').textContent = '';
    document.getElementById('gameFeedback').className = 'game-feedback';
}

function checkAnswer() {
    const userAnswer = document.getElementById('gameInput').value.trim().toUpperCase();
    const correctAnswer = CONFIG.favGame.words[currentGameRound].word;
    const feedback = document.getElementById('gameFeedback');

    if (userAnswer === correctAnswer) {
        gameScore += 10;
        feedback.textContent = `✓ Correct! ${CONFIG.favGame.words[currentGameRound].compliment}`;
        feedback.className = 'game-feedback correct';
        setTimeout(() => {
            currentGameRound++;
            loadGame();
        }, 2000);
    } else {
        feedback.textContent = '✗ Not quite! Try again.';
        feedback.className = 'game-feedback incorrect';
    }
}

function showGameComplete() {
    document.getElementById('gameComplete').classList.remove('hidden');
    document.getElementById('gameCompleteMessage').textContent =
        gameScore === CONFIG.favGame.words.length * 10
            ? "Perfect score! You really know your stuff!"
            : `Great job! You scored ${gameScore} points.`;

    markGameCompleted('scramble');
    triggerConfetti(2500);
}
