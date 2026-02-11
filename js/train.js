// Global State
let currentStop = -1;
const totalStops = TRAIN_DATA.length;
let travelSpeed = 1; // Multiplier: 0.5, 1, 2
let isReturning = false;
let trainSoundOscillators = [];
let trainSoundGain = null;

const STATION_WIDTH_VW = 300; // Increased distance for longer journey

document.addEventListener('DOMContentLoaded', () => {
    initTrainWorld();

    document.getElementById('startTrainBtn').addEventListener('click', () => startJourney(false));

    // Speed Controls
    createSpeedControls();
});

function createSpeedControls() {
    const controls = document.createElement('div');
    controls.id = 'speedControls';
    controls.innerHTML = `
        <button class="speed-btn" onclick="setSpeed(0.5)">0.5x</button>
        <button class="speed-btn active" onclick="setSpeed(1)">1x</button>
        <button class="speed-btn" onclick="setSpeed(2)">2x</button>
    `;
    document.body.appendChild(controls);
}

function setSpeed(speed) {
    travelSpeed = speed;
    document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.classList.toggle('active', parseFloat(btn.innerText) === speed);
    });
}

function initTrainWorld() {
    const world = document.getElementById('worldContainer');
    world.innerHTML = '';

    // Add Start Station
    createStation(world, -1, { name: "Start Journey" });

    // Add Memory Stations
    TRAIN_DATA.forEach((stop, index) => {
        createStation(world, index, stop);
    });

    // Add End Station
    createStation(world, 999, { name: "Terminus" });

    // Set world width (Distance based)
    world.style.width = `${(totalStops + 2) * STATION_WIDTH_VW}vw`;

    // Ensure Moon
    if (!document.getElementById('theMoon')) {
        const moon = document.createElement('div');
        moon.id = 'theMoon';
        moon.innerHTML = '🌙';
        const moonStyle = document.createElement('style');
        moonStyle.textContent = `@keyframes moonWink { 0%, 90% { transform: scale(1); } 95% { transform: scaleY(0.1); } 100% { transform: scale(1); } }`;
        document.head.appendChild(moonStyle);
        document.getElementById('trainContainer').appendChild(moon);
    }

    // Ensure Tracks
    if (!document.getElementById('trainTracks')) {
        const tracks = document.createElement('div');
        tracks.id = 'trainTracks';
        tracks.style.cssText = "position:fixed; bottom:0; left:0; width:100%; height:20px; background: repeating-linear-gradient(90deg, #333 0, #333 20px, transparent 20px, transparent 40px), linear-gradient(#555, #555); background-size: 40px 100%, 100% 50%; background-position: 0 0, 0 100%; z-index:40;";
        document.getElementById('trainContainer').appendChild(tracks);
    }
}

