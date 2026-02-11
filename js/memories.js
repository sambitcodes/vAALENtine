// ========================================
// MONOPOLY BOARD LOGIC (6x6 GRID)
// ========================================

let memories = [];
let currentPosition = 0;
let isMoving = false;
// A 6x6 grid perimeter has:
// Top: 6
// Right: 5 (excluding top corner)
// Bottom: 5 (excluding right corner)
// Left: 4 (excluding bottom & top corners)
// Total = 20 blocks.
// A 8x8 grid perimeter has:
// Top: 8
// Right: 7 (excluding top corner)
// Bottom: 7 (excluding right corner)
// Left: 6 (excluding bottom & top corners)
// Total = 28 blocks.
const TOTAL_BLOCKS = 28;

// Generate Grid Mapping for 8x8 Perimeter
// Rows/Cols are 1-indexed.
// Order: Top-Left -> Top-Right -> Bottom-Right -> Bottom-Left -> Top-Left
const GRID_MAPPING = [];

function generateGrid() {
    // 1. Top Row (Left to Right): Row 1, Col 1 -> 8
    for (let c = 1; c <= 8; c++) GRID_MAPPING.push({ row: 1, col: c });

    // 2. Right Col (Top to Bottom): Row 2 -> 8, Col 8
    for (let r = 2; r <= 8; r++) GRID_MAPPING.push({ row: r, col: 8 });

    // 3. Bottom Row (Right to Left): Row 8, Col 7 -> 1
    for (let c = 7; c >= 1; c--) GRID_MAPPING.push({ row: 8, col: c });

    // 4. Left Col (Bottom to Top): Row 7 -> 2, Col 1
    for (let r = 7; r >= 2; r--) GRID_MAPPING.push({ row: r, col: 1 });

    // Set Types for 28 blocks
    GRID_MAPPING.forEach((cell, index) => {
        if (index === 0) {
            cell.type = 'start';
            cell.label = 'GO 🏁';
        } else if (index === 7) { // Top Right Corner
            cell.type = 'chance';
            cell.label = 'Chance ❓';
        } else if (index === 14) { // Bottom Right Corner
            cell.type = 'jail'; // Using Chill logic here
            cell.label = 'Chill ☕';
        } else if (index === 21) { // Bottom Left Corner
            cell.type = 'chance';
            cell.label = 'Chance ❓';
        } else {
            cell.type = 'memory';
        }
    });
}
generateGrid();

document.addEventListener('DOMContentLoaded', async () => {
    if (!CONFIG.memories) {
        await loadConfig();
    }
    memories = CONFIG.memories || [];

    initBoard();
    initMemoriesMusic();

    // Start fresh at Go block (index 0)
    currentPosition = 0;
    placePawn(currentPosition);
    updateInfoPanel(currentPosition);

    document.getElementById('rollBtn').addEventListener('click', handleRoll);

    // Modal Close
    const closeBtns = document.querySelectorAll('.close-modal, .close-btn');
    closeBtns.forEach(btn => btn.addEventListener('click', closeModal));
    window.addEventListener('click', (e) => {
        if (e.target == document.getElementById('memoryModal')) closeModal();
    });
});

