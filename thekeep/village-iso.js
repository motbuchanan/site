// Ravenmarrow · village-iso.js · v3.3 · Nov 18 2026
// The village seen the way The Keep's Isometric mode sees its world: an orthographic camera at a fixed slant, every
// building made of lit blocks, a real shadow map from the sun or the blood moon, warm torch light pooling on the ground,
// and fog closing in at the edges. It only draws what it is handed (parts made of boxes), so another game can reuse it.
// Loaded on demand when the Village tab opens. window.VIL: mount, update, unmount, setHour, stats, project.
(function(){
'use strict';
const PITCH = 35 * Math.PI / 180, YAW = 45 * Math.PI / 180;
const MAXL = 16, SHADOW = 1536;

// ---------- small math ----------
function mul(a, b){ const o = new Float32Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++){ let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; }
function ortho(l, r, b, t, n, f){ return new Float32Array([2 / (r - l), 0, 0, 0, 0, 2 / (t - b), 0, 0, 0, 0, -2 / (f - n), 0, -(r + l) / (r - l), -(t + b) / (t - b), -(f + n) / (f - n), 1]); }
function norm(v){ const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
function cross(a, b){ return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function dot(a, b){ return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function lookAt(e, c, up){ const z = norm([e[0] - c[0], e[1] - c[1], e[2] - c[2]]), x = norm(cross(up, z)), y = cross(z, x);
 return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, e), -dot(y, e), -dot(z, e), 1]); }
function inv(a){ const o = new Float32Array(16);
 const b00 = a[0] * a[5] - a[1] * a[4], b01 = a[0] * a[6] - a[2] * a[4], b02 = a[0] * a[7] - a[3] * a[4], b03 = a[1] * a[6] - a[2] * a[5],
  b04 = a[1] * a[7] - a[3] * a[5], b05 = a[2] * a[7] - a[3] * a[6], b06 = a[8] * a[13] - a[9] * a[12], b07 = a[8] * a[14] - a[10] * a[12],
  b08 = a[8] * a[15] - a[11] * a[12], b09 = a[9] * a[14] - a[10] * a[13], b10 = a[9] * a[15] - a[11] * a[13], b11 = a[10] * a[15] - a[11] * a[14];
 let d = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06; if (!d) return o; d = 1 / d;
 o[0] = (a[5] * b11 - a[6] * b10 + a[7] * b09) * d; o[1] = (a[2] * b10 - a[1] * b11 - a[3] * b09) * d; o[2] = (a[13] * b05 - a[14] * b04 + a[15] * b03) * d; o[3] = (a[10] * b04 - a[9] * b05 - a[11] * b03) * d;
 o[4] = (a[6] * b08 - a[4] * b11 - a[7] * b07) * d; o[5] = (a[0] * b11 - a[2] * b08 + a[3] * b07) * d; o[6] = (a[14] * b02 - a[12] * b05 - a[15] * b01) * d; o[7] = (a[8] * b05 - a[10] * b02 + a[11] * b01) * d;
 o[8] = (a[4] * b10 - a[5] * b08 + a[7] * b06) * d; o[9] = (a[1] * b08 - a[0] * b10 - a[3] * b06) * d; o[10] = (a[12] * b04 - a[13] * b02 + a[15] * b00) * d; o[11] = (a[9] * b02 - a[8] * b04 - a[11] * b00) * d;
 o[12] = (a[5] * b07 - a[4] * b09 - a[6] * b06) * d; o[13] = (a[0] * b09 - a[1] * b07 + a[2] * b06) * d; o[14] = (a[13] * b01 - a[12] * b03 - a[14] * b00) * d; o[15] = (a[8] * b03 - a[9] * b01 + a[10] * b00) * d;
 return o; }
function xform(m, p){ const x = p[0], y = p[1], z = p[2], w = m[3] * x + m[7] * y + m[11] * z + m[15];
 return [(m[0] * x + m[4] * y + m[8] * z + m[12]) / w, (m[1] * x + m[5] * y + m[9] * z + m[13]) / w, (m[2] * x + m[6] * y + m[10] * z + m[14]) / w]; }
function hash(x, y){ let h = (x * 374761393 + y * 668265263) >>> 0; h = Math.imul(h ^ h >>> 13, 1274126177); return ((h ^ h >>> 16) >>> 0) / 4294967296; }

// ---------- shaders ----------
const VS = `#version 300 es
layout(location=0) in vec3 aP; layout(location=1) in vec3 aN; layout(location=2) in float aM; layout(location=3) in float aAO;
uniform mat4 uVP; uniform mat4 uLVP;
out vec3 vW; out vec3 vN; flat out int vM; out float vAO; out vec4 vL;
void main(){ vW = aP; vN = aN; vM = int(aM + .5); vAO = aAO; vL = uLVP * vec4(aP, 1.0); gl_Position = uVP * vec4(aP, 1.0); }`;
const FS = `#version 300 es
precision highp float; precision highp sampler2DShadow;
in vec3 vW; in vec3 vN; flat in int vM; in float vAO; in vec4 vL;
uniform vec4 uMat[40]; uniform float uGrid; uniform vec3 uAmb; uniform vec3 uSky; uniform vec3 uSunC; uniform vec3 uSunD; uniform vec3 uBg; uniform vec2 uCtr;
uniform int uNL; uniform vec4 uLP[${MAXL}]; uniform float uTime; uniform float uTorch; uniform sampler2DShadow uSh; uniform float uFlick;
out vec4 o;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float shade(){ vec3 p = vL.xyz / vL.w * .5 + .5; if (p.x < 0. || p.y < 0. || p.x > 1. || p.y > 1.) return 1.;
 float b = .0018, s = 0.; vec2 t = vec2(1.0 / ${SHADOW}.0);
 for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++) s += texture(uSh, vec3(p.xy + vec2(i, j) * t, p.z - b));
 return s / 9.; }
void main(){
 vec4 m = uMat[vM]; vec3 base = m.rgb;
 // a little per-block grain so big faces are not flat
 base *= .92 + .16 * hash(floor(vW.xy * 8.0) + floor(vW.z * 8.0));
 vec3 n = normalize(vN);
 float ndl = max(dot(n, uSunD), 0.0), sh = ndl > 0. ? shade() : 0.;
 vec3 lit = uAmb * (.62 + .38 * n.z) + uSky * max(n.z, 0.) * .25 + uSunC * ndl * sh;
 vec3 warm = vec3(0.);
 for (int i = 0; i < ${MAXL}; i++){ if (i >= uNL) break; vec3 d = uLP[i].xyz - vW; float dist = length(d); float q = dist / uLP[i].w;
  if (q < 1.){ float k = (1. - q); k *= k; float f = 1. + uFlick * (.12 * sin(uTime * 9. + float(i) * 3.1) + .08 * sin(uTime * 23. + float(i)));
   warm += vec3(1.0, .62, .3) * k * f * (.35 + .65 * max(dot(n, d / max(dist, .001)), 0.)) * uTorch; } }
 vec3 c = base * (lit * vAO + warm) + base * m.a * 1.15;
 // edit mode: faint tile lines on the open ground
 if (uGrid > 0. && n.z > .9 && vW.z < .08 && vW.x > 0. && vW.y > 0. && vW.x < 28. && vW.y < 28.){ vec2 g = abs(fract(vW.xy) - .5); float e = smoothstep(.47, .5, max(g.x, g.y)); c = mix(c, vec3(.85, .7, .4) * (.35 + .65 * uAmb.r), e * .55); }
 // fog: the forest edge sinks into the dark
 float r = length(vW.xy - uCtr); float f = smoothstep(13.0, 24.0, r);
 c = mix(c, uBg, f);
 o = vec4(pow(c, vec3(.94)), 1.0);
}`;
const VS_D = `#version 300 es
layout(location=0) in vec3 aP; uniform mat4 uLVP; void main(){ gl_Position = uLVP * vec4(aP, 1.0); }`;
const FS_D = `#version 300 es
precision mediump float; out vec4 o; void main(){ o = vec4(1.0); }`;

// ---------- state ----------
let canvas = null, gl = null, host = null, labelLayer = null, P = null, PD = null, shTex = null, shFb = null;
let geo = null, dyn = null, lastScene = null, lost = false;
const cam = {tx:14, ty:14, zoom:9.5, minZ:2.4, maxZ:22, fitted:false};  // v3.4: minZ 2.4 lets a finger get close enough to read faces and kit
const st = {dirty:true, raf:0, last:0, t0:performance.now(), frames:0, fpsT:0, fps:0, verts:0, hour:null, mounted:false, onTap:null, reduce:false, labels:[], parts:[], lights:[], smokeSrc:[], puffs:[], cost:8, visible:true, actors:[], anim:null, canAnim:null, battle:null, sel:null};

function compile(type, src){ const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
function program(vs, fs, names){ const p = gl.createProgram(); gl.attachShader(p, compile(gl.VERTEX_SHADER, vs)); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
 if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); const u = {}; names.forEach(n => u[n] = gl.getUniformLocation(p, n)); return {p, u}; }

function initGL(){
 gl = canvas.getContext('webgl2', {antialias:true, alpha:false, preserveDrawingBuffer:false, powerPreference:'default'});
 if (!gl) return false;
 P = program(VS, FS, ['uGrid', 'uVP', 'uLVP', 'uMat', 'uAmb', 'uSky', 'uSunC', 'uSunD', 'uBg', 'uCtr', 'uNL', 'uLP', 'uTime', 'uTorch', 'uSh', 'uFlick']);
 PD = program(VS_D, FS_D, ['uLVP']);
 shTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, shTex);
 gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT24, SHADOW, SHADOW);
 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
 shFb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, shFb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, shTex, 0);
 gl.drawBuffers([gl.NONE]); gl.readBuffer(gl.NONE); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
 geo = null; dyn = null;
 return true;
}

