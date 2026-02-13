// Custom Logic for Home Page
document.addEventListener('DOMContentLoaded', () => {
    // Hardcode name for Aalen
    localStorage.setItem('userName', 'AALEN');

    initPhotoStack();
    initBackgroundMusic();
    initFloatingVibe();
    createLightBulbs();

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
    // Real photos from pictures/slide-aal
    // Updated to match actual file system (20 verified images)
    const photoList = [
        "img_0001.jpg", "img_0370.jpg", "img_4235.png", "img_4404.png", "img_4406.png",
        "img_4894.png", "img_4916.png", "img_5407.png", "img_5447.png", "img_5451.png",
        "img_5472.png", "img_5512.png", "img_5618.png", "img_5759.png", "img_6105.png",
        "img_7228.jpg", "img_7718.jpg", "img_7857.png", "img_8642.png", "img_9263.jpg"
    ];

    const PHOTO_COUNT = photoList.length;
    const photos = [];

    // Create stacked photos from the real list
    photoList.forEach((filename, i) => {
        const img = document.createElement('img');
        img.src = `/pictures/slide-aal/${filename}`;
        img.className = 'stacked-photo';
        img.loading = 'lazy'; // Optimization for large folders
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

    // Register with Global Audio Controller
    if (window.AudioController) {
        window.AudioController.register(music);
    }

    // Background music usually requires a user interaction to start
    const startMusic = () => {
        music.play().then(() => {
            console.log("Background music started!");
            document.removeEventListener('click', startMusic);
            document.removeEventListener('touchstart', startMusic);
        }).catch(err => {
            console.warn("Autoplay was blocked, or file missing:", err);
        });
    };

    document.addEventListener('click', startMusic);
    document.addEventListener('touchstart', startMusic);

    // Attempt to play immediately (Works if user has interacted with domain previously)
    music.play().catch(() => { });
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


function createLightBulbs() {
    const container = document.getElementById('bulb-container');
    if (!container) return;

    // Clear existing if any
    container.innerHTML = '';

    const bulbCount = 8; // Fewer but larger bulbs

    for (let i = 0; i < bulbCount; i++) {
        // Assembly Container
        const assembly = document.createElement('div');
        assembly.classList.add('hanging-assembly');

        // Random Position (Left)
        const left = Math.random() * 90 + 5; // 5% to 95%
        assembly.style.left = `${left}%`;

        // Random Size
        const scale = 0.5 + Math.random() * 0.5; // 0.5 to 1.0 scale
        assembly.style.transform = `scale(${scale})`;

        // Random Swing Delay
        assembly.style.animationDelay = `${Math.random() * 2}s`;
        assembly.style.animationDuration = `${3 + Math.random() * 2}s`;

        // Wire
        const wire = document.createElement('div');
        wire.classList.add('bulb-wire');
        const wireLength = 30 + Math.random() * 100; // 30px to 130px hanging
        wire.style.height = `${wireLength}px`;

        // Socket
        const socket = document.createElement('div');
        socket.classList.add('bulb-socket');

        // Glass (Bulb)
        const glass = document.createElement('div');
        glass.classList.add('bulb-glass');
        // Random Flicker Delay
        glass.style.animationDelay = `${Math.random() * 2}s`;

        // Append
        assembly.appendChild(wire);
        assembly.appendChild(socket);
        assembly.appendChild(glass);
        container.appendChild(assembly);
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    initBackgroundMusic();
    initFloatingVibe();
    createLightBulbs();
});
