// ========================================
// MUSIC PAGE LOGIC
// ========================================

let musicPlaying = false;

document.addEventListener('DOMContentLoaded', async () => {
    if (!CONFIG.playlist) {
        await loadConfig();
    }
    loadPlaylist();

    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.onmouseenter = () => SoundFX.playHover();
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadPlaylist(btn.dataset.mood);
        });
    });

    document.getElementById('musicToggle').addEventListener('click', () => {
        const audio = document.getElementById('bgMusic');
        const icon = document.getElementById('musicIcon');

        if (musicPlaying) {
            audio.pause();
            icon.textContent = '🔇';
            musicPlaying = false;
        } else {
            audio.play();
            icon.textContent = '🔊';
            musicPlaying = true;
        }
    });
});

function loadPlaylist(mood = 'all') {
    const container = document.getElementById('playlistContainer');
    if (!container) return;
    container.innerHTML = '';

    const filteredPlaylist = mood === 'all'
        ? CONFIG.playlist
        : CONFIG.playlist.filter(song => song.moodTag === mood);

    filteredPlaylist.forEach(song => {
        const card = document.createElement('div');
        card.className = 'playlist-card';
        card.innerHTML = `
            <h3>${song.title}</h3>
            <p style="color: var(--text-secondary); margin-bottom: 1rem;">${song.artist}</p>
            <span class="mood-tag">${song.moodTag}</span>
            <button class="play-btn" onmouseenter="SoundFX.playHover()" onclick="SoundFX.playClick(); window.open('${song.link}', '_blank')">▶ Play</button>
        `;
        container.appendChild(card);
    });

    markGameCompleted('music');
}