const MEMORY_DATA = [
    { title: "Where It All Began", image: "the last call/1.jpg", description: "It was just the end - the day after everything just sublimed. Had I any idea I wouldnt have let this call end." },
    { title: "Stronger Together", image: "the rough patch/2.jpg", description: "Every journey has its bumps, but we made it through together." },
    { title: "That Heartbeat Moment", image: "the first meeting/1.jpg", description: "Remember how serious I was at the reception as If I knew you forever. Hugging tightly for half an hour. WOWWWW!" },
    { title: "Coastal Dreams", image: "the mandarmani trip/5.jpg", description: "The sea breeze and the sound of waves at Mandarmani." },
    { title: "The Grand Return", image: "came back with a bang/1.jpg", description: "Month of silence and then we slowly grew back. We both tried for better." },
    { title: "Moonlight Serenade", image: "the last walk to remember/1.jpg", description: "Standing on the bridge looking at the beauty of moon, returning with paan." },
    { title: "Forever In Your Arms", image: "my forever together moment/1.jpg", description: "I still remember every small detail of that day, you holding me tight." },
    { title: "Chilli's Spice & Love", image: "a chillis date never disappoints/1.jpg", description: "Thank you for introducing me to this class of a restaurant. It's my favourite!" },
    { title: "First Heart To Heart", image: "when we talked for the first time/1.jpg", description: "The conversation that started it all." },
    { title: "Our First Milestone", image: "when we went on a trip for the first time/1.jpg", description: "Our first big adventure together." },
    { title: "Ocean Soul", image: "the mandarmani trip/2.jpg", description: "Another beautiful moment by the sea." },
    { title: "The Journey Logic", image: "when we went on a trip for the first time/2.jpg", description: "Capturing the joy of travel." },
    { title: "Side By Side", image: "my forever together moment/2.jpg", description: "Standing side by side, always." },
    { title: "Infinite Path", image: "the last walk to remember/2.jpg", description: "Exploring every corner of our world." },
    { title: "Late Night Echoes", image: "the last call/2.jpg", description: "Seconds felt like hours on those calls." },
    { title: "Seaside Soul", image: "the mandarmani trip/3.jpg", description: "The memories we made at the coast." },
    { title: "Fiery Flavors", image: "a chillis date never disappoints/2.jpg", description: "Back at our favorite spot!" },
    { title: "Healing Chapters", image: "the rough patch/3.jpg", description: "Growing stronger through every challenge." },
    { title: "Deep Soul Talk", image: "when we talked for the first time/2.jpg", description: "Finding so much in common." },
    { title: "Mandarmani Magic", image: "the mandarmani trip/4.jpg", description: "The beauty of the ocean matched our joy." },
    { title: "Bridge To Forever", image: "the last walk to remember/3.jpg", description: "Peaceful moments under the stars." },
    { title: "Unbreakable Bond", image: "my forever together moment/3.jpg", description: "A bond that can't be broken." },
    { title: "The Bang Return", image: "came back with a bang/2.jpg", description: "Starting a fresh chapter with a bang." },
    { title: "Where Magic Happens", image: "when we talked for the first time/3.jpg", description: "Where it all began..." }
];

function initBoard() {
    const board = document.getElementById('monopolyBoard');
    board.innerHTML = ''; // Clear prev if any

    // We have 16 memory blocks. We have 10 data items.
    // Let's map them.
    let memoryCounter = 0;

    GRID_MAPPING.forEach((cell, index) => {
        const block = document.createElement('div');
        block.className = 'board-block';
        block.style.gridRow = cell.row;
        block.style.gridColumn = cell.col;
        block.dataset.index = index;
        block.id = `block-${index}`;

        // Content
        if (cell.type === 'start') {
            block.classList.add('start-block');
            block.innerHTML = `<span class="block-icon">🏁</span><span class="block-name">GO</span>`;
        } else if (cell.type === 'chance') {
            block.classList.add('corner-block');
            block.innerHTML = `<span class="block-icon">❓</span><span class="block-name">Chance</span>`;
        } else if (cell.type === 'jail') {
            block.classList.add('corner-block');
            block.innerHTML = `<span class="block-icon">☕</span><span class="block-name">Chill</span>`;
        } else {
            // Memory Block
            block.classList.add('memory-block');
            const dataIndex = memoryCounter % MEMORY_DATA.length;
            const memory = MEMORY_DATA[dataIndex];
            memoryCounter++;

            // Polaroid Wrap
            const polaroid = document.createElement('div');
            polaroid.className = 'board-polaroid';
            polaroid.style.setProperty('--rotation', `${(Math.random() * 4 - 2).toFixed(1)}deg`);

            // Image
            const img = document.createElement('img');
            img.src = `pictures/memories/${memory.image}`;
            img.className = 'block-thumb';
            // HEIC Handling fallback (visual)
            if (memory.image.toLowerCase().endsWith('.heic')) {
                img.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.className = 'heic-placeholder';
                fallback.textContent = '📸';
                polaroid.appendChild(fallback);
            }

            polaroid.appendChild(img);
            block.appendChild(polaroid);

            // Title
            const title = document.createElement('div');
            title.className = 'block-name';
            title.textContent = memory.title;
            block.appendChild(title);

            // Data for modal
            block.dataset.memoryTitle = memory.title;
            block.dataset.memoryImage = memory.image;
            block.dataset.memoryDesc = memory.description || "Reliving this beautiful memory...";
        }

        block.addEventListener('click', () => handleBlockClick(index));
        board.appendChild(block);
    });

    // Center Branding (Re-injecting Bulbs and Pulsing Logo)
    const center = document.createElement('div');
    center.className = 'board-center-decoration';
    center.innerHTML = `
        <div class="bulbs-container">
            <span class="bulb"></span><span class="bulb"></span><span class="bulb"></span>
            <span class="bulb"></span><span class="bulb"></span><span class="bulb"></span>
            <span class="bulb"></span><span class="bulb"></span><span class="bulb"></span>
            <span class="bulb"></span><span class="bulb"></span><span class="bulb"></span>
        </div>
        <h1 class="logo-text">DUOpoly</h1>
    `;
    board.appendChild(center);

    // Pawn
    const pawn = document.createElement('div');
    pawn.id = 'pawn';
    pawn.className = 'pawn';
    board.appendChild(pawn);
}