function createStation(container, index, data) {
    const div = document.createElement('div');
    div.className = 'station-section';
    div.id = `station-${index}`;
    div.style.width = `${STATION_WIDTH_VW}vw`; // Apply longer distance width

    let groundHTML = '<div class="ground-line"></div>';
    let trackHTML = '<div class="track-segment"></div>';
    let sceneryHTML = '';

    if (index === 5) {
        groundHTML = `
            <div class="water-area">
                <div class="wave w1"></div>
                <div class="wave w2"></div>
                <div class="wave w3"></div>
            </div>
            <div class="bridge-structure"></div>
        `;
    }

    // Scenery Logic - Scatter across the full 300vw width to create "Journey" feel
    const createTree = (leftVw, type) => `<div class="scenery-tree ${type}" style="left: ${leftVw}vw">🌲</div>`;
    const createBush = (leftVw) => `<div class="scenery-tree t2" style="left: ${leftVw}vw; font-size: 5rem;">🌳</div>`;

    if (index === -1) { // Start
        sceneryHTML += createTree(20, 't1');
        sceneryHTML += createBush(150);
        sceneryHTML += createTree(260, 't1');
    } else if (index === 999) { // End
        sceneryHTML += createTree(80, 't2');
    } else {
        // Random distribution for the journey
        // At Station (avoid 40-60vw)
        if (index % 2 === 0) sceneryHTML += createTree(10, 't1');
        if (index % 3 === 0) sceneryHTML += createBush(80);

        // In "Transit" (100vw - 300vw)
        sceneryHTML += createTree(130 + Math.random() * 20, 't1');
        sceneryHTML += createBush(180 + Math.random() * 20);
        sceneryHTML += createTree(250 + Math.random() * 30, 't2');

        if (index === 7) sceneryHTML += '<div class="scenery-rock" style="left: 45vw">🪨</div>';
    }

    let signHTML = '';
    if (index === -1) {
        signHTML = `
            <div class="station-sign start-sign">
                <div class="station-name">JOURNEY BEGINS</div>
                <div class="station-sub">All Aboard!</div>
            </div>`;
    } else if (index === 999) {
        signHTML = `
            <div class="station-sign end-sign">
                <div class="station-name">TERMINUS</div>
                <div class="station-sub" onclick="startJourney(true)">🔄 Click to Return Home</div>
            </div>`;
    } else {
        signHTML = `
            <div class="station-sign" onclick="openStation(${index})">
                <div class="station-index">${index + 1}</div>
                <div class="station-name">${data.name}</div>
                <div class="station-sub">Click to View Memory 📸</div>
            </div>`;
    }

    div.innerHTML = `
        ${sceneryHTML}
        ${groundHTML}
        ${trackHTML}
        <div class="station-pole"></div>
        ${signHTML}
    `;

    container.appendChild(div);
}

function startJourney(returning) {
    const btn = document.getElementById('startTrainBtn');
    btn.classList.add('hidden');
    isReturning = returning;

    const train = document.getElementById('theTrain');
    if (isReturning) {
        train.style.transform = "scaleX(-1)"; // Face left
        currentStop = totalStops; // Start from end
        playWhistle().then(() => goToStation(totalStops - 1));
    } else {
        train.style.transform = "scaleX(1)"; // Face right
        currentStop = -1;
        playWhistle().then(() => goToStation(0));
    }
}

function goToStation(index) {
    if ((!isReturning && index >= totalStops) || (isReturning && index < 0)) {
        moveWorld(isReturning ? -1 : 999); // Move to final logic
        return;
    }

    currentStop = index;
    const train = document.getElementById('theTrain');
    train.classList.add('train-shaking');

    startTrainSound();

    // Move World
    // index -1 = Start (0vw)
    // index 0 = Stop 1 (STATION_WIDTH_VW)
    // index 999 = Terminus
    let targetIndex = index;
    if (index === 999) targetIndex = totalStops;
    if (index === -1) targetIndex = -1; // Start

    moveWorld(targetIndex, () => {
        stopTrainSound();
        playCrumbleSound(); // Play braking/crumble sound on arrival
        train.classList.remove('train-shaking');
        // Arrived
        if (index === 999) {
            // Terminus logic
        } else if (index === -1) {
            // Back to start logic
            const btn = document.getElementById('startTrainBtn');
            btn.classList.remove('hidden');
            btn.textContent = "🚂 Start Again";
            document.getElementById('theTrain').style.transform = "scaleX(1)";
        }
    });
}

function moveWorld(stationIndex, callback) {
    const world = document.getElementById('worldContainer');
    // Calculate scroll position
    // Start is at 0. Station 0 at 1 * WIDTH. 
    // We want to center the station? Use translate X
    // Station index logic: 
    // -1 (Start) -> 0
    // 0 -> 1 * W
    // 1 -> 2 * W
    // ...
    // Terminus (999) -> (total + 1) * W

    let logicalIndex = stationIndex + 1;
    if (stationIndex === 999) logicalIndex = totalStops + 1;

    const distance = logicalIndex * STATION_WIDTH_VW;
    let duration = 5 / travelSpeed; // Base time 5s adjusted by speed

    world.style.transition = `transform ${duration}s ease-in-out`;
    world.style.transform = `translateX(-${distance}vw)`;

    setTimeout(callback, duration * 1000);
}

