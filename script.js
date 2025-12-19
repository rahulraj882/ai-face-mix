// const TOTAL_IMAGES = 5; // Removed in favor of explicit list
const ASSET_PATH = 'assets/';

// List of actual files present in assets folder
const AVAILABLE_IMAGES = [
    'Akhand_Kumar.png',
    // 'Akhand_Rahul.png',
    'Anish_Shah.jpeg',
    'BP_Singh.jpeg',
    // 'Brijesh_BP.jpeg',
    'Brijesh_Datta.jpg',
    'Deepak_Kamale.jpeg',
    'Gaurav_Aggarwal.png',
    'Gaurav_Duggal.png',
    // 'Gaurav_Mohsin.png',
    // 'Kiran_Anish.png',
    'Kiran_Thomas.png',
    'Mohsin_Abbas.png',
    'Nilesh_Mahajan.jpeg',
    // 'Nilesh_Sameer.png',
    // 'Raghuram_Deepak.png',
    'Raghuram_Velega.jpeg',
    'Rahul_Mukherjee.jpeg',
    'Sameer_Mehta.jpeg',
    // 'Shailesh_Gaurav.png',
    'Shailesh_Naik.jpeg',
    'Sudhir_Mittal.jpeg',
    // 'Sudhir_Tarun.png',
    'Tarun_Kalra.jpeg',
    'Leader1.jpeg',
    'Leader2.jpeg',
    'Leader3.jpeg',
    'Leader4.jpeg',
    'Leader5.jpeg',
    'Leader6.jpeg',
    'Leader7.jpeg',
    'Leader8.jpeg',
    'Leader9.jpeg',
    'Leader10.jpeg',
    'Leader11.jpeg'

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
const showClueBtn = document.getElementById('show-clue-btn');

const splitContainer = document.getElementById('split-container');
const splitLeft = document.getElementById('split-left');
const splitRight = document.getElementById('split-right');
const stormOverlay = document.getElementById('storm-overlay');

// Clue elements
const clueLeft = document.getElementById('clue-left');
const clueRight = document.getElementById('clue-right');
const clueImgLeft = document.getElementById('clue-img-left');
const clueImgRight = document.getElementById('clue-img-right');
const clueLabelLeft = document.getElementById('clue-label-left');
const clueLabelRight = document.getElementById('clue-label-right');


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

// --- SOUND SYSTEM ---
class SoundSystem {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3; // Global volume
        this.masterGain.connect(this.ctx.destination);
        this.initialized = false;
    }

    ensureContext() {
        if (!this.initialized) {
            this.ctx.resume().then(() => {
                this.initialized = true;
            });
        }
    }

    playTone(freq, type, duration, startTime = 0) {
        this.ensureContext();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);
        gain.gain.setValueAtTime(0.5, this.ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + startTime + duration);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(this.ctx.currentTime + startTime);
        osc.stop(this.ctx.currentTime + startTime + duration);
    }

    playClick() {
        this.playTone(600, 'triangle', 0.1);
    }

    playHover() {
        this.playTone(300, 'sine', 0.05);
    }

    playReveal() {
        this.ensureContext();
        const t = this.ctx.currentTime;

        // 1. Deep Impact (Bass Drop)
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(150, t);
        bassOsc.frequency.exponentialRampToValueAtTime(0.01, t + 2); // Slow drop
        bassGain.gain.setValueAtTime(1, t); // Loud start
        bassGain.gain.exponentialRampToValueAtTime(0.01, t + 2);
        bassOsc.connect(bassGain);
        bassGain.connect(this.masterGain);
        bassOsc.start(t);
        bassOsc.stop(t + 2);

        // 2. Magical Chord (Arpeggio + Sustain)
        // A Major 7: A4, C#5, E5, G#5, A5
        const chord = [440, 554.37, 659.25, 830.61, 880];
        chord.forEach((freq, index) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';

            // Stagger start slightly
            const start = t + (index * 0.05);

            osc.frequency.value = freq;

            // Envelope: Attack -> Sustain -> Release
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.2, start + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, start + 4); // Long tail

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(start);
            osc.stop(start + 4);
        });
    }

    playPowerUp() {
        this.ensureContext();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 1);
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 1);
    }

    playWarp() {
        this.ensureContext();

        // Primary "Tear" Sound
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.8);

        // Modulator for roughness
        const mod = this.ctx.createOscillator();
        mod.type = 'square';
        mod.frequency.value = 50;
        const modGain = this.ctx.createGain();
        modGain.gain.value = 500;
        mod.connect(modGain);
        modGain.connect(osc.frequency);

        // Envelope
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);

        // Sub-bass impact
        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(150, t);
        sub.frequency.exponentialRampToValueAtTime(0.01, t + 0.5);
        subGain.gain.setValueAtTime(0.5, t);
        subGain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

        // Connections
        mod.start(t);
        mod.stop(t + 0.8);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.8);

        sub.connect(subGain);
        subGain.connect(this.masterGain);
        sub.start(t);
        sub.stop(t + 0.5);
    }

    playBloop() {
        this.ensureContext();
        // High pitched short blip
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime); // Increased volume
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    speak(text) {
        if ('speechSynthesis' in window) {
            // Cancel any current speaking
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.volume = 1; // 0 to 1
            utterance.rate = 0.9; // Slightly slower
            utterance.pitch = 0.8; // Slightly lower/robotic

            // Try to find a good "system" voice (usually Google US English or Microsoft David)
            const voices = window.speechSynthesis.getVoices();
            // Prefer a "Zira" or "Google US" voice if possible for sci-fi feel
            const sciFiVoice = voices.find(v => v.name.includes('Zira') || v.name.includes('Google US English'));
            if (sciFiVoice) {
                utterance.voice = sciFiVoice;
            }

            window.speechSynthesis.speak(utterance);
        }
    }
}

