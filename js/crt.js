/* ---------- WEBGL CRT POST-PROCESS ---------- */
const crtCanvas = document.getElementById('crt');
const gl = crtCanvas.getContext('webgl');

const VSH = `
attribute vec2 a;
varying vec2 vUv;
void main() {
  vUv = a * 0.5 + 0.5;
  gl_Position = vec4(a, 0.0, 1.0);
}`;

const FSH = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform float uTime;
uniform float uRoll;
uniform float uGlitch;

void main() {
  // barrel curvature
  vec2 cc = vUv - 0.5;
  float d = dot(cc, cc);
  vec2 uv = 0.5 + cc * (1.0 + d * 0.14);

  // glitch jitter
  if (uGlitch >= 0.0 && uGlitch < 0.18) {
    uv.x += sin(uv.y * 160.0 + uTime * 90.0) * 0.004;
  }

  // outside the glass = black bezel
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  // chromatic fringing at the edges
  vec3 col;
  col.r = texture2D(uTex, uv + cc * d * 0.02).r;
  col.g = texture2D(uTex, uv).g;
  col.b = texture2D(uTex, uv - cc * d * 0.02).b;

  // scanlines
  col *= 0.82 + 0.18 * sin(uv.y * uRes.y * 3.14159);

  // rolling band, bottom -> top
  if (uRoll >= 0.0 && uRoll < 0.9) {
    float p = -0.15 + uRoll * 1.45;
    col *= 1.0 - smoothstep(0.09, 0.0, abs(uv.y - p)) * 0.35;
  }

  // faint flicker
  col *= 0.97 + 0.03 * sin(uTime * 47.0) * sin(uTime * 13.0);

  // vignette (curved-glass falloff)
  col *= 1.0 - d * 1.15;

  // glitch brightness blip
  if (uGlitch >= 0.0 && uGlitch < 0.18) col *= 1.25;

  gl_FragColor = vec4(col, 1.0);
}`;

function compile(type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}

const prog = gl.createProgram();
gl.attachShader(prog, compile(gl.VERTEX_SHADER, VSH));
gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FSH));
gl.linkProgram(prog);
gl.useProgram(prog);

// fullscreen triangle
const buf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buf);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
const loc = gl.getAttribLocation(prog, 'a');
gl.enableVertexAttribArray(loc);
gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

const uTime = gl.getUniformLocation(prog, 'uTime');
const uRes = gl.getUniformLocation(prog, 'uRes');
const uRoll = gl.getUniformLocation(prog, 'uRoll');
const uGlitch = gl.getUniformLocation(prog, 'uGlitch');

const tex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, tex);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

let rollStart = -1;
let glitchStart = -1;

function crtRoll() { rollStart = performance.now(); }
function crtPunch() { glitchStart = performance.now(); }

function resize() {
  crtCanvas.width = innerWidth;
  crtCanvas.height = innerHeight;
  off.width = innerWidth;
  off.height = innerHeight;
  gl.viewport(0, 0, crtCanvas.width, crtCanvas.height);
  view.dirty = true;
}
window.addEventListener('resize', resize);
resize();

function frame(now) {
  if (needsDraw(now)) {
    drawScene(off.width, off.height, now);
    view.dirty = false;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, off);
  }

  gl.useProgram(prog);
  gl.uniform1f(uTime, now / 1000);
  gl.uniform2f(uRes, crtCanvas.width, crtCanvas.height);
  gl.uniform1f(uRoll, rollStart >= 0 ? (now - rollStart) / 1000 : -1);
  gl.uniform1f(uGlitch, glitchStart >= 0 ? (now - glitchStart) / 1000 : -1);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);