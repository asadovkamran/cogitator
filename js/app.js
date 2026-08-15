/* ---------- CONFIG ---------- */
const MODEL_NAME = 'qwen2.5:0.5b';
const OLLAMA_URL = new URLSearchParams(window.location.search).get('spirit')
  || 'http://127.0.0.1:11434/api/generate';
const SPIRIT_CHANCE = 0.12;
const SPIRIT_TIMEOUT_MS = 30000;

/* ---------- HELPERS ---------- */
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

/* ---------- AUDIO ---------- */
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

/* ---------- TYPING / OUTPUT (WebGL) ---------- */

async function typeLine(text, cls = '', speed = 28) {
  const line = beginLine(text, cls);
  view.typing = true;
  const baseRate = cls === 'warn' ? 0.65 : 1;

  for (let i = 0; i < text.length; i++) {
    if (text[i] !== ' ' && Math.random() < corruption / 1200) {
      line.text = line.text.slice(0, i) + randGlitchChar() + line.text.slice(i + 1);
    }
    line.shown++;
    view.dirty = true;
    tick(0.04 + Math.random() * 0.02, baseRate * (0.9 + Math.random() * 0.2));
    await sleep(rand(speed - 10, speed + 18));
  }

  tick(0.05, baseRate * 0.5);
  view.typing = false;
  view.dirty = true;
  await sleep(rand(120, 450));
}

function scrambleLastLine() {
  const line = view.lines[view.lines.length - 1];
  if (!line || line.shown < line.text.length) return;

  const original = line.text;
  let frames = 0;
  const maxFrames = rand(3, 6);

  const iv = setInterval(() => {
    frames++;
    let out = '';
    for (const ch of original) {
      out += (ch !== ' ' && Math.random() < 0.3) ? randGlitchChar() : ch;
    }
    line.text = out;
    view.dirty = true;

    if (frames >= maxFrames) {
      clearInterval(iv);
      if (Math.random() < 0.8) line.text = original;
      view.dirty = true;
    }
  }, 40);
}

function triggerScreenGlitch() { crtPunch(); }
function triggerRoll() { crtRoll(); }

async function showEmblem() {
  view.emblemStart = performance.now();
  view.dirty = true;
  await sleep(1700);
}

/* ---------- GLITCH HELPERS ---------- */
const GLITCH_CHARS = '▓▒░█#%@&$01';
function randGlitchChar() {
  return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
}

/* ---------- STATUS BAR (WebGL) ---------- */
let corruption = 3;
let uptimeSec = 0;

function updateStatus() {
  uptimeSec++;
  status.uptime = uptimeSec;

  corruption += rand(-2, 3);
  if (Math.random() < 0.06) {
    corruption += rand(5, 15);
    crtPunch();
  }
  if (phase === 'CORRUPTION') corruption += 1;
  if (phase === 'LITANY') corruption -= 1;
  corruption = clamp(corruption, 1, 60);

  status.corruption = corruption;
  status.signal = clamp(100 - corruption - rand(0, 6), 20, 100);
  status.phase = phase;
  status.mode = mode;
  view.dirty = true;
}

setInterval(updateStatus, 1000);

/* ---------- CONTENT GENERATION ---------- */
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

  // BOOT / SYSTEM
  if (roll < mix.boot) {
    if (Math.random() < 0.4) {
      text = randBootLogLine();
      speed = rand(12, 18);
    } else {
      text = fillTokens(randItem(bootLines));
      speed = rand(18, 26);
    }
    cls = 'boot';
  }
  // HEX DATA
  else if (roll < mix.boot + mix.hex) {
    text = makeHexLine();
    cls = 'hex';
    speed = rand(8, 14);
  }
  // PRAYERS
  else if (roll < mix.boot + mix.hex + mix.prayer) {
    if (Math.random() < 0.5) {
      text = randMachineCant();
    } else {
      text = fillTokens(randItem(prayerLines));
    }
    cls = 'prayer';
    speed = rand(26, 36);
  }
  // WARNINGS
  else if (roll < mix.boot + mix.hex + mix.prayer + mix.warn) {
    const heresy = randHeresyFlag();
    text = heresy;
    if (heresy.includes('WARP-TAINT')) {
      cls = 'warn';
    } else {
      cls = 'boot';
    }
    speed = rand(24, 32);
  }
  // RESPONSES
  else {
    text = fillTokens(randItem(responseLines));
    cls = 'prayer';
    speed = rand(24, 34);
  }

  return { text, cls, speed: Math.round(speed * speedMul) };
}

/* ---------- PHASES ---------- */
let phase = 'IGNITION';
let mode = 'BOOT';

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

/* ---------- MACHINE SPIRIT ---------- */
function setSpirit(state) {
  status.model = state;
  view.dirty = true;
}

async function askMachineSpirit() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SPIRIT_TIMEOUT_MS);

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
        keep_alive: -1,
        options: { temperature: 0.5, num_ctx: 1024, num_predict: 42}
      })
    });

    if (!res.ok) return [];
    const data = await res.json();
    setSpirit('COMMUNION');

    return (data.response || '')
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => s.length > 90 ? s.slice(0, 90) + ' ...' : s)
      .slice(0, 3);
  } catch (e) {
    setSpirit('DORMANT');
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

/* ---------- BOOT / MAIN ---------- */
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

async function endlessMode() {
  while (true) {
    // phase shift
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

    if (corruption > 30 && Math.random() < 0.12) {
      triggerScreenGlitch();
      await typeLine(randItem(degradeLines), 'glitchline', 20);
    }

    if (Math.random() < 0.12) {
      await sleep(rand(700, 1600));
    }
  }
}

async function startConsole() {
  await boot();
  mode = 'ENDLESS';
  status.mode = mode;
  view.dirty = true;

  askMachineSpirit(); // warm up

  await endlessMode();
}

/* ---------- GLITCH / ROLL SCHEDULERS ---------- */
setInterval(() => {
  if (Math.random() < corruption / 450) triggerScreenGlitch();
  if (Math.random() < corruption / 250) scrambleLastLine();
}, 2500);

(function scheduleRoll() {
  setTimeout(() => {
    triggerRoll();
    scheduleRoll();
  }, Math.max(3000, rand(7000, 15000) - corruption * 80));
})();

/* ---------- SCREENSAVER MODE ---------- */
const saverParams = new URLSearchParams(window.location.search);

if (saverParams.get('saver') === '1') {
  let sx = null, sy = null;

  window.addEventListener('mousemove', (e) => {
    if (sx === null) { sx = e.screenX; sy = e.screenY; return; }
    if (Math.abs(e.screenX - sx) + Math.abs(e.screenY - sy) > 25) window.close();
  });

  ['keydown', 'mousedown', 'wheel', 'touchstart'].forEach(ev => {
    window.addEventListener(ev, () => window.close(), { once: true });
  });
}

/* ---------- INIT ---------- */
unlockAudio();
startConsole();