const sfx = new SoundSystem();

// --- INITIALIZATION ---
async function init() {
    // createFloatingShards(); // Removed


    // Initialize Audio Context on first interaction
    document.body.addEventListener('click', () => sfx.ensureContext(), { once: true });

    // Preload voices (chrome needs this sometimes)
    if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
    }

    // Button SFX
    document.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('mouseenter', () => sfx.playHover());
    });

    document.getElementById('start-btn').addEventListener('click', () => {
        sfx.playClick();
        sfx.playPowerUp();
        startSelectionPhase();
    });

    splitBtn.addEventListener('click', () => {
        sfx.playWarp();
        triggerStormSplit();
    });

    showClueBtn.addEventListener('click', () => {
        sfx.playClick();
        showClue();
    });

    document.getElementById('peek-btn').addEventListener('click', () => {
        sfx.playClick();
        triggerHandSequence();
    });

    resetBtn.addEventListener('click', () => {
        sfx.playClick();
        resetGame();
    });

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
    showClueBtn.classList.remove('hidden'); // Ensure button is back
    document.getElementById('peek-btn').classList.remove('hidden'); // Ensure peek button is back
    showClueBtn.classList.remove('active'); // Reset active state

    // Hide Clues
    clueLeft.classList.add('hidden');
    clueRight.classList.add('hidden');

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

    // Voiceover
    sfx.speak("Scanning across infinite leadership realities");

    // 1. Populate full screen grid
    // Need enough to cover screen. 150 items usually safe for 1080p.
    mosaicGrid.innerHTML = '';
    const items = [];
    const recentImages = []; // Queue to prevent adjacency
    const COOLDOWN = 15; // Avoid repeating image within this many steps (approx 1 row)

    for (let i = 0; i < 150; i++) {
        // const id = (i % TOTAL_IMAGES) + 1; // Removed
        const div = document.createElement('div');
        div.className = 'mosaic-item'; // CSS handles size

        // Smart Selection Logic
        let selectedInfo;
        let attempts = 0;
        do {
            selectedInfo = getRandomImage();
            attempts++;
        } while (recentImages.includes(selectedInfo) && attempts < 10);

        recentImages.push(selectedInfo);
        if (recentImages.length > COOLDOWN) {
            recentImages.shift();
        }

        const img = document.createElement('img');
        img.src = `${ASSET_PATH}${selectedInfo}`; // selectedInfo is filename string
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

        // Play bloop sound
        sfx.playBloop();
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
    const sphereWrapper = document.getElementById('sphere-wrapper');
    const mergeControls = document.getElementById('merge-controls');

    // 1. Prepare UI State
    if (sphereWrapper && mergeControls) {
        // Reset clue state
        clueLeft.classList.add('hidden');
        clueRight.classList.add('hidden');
        showClueBtn.classList.remove('active');

        sphereWrapper.classList.add('faded-out'); // Fade out briefly for load
        mergeControls.classList.add('faded-out');
    }

    // 2. Clear output canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    switchScreen('merge');

    // Load and Merge
    try {
        // Fallback if no specific data
        const mergedSrc = roundData ? roundData["split the indenties image"] : 'assets/preview-merged.jpeg';

        // Setup Clue Data (Even if hidden)
        if (roundData) {
            clueImgLeft.src = roundData["qleft image"];
            clueImgRight.src = roundData["right image"];
            clueLabelLeft.textContent = roundData["left text"] || "HR";
            clueLabelRight.textContent = roundData["right text"] || "Enterprise";
        }

        // 3. Load Image (No 5 second wait anymore)
        const [previewImg] = await Promise.all([
            new Promise((resolve) => {
                const img = new Image();
                img.src = mergedSrc;
                img.onload = () => resolve(img);
                img.onerror = () => resolve(img); // Proceed even if fail
            }),
            sleep(500) // Small delay for fade transitions
        ]);

        // 4. Draw merged result with full visibility (no crop)
        // Calculate natural aspect ratio
        const ratio = previewImg.width / (previewImg.height || 1); // Avoid div by zero

        // Set canvas dimensions to match this ratio
        const baseHeight = 600;
        canvas.height = baseHeight;
        canvas.width = baseHeight * ratio;

        // Update CSS container
        const sphere = document.querySelector('.energy-sphere');
        if (sphere) {
            sphere.style.aspectRatio = `${ratio}`;
        }

        // Draw FULL image
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(previewImg, 0, 0, canvas.width, canvas.height);

        // 5. Reveal Sphere and Controls
        if (sphereWrapper && mergeControls) {
            sphereWrapper.classList.remove('faded-out');
            mergeControls.classList.remove('faded-out');
        }

        // Setup Reveal Data for when they click Reveal
        document.getElementById('reveal-img-merged').src = mergedSrc;

        if (roundData) {
            revealImgA.src = roundData["qleft image"];
            revealImgB.src = roundData["right image"];

            revealNameA.textContent = roundData["left text"] || "JIO";
            revealNameB.textContent = roundData["right text"] || "JIO";

            const revealOriginA = document.getElementById('reveal-origin-a');
            const revealOriginB = document.getElementById('reveal-origin-b');
            if (revealOriginA) revealOriginA.textContent = roundData["qleft image name"] || "UNIVERSE A";
            if (revealOriginB) revealOriginB.textContent = roundData["right image name"] || "UNIVERSE B";


        } else {
            // Fallback
            revealImgA.src = `assets/img001.jpeg`;
            revealImgB.src = `assets/img002.jpg`;
            revealNameA.textContent = "JIO";
            revealNameB.textContent = "JIO";
        }

    } catch (e) {
        console.error("Merge failed", e);
    }
}