// ---------- geometry: boxes to faces ----------
// faces: top, +x, -x, +y, -y (no bottoms, nothing sits under the ground)
const FACES = [[0, 0, 1], [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0]];
function pushBox(V, I, b, ox, oy){
 const x0 = b[0] + ox, y0 = b[1] + oy, z0 = b[2], x1 = x0 + b[3], y1 = y0 + b[4], z1 = z0 + b[5], m = b[6];
 const low = z0 < .2 ? .62 : .82; // contact shading where a block meets the ground
 const quads = [
  [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]],
  [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]],
  [[x0, y1, z0], [x0, y0, z0], [x0, y0, z1], [x0, y1, z1]],
  [[x1, y1, z0], [x0, y1, z0], [x0, y1, z1], [x1, y1, z1]],
  [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]]];
 for (let f = 0; f < 5; f++){ const q = quads[f], n = FACES[f], base = V.length / 8;
  for (let k = 0; k < 4; k++){ const p = q[k], ao = f === 0 ? 1 : (p[2] === z0 ? low : 1); V.push(p[0], p[1], p[2], n[0], n[1], n[2], m, ao); }
  I.push(base, base + 1, base + 2, base, base + 2, base + 3); }
}
function upload(target, V, I){
 if (!target){ target = {vao:gl.createVertexArray(), vb:gl.createBuffer(), ib:gl.createBuffer(), n:0}; }
 gl.bindVertexArray(target.vao);
 gl.bindBuffer(gl.ARRAY_BUFFER, target.vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(V), gl.DYNAMIC_DRAW);
 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, target.ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(I), gl.DYNAMIC_DRAW);
 const S = 32; gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, S, 0);
 gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, S, 12);
 gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 1, gl.FLOAT, false, S, 24);
 gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 1, gl.FLOAT, false, S, 28);
 gl.bindVertexArray(null); target.n = I.length; return target;
}

// the ground, paths and the forest ring around the grid; scene.ground: {w, h, path:Set('x,y'), clear:Set('x,y'), seed}
function groundBoxes(sc){
 const B = [], w = sc.w, h = sc.h, path = sc.path || new Set(), clear = sc.clear || new Set(), busy = sc.busy || new Set();
 B.push([-26, -26, -.06, w + 52, h + 52, .04, 15]);
 for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
  const k = x + ',' + y, r = hash(x + 7, y + 3);
  const m = path.has(k) ? 3 : (r < .18 ? 1 : r > .9 ? 2 : 0);
  B.push([x, y, -.02, 1, 1, .04 + (path.has(k) ? 0 : r * .02), m]);
  if (!path.has(k) && !busy.has(k) && !clear.has(k) && r > .975) B.push([x + .3, y + .4, 0, .25, .2, .12, 7]); // a stray stone
 }
 // pines outside the walls and beyond the grid
 const tree = (x, y, s) => { B.push([x - .07 * s, y - .07 * s, 0, .14 * s, .14 * s, .45 * s, 23]);
  for (let i = 0; i < 4; i++){ const r = (.62 - i * .14) * s; B.push([x - r, y - r, (.35 + i * .32) * s, r * 2, r * 2, .3 * s, i % 2 ? 15 : 14]); } };
 for (let y = -9; y < h + 9; y++) for (let x = -9; x < w + 9; x++){
  const inGrid = x >= 0 && y >= 0 && x < w && y < h, k = x + ',' + y;
  if (inGrid && (path.has(k) || clear.has(k) || busy.has(k))) continue;
  const ring = sc.ring, inside = ring && x >= ring[0] - 1 && y >= ring[1] - 1 && x <= ring[2] + 1 && y <= ring[3] + 1;
  if (inside) continue;
  const r = hash(x * 3 + 11, y * 5 + 2), d = Math.max(0, Math.hypot(x - w / 2, y - h / 2) - 11);
  if (Math.hypot(x - w / 2, y - h / 2) > 24) continue;
  if (r < Math.min(.5, .14 + d * .05)) tree(x + .5 + (hash(x, y) - .5) * .5, y + .5 + (hash(y, x) - .5) * .5, .8 + hash(x + 1, y + 9) * .7);
 }
 return B;
}

