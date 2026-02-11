// TRAIN JOURNEY LOGIC
const STATION_WIDTH_VW = 300; // Distance between stations in VW
let currentStop = -1; // -1 = Start, 0-N = Memories, N+1 = Terminus
let travelSpeed = 1; // Multiplier
let trainSoundGain = null;
let trainSoundOscillators = [];
let isReturning = false;

document.addEventListener('DOMContentLoaded', () => {
    // Ensure TRAIN_DATA is available
    if (typeof TRAIN_DATA === 'undefined') {
        console.error("TRAIN_DATA is missing! Check script loading order.");
        return;
    }

    initTrainWorld();

    // Speed Controls
    const speedBtns = document.querySelectorAll('.speed-btn');
    if (speedBtns.length > 0) {
        speedBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                travelSpeed = parseFloat(e.target.dataset.speed);
            });
        });
    }

    // Return Journey
    const returnBtn = document.getElementById('returnHomeBtn');
    if (returnBtn) {
        returnBtn.addEventListener('click', () => {
            isReturning = true;
            returnBtn.classList.add('hidden');
            document.getElementById('theTrain').style.transform = "scaleX(-1)"; // Reverse train
            goToStation(TRAIN_DATA.length - 1); // Go back to last memory
        });
    }
});

function initTrainWorld() {
    const world = document.getElementById('worldContainer');
    const trackLayer = document.querySelector('.track-layer'); // Check if these exist in CSS/HTML or need creation? 
    // In previous CSS/HTML context these were background-image or part of body? 
    // Actually looking at train.css, track-layer might not exist as a div yet if I didn't verify html structure.
    // Based on previous code, they were selected. Let's assume they exist or we append to world.

    // Retrying robust selection or creation
    let groundLayer = document.querySelector('.ground-layer');
    if (!groundLayer) {
        groundLayer = document.createElement('div');
        groundLayer.className = 'ground-layer';
        world.appendChild(groundLayer);
    }

    // 12 stops total: Start + Data + Terminus
    const totalMemories = TRAIN_DATA.length;
    const totalStops = totalMemories + 2;
    const totalWidth = totalStops * STATION_WIDTH_VW;

    world.style.width = `${totalWidth}vw`;

    // Remove old tracks if any
    const existingTracks = world.querySelectorAll('.track-segment');
    existingTracks.forEach(t => t.remove());

    // Generate Tracks (Visual only, simple loop)
    // We cover the whole width
    const segments = Math.ceil(totalWidth / 100);
    for (let i = 0; i < segments; i++) {
        const track = document.createElement('div');
        track.className = 'track-segment';
        // Check if css handles positioning. Usually absolute.
        // If not using trackLayer, append to ground or world
        track.style.left = `${i * 100}vw`;
        groundLayer.appendChild(track);
    }

    // Generate Stations
    // Visual Index:
    // 0: Start
    // 1..N: Memories
    // N+1: Terminus

    // 1. START STATION
    createStation({
        index: -1,
        visualIndex: 0,
        name: "JOURNEY BEGINS",
        subLabel: "Platform 9¾",
        folder: ""
    }, world);

    // 2. MEMORY STATIONS
    TRAIN_DATA.forEach((memory, i) => {
        createStation({
            index: i,
            visualIndex: i + 1,
            name: memory.displayTitle,
            subLabel: `Stop #${i + 1}`,
            folder: memory.folder,
            originalData: memory
        }, world);
    });

    // 3. TERMINUS
    createStation({
        index: 999, // Special ID
        visualIndex: totalMemories + 1,
        name: "TERMINUS",
        subLabel: "End of the Line",
        folder: ""
    }, world);

    // Initial Scenery Generation
    generateGlobalScenery(totalWidth, world);

    // Start Button Logic
    const startBtn = document.getElementById('startTrainBtn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            startBtn.classList.add('hidden');
            startJourney();
        });
    }
}

