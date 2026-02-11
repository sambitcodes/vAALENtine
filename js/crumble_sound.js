// Add to existing SoundFX or train.js
function playCrumbleSound() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const bufferSize = ctx.sampleRate * 2; // 2 seconds
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const gain = ctx.createGain();

    // Bandpass to simulate rock/earth crumbling
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 100; // Low rumble start
    filter.Q.value = 0.5;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    // Crumbled envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 2);

    // Filter movement for "falling" sound
    filter.frequency.setValueAtTime(100, now);
    filter.frequency.linearRampToValueAtTime(800, now + 0.5); // Debris scattering
    filter.frequency.linearRampToValueAtTime(50, now + 2); // Settling

    noise.start(now);
    noise.stop(now + 2);
}
