(function () {
    // Check session on load
    if (localStorage.getItem('vAALENtine_session') !== 'authenticated') {
        const path = window.location.pathname;
        if (!path.endsWith('index.html') && path !== '/' && path !== '') {
            window.location.href = 'index.html';
        }
    } else {
        // Start Analytics if authenticated
        if (typeof Analytics !== 'undefined') {
            Analytics.init();
        } else {
            // Lazy load analytics if not present
            const script = document.createElement('script');
            script.src = 'js/analytics.js';
            script.onload = () => { if (window.Analytics) Analytics.init(); };
            document.head.appendChild(script);
        }
    }
})();

// Inject Logout Styles
(function injectLogoutStyles() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'css/logout.css';
    document.head.appendChild(link);
})();

function getUser() {
    return localStorage.getItem('vAALENtine_user');
}

async function logout() {
    console.log("Logout initiated...");

    // Show Animation
    const overlay = document.createElement('div');
    overlay.className = 'logout-overlay';
    overlay.innerHTML = `
        <div class="logout-content">
            <div class="logout-heart">❤️</div>
            <div class="logout-title">vAALENtine</div>
            <div class="logout-subtitle" id="logoutMsg">Syncing your memories to the stars...</div>
            <div class="sync-status">Session Analytics <span class="sync-dots"></span></div>
        </div>
    `;
    document.body.appendChild(overlay);

    // Trigger reflow for transition
    setTimeout(() => overlay.classList.add('active'), 10);

    // Prepare redirect
    const performRedirect = () => {
        const msg = document.getElementById('logoutMsg');
        if (msg) msg.innerText = "See you soon, AALEN! 🎈";

        setTimeout(() => {
            localStorage.removeItem('vAALENtine_session');
            localStorage.removeItem('vAALENtine_user');
            window.location.href = 'index.html';
        }, 1500);
    };

    // Send Report with Timeout (3s)
    if (typeof Analytics !== 'undefined') {
        try {
            // Race condition: either report sends or 3s timeout
            await Promise.race([
                Analytics.sendReport(),
                new Promise(resolve => setTimeout(resolve, 3000))
            ]);
            console.log("Analytics report finished or timed out.");
        } catch (err) {
            console.error("Logout Analytics error:", err);
        }
    }

    performRedirect();
}
