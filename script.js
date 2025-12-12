const TOTAL_IMAGES = 5;
const ASSET_PATH = 'assets/';

// --- STATE ---
let currentA = null;
let currentB = null;

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
const getRandomId = () => Math.floor(Math.random() * TOTAL_IMAGES) + 1;

// --- INITIALIZATION ---
function init() {
    createFloatingShards();
    document.getElementById('start-btn').addEventListener('click', startSelectionPhase);
    splitBtn.addEventListener('click', triggerStormSplit);
    resetBtn.addEventListener('click', resetGame);
}

function resetGame() {
    // Reset Split/Merge State
    splitBtn.classList.remove('hidden');
    canvas.style.opacity = 1;
    splitContainer.classList.add('hidden');
    splitContainer.style.opacity = 1;
    splitContainer.style.transition = 'none';
    splitLeft.style.transform = 'none';
    splitRight.style.transform = 'none';

    // Clear any active screens to be safe
    Object.values(screens).forEach(s => s.classList.remove('active'));

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
        img.src = `${ASSET_PATH}img${pad(getRandomId())}.jpg`;
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
        const id = (i % TOTAL_IMAGES) + 1;
        const div = document.createElement('div');
        div.className = 'mosaic-item'; // CSS handles size
        const img = document.createElement('img');
        img.src = `${ASSET_PATH}img${pad(id)}.jpg`;
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

    // 3. Select Targets
    let a = getRandomId();
    let b = getRandomId();
    while (a === b) b = getRandomId();
    currentA = a;
    currentB = b;

    // Wait for "Scanning" drama (3 seconds)
    await sleep(4000);
    clearInterval(phasingInterval);

    startMergePhase(a, b);
}

// --- PHASE 2 -> 3: MERGE (SPHERE) ---
async function startMergePhase(idA, idB) {
    switchScreen('merge');

    // Load and Merge
    try {
        // Load the fixed preview image instead of random merge
        // const mergedImg = await loadImage('preview-merged');

        // Actually, just load it directly. 
        // We override the canvas logic to show this specific image
        const previewImg = new Image();
        previewImg.src = 'assets/preview-merged.jpg';
        await new Promise(r => previewImg.onload = r);

        // Draw merged result with full visibility (no crop)
        // 1. Calculate natural aspect ratio
        const ratio = previewImg.width / previewImg.height;

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

        // Prepare Split Animation Assets
        const dataUrl = canvas.toDataURL();
        splitLeft.style.backgroundImage = `url(${dataUrl})`;
        splitRight.style.backgroundImage = `url(${dataUrl})`;

        // Setup Reveal Data
        document.getElementById('reveal-img-merged').src = dataUrl;

        revealImgA.src = `${ASSET_PATH}img${pad(idA)}.jpg`;
        revealImgB.src = `${ASSET_PATH}img${pad(idB)}.jpg`;
        revealNameA.textContent = `UNIVERSE #${pad(idA)}`;
        revealNameB.textContent = `UNIVERSE #${pad(idB)}`;

    } catch (e) {
        console.error("Merge failed", e);
    }
}

// --- PHASE 3 -> 4: STORM SPLIT ---
async function triggerStormSplit() {
    splitBtn.classList.add('hidden'); // Hide button

    // 1. SHAKE THE UNIVERSE
    document.body.classList.add('screen-shake');

    // 2. CRACK
    // Hide canvas, show split container
    canvas.style.opacity = 0;
    splitContainer.classList.remove('hidden');

    await sleep(800); // Shaking for a bit...

    // 3. FLASH & SPLIT
    const whiteOut = stormOverlay.querySelector('.white-out');
    stormOverlay.classList.remove('hidden');
    whiteOut.style.opacity = 1;

    // Trigger separation
    splitLeft.style.transform = "translateX(-200px) rotate(-10deg)";
    splitRight.style.transform = "translateX(200px) rotate(10deg)";
    splitContainer.style.opacity = 0;
    splitContainer.style.transition = "opacity 0.5s 0.2s"; // Fade out while splitting

    await sleep(200); // Wait for flash to peak

    // 4. TRANSITION TO REVEAL
    screens.merge.classList.remove('active');
    screens.merge.classList.add('hidden');

    screens.reveal.classList.remove('hidden');
    screens.reveal.classList.add('active'); // Triggers CSS floatUp anims

    // Fade out flash
    whiteOut.style.opacity = 0;
    document.body.classList.remove('screen-shake');

    await sleep(500);
    stormOverlay.classList.add('hidden');
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

function loadImage(id) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = `${ASSET_PATH}img${pad(id)}.jpg`;
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