function startTrainSound() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    trainSoundGain = ctx.createGain();
    trainSoundGain.gain.value = 0.1;
    trainSoundGain.connect(ctx.destination);

    // Pink noise + rhythm
    const bufferSize = ctx.sampleRate * 2; // 2 seconds buffer
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0; // Initialize lastOut here
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Rhythm filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    noise.connect(filter);
    filter.connect(trainSoundGain);
    noise.start();

    // LFO for Chug-Chug
    const lfo = ctx.createOscillator();
    lfo.type = 'square';
    lfo.frequency.value = 4 * travelSpeed; // Speed up rhythm with travel speed
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 500;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    trainSoundOscillators = [noise, lfo];
}

function stopTrainSound() {
    if (trainSoundGain) {
        trainSoundGain.gain.exponentialRampToValueAtTime(0.001, trainSoundGain.context.currentTime + 0.5);
        setTimeout(() => {
            trainSoundOscillators.forEach(o => o.stop());
            trainSoundOscillators = [];
        }, 500);
    }
}

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
    filter.type = 'lowpass'; // Lowpass for heavy crumble
    filter.frequency.value = 100;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    // Envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.8, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);

    // Filter movement
    filter.frequency.setValueAtTime(100, now);
    filter.frequency.linearRampToValueAtTime(600, now + 0.3); // Crumble up
    filter.frequency.linearRampToValueAtTime(50, now + 1.5); // Settle down

    noise.start(now);
    noise.stop(now + 2);
}


function openStation(index) {
    const stopData = TRAIN_DATA[index];
    const modal = document.getElementById('trainModal');
    const grid = document.getElementById('galleryGrid');
    const title = document.getElementById('modalTitle');

    title.textContent = stopData.displayTitle;

    // Update Description
    let descEl = document.getElementById('trainModalDesc');
    if (!descEl) {
        descEl = document.createElement('p');
        descEl.id = 'trainModalDesc';
        descEl.style.cssText = "color: #ffecd2; font-style: italic; margin-bottom: 25px; font-size: 1.3rem; max-width: 700px; margin-left: auto; margin-right: auto; text-shadow: 1px 1px 2px black;";
        title.insertAdjacentElement('afterend', descEl);
    }
    descEl.textContent = stopData.description;

    // LED STRIP DECORATION
    grid.innerHTML = '<div class="led-strip"></div>'; // Add string container

    if (stopData.images && stopData.images.length > 0) {
        stopData.images.forEach(src => {
            const container = document.createElement('div');
            container.className = 'polaroid-frame';
            // Random rotation
            container.style.transform = `rotate(${Math.random() * 10 - 5}deg)`;

            const img = document.createElement('img');
            img.src = src;
            img.onclick = () => window.open(src, '_blank');

            const caption = document.createElement('div');
            caption.className = 'polaroid-caption';
            caption.textContent = stopData.name;

            container.appendChild(img);
            container.appendChild(caption);
            grid.appendChild(container);
        });
    } else {
        grid.innerHTML += '<p style="color: #666;">No images found.</p>';
    }

    modal.classList.add('active');
}

function closeTrainModal() {
    const modal = document.getElementById('trainModal');
    modal.classList.remove('active');

    setTimeout(() => {
        playWhistle().then(() => {
            goToStation(currentStop + (isReturning ? -1 : 1));
        });
    }, 1000);
}

function playWhistle() {
    return new Promise(resolve => {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const now = ctx.currentTime;
        const freqs = [311, 370];
        freqs.forEach(f => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(f, now);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
            gain.gain.setValueAtTime(0.2, now + 0.4);
            gain.gain.linearRampToValueAtTime(0, now + 1.2);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 1.5);
        });
        setTimeout(resolve, 1500);
    });
}