function showClue() {
    const isHidden = clueLeft.classList.contains('hidden');
    if (isHidden) {
        clueLeft.classList.remove('hidden');
        clueRight.classList.remove('hidden');
        showClueBtn.classList.add('active');
        // showClueBtn.textContent = "CLUE REVEALED"; // Optional: Keep it simple as per request
    }
}



// --- PHASE 3 -> 4: STORM SPLIT ---
async function triggerStormSplit() {
    splitBtn.classList.add('hidden'); // Hide button
    showClueBtn.classList.add('hidden'); // Hide clue button too
    document.getElementById('peek-btn').classList.add('hidden'); // Hide peek button

    // Hide clue panels if open
    clueLeft.classList.add('hidden');
    clueRight.classList.add('hidden');

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

    // Play success sound
    sfx.playReveal();
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

// --- CURTAIN PEEK SEQUENCE ---
async function triggerHandSequence() {
    const curtain = document.getElementById('black-curtain');
    const allBtns = document.querySelectorAll('button');

    if (!curtain) return;

    // Disable interactions
    allBtns.forEach(b => b.disabled = true);

    // Setup Transitions
    curtain.style.transition = 'top 1s cubic-bezier(0.25, 1, 0.5, 1)';

    // --- 1. TOP COVER ---
    // Start Top (-100%) -> Move to 0% (Cover Top Half)
    curtain.style.top = '-100%';
    void curtain.offsetWidth; // Force Paint

    curtain.style.top = '-2%'; // Slight overlap

    await sleep(2000); // Hold

    // Exit Top
    curtain.style.top = '-100%';
    await sleep(1000);

    // --- 2. BOTTOM COVER ---
    // Move "Start" to Bottom
    curtain.style.transition = 'none';
    curtain.style.top = '100%'; // Below container
    void curtain.offsetWidth;

    // Animate Up to cover Bottom Half
    curtain.style.transition = 'top 1s cubic-bezier(0.25, 1, 0.5, 1)';
    curtain.style.top = '50%'; // Top edge at 50% covers the bottom half

    await sleep(2000); // Hold

    // Exit Bottom
    curtain.style.top = '100%';
    await sleep(1000);

    // Reset
    curtain.style.transition = 'none';
    curtain.style.top = '-100%';

    // Re-enable interactions
    allBtns.forEach(b => b.disabled = false);
}

// Run
init();