function build(sc){
 const V = [], I = [];
 groundBoxes(sc).forEach(b => pushBox(V, I, b, 0, 0));
 let hasAnim = false; st.lights = []; st.smokeSrc = []; st.labels.forEach(l => l.el.remove()); st.labels = []; st.parts = [];
 (sc.parts || []).forEach(p => {
  if (st.drag && st.drag.key === p.key){ st.drag.part = p; }
  else if (p.anim && !st.reduce){ hasAnim = true; if (!st.anim || st.anim.part.id !== p.id) st.anim = {part:p, t:0, dur:3}; }
  else p.boxes.forEach(b => pushBox(V, I, b, p.x, p.y));
  (p.lights || []).forEach(L => st.lights.push([L[0] + p.x, L[1] + p.y, L[2], L[3]]));
  (p.smoke || []).forEach(s => st.smokeSrc.push([s[0] + p.x, s[1] + p.y, s[2]]));
  if (p.tap) st.parts.push({id:p.id, key:p.key, x0:p.x, y0:p.y, x1:p.x + p.fw, y1:p.y + p.fh, top:p.top || 1, boxes:p.boxes.concat([[-.12, -.12, 0, p.fw + .24, p.fh + .24, .14, 0]])});
  if (p.label){ const el = document.createElement('div'); el.className = 'vlab' + (p.labelCls ? ' ' + p.labelCls : ''); el.innerHTML = p.label; el.dataset.b = p.id; labelLayer.appendChild(el);
   st.labels.push({el, key:p.key, empty:/empty/.test(p.labelCls || ''), x:p.x + p.fw / 2, y:p.y + p.fh / 2, z:(p.top || 1) + .2}); }
 });
 if (!hasAnim) st.anim = null;
 geo = upload(geo, V, I); st.verts = V.length / 8; st.dirty = true;
}

// ---------- time of day: the sun by day, a blood moon by night ----------
function sky(){
 const d = new Date(), h = st.hour != null ? st.hour : d.getHours() + d.getMinutes() / 60;
 // day weight: 0 at night, 1 at midday, soft at dawn and dusk
 const day = Math.max(0, Math.min(1, Math.min((h - 5.5) / 2, (19.5 - h) / 2)));
 const t = (h - 6) / 12 * Math.PI, sunD = norm([-Math.cos(t) * .8 - .2, .55, Math.max(.35, Math.sin(t)) * 1.2]);
 const moonD = norm([-.55, .35, .9]);
 const L = (a, b) => a.map((v, i) => v + (b[i] - v) * day);
 return {day, dir:norm(L(moonD, sunD)), sunC:L([.52, .2, .24], [1.0, .86, .7]), amb:L([.17, .16, .26], [.42, .41, .46]), sky:L([.12, .05, .08], [.34, .36, .44]),
  bg:L([.035, .02, .03], [.12, .1, .09]), torch:1.25 - .75 * day};
}

// ---------- camera ----------
function camMats(){
 const asp = canvas.width / canvas.height, hh = cam.zoom, hw = hh * asp;
 const dir = [Math.cos(PITCH) * Math.sin(YAW), Math.cos(PITCH) * Math.cos(YAW), Math.sin(PITCH)], c = [cam.tx, cam.ty, 0];
 const eye = [c[0] + dir[0] * 60, c[1] + dir[1] * 60, dir[2] * 60];
 const V = lookAt(eye, c, [0, 0, 1]), Pm = ortho(-hw, hw, -hh, hh, 1, 140);
 return {VP:mul(Pm, V), dir, eye};
}
function lightMat(dir){
 const c = [14, 14, 0], e = [c[0] + dir[0] * 50, c[1] + dir[1] * 50, c[2] + dir[2] * 50];
 return mul(ortho(-24, 24, -24, 24, 1, 120), lookAt(e, c, Math.abs(dir[2]) > .98 ? [0, 1, 0] : [0, 0, 1]));
}
function project(wx, wy, wz){ const m = camMats(), p = xform(m.VP, [wx, wy, wz]), r = canvas.getBoundingClientRect();
 return [(p[0] * .5 + .5) * r.width, (1 - (p[1] * .5 + .5)) * r.height]; }
function placeLabels(){ if (!st.labels.length) return; const m = camMats(), r = canvas.getBoundingClientRect();
 st.labels.forEach(l => { const p = xform(m.VP, [l.x, l.y, l.z]); l.el.style.transform = `translate(${((p[0] * .5 + .5) * r.width).toFixed(1)}px, ${((1 - (p[1] * .5 + .5)) * r.height).toFixed(1)}px)`; }); }
// the whole walled village fits the width: half of the ring's diagonal, a little margin
function fit(){ const r = canvas.getBoundingClientRect(), asp = (r.width || 1) / (r.height || 1); cam.tx = 14; cam.ty = 14; cam.zoom = 15 / Math.max(.4, asp); cam.maxZ = Math.max(cam.zoom, 12); clampCam(); st.dirty = true; }
function clampCam(){ cam.zoom = Math.max(cam.minZ, Math.min(cam.maxZ, cam.zoom)); cam.tx = Math.max(4, Math.min(24, cam.tx)); cam.ty = Math.max(4, Math.min(25, cam.ty)); }

