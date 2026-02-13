document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    const phoneInput = document.getElementById('phone');
    const passwordInput = document.getElementById('password');
    const successPopup = document.getElementById('successPopup');
    const failPopup = document.getElementById('failPopup');
    const successVideo = document.getElementById('successVideo');
    const tryAgainBtn = document.getElementById('tryAgainBtn');

    // Audio Assets
    const successAudio = new Audio('pictures/aay_sound.mp3');
    const failAudio = new Audio('pictures/naw_sound.mp3');

    // Valid credentials reverse mapping
    const validCredentials = {
        "8335891019": "9101985338",
        "8777566959": "9596657778"
    };

    function handleLogin() {
        const phone = phoneInput.value.trim();
        const password = passwordInput.value.trim();

        if (validCredentials[phone] && validCredentials[phone] === password) {
            // SUCCESS
            localStorage.setItem('vAALENtine_session', 'authenticated');
            localStorage.setItem('vAALENtine_user', phone);
            successPopup.style.display = 'flex';

            // Play success video and audio
            successVideo.play().catch(e => console.warn("Video auto-play failed:", e));
            successAudio.play().catch(err => console.log("Success audio blocked:", err));

            // Redirect after 3.5 seconds
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 3500);
        } else {
            // FAILURE
            failPopup.style.display = 'flex';
            failAudio.currentTime = 0;
            failAudio.play().catch(err => console.log("Fail audio blocked:", err));
        }
    }

    loginBtn.addEventListener('click', handleLogin);

    // Try Again Handler
    if (tryAgainBtn) {
        tryAgainBtn.addEventListener('click', () => {
            if (window.SoundFX) window.SoundFX.playClick();
            failPopup.style.display = 'none';
            // Stop failure audio
            failAudio.pause();
            failAudio.currentTime = 0;
        });
    }

    // Enter key support
    [phoneInput, passwordInput].forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
    });

    // Check if already logged in
    if (localStorage.getItem('vAALENtine_session') === 'authenticated') {
        window.location.href = 'home.html';
    }
});
