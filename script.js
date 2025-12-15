// const TOTAL_IMAGES = 5; // Removed in favor of explicit list
const ASSET_PATH = 'assets/';

// List of actual files present in assets folder
const AVAILABLE_IMAGES = [
    'gaurav.jpeg',
    'img001.jpeg',
    'img002.jpg',
    'preview-merged.jpeg',
    'shailesh+gaurav.jpeg',
    'shailesh.jpeg',
    'sudheer+tarun.jpeg',
    'sudheer.jpeg',
    'tarun.jpeg'
];

// --- STATE ---
let currentA = null;
let currentB = null;
let gameData = [];
let currentRoundIndex = 0;

// --- DOM ELEMENTS ---
const screens = {
    intro: document.getElementById('intro-screen'),
    selection: document.getElementById('selection-screen'),
    merge: document.getElementById('merge-screen'),
    reveal: document.getElementById('reveal-screen')
};

const mosaicGrid = document.getElementById('mosaic-grid');
const canvas = document.getElementById('merge-canvas');
const ctx = canvas.getContext('2d');
const splitBtn = document.getElementById('split-btn'); // Renamed from revealBtn
const resetBtn = document.getElementById('reset-btn');

const splitContainer = document.getElementById('split-container');
const splitLeft = document.getElementById('split-left');
const splitRight = document.getElementById('split-right');
const stormOverlay = document.getElementById('storm-overlay');

// Reveal elements
const revealImgA = document.getElementById('reveal-img-a');
const revealImgB = document.getElementById('reveal-img-b');
const revealNameA = document.getElementById('reveal-name-a');
const revealNameB = document.getElementById('reveal-name-b');

// --- HELPERS ---
const pad = (num) => String(num).padStart(3, '0');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
// const getRandomId = () => Math.floor(Math.random() * TOTAL_IMAGES) + 1;
const getRandomImage = () => AVAILABLE_IMAGES[Math.floor(Math.random() * AVAILABLE_IMAGES.length)];

// --- INITIALIZATION ---
async function init() {
    createFloatingShards();
    document.getElementById('start-btn').addEventListener('click', startSelectionPhase);
    splitBtn.addEventListener('click', triggerStormSplit);
    resetBtn.addEventListener('click', resetGame);

    // Load Game Data
    try {
        const response = await fetch('game_data.json');
        gameData = await response.json();
        console.log("Game Data Loaded:", gameData);
    } catch (e) {
        console.error("Failed to load game data:", e);
    }
}

function resetGame() {
    // Reset Split/Merge State
    splitBtn.classList.remove('hidden');
    canvas.style.opacity = 1;

    // Ensure infusion class is gone
    const sphere = document.querySelector('.energy-sphere');
    if (sphere) sphere.classList.remove('infusing');

    // Hide split container (legacy, but good to keep clean)
    splitContainer.classList.add('hidden');
    splitContainer.style.opacity = 1;
    splitContainer.style.transition = 'none';
    splitLeft.style.transform = 'none';
    splitRight.style.transform = 'none';

    // Clear any active screens to be safe
    Object.values(screens).forEach(s => s.classList.remove('active'));

    // Advance Round (Sequential)
    if (gameData.length > 1) {
        currentRoundIndex = (currentRoundIndex + 1) % gameData.length;
    } else {
        currentRoundIndex = 0;
    }

    // Start Selection
    startSelectionPhase();
}

function createFloatingShards() {
    const container = document.querySelector('.floating-shards');
    for (let i = 0; i < 15; i++) {
        const shard = document.createElement('div');
        shard.className = 'shard';
        shard.style.left = Math.random() * 100 + 'vw';
        shard.style.animationDelay = Math.random() * 5 + 's';
        shard.style.width = (Math.random() * 50 + 30) + 'px';
        shard.style.height = shard.style.width;

        const img = document.createElement('img');
        img.src = `${ASSET_PATH}${getRandomImage()}`;
        shard.appendChild(img);
        container.appendChild(shard);
    }
}

// --- PHASE 1 -> 2: SELECTION (MOSAIC) ---
async function startSelectionPhase() {
    switchScreen('selection');

    // 1. Populate full screen grid
    // Need enough to cover screen. 150 items usually safe for 1080p.
    mosaicGrid.innerHTML = '';
    const items = [];
    for (let i = 0; i < 150; i++) {
        // const id = (i % TOTAL_IMAGES) + 1; // Removed
        const div = document.createElement('div');
        div.className = 'mosaic-item'; // CSS handles size
        const img = document.createElement('img');
        img.src = `${ASSET_PATH}${getRandomImage()}`;
        img.className = 'mosaic-item';
        div.appendChild(img);
        mosaicGrid.appendChild(div);
        items.push(img);
    }

    // 2. Animate "Phasing" (random flickering)
    const phasingInterval = setInterval(() => {
        // Pick random items to phase
        const idx = Math.floor(Math.random() * items.length);
        const item = items[idx];
        item.classList.add('phasing');
        setTimeout(() => item.classList.remove('phasing'), 300);
    }, 100);

    // 3. Select Targets based on JSON
    // If no data, fallback to random (safety)
    let roundData = null;
    if (gameData && gameData.length > 0) {
        roundData = gameData[currentRoundIndex];
    }

    // Wait for "Scanning" drama (3 seconds)
    await sleep(4000);
    clearInterval(phasingInterval);

    startMergePhase(roundData);
}

