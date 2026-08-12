/* ---------- CONFIG ---------- */
const MODEL_NAME = 'qwen2.5:0.5b';
const OLLAMA_URL = 'http://127.0.0.1:11434/api/generate';
const MAX_LINES = 130;
const SPIRIT_CHANCE = 0.18;
const SPIRIT_TIMEOUT_MS = 120000;

/* ---------- DOM REFS ---------- */
const output = document.getElementById('output');
const caret = document.getElementById('caret');

/* ---------- HELPERS ---------- */
// sleep, rand, randItem, randHex, randAddr, randCode, clamp, fmtTime
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

function fmtTime(s) {
    return String(s).padStart(8, '0');
}

/* ---------- AUDIO ---------- */
// initAudio, unlockAudio, tick + listeners
let audioCtx = null;
let masterGain = null;
let clickBuffer = null;

function initAudio() {
    if (audioCtx) return;

    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;

    audioCtx = new AC();

    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.4;
    masterGain.connect(audioCtx.destination);

    const seconds = 0.03;
    const len = Math.floor(audioCtx.sampleRate * seconds);
    clickBuffer = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    const data = clickBuffer.getChannelData(0);

    for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    }
}

function unlockAudio() {
    initAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => { });
    }
}

function tick(volume = 0.05, rate = 1) {
    if (!audioCtx || !clickBuffer) return;
    if (audioCtx.state !== 'running') return;

    const src = audioCtx.createBufferSource();
    src.buffer = clickBuffer;
    src.playbackRate.value = rate * (0.85 + Math.random() * 0.3);

    const g = audioCtx.createGain();
    g.gain.value = volume;

    src.connect(g);
    g.connect(masterGain);
    src.start();
}

window.addEventListener('pointerdown', unlockAudio, { once: true });
window.addEventListener('keydown', unlockAudio, { once: true });

/* ---------- TYPING / OUTPUT ---------- */
// typeLine, trimOutput
async function typeLine(text, cls = '', speed = 28) {
    const line = document.createElement('div');
    line.className = 'line ' + cls;
    output.insertBefore(line, caret);
    lastLine = line;

    caret.classList.add('typing');

    const baseRate = cls === 'warn' ? 0.65 : 1;

    for (const ch of text) {
        let shown = ch;
        if (ch !== ' ' && Math.random() < corruption / 1200) {
            shown = randGlitchChar();
        }

        line.textContent += shown;
        output.scrollTop = output.scrollHeight;

        tick(0.04 + Math.random() * 0.02, baseRate * (0.9 + Math.random() * 0.2));

        await sleep(rand(speed - 10, speed + 18));
    }

    tick(0.05, baseRate * 0.5);

    caret.classList.remove('typing');
    output.scrollTop = output.scrollHeight;
    await sleep(rand(120, 450));
}

function trimOutput() {
    while (output.children.length > MAX_LINES + 1) {
        const old = output.firstElementChild;
        if (!old) break;
        output.removeChild(old);
    }
}

/* ---------- CONTENT GENERATION ---------- */
// makeHexLine, fillTokens, nextEndlessLine, endlessMode
function makeHexLine() {
    const count = rand(3, 6);
    const parts = [];
    for (let i = 0; i < count; i++) {
        parts.push('0x' + randHex(4));
    }
    return parts.join(' ');
}

function fillTokens(text) {
    return text
        .split('{ADDR}').join(randAddr())
        .split('{CODE}').join(randCode());
}

function nextEndlessLine() {
    const mix = PHASE_MIX[phase] || PHASE_MIX.IGNITION;
    const speedMul = PHASE_SPEED[phase] || 1;
    const roll = Math.random();

    let text, cls, speed;

    if (roll < mix.boot) {
        if (Math.random() < 0.4) {
            text = randBootLogLine();
            speed = rand(12, 18);
        } else {
            text = fillTokens(randItem(bootLines));
            speed = rand(18, 26);
        }
        cls = 'boot';
    } else if (roll < mix.boot + mix.hex + mix.prayer) {
        if (Math.random() < 0.5) {
            text = randMachineCant();
        } else {
            text = fillTokens(randItem(prayerLines));
        }

        cls = 'prayer';
        speed = rand(26, 36);
    } else if (roll < mix.boot + mix.hex + mix.prayer + mix.warn) {
        const heresy = randHeresyFlag();
        text = heresy;
        if (heresy.includes('WARP-TAINT')) {
            cls = 'warn';
        } else {
            cls = 'boot'
        }
        speed = rand(24, 32);
    } else {
        text = fillTokens(randItem(responseLines));
        cls = 'prayer';
        speed = rand(24, 34);
    }

    return { text, cls, speed: Math.round(speed * speedMul) };
}

