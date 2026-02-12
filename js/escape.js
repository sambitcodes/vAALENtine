// ========================================
// 7 DAYS OF LOW-BUDGET LOVE LOGIC
// ========================================

const DAYS_CONTENT = {
    1: {
        title: "Day 1: Rose Day",
        visual: `
            <div class="gift-visual-container">
                <img src="pictures/rose.gif" alt="Rose" class="gift-gif">
                <div class="gift-visual rotating-rose">🌹</div>
            </div>
        `,
        caption: "A rose that will never wither, mostly because it’s a .gif and I can’t afford the real ones that die in three days anyway. It's 'Eternal Love' on a budget."
    },
    2: {
        title: "Day 2: Propose Day",
        visual: `
            <div class="gift-visual-container">
                <img src="pictures/prop.gif" alt="Propose" class="gift-gif">
                <div class="gift-visual">💍</div>
            </div>
            <button class="btn-tc" onclick="acceptTC()">ACCEPT TERMS & CONDITIONS</button>
        `,
        caption: "Don't panic—I’m not proposing that. I'm proposing a 'Mutual Non-Aggression Pact' for the rest of 2026. Do you accept the terms and conditions of my friendship?"
    },
    3: {
        title: "Day 3: Chocolate Day",
        visual: `
            <div class="gift-visual-container">
                <img src="pictures/choc.gif" alt="Chocolate" class="gift-gif">
                <div class="gift-visual error-overlay">
                    🍫
                    <div class="error-text">404 ERROR</div>
                </div>
            </div>
        `,
        caption: "Actual footage of me trying to handle my responsibilities right now. Since my bank account says 'No' to Ferrero Rocher, please enjoy this child having a better time with chocolate than I will ever be able to give you."
    },
    4: {
        title: "Day 4: Teddy Day",
        visual: `
            <div class="gift-visual-container">
                <img src="pictures/tedd.gif" alt="Teddy" class="gift-gif">
                <div class="gift-visual">🤦‍♂️🧸</div>
            </div>
        `,
        caption: "I was going to buy you a real teddy, but this guy has better moves than me and—more importantly—he doesn't require any shelf space in your new life."
    },
    5: {
        title: "Day 5: Promise Day",
        visual: `
            <div class="gift-visual-container">
                <img src="pictures/prom.gif" alt="Promise" class="gift-gif">
                <div class="gift-visual">📜</div>
            </div>
        `,
        caption: "I promise to stay in my lane. I also promise that this website is officially the most effort anyone has ever put into being 'just friends.' Case closed."
    },
    6: {
        title: "Day 6: Hug Day",
        visual: `
            <div class="gift-visual-container">
                <img src="pictures/hug.gif" alt="Hug" class="gift-gif">
                <div class="hug-container">
                    <div class="hug-circle circle-left"></div>
                    <div class="hug-circle circle-right"></div>
                </div>
            </div>
        `,
        caption: "A visual representation of our next 'accidental' run-in at the mall. Let’s keep it this awkward—it builds character and makes for a great story later."
    },
    7: {
        title: "Day 7: Kiss Day 💋",
        visual: `
            <div class="gift-visual-container">
                <img src="pictures/kiss.gif" alt="Kiss" class="gift-gif">
                <div class="gift-visual">✖️</div>
            </div>
        `,
        caption: "The world's first 100% wireless, high-speed, and platonic kiss. It’s low-latency, germs-free, and most importantly, it won't ruin your makeup. X marks the 'Ex' spot."
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const icons = document.querySelectorAll('.day-icon');
    icons.forEach(icon => {
        icon.addEventListener('click', () => {
            const day = icon.dataset.day;
            unlockDay(day, icon);
        });
    });
});

function unlockDay(day, iconElement) {
    const display = document.getElementById('contentDisplay');
    const content = DAYS_CONTENT[day];

    if (!content) return;

    // Remove active class from all icons
    document.querySelectorAll('.day-icon').forEach(i => i.classList.remove('active'));
    iconElement.classList.add('active');

    // Play sound based on day
    if (day == 7) {
        SoundFX.playGlitchyKiss();
    } else {
        SoundFX.playCoin();
    }

    // Update Display
    display.innerHTML = `
        <h2 style="color: var(--pixel-accent); margin-bottom: 1rem;">${content.title}</h2>
        ${content.visual}
        <p class="cheeky-caption">${content.caption}</p>
    `;

    // Day 6 specific logic: stop animation after 1.5s as per caption
    if (day == 6) {
        setTimeout(() => {
            const circles = document.querySelectorAll('.hug-circle');
            circles.forEach(c => c.style.animation = 'none');
        }, 1500);
    }
}

function acceptTC() {
    SoundFX.playCorrect();
    alert("Pact Accepted! No passive-aggressive stories/status for 1 year.");
}