function createStation(config, container) {
    const leftPos = config.visualIndex * STATION_WIDTH_VW;

    // Station Sign
    const sign = document.createElement('div');
    sign.className = 'station-sign';
    sign.style.left = `${leftPos + 50}vw`; // Center of that screen

    sign.innerHTML = `
        <div class="station-name">${config.name}</div>
        <div class="station-sub">${config.subLabel}</div>
    `;

    if (config.index >= 0 && config.index !== 999) {
        sign.onclick = () => openStation(config.index);
        sign.style.cursor = "pointer";
    }

    // Station Pole
    const pole = document.createElement('div');
    pole.className = 'station-pole';
    pole.style.left = `${leftPos + 50}vw`;

    container.appendChild(pole);
    container.appendChild(sign);

    // Special Features (Bridge/Water for Mandarmani)
    if (config.folder && config.folder.includes('mandarmani')) {
        const ground = document.querySelector('.ground-layer');

        // Water
        const water = document.createElement('div');
        water.className = 'water-body';
        water.style.left = `${leftPos}vw`;
        water.style.width = '100vw'; // Ensure water spans the station area
        ground.appendChild(water);

        // Bridge
        const bridge = document.createElement('div');
        bridge.className = 'bridge-structure';
        bridge.style.left = `${leftPos}vw`;
        container.appendChild(bridge);
    }
}

function generateGlobalScenery(totalWidthVw, container) {
    // We want scenery everywhere except maybe directly on top of stations?
    // Let's just scatter randomly across the whole width

    const sceneryContainer = document.querySelector('.scenery-layer') || container;
    // Clear old
    const old = sceneryContainer.querySelectorAll('.scenery-tree, .scenery-rock');
    old.forEach(el => el.remove());

    const numItems = Math.floor(totalWidthVw / 15); // One item every 15vw roughly

    for (let i = 0; i < numItems; i++) {
        const pos = Math.random() * totalWidthVw;

        // Avoid "station centers" slightly? (Stations are at 50, 350, 650...)
        // Station center is (Index * 300) + 50. Range roughly +/- 30vw to be safe?
        // Let's just place them, z-index handles overlap usually.

        const type = Math.random() > 0.8 ? 'rock' : 'tree';
        const el = document.createElement('div');

        if (type === 'tree') {
            const variant = Math.random() > 0.5 ? 't1' : 't2';
            el.className = `scenery-tree ${variant}`;
            el.textContent = variant === 't1' ? '🌲' : '🌳';
            el.style.fontSize = (3 + Math.random() * 2) + 'rem';
        } else {
            el.className = 'scenery-rock';
            el.textContent = '🪨';
        }

        el.style.left = `${pos}vw`;
        sceneryContainer.appendChild(el);
    }
}

function startJourney() {
    goToStation(0);
}

function goToStation(index) {
    if (index >= TRAIN_DATA.length && !isReturning) {
        // Terminus
        moveWorld(999);
        return;
    }
    if (index < 0 && isReturning) {
        // Back at start
        moveWorld(-1);
        isReturning = false;
        return;
    }

    currentStop = index;

    // Synthesized Sound Start
    startTrainSound();

    const train = document.getElementById('theTrain');
    train.classList.add('train-shaking');

    moveWorld(index, () => {
        // Arrival Callback
        stopTrainSound();
        playCrumbleSound(); // Synthesized brake
        train.classList.remove('train-shaking');

        // Handle Terminus UI
        if (index === 999) {
            const btn = document.getElementById('returnHomeBtn');
            if (btn) btn.classList.remove('hidden');
        }
        // Handle Start UI
        else if (index === -1) {
            const btn = document.getElementById('startTrainBtn');
            if (btn) {
                btn.classList.remove('hidden');
                btn.textContent = "🚂 Start Again";
            }
            train.style.transform = "scaleX(1)";
        }
    });
}

