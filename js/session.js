(function () {
    // Check session on load
    if (localStorage.getItem('vAALENtine_session') !== 'authenticated') {
        const path = window.location.pathname;
        if (!path.endsWith('index.html') && path !== '/' && path !== '') {
            window.location.href = 'index.html';
        }
    }
})();

function getUser() {
    return localStorage.getItem('vAALENtine_user');
}

function logout() {
    localStorage.removeItem('vAALENtine_session');
    localStorage.removeItem('vAALENtine_user');
    window.location.href = 'index.html';
}
