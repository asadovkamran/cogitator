/* ---------- TERMINAL MODEL + 2D PAINTER ---------- */
const view = {
  lines: [],
  typing: false,
  emblemStart: -1,
  dirty: true
};

const status = {
  model: 'DORMANT',
  phase: 'IGNITION',
  mode: 'BOOT',
  corruption: 3,
  signal: 98,
  uptime: 0
};

const COLORS = {
  boot: 'rgba(125,255,155,0.55)',
  hex: 'rgba(125,255,155,0.38)',
  prayer: '#b8ffcc',
  warn: '#ff4b3a',
  spirit: '#eafff0',
  glitchline: '#ff4b3a'
};

const GLOW = { prayer: 12, spirit: 14, warn: 10, glitchline: 12 };

const off = document.createElement('canvas');
const octx = off.getContext('2d');

const emblemImg = new Image();
emblemImg.src = 'assets/emblem.png';
emblemImg.onload = () => { view.dirty = true; };

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => { view.dirty = true; });
}

function beginLine(text, cls) {
  const line = { text, cls, shown: 0 };
  view.lines.push(line);
  if (view.lines.length > 130) view.lines.shift();
  view.dirty = true;
  return line;
}

let lastDraw = 0;

function needsDraw(now) {
  return view.dirty || (now - lastDraw > 100);
}

function drawScene(w, h, now) {
  lastDraw = now;
  const ctx = octx;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#030b06';
  ctx.fillRect(0, 0, w, h);
  ctx.textBaseline = 'top';

  const PAD = 26;
  const BAR = 34;

  // top bar
  ctx.font = '21px VT323, monospace';
  ctx.fillStyle = 'rgba(125,255,155,0.55)';
  ctx.shadowBlur = 0;
  ctx.fillText(
    'LINK :: ESTABLISHED   SPIRIT :: ' + status.model +
    '   PHASE :: ' + status.phase +
    '   CORRUPTION :: ' + status.corruption + '%',
    PAD, 10
  );
  ctx.strokeStyle = 'rgba(125,255,155,0.18)';
  ctx.beginPath(); ctx.moveTo(PAD, BAR); ctx.lineTo(w - PAD, BAR); ctx.stroke();

  // bottom bar
  ctx.fillText(
    'MODE :: ' + status.mode +
    '   SIGNAL :: ' + status.signal + '%' +
    '   UPTIME :: ' + String(status.uptime).padStart(8, '0') + ' CYCLES',
    PAD, h - 24
  );
  ctx.beginPath(); ctx.moveTo(PAD, h - BAR); ctx.lineTo(w - PAD, h - BAR); ctx.stroke();

  // lines, anchored to the bottom
  const LINE_H = 28;
  ctx.font = '22px VT323, monospace';
  const lines = view.lines;

  let y = h - BAR - 16;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (y < BAR + 12) break;

    const L = lines[i];
    const shownText = L.text.slice(0, L.shown);

    ctx.fillStyle = COLORS[L.cls] || COLORS.boot;
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = GLOW[L.cls] || 6;
    ctx.fillText(shownText, PAD, y - 22);

    // caret on the last line
    if (i === lines.length - 1) {
      const on = view.typing || (now % 1000) < 500;
      if (on) {
        const tw = ctx.measureText(shownText).width;
        ctx.fillRect(PAD + tw + 2, y - 22, 10, 22);
      }
    }

    y -= LINE_H;
  }
  ctx.shadowBlur = 0;

  // emblem splash
  if (view.emblemStart >= 0) {
    const t = now - view.emblemStart;
    let a = 0;
    if (t < 450) a = t / 450;
    else if (t < 1100) a = 1;
    else if (t < 1700) a = 1 - (t - 1100) / 600;
    else view.emblemStart = -1;

    if (a > 0 && emblemImg.complete && emblemImg.naturalWidth > 0) {
      ctx.globalAlpha = a;
      ctx.shadowBlur = 25;
      ctx.shadowColor = 'rgba(125,255,155,0.5)';
      const S = Math.min(w, h) * 0.4;
      ctx.drawImage(emblemImg, (w - S) / 2, (h - S) / 2, S, S);
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }
  }
}