function moveWorld(dataIndex, callback) {
    const world = document.getElementById('worldContainer');

    // Map data index to visual index
    // -1 -> 0
    // 0 -> 1
    // ...
    // 999 -> length + 1

    let visualIndex = dataIndex + 1;
    if (dataIndex === 999) visualIndex = TRAIN_DATA.length + 1;
    if (dataIndex === -1) visualIndex = 0;

    const targetVw = visualIndex * STATION_WIDTH_VW;
    const duration = 5 / travelSpeed;

    world.style.transition = `transform ${duration}s ease-in-out`;
    world.style.transform = `translateX(-${targetVw}vw)`;

    setTimeout(callback, duration * 1000);
}

// ========================================
// SOUND FX (SYNTHESIZED AS REQUESTED)
// ========================================

function startTrainSound() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    trainSoundGain = ctx.createGain();
    trainSoundGain.gain.value = 0.1;
    trainSoundGain.connect(ctx.destination);

    // Pink noise buffer
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // LFO & Filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    const lfo = ctx.createOscillator();
    lfo.type = 'square';
    lfo.frequency.value = 4 * travelSpeed; // Rhythm matches speed

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 500;

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noise.connect(filter);
    filter.connect(trainSoundGain);

    noise.start();
    lfo.start();

    trainSoundOscillators = [noise, lfo];
}

function stopTrainSound() {
    if (trainSoundGain) {
        trainSoundGain.gain.exponentialRampToValueAtTime(0.001, trainSoundGain.context.currentTime + 0.5);
        setTimeout(() => {
            trainSoundOscillators.forEach(o => o.stop());
            trainSoundOscillators = [];
        }, 600);
    }
}

function playCrumbleSound() {
    // REVERTED TO SYNTHESIZED SOUND
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 100;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.8, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);

    filter.frequency.setValueAtTime(100, now);
    filter.frequency.linearRampToValueAtTime(600, now + 0.3);
    filter.frequency.linearRampToValueAtTime(50, now + 1.5);

    noise.start(now);
    noise.stop(now + 2);
}

// ========================================
// MODAL LOGIC
// ========================================

function openStation(index) {
    const memory = TRAIN_DATA[index];
    const modal = document.getElementById('trainModal');
    const grid = document.getElementById('galleryGrid');
    const title = document.getElementById('modalTitle');

    title.textContent = memory.displayTitle;

    // Description Check/Create
    let descEl = document.getElementById('trainModalDesc');
    if (!descEl) {
        descEl = document.createElement('p');
        descEl.id = 'trainModalDesc';
        descEl.style.cssText = "color: #ffecd2; font-style: italic; margin-bottom: 25px; font-size: 1.3rem; max-width: 700px; margin-left: auto; margin-right: auto; text-shadow: 1px 1px 2px black;";
        title.insertAdjacentElement('afterend', descEl);
    }
    descEl.textContent = memory.description;

    grid.innerHTML = '<div class="led-strip"></div>';

    if (memory.images && memory.images.length > 0) {
        memory.images.forEach(src => {
            const frame = document.createElement('div');
            frame.className = 'polaroid-frame';
            frame.style.transform = `rotate(${Math.random() * 10 - 5}deg)`;

            const img = document.createElement('img');
            img.src = src;
            img.loading = "lazy";
            img.onclick = () => window.open(src, '_blank');

            const caption = document.createElement('div');
            caption.className = 'polaroid-caption';
            caption.textContent = memory.name; // Short name

            frame.appendChild(img);
            frame.appendChild(caption);
            grid.appendChild(frame);
        });
    } else {
        grid.innerHTML += '<p style="color: #ccc;">No snapshots stored here.</p>';
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
    }, 800);
}

function playWhistle() {
    return new Promise(resolve => {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) { resolve(); return; }

        const ctx = new AudioContext();
        const now = ctx.currentTime;
        [311, 370].forEach(f => {
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