// a tap: the nearest tappable footprint box the ray passes through
function pick(px, py){ const p = pickPart(px, py); return p ? p.id : null; }
function pickPart(px, py){
 // v3.4.1: the round badge and name over a building are what a thumb aims for (on an empty plot they are most of what you see).
 // A tap right on a label (16 px) picks that building; otherwise the ray decides, and a label within 34 px catches taps the ray misses.
 let lb = null, ld = 1e9;  // the wide 34 px catch is only for unbuilt plots, so open ground elsewhere still double-taps to fit
 if (!st.edit && !st.battle && st.labels.length){ const m0 = camMats(), r0 = canvas.getBoundingClientRect();
  for (const l of st.labels){ const q = xform(m0.VP, [l.x, l.y, l.z]), sx = (q[0] * .5 + .5) * r0.width, sy = (1 - (q[1] * .5 + .5)) * r0.height - 4, d = Math.hypot(sx - px, sy - py); if (d < ld){ ld = d; lb = l; } } }
 const byLabel = lb ? st.parts.find(q => q.key === lb.key) : null;
 if (byLabel && ld < 16) return byLabel;
 const ray = pickRay(px, py); if (ray) return ray;
 return byLabel && ld < 34 && lb.empty ? byLabel : null;
}
function pickRay(px, py){
 const r = canvas.getBoundingClientRect(), m = camMats(), iv = inv(m.VP);
 const nx = (px / r.width) * 2 - 1, ny = 1 - (py / r.height) * 2;
 const a = xform(iv, [nx, ny, -1]), b = xform(iv, [nx, ny, 1]), d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
 // ray against a box: entry t or Infinity
 const hit = (lo, hi) => { let t0 = 0, t1 = 1; for (let k = 0; k < 3; k++){ if (Math.abs(d[k]) < 1e-9){ if (a[k] < lo[k] || a[k] > hi[k]) return Infinity; continue; }
  let u = (lo[k] - a[k]) / d[k], v = (hi[k] - a[k]) / d[k]; if (u > v){ const s = u; u = v; v = s; } t0 = Math.max(t0, u); t1 = Math.min(t1, v); if (t0 > t1) return Infinity; } return t0; };
 let best = null, bt = Infinity, padBest = null, padT = Infinity;
 for (const p of st.parts){
  if (hit([p.x0 - .4, p.y0 - .4, 0], [p.x1 + .4, p.y1 + .4, p.top + .3]) === Infinity) continue;   // quick reject
  const pad = p.boxes[p.boxes.length - 1];
  for (const q of p.boxes){ const lo = [q[0] + p.x0 - .04, q[1] + p.y0 - .04, q[2]], hi = [lo[0] + q[3] + .08, lo[1] + q[4] + .08, q[2] + q[5] + .04], t = hit(lo, hi);
   if (q === pad){ if (t < padT){ padT = t; padBest = p; } continue; }   // the ground pad only counts when no real box was hit, so it never steals from a neighbour
   if (t < bt){ bt = t; best = p; } }
 }
 if (!best) best = padBest;
 return best;
}
// ---------- smoke: a few grey blocks drifting up from chimneys ----------
function stepSmoke(dt){
 if (st.reduce) { st.puffs.length = 0; return; }
 st.smokeSrc.forEach((s, i) => { s.acc = (s.acc || hash(i, 3)) + dt; if (s.acc > .7){ s.acc = 0; if (st.puffs.length < 70) st.puffs.push({x:s[0], y:s[1], z:s[2], age:0, sz:.1 + Math.random() * .05}); } });
 st.puffs.forEach(p => { p.age += dt; p.z += dt * .35; p.x -= dt * .12; p.y += dt * .05; });
 st.puffs = st.puffs.filter(p => p.age < 3.2);
}
// ---------- actors: block people walking routes, working, standing guard ----------
// an actor: {route:[[x,y,z],...], fig(frame, mode, torch)->boxes, speed, waitEnd:[s,s], workEnd:[bool,bool], torch, loop}
function rot(B, f){ // f: 0 faces +y, 1 faces +x, 2 faces -y, 3 faces -x
 if (!f) return B; return B.map(b => { let [x, y, z, w, d, h, m] = b; for (let i = 0; i < f; i++){ const nx = y, ny = -(x + w); x = nx; y = ny; const t = w; w = d; d = t; } return [x, y, z, w, d, h, m]; }); }
