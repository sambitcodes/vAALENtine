// Custom Logic for Home Page
document.addEventListener('DOMContentLoaded', () => {
    // Hardcode name for Aalen
    localStorage.setItem('userName', 'AALEN');

    initPhotoStack();
    initBackgroundMusic();
    initFloatingVibe();

    // Animate elements
    setTimeout(() => {
        const title = document.querySelector('.hero-title');
        if (title) title.classList.add('fade-in');
    }, 500);
});

function initPhotoStack() {
    const container = document.getElementById('photoStackContainer');
    if (!container) return;

    // Real photos from pictures/slide-aal
    // Re-ordering again to ensure no broken images at the start
    const photoList = [
        "IMG_0370.jpg", "IMG_1198.PNG", "IMG_1216.PNG", "IMG_1219.PNG", "IMG_1234.PNG",
        "IMG_1331.PNG", "IMG_4156.PNG", "IMG_4235.PNG", "IMG_4292.PNG", "IMG_4404.PNG",
        "IMG_4406.PNG", "IMG_4474.PNG", "IMG_4544.PNG", "IMG_4894.PNG", "IMG_4916.PNG",
        "IMG_5407.PNG", "IMG_5447.PNG", "IMG_5451.PNG", "IMG_5472.PNG", "IMG_5512.PNG",
        "IMG_5521.PNG", "IMG_5613.PNG", "IMG_5618.PNG", "IMG_5789.PNG", "IMG_5816.PNG",
        "IMG_6105.PNG", "IMG_7555.PNG", "IMG_7656_Original.jpg", "IMG_7674.PNG", "IMG_7793.PNG",
        "IMG_7857.PNG", "IMG_8642.PNG", "IMG_9263.jpg", "IMG_0250.JPG"
    ];

    const PHOTO_COUNT = photoList.length;
    const photos = [];

    // Create stacked photos from the real list
    photoList.forEach((filename, i) => {
        const img = document.createElement('img');
        img.src = `pictures/slide-aal/${filename}`;
        img.className = 'stacked-photo';
        img.alt = `Memory ${i + 1}`;
        // Handle HEIC fallback if needed (browsers don't support HEIC natively usually)
        // [NOTE] If images don't show, they might need conversion.
        container.appendChild(img);
        photos.push(img);
    });

    let currentIndex = 0;

    function updateStack() {
        photos.forEach((photo, i) => {
            photo.className = 'stacked-photo';

            // Current Active
            if (i === currentIndex) {
                photo.classList.add('active');
            }
            // Previous (Fading out left)
            else if (i === (currentIndex - 1 + PHOTO_COUNT) % PHOTO_COUNT) {
                photo.classList.add('prev');
            }
            // Next (Prepared on right)
            else if (i === (currentIndex + 1) % PHOTO_COUNT) {
                photo.classList.add('next');
            }
            // Layers behind
            else if (i === (currentIndex + 2) % PHOTO_COUNT) {
                photo.classList.add('layer-1');
            }
            else if (i === (currentIndex + 3) % PHOTO_COUNT) {
                photo.classList.add('layer-2');
            }
            else if (i === (currentIndex + 4) % PHOTO_COUNT) {
                photo.classList.add('layer-3');
            }
        });

        currentIndex = (currentIndex + 1) % PHOTO_COUNT;
    }

    // Initial run
    updateStack();

    // Cycles every 1.5 seconds
    setInterval(updateStack, 1500);
}

function initBackgroundMusic() {
    // Create audio element
    const music = new Audio('pictures/cdr-home.mp3');
    music.loop = true;
    music.volume = 0.5; // Set to 50% volume so it's not too loud

    // Background music usually requires a user interaction to start
    const startMusic = () => {
        music.play().then(() => {
            console.log("Background music started!");
        }).catch(err => {
            console.warn("Autoplay was blocked, or file missing:", err);
        });
        // Remove listeners after first interaction
        document.removeEventListener('click', startMusic);
        document.removeEventListener('touchstart', startMusic);
    };

    document.addEventListener('click', startMusic);
    document.addEventListener('touchstart', startMusic);
}

function initFloatingVibe() {
    const symbols = ['❤️', '🌹', '🪷'];
    const container = document.body;

    function createSymbol() {
        const span = document.createElement('span');
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        span.textContent = symbol;
        span.className = 'floating-vibe';

        // Random position
        span.style.left = Math.random() * 100 + 'px'; // Start from left mostly or randomize
        span.style.left = Math.random() * window.innerWidth + 'px';

        // Random size
        const size = Math.random() * 20 + 20;
        span.style.fontSize = size + 'px';

        // Random horizontal drift
        const drift = (Math.random() - 0.5) * 100;
        span.style.setProperty('--drift', drift + 'px');

        // Random duration
        const duration = Math.random() * 10 + 10;
        span.style.animationDuration = duration + 's';

        // Random delay
        span.style.animationDelay = Math.random() * 5 + 's';

        container.appendChild(span);

        // Remove after animation
        setTimeout(() => {
            span.remove();
        }, duration * 1000 + 5000);
    }

    // Initial batch
    for (let i = 0; i < 15; i++) {
        setTimeout(createSymbol, i * 500);
    }

    // Keep spawning
    setInterval(createSymbol, 2000);
}

