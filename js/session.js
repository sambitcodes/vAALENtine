(function () {
    // Check session on load
    if (localStorage.getItem('vAALENtine_session') !== 'authenticated') {
        const currentPage = window.location.pathname.split('/').pop();
        if (currentPage !== 'index.html' && currentPage !== '') {
            window.location.href = 'index.html';
        }
    }
})();

function logout() {
    localStorage.removeItem('vAALENtine_session');
    window.location.href = 'index.html';
}
