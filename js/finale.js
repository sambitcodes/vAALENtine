// ========================================
// FINALE PAGE LOGIC
// ========================================

let noClickCount = 0;

document.addEventListener('DOMContentLoaded', async () => {
    if (!CONFIG.valentineFinal) {
        await loadConfig();
    }
    const yesBtn = document.getElementById('yesBtn');
    const noBtn = document.getElementById('noBtn');
    const reallyNoBtn = document.getElementById('reallyNoBtn');

    yesBtn.addEventListener('click', () => {
        SoundFX.playCorrect();
        document.getElementById('finaleButtons').style.display = 'none';
        document.getElementById('reallyNoBtn').classList.add('hidden');
        document.getElementById('finaleResultTitle').textContent = CONFIG.valentineFinal.yesTitle;
        document.getElementById('finaleResultMessage').textContent = CONFIG.valentineFinal.yesMessage;
        document.getElementById('finaleResult').classList.remove('hidden');
        triggerConfetti(5000);
    });

    noBtn.addEventListener('mouseover', () => {
        SoundFX.playHover();
        if (noClickCount < 5) {
            const container = document.getElementById('finaleButtons');
            const maxX = container.offsetWidth - noBtn.offsetWidth - 20;
            const maxY = 50;

            noBtn.style.position = 'absolute';
            noBtn.style.left = Math.random() * maxX + 'px';
            noBtn.style.top = Math.random() * maxY + 'px';

            noClickCount++;

            const scale = Math.max(0.5, 1 - noClickCount * 0.1);
            noBtn.style.transform = `scale(${scale})`;

            const yesScale = Math.min(1.5, 1 + noClickCount * 0.1);
            yesBtn.style.transform = `scale(${yesScale})`;
        }

        if (noClickCount >= 3) {
            reallyNoBtn.classList.remove('hidden');
        }
    });

    noBtn.addEventListener('click', (e) => {
        SoundFX.playClick();
        e.preventDefault();
        if (noClickCount < CONFIG.valentineFinal.noMessages.length) {
            alert(CONFIG.valentineFinal.noMessages[noClickCount]);
        }
    });

    reallyNoBtn.addEventListener('click', () => {
        SoundFX.playClick();
        document.getElementById('finaleButtons').style.display = 'none';
        reallyNoBtn.classList.add('hidden');
        document.getElementById('finaleResultTitle').textContent = CONFIG.valentineFinal.noTitle;
        document.getElementById('finaleResultMessage').textContent = CONFIG.valentineFinal.noMessage;
        document.getElementById('finaleResult').classList.remove('hidden');
    });
});
