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
    const choiceContainer = document.querySelector('.choice-container');
    const mergedContainer = document.getElementById('mergedCardContainer');
    const blipOverlay = document.getElementById('blipOverlay');
    const countdownDisplay = document.getElementById('countdownDisplay');
    const finalMessage = document.getElementById('finalMessage');

    if (matchBtn) {
        matchBtn.addEventListener('click', () => {
            profilesWrapper.classList.add('hidden');
            choiceContainer.classList.add('hidden');
            mergedContainer.classList.remove('hidden');
            mergedContainer.innerHTML = `
                <div class="profile-card" style="width: 100%; max-width: 600px; margin: 50px auto; animation: fadeIn 1.5s forwards;">
                    <h2 class="card-title">The Perfect Match</h2>
                    <div class="card-alias">"Bound Together"</div>
                    <p style="color: #eee; font-size: 1.2rem; margin: 30px 0; line-height: 1.6;">
                        Wait for it... Something magical is coming. Our story is just beginning a new chapter.
                    </p>
                    <div class="card-footer">
                        <button class="btn-choice match" onclick="location.reload()">Back to Realities</button>
                    </div>
                </div>
            `;
            if (typeof triggerConfetti === 'function') triggerConfetti(3000);
        });
    }

    if (unmatchBtn) {
        unmatchBtn.addEventListener('click', () => {
            blipOverlay.classList.remove('hidden');
            let count = 10;
            document.body.classList.add('disintegrating');

            const timer = setInterval(() => {
                count--;
                countdownDisplay.textContent = count;

                if (count <= 0) {
                    clearInterval(timer);
                    countdownDisplay.classList.add('hidden');
                    document.querySelector('.blip-message').classList.add('hidden');
                    finalMessage.classList.remove('hidden');

                    setTimeout(() => {
                        window.location.href = "https://www.google.com";
                    }, 3000);
                }
            }, 1000);
        });
    }
});