async function endlessMode() {
    while (true) {
        trimOutput();

        if (Date.now() > phaseUntil) {
            shiftPhase();
            triggerScreenGlitch();
            await typeLine('PHASE SHIFT :: ' + phase + ' PROTOCOLS ENGAGED', 'boot', 20);
        }

        const spiritChance = SPIRIT_CHANCE *
            (phase === 'LITANY' ? 1.6 : phase === 'DIAGNOSTIC' ? 0.5 : 1);

        if (Math.random() < spiritChance) {
            const spiritLines = await askMachineSpirit();

            if (spiritLines.length) {
                for (const l of spiritLines) {
                    await typeLine(l, 'spirit', 26);
                }
                await sleep(rand(400, 1000));
                continue;
            }
        }

        const item = nextEndlessLine();
        await typeLine(item.text, item.cls, item.speed);

        if (corruption > 40 && Math.random() < 0.12) {
            triggerScreenGlitch();
            await typeLine(randItem(degradeLines), 'glitchline', 20);
        }

        if (Math.random() < 0.12) {
            await sleep(rand(700, 1600));
        }
    }
}

/* ---------- STATUS BAR ---------- */
// corruption/phase/mode/uptime state + updateStatus + setInterval
let corruption = 3;
let phase = 'IGNITION'
let mode = 'BOOT'
let uptimeSec = 0;

function updateStatus() {
    uptimeSec++;

    corruption += rand(-4, 3);
    if (phase === 'CORRUPTION') corruption += 1;
    if (phase === 'LITANY') corruption -= 3;
    if (Math.random() < 0.06) {
        corruption += rand(5, 10);
        triggerScreenGlitch();
    }
    corruption = clamp(corruption, 1, 60);

    const signal = clamp(100 - corruption - rand(0, 6), 20, 100);

    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    setText('st-phase', 'PHASE :: ' + phase);
    setText('st-mode', 'MODE :: ' + mode);
    setText('st-uptime', 'UPTIME :: ' + fmtTime(uptimeSec) + ' CYCLES');
    setText('st-signal', 'SIGNAL :: ' + signal + '%');

    const corEl = document.getElementById('st-corruption');
    if (corEl) {
        corEl.textContent = 'CORRUPTION :: ' + corruption + '%';
        corEl.classList.toggle('hot', corruption > 30);
    }
}

setInterval(updateStatus, 1000);

/* ---------- MACHINE SPIRIT ---------- */
// setSpirit, askMachineSpirit
function setSpirit(state) {
    const el = document.getElementById('st-model');
    if (el) el.textContent = 'SPIRIT :: ' + state;
}

async function askMachineSpirit() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    try {
        const res = await fetch(OLLAMA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                model: MODEL_NAME,
                system: SPIRIT_SYSTEM,
                prompt: randItem(SPIRIT_PROMPTS),
                stream: false,
                keep_alive: '10m',
                options: { temperature: 0.9, num_predict: 40 }
            })
        });

        if (!res.ok) return [];

        const data = await res.json();
        setSpirit('COMMUNION');

        return (data.response || '')
            .split('\n')
            .map(s => s.trim())
            .filter(Boolean)
            .slice(0, 3);
    } catch (e) {
        setSpirit('DORMANT');
        return [];
    } finally {
        clearTimeout(timeout);
    }
}

/* ---------- GLITCH/CORRUPTION EVENTS ---------- */
const GLITCH_CHARS = '▓▒░█#%@&$01';

let lastLine = null;

function randGlitchChar() {
    return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
}

function triggerScreenGlitch() {
    const screen = document.getElementById('screen');
    screen.classList.remove('glitching');
    void screen.offsetWidth;
    screen.classList.add('glitching');
    setTimeout(() => screen.classList.remove('glitching'), 220)
}

