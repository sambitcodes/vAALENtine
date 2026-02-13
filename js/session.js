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

function getUser() {
    return localStorage.getItem('vAALENtine_user');
}

async function logout() {
    if (typeof Analytics !== 'undefined') {
        await Analytics.sendReport();
    }

    localStorage.removeItem('vAALENtine_session');
    localStorage.removeItem('vAALENtine_user');
    window.location.href = 'index.html';
}