// --- PHASE 2 -> 3: MERGE (SPHERE) ---
// --- PHASE 2 -> 3: MERGE (SPHERE) ---
async function startMergePhase(roundData) {
    switchScreen('merge');

    // Load and Merge
    try {
        // Fallback if no specific data
        const mergedSrc = roundData ? roundData["split the indenties image"] : 'assets/preview-merged.jpg';

        // Update Clue Text
        const clueText = document.getElementById('clue-text');
        const clueContainer = document.getElementById('clue-overlay');
        const sphereWrapper = document.getElementById('sphere-wrapper');
        const mergeControls = document.getElementById('merge-controls');

        if (clueText) {
            const lText = (roundData && roundData["left text"]) ? roundData["left text"] : "HR";
            const rText = (roundData && roundData["right text"]) ? roundData["right text"] : "AI";
            clueText.textContent = `${lText} X ${rText}`;
        }

        // Transition Logic: Show Clue -> Wait 5s -> Show Sphere
        if (clueContainer && sphereWrapper && mergeControls) {
            // Initial State: Show Clue, Hide Sphere
            clueContainer.classList.remove('hidden');
            sphereWrapper.classList.add('faded-out');
            mergeControls.classList.add('faded-out');

            // Wait 5 seconds
            await sleep(5000);

            // Swap
            clueContainer.classList.add('hidden');
            sphereWrapper.classList.remove('faded-out');
            mergeControls.classList.remove('faded-out');
        }

        const previewImg = new Image();
        previewImg.src = mergedSrc;
        await new Promise((r, e) => {
            previewImg.onload = r;
            previewImg.onerror = r; // Proceed anyway
        });

        // Draw merged result with full visibility (no crop)
        // 1. Calculate natural aspect ratio
        const ratio = previewImg.width / (previewImg.height || 1); // Avoid div by zero

        // 2. Set canvas dimensions to match this ratio
        // We keep height fixed at 600 (or higher for resolution) and adjust width
        const baseHeight = 600;
        canvas.height = baseHeight;
        canvas.width = baseHeight * ratio;

        // 3. Update CSS container to match this ratio so it doesn't stretch/distort
        // We wait a tick to ensure DOM is ready if needed, but synchronous is fine usually
        const sphere = document.querySelector('.energy-sphere');
        if (sphere) {
            sphere.style.aspectRatio = `${ratio}`;
        }

        // 4. Draw FULL image
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(previewImg, 0, 0, canvas.width, canvas.height);

        // Prepare Split Animation Assets (Legacy visual backup)
        const dataUrl = canvas.toDataURL();
        splitLeft.style.backgroundImage = `url(${dataUrl})`;
        splitRight.style.backgroundImage = `url(${dataUrl})`;

        // Setup Reveal Data
        // Map JSON keys to UI:
        // "split the indenties image" -> Center
        // "qleft image" -> Left
        // "right image" -> Right
        // "text" -> Name

        document.getElementById('reveal-img-merged').src = mergedSrc;

        if (roundData) {
            revealImgA.src = roundData["qleft image"];
            revealImgB.src = roundData["right image"];

            revealNameA.textContent = roundData["left text"] || "HR";
            revealNameB.textContent = roundData["right text"] || "AI";

            const centerName = document.querySelector('.center-card .hero-name');
            if (centerName) centerName.textContent = "FUSION COMPLETE";
        } else {
            // Fallback
            revealImgA.src = `assets/img001.jpg`;
            revealImgB.src = `assets/img002.jpg`;
            revealNameA.textContent = "HR";
            revealNameB.textContent = "AI";
        }

    } catch (e) {
        console.error("Merge failed", e);
    }
}

// --- PHASE 3 -> 4: STORM SPLIT ---
// --- PHASE 3 -> 4: STORM SPLIT (Now Infusion) ---
async function triggerStormSplit() {
    splitBtn.classList.add('hidden'); // Hide button

    // 1. INFUSION DETONATION
    // Instead of splitting, we infuse the energy
    const sphere = document.querySelector('.energy-sphere');
    sphere.classList.add('infusing');

    // Wait for animation to complete (CSS is 1.5s)
    await sleep(1500);

    // 2. TRANSITION TO REVEAL
    screens.merge.classList.remove('active');
    screens.merge.classList.add('hidden');

    // Reset sphere state immediately so it's ready for next time (even though hidden)
    sphere.classList.remove('infusing');

    screens.reveal.classList.remove('hidden');
    screens.reveal.classList.add('active'); // Triggers CSS floatUp anims
}

// --- UTILS ---
function switchScreen(name) {
    Object.values(screens).forEach(s => {
        s.classList.remove('active');
        s.classList.add('hidden');
    });

    // Tiny delay to ensure DOM paint before fade-in
    const target = screens[name];
    target.classList.remove('hidden');
    // Force reflow
    void target.offsetWidth;
    target.classList.add('active');
}

function loadImage(filename) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = `${ASSET_PATH}${filename}`;
        img.onload = () => resolve(img);
        img.onerror = () => {
            // Fallback
            const p = new Image();
            p.src = 'https://placehold.co/400x400/000/FFF?text=VOID';
            p.onload = () => resolve(p);
        };
    });
}

// Run
init();