function handleRoll() {
    if (isMoving) return;

    const rollBtn = document.getElementById('rollBtn');
    rollBtn.disabled = true;

    const dice = document.getElementById('dice');
    const rolledNum = Math.floor(Math.random() * 6) + 1;

    // Dice Val -> Rotation Mapping (X, Y)
    // based on standard CSS cube: front=1, back=6, right=3, left=4, top=5, bottom=2
    const rotations = {
        1: { x: 0, y: 0 },
        6: { x: 0, y: 180 }, // Fix: Rotate Y instead of X to prevent upside down "9"
        3: { x: 0, y: -90 }, // Rotate Y to show Right
        4: { x: 0, y: 90 },  // Rotate Y to show Left
        5: { x: -90, y: 0 }, // Rotate X to show Top
        2: { x: 90, y: 0 }   // Rotate X to show Bottom
    };

    // Add extra full spins for effect (e.g., 2 full rotations)
    const extraSpins = 2 * 360;
    const target = rotations[rolledNum];

    // We add extra spins to the target rotation
    // Ensure we start from logical 0 or add to current if preserving state (optional)
    // For simplicity, just set distinct new transform
    const finalX = target.x + extraSpins + (Math.random() < 0.5 ? 360 : 0); // Randomize spin direction slightly
    const finalY = target.y + extraSpins;

    dice.style.transform = `rotateX(${finalX}deg) rotateY(${finalY}deg)`;

    // SOUND: Dice Shake
    SoundFX.playDiceShake();
    updateGameStatus("Rolling...");

    setTimeout(() => {
        updateGameStatus(`Rolled a ${rolledNum}!`);
        movePawnSequence(rolledNum);
        rollBtn.disabled = false;
    }, 1200);
}

function movePawnSequence(steps) {
    isMoving = true;
    let stepsLeft = steps;

    const stepInterval = setInterval(() => {
        currentPosition = (currentPosition + 1) % TOTAL_BLOCKS;
        placePawn(currentPosition);

        // SOUND: Step
        SoundFX.playLand();

        stepsLeft--;
        if (stepsLeft <= 0) {
            clearInterval(stepInterval);
            isMoving = false;
            checkLanding();
            updateInfoPanel(currentPosition);
        }
    }, 300); // 300ms per hop, slightly faster
}