function scrambleLastLine() {
    if (!lastLine) return;

    const original = lastLine.textContent;
    let frames = 0;
    const maxFrames = rand(3, 6);

    const iv = setInterval(() => {
        frames++;
        let out = '';
        for (const ch of original) {
            out += (ch !== ' ' && Math.random() < 0.3) ? randGlitchChar() : ch;
        }
        lastLine.textContent = out;

        if (frames >= maxFrames) {
            clearInterval(iv);
            if (Math.random() < 0.8) lastLine.textContent = original;
        }
    }, 40);
}

setInterval(() => {
    if (Math.random() < corruption / 300) triggerScreenGlitch();
    if (Math.random() < corruption / 250) scrambleLastLine();
}, 2500);

/* ---------- ROLLING SCANLINE ---------- */
function triggerRoll() {
    const roll = document.getElementById('roll');
    roll.classList.remove('active');
    void roll.offsetWidth;
    roll.classList.add('active');
}

(function scheduleRoll() {
    setTimeout(() => {
        triggerRoll();
        scheduleRoll();
    }, Math.max(3000, rand(4000, 7000) - corruption * 80));
})();

/* ---------- CRT BARREL WARP ---------- */
const WARP_STRENGTH = 0.35;   // 0.2 subtle ... 0.6 very curved

function buildWarpMap() {
    const w = 256, h = 256;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(w, h);
    const d = img.data;

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const nx = (x / (w - 1)) * 2 - 1;
            const ny = (y / (h - 1)) * 2 - 1;
            const r2 = nx * nx + ny * ny;

            // sampling pulled toward center, stronger at edges = barrel bulge
            const dx = -nx * r2 * WARP_STRENGTH * 0.5;
            const dy = -ny * r2 * WARP_STRENGTH * 0.5;

            const i = (y * w + x) * 4;
            d[i] = Math.max(0, Math.min(255, 128 + dx * 255));
            d[i + 1] = Math.max(0, Math.min(255, 128 + dy * 255));
            d[i + 2] = 255;
            d[i + 3] = 255;
        }
    }

    ctx.putImageData(img, 0, 0);
    return canvas.toDataURL();
}

function applyWarp() {
    const map = document.getElementById('warp-map');
    const url = buildWarpMap();
    map.setAttribute('href', url);
}

applyWarp();

/* ---------- PHASES ---------- */
const PHASE_MIX = {
    IGNITION: { boot: 0.45, hex: 0.25, prayer: 0.15, warn: 0.10 },
    LITANY: { boot: 0.15, hex: 0.10, prayer: 0.50, warn: 0.05 },
    DIAGNOSTIC: { boot: 0.20, hex: 0.50, prayer: 0.10, warn: 0.10 },
    CORRUPTION: { boot: 0.15, hex: 0.20, prayer: 0.10, warn: 0.40 }
};

const PHASE_SPEED = {
    IGNITION: 0.9,
    LITANY: 1.25,
    DIAGNOSTIC: 0.7,
    CORRUPTION: 1.0
};

let phaseUntil = Date.now() + rand(30000, 60000);

function shiftPhase() {
    const others = PHASES.filter(p => p !== phase);
    phase = randItem(others);
    phaseUntil = Date.now() + rand(30000, 60000);
}

/* ---------- BOOT / MAIN ---------- */
// showEmblem, boot, startConsole, unlockAudio(), startConsole()
async function showEmblem() {
    const emblem = document.getElementById('emblem');

    emblem.classList.add('on');
    await sleep(1100);

    emblem.classList.remove('on');
    await sleep(500);
}

async function boot() {
    await showEmblem();
    await sleep(700);

    await typeLine('COGITATOR INTERFACE :: LINK ESTABLISHED', 'boot', 24);
    await typeLine('RITE OF IGNITION :: BEGIN', 'boot', 24);

    await typeLine(randBootLogLine(), 'boot', 14);
    await typeLine(randBootLogLine(), 'boot', 14);
    await typeLine(randCogitorStatus(), 'boot', 16);

    await typeLine('0xF3A9 0x001C 0x77D1 0x0A42', 'hex', 10);

    await typeLine(randMachineCant(), 'prayer', 26);

    await typeLine(randHeresyFlag(), 'boot', 22);

    await typeLine('The Machine-God watches through the silicon veil.', 'prayer', 32);

    await sleep(700);
    await typeLine('AWAITING NEXT TRANSMISSION ...', 'boot', 24);
}

async function startConsole() {
    await boot();

    askMachineSpirit();

    mode = 'ENDLESS';
    await endlessMode();
}

unlockAudio();
startConsole();