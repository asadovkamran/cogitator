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

function randHex(length) {
    const chars = '0123456789ABCDEF';
    let out = '';
    for (let i = 0; i < length; i++) {
        out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
}

function randAddr() {
    return '0x' + randHex(4);
}

function randCode() {
    return '0x' + randHex(4) + '-' + randHex(2);
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

    caret.classList.add('typing');

    const baseRate = cls === 'warn' ? 0.65 : 1;
    let charIndex = 0;

    for (const ch of text) {
        charIndex++;
        line.textContent += ch;
        output.scrollTop = output.scrollHeight;

        // play a tick for every character
        tick(0.04 + Math.random() * 0.02, baseRate * (0.9 + Math.random() * 0.2));

        await sleep(rand(speed - 10, speed + 18));
    }

    // small end-of-line thunk
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
    const roll = Math.random();

    if (roll < 0.32) {
        return {
            text: fillTokens(randItem(bootLines)),
            cls: 'boot',
            speed: rand(18, 26)
        };
    }

    if (roll < 0.58) {
        return {
            text: makeHexLine(),
            cls: 'hex',
            speed: rand(8, 14)
        };
    }

    if (roll < 0.78) {
        return {
            text: fillTokens(randItem(prayerLines)),
            cls: 'prayer',
            speed: rand(26, 36)
        };
    }

    if (roll < 0.88) {
        return {
            text: fillTokens(randItem(warnLines)),
            cls: 'warn',
            speed: rand(24, 32)
        };
    }

    return {
        text: fillTokens(randItem(responseLines)),
        cls: 'prayer',
        speed: rand(24, 34)
    };
}

async function endlessMode() {
    while (true) {
        trimOutput();

        if (Math.random() < SPIRIT_CHANCE) {
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

    corruption += rand(-2, 3);
    if (Math.random() < 0.06) corruption += rand(5, 15);
    corruption = clamp(corruption, 1, 60);

    const signal = clamp(100 - corruption - rand(0, 6), 20, 100);

    if (Math.random() < 0.04) {
        phase = PHASES[Math.floor(Math.random() * PHASES.length)];
    }

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
    await sleep(700);

    await typeLine('COGITATOR INTERFACE :: LINK ESTABLISHED', 'boot', 24);
    await typeLine('RITE OF IGNITION :: BEGIN', 'boot', 24);
    await typeLine('sanctified firmware mount... accepted', 'boot', 18);
    await typeLine('machine spirit presence... detected', 'boot', 18);

    await typeLine('0xF3A9 0x001C 0x77D1 0x0A42', 'hex', 10);

    await typeLine('Let the sacred protocols be invoked.', 'prayer', 30);
    await typeLine('WARNING :: flesh-corruption detected in buffer 0x003C', 'warn', 26);

    await typeLine('0x9D21 :: checksum accepted', 'hex', 10);
    await typeLine('The Machine-God watches through the silicon veil.', 'prayer', 32);

    await sleep(700);
    await typeLine('AWAITING NEXT TRANSMISSION ...', 'boot', 24);
}

async function startConsole() {
    await showEmblem();
    await boot();

    askMachineSpirit();

    mode = 'ENDLESS';
    await endlessMode();
}

unlockAudio();
startConsole();