function placePawn(index) {
    const block = document.getElementById(`block-${index}`);
    const pawn = document.getElementById('pawn');
    const board = document.getElementById('monopolyBoard'); // Relative parent

    // Grid positioning is tricky because offsets are relative to nearest positioned ancestor.
    // The board is relative.
    const rect = block.offsetLeft;
    const top = block.offsetTop;
    const w = block.offsetWidth;
    const h = block.offsetHeight;

    // Center pawn
    pawn.style.left = (rect + w / 2 - 17.5) + 'px'; // 35px width/2
    pawn.style.top = (top + h / 2 - 17.5) + 'px';

    document.querySelectorAll('.board-block').forEach(b => b.classList.remove('active'));
    block.classList.add('active');
}

function savePosition() {
    localStorage.setItem('pawnIndex_v2', currentPosition);
}

function checkLanding() {
    const type = GRID_MAPPING[currentPosition].type;

    if (type === 'memory') {
        updateGameStatus("Memory! Click the block to view! 📸");
        triggerConfetti(500);
    } else if (type === 'chance') {
        triggerEventPopup('chance');
    } else if (type === 'jail') {
        triggerEventPopup('chill');
    } else {
        updateGameStatus(GRID_MAPPING[currentPosition].label || "Just visiting...");
    }
}

function triggerEventPopup(type) {
    const popup = document.getElementById('eventPopup');
    const title = document.getElementById('eventTitle');
    const msg = document.getElementById('eventMessage');

    popup.classList.remove('hidden');

    if (type === 'chance') {
        title.textContent = "Chance! ❓";
        msg.textContent = "You thought I will be asking for another chance, Damn right ! I am too desperate and much in love to not ask for a chance. Just kidding AALEN - roll the dice again.";

        setTimeout(() => {
            popup.classList.add('hidden');
        }, 10000);
    } else if (type === 'chill') {
        title.textContent = "Chill Zone ☕";
        msg.textContent = "Nothing to do here, I ran out of Ideas";

        setTimeout(() => {
            msg.textContent = "PSYCH ! I lied - Will you be my valentine ? OK stop don't answer, Keep playing !";
            setTimeout(() => {
                popup.classList.add('hidden');
            }, 5000);
        }, 5000);
    }
}

function handleBlockClick(index) {
    if (index !== currentPosition) {
        updateGameStatus("You need to land here first! 🎲");
        return;
    }

    const block = document.getElementById(`block-${index}`);
    if (GRID_MAPPING[index].type === 'memory') {
        openModal({
            title: block.dataset.memoryTitle,
            image: block.dataset.memoryImage,
            description: block.dataset.memoryDesc
        });
    }
}

function openModal(data) {
    const modal = document.getElementById('memoryModal');

    // SOUND: Open
    SoundFX.playMemoryOpen();

    document.getElementById('modalTitle').textContent = data.title;
    document.getElementById('modalDate').textContent = "Our Special Moment";
    document.getElementById('modalDesc').textContent = data.description || "Reliving this beautiful memory...";

    const img = document.getElementById('modalImage');

    if (data.image) {
        img.src = `pictures/memories/${data.image}`;
        img.className = 'modal-image polaroid-img';
        img.style.display = 'block';

        if (data.image.toLowerCase().endsWith('.heic')) {
            img.style.display = 'none';
            // Maybe show a message or use the placeholder
        }
    } else {
        img.src = `https://ui-avatars.com/api/?name=❤&background=random&size=256&font-size=0.5`;
        img.className = 'modal-image';
    }

    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('memoryModal').classList.add('hidden');
}

function updateGameStatus(msg) {
    document.getElementById('gameStatus').textContent = msg;
}

function updateInfoPanel(index) {
    const block = document.getElementById(`block-${index}`);
    if (block) {
        const title = block.dataset.memoryTitle || GRID_MAPPING[index].label || "Unknown";
        document.getElementById('currentBlockInfo').innerHTML = `<strong>${title}</strong><br>Block #${index + 1}`;
    }
}

function initMemoriesMusic() {
    const music = new Audio('pictures/tdn-memories.mp3');
    music.loop = true;
    music.volume = 0.15; // Lighter volume as requested

    const startMusic = () => {
        music.play().catch(err => console.log("Music blocked:", err));
        document.removeEventListener('click', startMusic);
    };
    document.addEventListener('click', startMusic);
}