function setActors(list){ st.actors = (list || []).filter(a => a.route && a.route.length).map((a, i) => Object.assign({seg:0, t:0, dir:1, wait:Math.random() * 2, face:0, anim:Math.random() * 4, mode:'idle'}, a)); st.dirty = true; }
function stepActors(dt){
 for (const a of st.actors){
  a.anim += dt;
  const R = a.route;
  if (R.length < 2){ a.mode = a.drill ? 'work' : 'idle'; a.pos = R[0]; a.face = a.faceAt || 0; continue; }
  if (a.wait > 0){ a.wait -= dt; a.mode = a.working ? 'work' : 'idle'; continue; }
  const i = a.seg, j = i + a.dir, p = R[i], q = R[j], len = Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]) || .001;
  a.t += dt * (a.speed || .9) / len; a.mode = 'walk';
  const dx = q[0] - p[0], dy = q[1] - p[1]; a.face = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 0 : 2);
  if (a.t >= 1){ a.t = 0; a.seg = j;
   const end = a.seg === R.length - 1 ? 1 : a.seg === 0 ? 0 : -1;
   if (end >= 0){ a.dir = end === 1 ? -1 : 1; a.wait = a.waitEnd ? a.waitEnd[end] * (.7 + Math.random() * .6) : 0; a.working = !!(a.workEnd && a.workEnd[end]);
    if (a.working && a.workFace != null && end === 1) a.face = a.workFace; }
  }
  const s = R[a.seg], n = R[Math.min(R.length - 1, Math.max(0, a.seg + a.dir))], t = a.wait > 0 ? 0 : a.t;
  a.pos = [s[0] + (n[0] - s[0]) * t, s[1] + (n[1] - s[1]) * t, s[2] + (n[2] - s[2]) * t];
 }
}
// the building being raised: scaffold poles, then its blocks rise from the ground up
function animBoxes(){
 const A = st.anim; if (!A) return [];
 const p = A.part, k = Math.min(1, A.t / A.dur), top = p.top || 1, cut = top * k, out = [];
 p.boxes.forEach(b => { if (b[2] >= cut) return; out.push([b[0] + p.x, b[1] + p.y, b[2], b[3], b[4], Math.min(b[5], cut - b[2]), b[6]]); });
 if (k < 1){ const sh = top + .2, x0 = p.x - .05, y0 = p.y - .05, x1 = p.x + p.fw - .05, y1 = p.y + p.fh - .05;
  [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].forEach(([x, y]) => out.push([x, y, 0, .07, .07, sh, 5]));
  for (let z = .35; z < sh; z += .45){ out.push([x0, y0, z, p.fw, .05, .04, 5]); out.push([x0, y1, z, p.fw, .05, .04, 5]); out.push([x0, y0, z, .05, p.fh, .04, 5]); out.push([x1, y0, z, .05, p.fh, .04, 5]); }
  // two builders hammering at the front
  const fr = Math.floor(A.t * 6); [[p.x + p.fw * .3, p.y + p.fh + .25], [p.x + p.fw * .7, p.y + p.fh + .25]].forEach(([x, y], i) => rot(st.fig ? st.fig('villager', fr + i * 2, 'work', false) : [], 2).forEach(b => out.push([b[0] + x, b[1] + y, b[2], b[3], b[4], b[5], b[6]])));
 }
 return out;
}
function stepAnim(dt){
 const A = st.anim; if (!A) return;
 if (st.canAnim && !st.canAnim()) return;      // wait until nothing covers the village
 A.t += dt;
 if (A.t > .3 && Math.random() < dt * 6 && st.puffs.length < 70) st.puffs.push({x:A.part.x + Math.random() * A.part.fw, y:A.part.y + A.part.fh, z:.05, age:1.2, sz:.05 + Math.random() * .04});
 if (A.t >= A.dur){ A.part.anim = false; st.anim = null; if (lastScene) build(lastScene); }
}
// ---------- battle replay: a recorded raid played back on the map ----------
// opts: {frames, tick, units:{id:{look, max}}, items:[{key,x,y,fw,fh,top,max}], speed, onTick(i), onEnd()}
function battleStep(dt){
 const Bt = st.battle; if (!Bt || Bt.done) return;
 if (st.canAnim && !st.canAnim()) return;
 const prev = Math.floor(Bt.t / Bt.tick); Bt.t += dt * Bt.speed;
 let i = Math.floor(Bt.t / Bt.tick);
 if (i >= Bt.frames.length - 1){ i = Bt.frames.length - 1; Bt.t = i * Bt.tick; }
 for (let k = prev + 1; k <= i; k++){ const f = Bt.frames[k]; if (f && f.s) f.s.forEach(s => Bt.shots.push({s, age:0})); }
 Bt.shots.forEach(x => x.age += dt * Bt.speed); Bt.shots = Bt.shots.filter(x => x.age < .35);
 // fire and smoke on badly hurt buildings
 const f = Bt.frames[i]; Bt.items.forEach((it, j) => { const hp = f.b[j]; if (it.max && hp > 0 && hp < it.max * .5 && Math.random() < dt * Bt.speed * 3 && st.puffs.length < 90) st.puffs.push({x:it.x + it.fw * (.3 + Math.random() * .4), y:it.y + it.fh * (.3 + Math.random() * .4), z:it.top * .7, age:0, sz:.12 + Math.random() * .06}); });
 // the camera drifts after the fighting until you take over with a finger
 if (Bt.follow){ let sx = 0, sy = 0, n = 0; f.u.forEach(u => { if (u[6] && u[0] < 100){ sx += u[1]; sy += u[2]; n++; } });
  if (n){ const tx = (sx / n) * .7 + 14 * .3, ty = (sy / n) * .7 + 14 * .3, k = Math.min(1, dt * 1.2); cam.tx += (tx - cam.tx) * k; cam.ty += (ty - cam.ty) * k; cam.zoom += (Bt.zoom - cam.zoom) * k; clampCam(); st.dirty = true; } }
 if (i !== Bt.last){ Bt.last = i; Bt.onTick && Bt.onTick(i); }
 if (i >= Bt.frames.length - 1 && !Bt.done){ Bt.done = true; Bt.endT = setTimeout(() => { if (st.battle === Bt){ st.battle = null; Bt.onEnd && Bt.onEnd(); } }, 900); }
}
function battleBoxes(V, I){
 const Bt = st.battle; if (!Bt) return;
 const i = Math.min(Bt.frames.length - 1, Math.floor(Bt.t / Bt.tick)), j = Math.min(Bt.frames.length - 1, i + 1), a = Bt.frames[i], b = Bt.frames[j], k = Bt.t / Bt.tick - i;
 const nb = {}; b.u.forEach(u => nb[u[0]] = u);
 for (const u of a.u){ if (!u[6]) continue; const n = nb[u[0]] || u, x = u[1] + (n[1] - u[1]) * k, y = u[2] + (n[2] - u[2]) * k, meta = Bt.units[u[0]] || {};
  const mode = u[4] === 0 ? 'walk' : u[4] === 1 ? 'work' : 'idle', fr = Math.floor(Bt.t * (mode === 'walk' ? 7 : 4));
  lod(rot(st.fig(meta.look, fr, mode, false), u[5])).forEach(q => pushBox(V, I, [q[0] + x, q[1] + y, q[2], q[3], q[4], q[5], q[6]], 0, 0));
  if (meta.max && u[3] < meta.max){ const w = .44, fr2 = Math.max(0, u[3] / meta.max), z = meta.fly ? 1.32 : .72;   // a life bar over the head
   pushBox(V, I, [x - w / 2, y, z, w, .05, .05, 13], 0, 0); pushBox(V, I, [x - w / 2, y - .005, z + .002, w * fr2, .06, .05, meta.side === 'a' ? 33 : 32], 0, 0); }
 }
 Bt.items.forEach((it, n) => { if (!it.max) return; const hp = a.b[n]; if (hp >= it.max || hp <= 0) return; const w = Math.min(1.6, it.fw * .7), z = it.top + .25, cx = it.x + it.fw / 2 - w / 2, cy = it.y + it.fh / 2;
  pushBox(V, I, [cx, cy, z, w, .07, .06, 13], 0, 0); pushBox(V, I, [cx, cy - .005, z + .002, w * hp / it.max, .08, .06, 9], 0, 0); });
 for (const sh of Bt.shots){ const [x0, y0, x1, y1, kd] = sh.s, p = Math.min(1, sh.age / .3);
  if (kd === 2){ for (let q = 0; q < 4; q++) pushBox(V, I, [x0 - .2 + q * .12, y0 - .05, 0, .05, .05, .2 * (1 - p), 33], 0, 0); continue; }
  const x = x0 + (x1 - x0) * p, y = y0 + (y1 - y0) * p, z = .9 * (1 - p) + .35 + Math.sqrt(Math.max(0, p * (1 - p))) * .8;
  pushBox(V, I, [x - .04, y - .04, z, .08, .08, .08, kd === 3 ? 12 : kd === 1 ? 9 : 23], 0, 0); }
}
function battleLights(){ const Bt = st.battle; if (!Bt) return []; return Bt.shots.filter(s => s.s[4] === 3).slice(0, 6).map(s => { const p = Math.min(1, s.age / .3); return [s.s[0] + (s.s[2] - s.s[0]) * p, s.s[1] + (s.s[3] - s.s[1]) * p, .6, 1.2]; }); }

