// ========================================
// HER PAGE LOGIC
// ========================================

let currentQuizIndex = 0;
let quizScore = 0;
let selectedOption = null;
let questions = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (!CONFIG.herQuestions) {
        await loadConfig();
    }

    // Fallback if config fails or empty
    questions = CONFIG.herQuestions || [];

    if (questions.length === 0) {
        document.getElementById('quizContainer').innerHTML = "<p style='text-align:center'>No questions found. Please check database configuration.</p>";
        return;
    }

    loadQuizQuestion();

    document.getElementById('quizNext').addEventListener('click', () => {
        const question = questions[currentQuizIndex];
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
    if (currentQuizIndex >= questions.length) {
        showQuizResult();
        return;
    }

    const question = questions[currentQuizIndex];
    document.getElementById('quizProgress').textContent =
        `Question ${currentQuizIndex + 1} of ${questions.length}`;
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
    const percentage = (quizScore / questions.length) * 100;
    let result;

    if (percentage === 100) result = { title: "👑 The Queen!", message: "You are truly the expert on Her!" };
    else if (percentage >= 70) result = { title: "🌟 Star Student!", message: "You've been studying well!" };
    else if (percentage >= 50) result = { title: "😐 Decent", message: "You got the basics right, at least." };
    else result = { title: "🙈 Oof...", message: "Do you need a refresher course?" };

    document.getElementById('resultTitle').textContent = result.title;
    document.getElementById('resultMessage').textContent = result.message;

    document.getElementById('quizContainer').classList.add('hidden');
    document.getElementById('quizResult').classList.remove('hidden');

    if (percentage >= 70) triggerConfetti(2000);
}
