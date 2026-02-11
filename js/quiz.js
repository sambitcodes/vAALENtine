// ========================================
// QUIZ PAGE LOGIC
// ========================================

let currentQuizIndex = 0;
let quizScore = 0;
let selectedOption = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!CONFIG.quizQuestions) {
        await loadConfig();
    }
    loadQuizQuestion();

    document.getElementById('quizNext').addEventListener('click', () => {
        const question = CONFIG.quizQuestions[currentQuizIndex];
        if (selectedOption === question.correctIndex) {
            quizScore++;
        }
        currentQuizIndex++;
        loadQuizQuestion();
    });

    document.getElementById('quizRestart').addEventListener('click', () => {
        currentQuizIndex = 0;
        quizScore = 0;
        document.getElementById('quizContainer').classList.remove('hidden');
        document.getElementById('quizResult').classList.add('hidden');
        loadQuizQuestion();
    });
});

function loadQuizQuestion() {
    if (currentQuizIndex >= CONFIG.quizQuestions.length) {
        showQuizResult();
        return;
    }

    const question = CONFIG.quizQuestions[currentQuizIndex];
    document.getElementById('quizProgress').textContent =
        `Question ${currentQuizIndex + 1} of ${CONFIG.quizQuestions.length}`;
    document.getElementById('quizQuestion').textContent = question.question;

    const optionsContainer = document.getElementById('quizOptions');
    optionsContainer.innerHTML = '';

    question.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'quiz-option';
        optionDiv.textContent = option;
        optionDiv.addEventListener('click', () => selectQuizOption(index, optionDiv));
        optionsContainer.appendChild(optionDiv);
    });

    selectedOption = null;
    document.getElementById('quizNext').disabled = true;
}

function selectQuizOption(index, element) {
    document.querySelectorAll('.quiz-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    element.classList.add('selected');
    selectedOption = index;
    document.getElementById('quizNext').disabled = false;
}

function showQuizResult() {
    const percentage = (quizScore / CONFIG.quizQuestions.length) * 100;
    let result;

    if (percentage === 100) result = CONFIG.quizResults.perfect;
    else if (percentage >= 70) result = CONFIG.quizResults.good;
    else if (percentage >= 50) result = CONFIG.quizResults.decent;
    else result = CONFIG.quizResults.low;

    document.getElementById('resultTitle').textContent = result.title;
    document.getElementById('resultMessage').textContent = result.message;

    document.getElementById('quizContainer').classList.add('hidden');
    document.getElementById('quizResult').classList.remove('hidden');

    markGameCompleted('quiz');

    if (percentage >= 70) triggerConfetti(2000);
}