// v3.4 figures carry fine detail (eyes, teeth, buckles); zoomed out it is too small to see, so it is skipped to save the phone some work
function lod(bs){ if (cam.zoom < 6.5) return bs; return bs.filter(b => b[3] > .03 || b[4] > .03 || b[5] > .045); }
function dynGeo(){
 const V = [], I = [];
 st.puffs.forEach(p => { const s = p.sz * (1 + Math.min(p.age, 1.2) * .6) * Math.max(.2, 1 - Math.max(0, p.age - 1.2) / 2.4); pushBox(V, I, [p.x - s / 2, p.y - s / 2, p.z, s, s, s, 24], 0, 0); });
 st.dynLights = [];
 for (const a of st.actors){ if (!a.pos) continue;
  const fr = a.mode === 'walk' ? Math.floor(a.anim * 7) : a.mode === 'work' ? Math.floor(a.anim * (a.drill ? 2.5 : 3.2)) : 0;
  const bs = lod(rot(a.fig(fr, a.mode, a.torch), a.face));
  for (const b of bs) pushBox(V, I, [b[0] + a.pos[0], b[1] + a.pos[1], b[2] + a.pos[2], b[3], b[4], b[5], b[6]], 0, 0);
  if (a.torch) st.dynLights.push([a.pos[0], a.pos[1], a.pos[2] + .5, 1.6]); }
 animBoxes().forEach(b => pushBox(V, I, b, 0, 0));
 battleBoxes(V, I); st.dynLights = st.dynLights.concat(battleLights());
 const D = st.drag; if (D && D.part){ const p = D.part, lift = .14, m = D.ok ? 32 : 33;
  p.boxes.forEach(b => pushBox(V, I, [b[0] + D.x, b[1] + D.y, b[2] + lift, b[3], b[4], b[5], b[6]], 0, 0));
  const fw = p.fw, fh = p.fh, t = .08, z = .03;
  [[0, 0, fw, t], [0, fh - t, fw, t], [0, 0, t, fh], [fw - t, 0, t, fh]].forEach(([x, y, w, d]) => pushBox(V, I, [D.x + x, D.y + y, z, w, d, .03, m], 0, 0));
  pushBox(V, I, [D.x + .1, D.y + .1, .01, fw - .2, fh - .2, .015, m], 0, 0); }
 editMarks(V, I);
 dyn = upload(dyn, V, I);
}

// v3.4 placement marks: while a building is picked or dragged, every tower's reach is drawn on the ground
// (bright for the picked tower, dim gold for the rest) and the picked footprint gets a teal outline
function ringDashes(V, I, x0, y0, fw, fh, r, m){
 const seg = [], L = (fw + fh) * 2 + 2 * Math.PI * r, n = Math.max(24, Math.round(L / .42));
 for (let i = 0; i < n; i++){ let d = (i + .5) / n * L, px, py;
  const e = [[fw, 0], [r * Math.PI / 2, 1], [fh, 2], [r * Math.PI / 2, 3], [fw, 4], [r * Math.PI / 2, 5], [fh, 6], [r * Math.PI / 2, 7]];
  for (const [len, k] of e){ if (d > len){ d -= len; continue; }
   const a = d / r;
   if (k === 0){ px = x0 + d; py = y0 - r; } else if (k === 1){ px = x0 + fw + Math.sin(a) * r; py = y0 - Math.cos(a) * r; }
   else if (k === 2){ px = x0 + fw + r; py = y0 + d; } else if (k === 3){ px = x0 + fw + Math.cos(a) * r; py = y0 + fh + Math.sin(a) * r; }
   else if (k === 4){ px = x0 + fw - d; py = y0 + fh + r; } else if (k === 5){ px = x0 - Math.sin(a) * r; py = y0 + fh + Math.cos(a) * r; }
   else if (k === 6){ px = x0 - r; py = y0 + fh - d; } else { px = x0 - Math.cos(a) * r; py = y0 - Math.sin(a) * r; }
   break; }
  if (px == null) continue; pushBox(V, I, [px - .07, py - .07, .03, .14, .14, .03, m], 0, 0); } }
function editMarks(V, I){
 const E = st.edit; if (!E || !E.h || E.mode !== 'move') return;
 const D = st.drag, act = D ? D.key : st.sel; if (act == null) return;
 for (const p of st.parts){ const r = E.h.ring ? E.h.ring(p.key) : 0; if (!(r > 0)) continue;
  const fw = p.x1 - p.x0, fh = p.y1 - p.y0, here = D && D.key === p.key, x0 = here ? D.x : p.x0, y0 = here ? D.y : p.y0;
  ringDashes(V, I, x0, y0, fw, fh, r, p.key === act ? 12 : 9); }
 if (!D){ const p = st.parts.find(q => q.key === act); if (p){ const fw = p.x1 - p.x0, fh = p.y1 - p.y0, t = .07, z = .14;
  [[0, 0, fw, t], [0, fh - t, fw, t], [0, 0, t, fh], [fw - t, 0, t, fh]].forEach(([x, y, w, d]) => pushBox(V, I, [p.x0 + x - .04, p.y0 + y - .04, z, w + .08, d + .08, .04, 12], 0, 0)); } }
}

