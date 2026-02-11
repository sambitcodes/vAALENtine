// TRAIN JOURNEY LOGIC
const STATION_WIDTH_VW = 300; // Distance between stations in VW
let currentStop = -1; // -1 = Start, 0-9 = Memories, 10 = Terminus
let travelSpeed = 1; // Multiplier
let trainSoundGain = null;
let trainSoundOscillators = [];
let isReturning = false;

document.addEventListener('DOMContentLoaded', () => {
    initTrainWorld();

    // Speed Controls
    document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            travelSpeed = parseFloat(e.target.dataset.speed);
        });
    });

    // Return Journey
    document.getElementById('returnHomeBtn').addEventListener('click', () => {
        isReturning = true;
        document.getElementById('returnHomeBtn').classList.add('hidden');
        document.getElementById('theTrain').style.transform = "scaleX(-1)"; // Reverse train
        goToStation(9); // Go back to last memory
    });
});

function initTrainWorld() {
    const world = document.getElementById('worldContainer');
    const trackLayer = document.querySelector('.track-layer');
    const groundLayer = document.querySelector('.ground-layer');
    const sceneryLayer = document.querySelector('.scenery-layer');

    // 10 Memories + Start + Terminus = 12 stops total
    const totalStops = Object.keys(TRAIN_DATA).length;
    const totalWidth = (totalStops + 2) * STATION_WIDTH_VW;

    world.style.width = `${totalWidth}vw`;

    // Generate Ground & Tracks
    let trackHTML = '';
    let groundHTML = '';
    let sceneryHTML = '';

    // We need track for the full width
    // Each segment is 100vw, so we need totalWidth/100 segments
    const segments = totalWidth / 100;

    for (let i = 0; i < segments; i++) {
        trackHTML += '<div class="track-segment"></div>';
        groundHTML += '<div class="ground-segment"></div>';
    }

    trackLayer.innerHTML = trackHTML;
    groundLayer.innerHTML = groundHTML;

    // Generate Stations
    // Start Station at 0 (visual index)
    // Memory 1 at 1
    // ...
    // Memory 10 at 10
    // Terminus at 11

    const stations = ['START', ...Object.keys(TRAIN_DATA), 'TERMINUS'];

    stations.forEach((name, index) => {
        // Adjust index to match visual position (Start is 0, Memories 1..10, End 11)

        let leftPos = index * STATION_WIDTH_VW;

        // Station Sign
        const sign = document.createElement('div');
        sign.className = 'station-sign';

        // Reset the CSS reliance and set inline styles for position in the big world
        sign.style.left = `${leftPos + 50}vw`;

        let label = name;
        let subLabel = "";

        if (index === 0) {
            label = "JOURNEY BEGINS";
            subLabel = "Platform 9¾";
        } else if (index === stations.length - 1) {
            label = "TERMINUS";
            subLabel = "End of the Line";
        } else {
            label = TRAIN_DATA[name].displayTitle; // Use short title
            subLabel = `Stop #${index}`;
        }

        sign.innerHTML = `
            <div class="station-name">${label}</div>
            <div class="station-sub">${subLabel}</div>
        `;

        if (index > 0 && index < stations.length - 1) {
            sign.onclick = () => openStation(name);
        }

        // Pole
        const pole = document.createElement('div');
        pole.className = 'station-pole';
        pole.style.left = `${leftPos + 50}vw`;

        world.appendChild(pole);
        world.appendChild(sign);

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
            if (index % 2 === 0) sceneryHTML += createTree(10 + leftPos, 't1');
            if (index % 3 === 0) sceneryHTML += createBush(80 + leftPos);

            // In "Transit" (100vw - 300vw)
            sceneryHTML += createTree(leftPos + 130 + Math.random() * 20, 't1');
            sceneryHTML += createBush(leftPos + 180 + Math.random() * 20);
            sceneryHTML += createTree(leftPos + 250 + Math.random() * 30, 't2');

            if (index === 7) sceneryHTML += `<div class="scenery-rock" style="left: ${leftPos + 45}vw">🪨</div>`;
        }

        // MANDARMANI SPECIAL BRIDGE (Index 3 and 8 in standard list, check name)
        if (name.includes('mandarmani')) {
            // Add Water under tracks
            const water = document.createElement('div');
            water.className = 'water-body';
            water.style.left = `${leftPos}vw`;
            groundLayer.appendChild(water);

            // Add Bridge styling to track segment at this pos
            const bridge = document.createElement('div');
            bridge.className = 'bridge-structure';
            bridge.style.left = `${leftPos}vw`;
            world.appendChild(bridge);
        }
    });

    sceneryLayer.innerHTML = sceneryHTML;

    // Start Button Logic
    document.getElementById('startTrainBtn').addEventListener('click', () => {
        document.getElementById('startTrainBtn').classList.add('hidden');
        startJourney();
    });
}

function startJourney() {
    goToStation(0);
}

function goToStation(index) {
    if (index >= Object.keys(TRAIN_DATA).length && !isReturning) { // End
        moveWorld(999);
        return;
    }
    if (index < 0 && isReturning) { // Back at start
        moveWorld(-1);
        isReturning = false;
        return;
    }

    currentStop = index;
    const stationName = Object.keys(TRAIN_DATA)[index];

    // Calculate target visual index (Start=0, Mem1=1...)
    const targetIndex = index; // The moveWorld logic handles offset

    // Start Sound
    startTrainSound();
    document.getElementById('theTrain').classList.add('train-shaking');

    moveWorld(targetIndex, () => {
        stopTrainSound();
        playCrumbleSound(); // Play braking/crumble sound on arrival
        document.getElementById('theTrain').classList.remove('train-shaking');
        // Arrived
        if (index === 999) {
            // Terminus logic
            document.getElementById('returnHomeBtn').classList.remove('hidden');
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

    let logicalIndex = stationIndex + 1;
    if (stationIndex === 999) logicalIndex = Object.keys(TRAIN_DATA).length + 1;
    if (stationIndex === -1) logicalIndex = 0;

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
