// ========================================
// CATCH HEARTS GAME LOGIC
// ========================================

let catchGameRunning = false;
let catchScore = 0;
let catchLives = 3;
let catchTime = 30;
let basketX = 250;
let hearts = [];
let catchAnimationId = null;

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('catchCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    document.getElementById('startCatchBtn').addEventListener('click', () => startCatchGame(canvas, ctx));

    document.getElementById('leftBtn').addEventListener('mousedown', () => {
        const moveLeft = setInterval(() => {
            basketX = Math.max(0, basketX - 10);
        }, 50);
        document.getElementById('leftBtn').addEventListener('mouseup', () => clearInterval(moveLeft), { once: true });
    });

    document.getElementById('rightBtn').addEventListener('mousedown', () => {
        const moveRight = setInterval(() => {
            basketX = Math.min(canvas.width - 80, basketX + 10);
        }, 50);
        document.getElementById('rightBtn').addEventListener('mouseup', () => clearInterval(moveRight), { once: true });
    });

    document.addEventListener('keydown', (e) => {
        if (!catchGameRunning) return;
        if (e.key === 'ArrowLeft') basketX = Math.max(0, basketX - 15);
        if (e.key === 'ArrowRight') basketX = Math.min(canvas.width - 80, basketX + 15);
    });
});

function startCatchGame(canvas, ctx) {
    catchGameRunning = true;
    catchScore = 0;
    catchLives = 3;
    catchTime = 30;
    basketX = 250;
    hearts = [];

    document.getElementById('catchScore').textContent = catchScore;
    document.getElementById('catchTime').textContent = catchTime;
    document.getElementById('catchLives').textContent = '❤️'.repeat(catchLives);
    document.getElementById('catchGameOver').classList.add('hidden');
    document.getElementById('startCatchBtn').textContent = 'Playing...';
    document.getElementById('startCatchBtn').disabled = true;

    const timer = setInterval(() => {
        catchTime--;
        document.getElementById('catchTime').textContent = catchTime;
        if (catchTime <= 0 || catchLives <= 0) {
            clearInterval(timer);
            endCatchGame();
        }
    }, 1000);

    catchGameLoop(canvas, ctx);
}

function catchGameLoop(canvas, ctx) {
    if (!catchGameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Spawn hearts
    if (Math.random() < 0.03) {
        hearts.push({
            x: Math.random() * (canvas.width - 30),
            y: 0,
            speed: 2 + Math.random() * 2
        });
    }

    // Draw and move hearts
    hearts = hearts.filter(heart => {
        heart.y += heart.speed;

        ctx.fillStyle = '#ff6b9d';
        ctx.font = '30px Arial';
        ctx.fillText('❤️', heart.x, heart.y);

        if (heart.y > canvas.height - 60 && heart.y < canvas.height - 20) {
            if (heart.x > basketX - 20 && heart.x < basketX + 70) {
                catchScore++;
                document.getElementById('catchScore').textContent = catchScore;
                return false;
            }
        }

        if (heart.y > canvas.height) {
            catchLives--;
            document.getElementById('catchLives').textContent = '❤️'.repeat(Math.max(0, catchLives));
            if (catchLives <= 0) {
                catchGameRunning = false;
            }
            return false;
        }

        return true;
    });

    // Draw basket
    ctx.fillStyle = '#f8b500';
    ctx.fillRect(basketX, canvas.height - 50, 80, 40);
    ctx.fillStyle = '#c9457a';
    ctx.font = '20px Arial';
    ctx.fillText('🧺', basketX + 20, canvas.height - 20);

    if (catchGameRunning) {
        catchAnimationId = requestAnimationFrame(() => catchGameLoop(canvas, ctx));
    }
}

function endCatchGame() {
    catchGameRunning = false;
    if (catchAnimationId) {
        cancelAnimationFrame(catchAnimationId);
    }

    document.getElementById('catchFinalScore').textContent =
        `You caught ${catchScore} hearts! ${catchScore >= 20 ? "Amazing reflexes!" : "Not bad! Try again?"}`;
    document.getElementById('catchGameOver').classList.remove('hidden');
    document.getElementById('startCatchBtn').textContent = 'Start';
    document.getElementById('startCatchBtn').disabled = false;

    markGameCompleted('catch');

    if (catchScore >= 20) triggerConfetti(2000);
}