// ---------- draw ----------
function draw(now){
 if (!gl || lost || !geo) return;
 const S = sky(), m = camMats(), LVP = lightMat(S.dir);
 dynGeo();
 // shadow pass
 gl.bindFramebuffer(gl.FRAMEBUFFER, shFb); gl.viewport(0, 0, SHADOW, SHADOW); gl.clear(gl.DEPTH_BUFFER_BIT);
 gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
 gl.useProgram(PD.p); gl.uniformMatrix4fv(PD.u.uLVP, false, LVP);
 gl.bindVertexArray(geo.vao); gl.drawElements(gl.TRIANGLES, geo.n, gl.UNSIGNED_INT, 0);
 if (dyn && dyn.n){ gl.bindVertexArray(dyn.vao); gl.drawElements(gl.TRIANGLES, dyn.n, gl.UNSIGNED_INT, 0); }
 gl.bindFramebuffer(gl.FRAMEBUFFER, null);
 // main pass
 gl.viewport(0, 0, canvas.width, canvas.height);
 gl.clearColor(S.bg[0], S.bg[1], S.bg[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
 gl.useProgram(P.p); const u = P.u;
 gl.uniformMatrix4fv(u.uVP, false, m.VP); gl.uniformMatrix4fv(u.uLVP, false, LVP);
 gl.uniform4fv(u.uMat, st.mats); gl.uniform1f(u.uGrid, st.edit ? 1 : 0); gl.uniform3fv(u.uAmb, S.amb); gl.uniform3fv(u.uSky, S.sky); gl.uniform3fv(u.uSunC, S.sunC); gl.uniform3fv(u.uSunD, S.dir);
 gl.uniform3fv(u.uBg, S.bg); gl.uniform2f(u.uCtr, 14, 14); gl.uniform1f(u.uTime, (now - st.t0) / 1000); gl.uniform1f(u.uTorch, S.torch); gl.uniform1f(u.uFlick, st.reduce ? 0 : 1);
 // the lights nearest the camera's focus
 const Ls = st.lights.concat(st.dynLights || []).sort((a, b) => Math.hypot(a[0] - cam.tx, a[1] - cam.ty) - Math.hypot(b[0] - cam.tx, b[1] - cam.ty)).slice(0, MAXL), lp = new Float32Array(MAXL * 4);
 Ls.forEach((L, i) => lp.set(L, i * 4)); gl.uniform1i(u.uNL, Ls.length); gl.uniform4fv(u.uLP, lp);
 gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, shTex); gl.uniform1i(u.uSh, 0);
 gl.bindVertexArray(geo.vao); gl.drawElements(gl.TRIANGLES, geo.n, gl.UNSIGNED_INT, 0);
 if (dyn && dyn.n){ gl.bindVertexArray(dyn.vao); gl.drawElements(gl.TRIANGLES, dyn.n, gl.UNSIGNED_INT, 0); }
 gl.bindVertexArray(null);
 if (host) host.style.background = `rgb(${S.bg.map(v => Math.round(v * 255)).join(',')})`;
}
function loop(now){
 if (!st.mounted) return;
 if (!canvas.isConnected){ st.mounted = false; return; }
 st.raf = requestAnimationFrame(loop);
 // nothing to draw when the app is in the background, the tab is hidden, or the village is scrolled out of sight
 if (document.hidden || !canvas.offsetWidth || !st.visible) return;
 // idle animation (torch flicker, smoke) runs at about 24 fps, slower if frames are expensive on this phone
 const dt = Math.min(.1, (now - (st.last || now)) / 1000), animate = !st.reduce, idleGap = Math.max(st.battle ? 30 : 42, st.cost * 4), due = st.dirty || (animate && now - st.last >= idleGap);
 if (!due) return;
 stepSmoke(dt); if (!st.reduce) stepActors(dt); else st.actors.forEach(a => { if (!a.pos){ const R = a.route, e = R[R.length - 1]; a.pos = e; a.mode = 'idle'; a.face = a.workFace || 0; } }); stepAnim(dt); battleStep(dt); st.last = now;
 if (st.dirty) placeLabels();
 st.dirty = false; const t0 = performance.now(); draw(now); st.cost = st.cost * .8 + (performance.now() - t0) * .2;
 st.frames++; if (now - st.fpsT > 1000){ st.fps = Math.round(st.frames * 1000 / (now - st.fpsT)); st.frames = 0; st.fpsT = now; }
}

// ---------- input: drag pans, pinch and wheel zoom, a short still touch taps ----------
const ptr = new Map(); let pinch0 = 0, zoom0 = 0, mid0 = null, downAt = 0, moved = 0, downXY = null, lastTapAt = 0;
// the ground point under a screen point (z = 0), used so a drag or pinch keeps the ground under the fingers
function groundAt(px, py){ const r = canvas.getBoundingClientRect(), iv = inv(camMats().VP), nx = (px / r.width) * 2 - 1, ny = 1 - (py / r.height) * 2;
 const a = xform(iv, [nx, ny, -1]), b = xform(iv, [nx, ny, 1]), t = a[2] / (a[2] - b[2]); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
function local(e){ const r = canvas.getBoundingClientRect(); return [e[0] - r.left, e[1] - r.top]; }
let lastPaint = null;
function tileAt(cx, cy){ const g = groundAt(...local([cx, cy])); return [Math.floor(g[0]), Math.floor(g[1]), g]; }
function onDown(e){ try { canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId); } catch (err){} ptr.set(e.pointerId, [e.clientX, e.clientY]);
 if (st.battle) st.battle.follow = false;
 if (st.edit && ptr.size === 1){
  const E = st.edit, r = canvas.getBoundingClientRect();
  if (E.mode === 'move'){ const p = pickPart(e.clientX - r.left, e.clientY - r.top);
   if (p && E.h.movable(p.key)){ const [, , g] = tileAt(e.clientX, e.clientY); st.drag = {key:p.key, ox:g[0] - p.x0, oy:g[1] - p.y0, x:p.x0, y:p.y0, x0:p.x0, y0:p.y0, ok:true}; st.sel = p.key; if (E.h.select) E.h.select(p.key, p.x0, p.y0); if (lastScene) build(lastScene); moved = 99; return; } }
  else if (E.mode === 'paint' || E.mode === 'erase'){ const [x, y] = tileAt(e.clientX, e.clientY); lastPaint = x + ',' + y; E.h[E.mode](x, y); moved = 99; return; }
 }
 if (st.drag && ptr.size === 2){ const D = st.drag; st.drag = null; if (st.edit && st.edit.h.select) st.edit.h.select(D.key, D.x0, D.y0); if (lastScene) build(lastScene); }
 if (ptr.size === 1){ downAt = performance.now(); moved = 0; downXY = [e.clientX, e.clientY]; const r = canvas.getBoundingClientRect(); window.VIL.lastPick = pick(e.clientX - r.left, e.clientY - r.top); }
 if (ptr.size === 2){ const [a, b] = [...ptr.values()]; pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]); zoom0 = cam.zoom; mid0 = groundAt(...local([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2])); moved = 99; } }
function onMove(e){ if (!ptr.has(e.pointerId)) return; let prev = ptr.get(e.pointerId), cur = [e.clientX, e.clientY];
 if (st.drag && ptr.size === 1){ ptr.set(e.pointerId, cur); const [, , g] = tileAt(cur[0], cur[1]), D = st.drag, x = Math.round(g[0] - D.ox), y = Math.round(g[1] - D.oy);
  if (x !== D.x || y !== D.y){ D.x = x; D.y = y; D.ok = st.edit.h.canPlace(D.key, x, y); st.dirty = true; if (st.edit.h.hover) st.edit.h.hover(D.key, x, y, D.ok); } return; }
 if (st.edit && (st.edit.mode === 'paint' || st.edit.mode === 'erase') && ptr.size === 1){ ptr.set(e.pointerId, cur); const [x, y] = tileAt(cur[0], cur[1]), k = x + ',' + y; if (k !== lastPaint){ lastPaint = k; st.edit.h[st.edit.mode](x, y); } return; }
 if (ptr.size === 1){
  // grab the ground: whatever was under the finger stays under the finger
  const far = downXY ? Math.hypot(cur[0] - downXY[0], cur[1] - downXY[1]) : 99;
  if (moved < 10 && far < 12){ ptr.set(e.pointerId, cur); return; }       // v3.4.1 tap slop: under 12 px from the press, stay put
  if (moved < 10 && downXY){ moved = 10; prev = downXY.slice(); }                     // first real move: pan from the press point so nothing jumps
  const g0 = groundAt(...local(prev)), g1 = groundAt(...local(cur)); ptr.set(e.pointerId, cur);
  moved += Math.abs(cur[0] - prev[0]) + Math.abs(cur[1] - prev[1]);
  cam.tx += g0[0] - g1[0]; cam.ty += g0[1] - g1[1]; clampCam(); st.dirty = true; return; }
 ptr.set(e.pointerId, cur);
 if (ptr.size === 2 && pinch0){ const [a, b] = [...ptr.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]), mid = local([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
  // zoom toward the point between the fingers, and let the two fingers pan together
  cam.zoom = zoom0 * pinch0 / d; clampCam(); const after = groundAt(...mid);
  cam.tx += mid0[0] - after[0]; cam.ty += mid0[1] - after[1]; clampCam(); st.dirty = true; } }
function onUp(e){ const was = ptr.size; ptr.delete(e.pointerId);
 if (st.drag && was === 1){ const D = st.drag; st.drag = null; lastPaint = null;
  if (D.ok && (D.x !== D.x0 || D.y !== D.y0)){ st.edit.h.place(D.key, D.x, D.y); if (st.edit && st.edit.h.select) st.edit.h.select(D.key, D.x, D.y); }
  else { if (!D.ok) st.edit.h.reject(D.key); if (st.edit.h.select) st.edit.h.select(D.key, D.x0, D.y0); if (lastScene) build(lastScene); } return; }
 lastPaint = null;
 if (ptr.size < 2){ pinch0 = 0; zoom0 = cam.zoom; }
 if (ptr.size === 1){ const [k, v] = [...ptr.entries()][0]; ptr.set(k, v); }  // the finger left behind keeps panning from where it is
 if (was === 1 && moved < 10 && performance.now() - downAt < 700){
  const now = performance.now(), r = canvas.getBoundingClientRect(), id = pick(e.clientX - r.left, e.clientY - r.top);
  if (st.edit && st.edit.mode === 'move'){ const p = pickPart(e.clientX - r.left, e.clientY - r.top); st.sel = p ? p.key : null; st.dirty = true; if (st.edit.h.select) st.edit.h.select(st.sel, p ? p.x0 : 0, p ? p.y0 : 0); if (p) return; }
  if (!id && now - lastTapAt < 350){ fit(); lastTapAt = 0; return; }           // double-tap empty ground: back to the whole village
  lastTapAt = now; if (id && st.onTap) st.onTap(id); } }
function onWheel(e){ e.preventDefault(); const p = local([e.clientX, e.clientY]), g0 = groundAt(...p); cam.zoom *= Math.exp(e.deltaY * .0012); clampCam(); const g1 = groundAt(...p); cam.tx += g0[0] - g1[0]; cam.ty += g0[1] - g1[1]; clampCam(); st.dirty = true; }
function resize(){ if (!canvas || !host) return; const r = host.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
 const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr)); if (canvas.width !== w || canvas.height !== h){ canvas.width = w; canvas.height = h; } st.dirty = true; }

// ---------- public ----------
function mount(el, opts){
 opts = opts || {};
 if (!canvas){
  canvas = document.createElement('canvas'); canvas.className = 'vilcv';
  labelLayer = document.createElement('div'); labelLayer.className = 'vlabs';
  try { if (!initGL()) { canvas = null; return false; } } catch (err){ console.warn('village renderer', err); canvas = null; gl = null; return false; }
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); lost = true; });
  canvas.addEventListener('webglcontextrestored', () => { try { initGL(); lost = false; if (lastScene) build(lastScene); st.dirty = true; } catch (err){ console.warn(err); } });
  canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerup', onUp); canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('wheel', onWheel, {passive:false});
  window.addEventListener('resize', resize);
  if (window.IntersectionObserver){ new IntersectionObserver(es => { st.visible = es[es.length - 1].isIntersecting; if (st.visible) st.dirty = true; }).observe(canvas); }
 }
 if (lost) return false;
 host = el; host.appendChild(canvas); host.appendChild(labelLayer);
 st.onTap = opts.onTap || null; st.reduce = !!opts.reduce; st.fig = opts.figure || null; st.canAnim = opts.canAnimate || null;
 st.mats = new Float32Array(40 * 4); (opts.mats || []).forEach((m, i) => { if (i < 40) st.mats.set([m[0] / 255, m[1] / 255, m[2] / 255, m[3] || 0], i * 4); });
 st.mounted = true; resize(); if (!cam.fitted){ fit(); cam.fitted = true; } cancelAnimationFrame(st.raf); st.last = 0; st.raf = requestAnimationFrame(loop);
 return true;
}
function update(scene){ lastScene = scene; if (!gl || lost) return; build(scene); setActors(scene.actors); }
function unmount(){ st.mounted = false; cancelAnimationFrame(st.raf); if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas); if (labelLayer && labelLayer.parentNode) labelLayer.parentNode.removeChild(labelLayer); host = null; }
window.VIL = {mount, update, unmount, project,
 setHour(h){ st.hour = h; st.dirty = true; },
 getHour(){ return st.hour; },
 battle(o){ if (st.battle && st.battle.endT) clearTimeout(st.battle.endT); st.battle = o ? Object.assign({t:0, last:-1, shots:[], speed:1, done:false, follow:true, zoom:7.5}, o) : null; st.dirty = true; },
 battleSpeed(s){ if (st.battle) st.battle.speed = s; },
 battleSkip(){ const Bt = st.battle; if (!Bt) return; clearTimeout(Bt.endT); st.battle = null; Bt.onEnd && Bt.onEnd(); },
 battleInfo(){ const Bt = st.battle; return Bt ? {i:Math.floor(Bt.t / Bt.tick), n:Bt.frames.length, speed:Bt.speed, done:Bt.done} : null; },
 edit(mode, handlers){ st.edit = mode ? {mode, h:handlers || (st.edit && st.edit.h)} : null; st.drag = null; st.sel = null; if (host) host.classList.toggle('editing', !!mode); st.dirty = true; },
 select(key){ st.sel = key == null ? null : key; st.dirty = true; },
 dragState(){ return st.drag ? {key:st.drag.key, x:st.drag.x, y:st.drag.y, ok:st.drag.ok} : null; },
 stats(){ return {fps:st.fps, verts:st.verts, lights:st.lights.length, lost, zoom:cam.zoom, actors:st.actors.length, moving:st.actors.filter(a => a.mode === 'walk').length, working:st.actors.filter(a => a.mode === 'work').length, building:st.anim ? +(st.anim.t / st.anim.dur).toFixed(2) : null}; },
 view(v){ if (v){ Object.assign(cam, v); clampCam(); st.dirty = true; } return {tx:cam.tx, ty:cam.ty, zoom:cam.zoom}; },
 pick(px, py){ return pick(px, py); },
 fit(){ fit(); return {tx:cam.tx, ty:cam.ty, zoom:cam.zoom}; },
 loseContext(){ const ext = gl && gl.getExtension('WEBGL_lose_context'); if (ext){ ext.loseContext(); setTimeout(() => ext.restoreContext(), 300); return true; } return false; }};
})();
