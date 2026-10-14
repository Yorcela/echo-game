import { runtime } from '../state/runtime.js';
import { G, JMP, MAXF, PLT, SPD, T, W } from '../core/config.js';
import { bossAlive, gameState, say } from '../state/state.js';
import { sfx } from '../audio/audio.js';
/* ---------- Physique ---------- */
export const isDoor = (ch) => ch >= 'A' && ch <= 'Z' && ch !== 'E' && ch !== 'P';
let EDGE = false;
export const gateOK = (k) => {
  const g = k.gate;
  if (!g) return true;
  if (g.cl !== undefined && !gameState.cl[g.cl]) return false;
  if (g.pw !== undefined && !gameState.have[g.pw]) return false;
  if (g.t && !gameState.haveT) return false;
  if (g.all && !g.all.every((p) => gameState.have[p])) return false;
  if (g.any && !g.any.some((p) => gameState.have[p])) return false;
  return true;
};
export const sealed = (k) => !!k.gate && !gateOK(k);
export function linkAt(s, v) {
  for (const k of runtime.level.links) {
    if (k.s !== s || sealed(k)) continue;
    if (s === 'l' || s === 'r') {
      if (v >= k.r0 && v <= k.r1) return k;
    } else if (v >= k.c0 && v <= k.c1) return k;
  }
  return null;
}
function edgeOpen(s, r) {
  return !!linkAt(s, r);
}
export function syncHoles() {
  for (const k of runtime.level.links) {
    if (k.s !== 't' && k.s !== 'b') continue;
    const o = !sealed(k);
    for (let c = k.c0; c <= k.c1; c++) {
      if (k.s === 't') {
        runtime.grid[0][c] = o ? (k.lad ? '|' : '.') : '#';
        if (k.lad) for (let r = 1; r <= 13; r++) runtime.grid[r][c] = o ? '|' : '.';
      } else {
        for (let r = 14; r <= 16; r++) runtime.grid[r][c] = o ? (k.lad ? '|' : '.') : '#';
        if (k.lad) for (let r = 12; r <= 13; r++) runtime.grid[r][c] = o ? '|' : '.';
      }
    }
  }
}
runtime.KG = 0;
runtime.BM = 0;
runtime.FLR = {
  cnt: [],
  rise: [],
  last: -1,
};
function ksolid(c, r) {
  if (c < 0 || c >= 30 || r < 0) return true;
  if (r >= 17) return false;
  for (let q = r; q < 17; q++) {
    const y = runtime.grid[q][c];
    if (!(y === '#' || y === '%' || y === '&' || y === '~')) return false;
  }
  return true;
}
runtime.PO = 0;
const isPlat = (c, r) => r >= 6 && r <= 7 && ((c >= 6 && c <= 12) || (c >= 17 && c <= 23));
export function solid(c, r) {
  if (runtime.KG) return ksolid(c, r);
  if (runtime.BM)
    return (
      (r >= 14 && r < 17 && c >= 1 && c <= 28) ||
      c < 1 ||
      c >= 29 ||
      (runtime.BM === 2 && r >= 0 && r < 14 && c < 30 && runtime.grid[r][c] === '#')
    );
  if (c < 0) return !(EDGE && edgeOpen('l', r));
  if (c >= 30) return !(EDGE && edgeOpen('r', r));
  if (r < 0) return !(EDGE && c >= 0 && c < 30 && linkAt('t', c));
  if (r >= 17) return false;
  const ch = runtime.grid[r][c];
  if (runtime.PO > 0 && ch === '#' && isPlat(c, r)) return false;
  return (
    ch === '#' || ch === '%' || ch === '&' || ch === '~' || (isDoor(ch) && !runtime.open[ch.toLowerCase()])
  );
}
export function collide(b) {
  const x0 = Math.floor(b.x / T),
    x1 = Math.floor((b.x + b.w - 0.001) / T),
    y0 = Math.floor(b.y / T),
    y1 = Math.floor((b.y + b.h - 0.001) / T);
  for (let r = y0; r <= y1; r++) for (let c = x0; c <= x1; c++) if (solid(c, r)) return true;
  return false;
}
function wallSide(b) {
  b.x += 1;
  const r = collide(b);
  b.x -= 2;
  const l = collide(b);
  b.x += 1;
  return r ? 1 : l ? -1 : 0;
}
export function moveBody(b, inp, dt) {
  EDGE = b === runtime.player;
  try {
    moveBody0(b, inp, dt);
  } finally {
    EDGE = false;
  }
}
const LSP = 135;
function onLad(b) {
  const c = Math.floor((b.x + b.w / 2) / T),
    y0 = Math.floor((b.y + 4) / T),
    y1 = Math.floor((b.y + b.h - 4) / T);
  for (let r = y0; r <= y1; r++) if (r >= 0 && r < 17 && runtime.grid[r][c] === '|') return c;
  return -1;
}
function ladderStep(b, inp, dt) {
  // renvoie true si le corps est (resté) sur l'échelle
  b.ladCd = Math.max(0, (b.ladCd || 0) - dt);
  const lc = onLad(b);
  if (b.lad) {
    if (lc < 0) {
      // sorti par le haut ou le bas : petit saut de côté
      b.lad = 0;
      b.ladCd = 0.25;
      const c = Math.floor((b.x + b.w / 2) / T);
      const dir = solid(c + 1, 14) ? 1 : solid(c - 1, 14) ? -1 : b.face || 1;
      b.vx = dir * SPD * 0.7;
      b.vy = b.vy < 0 ? -330 : 0;
      b.face = dir;
      return false;
    }
    if (inp.js) {
      b.lad = 0;
      b.ladCd = 0.3;
      b.vy = -JMP * 0.85;
      b.vx = (inp.r - inp.l) * SPD;
      if (inp.r || inp.l) b.face = inp.r ? 1 : -1;
      b.g = false;
      b.jumped = 1;
      b.dj = 1;
      return false;
    }
    const up = inp.u,
      dn = inp.d;
    b.vy = up && !dn ? -LSP : dn && !up ? LSP : 0;
    b.vx = 0;
    b.g = false;
    b.co = 0;
    b.jb = 0;
    b.dj = 1;
    b.x += (lc * T + T / 2 - b.w / 2 - b.x) * Math.min(1, dt * 20);
    return true;
  }
  if (lc >= 0 && b.ladCd <= 0 && inp.u && !b.dash) {
    b.lad = 1;
    b.vx = 0;
    b.vy = 0;
    b.g = false;
    return ladderStep(b, inp, dt);
  }
  return false;
}
function moveBody0(b, inp, dt) {
  const SP = b.spd || SPD;
  if (b.dash > 0) {
    b.dash -= dt;
    b.vy = 0;
    b.vx = b.dd * 820;
    if (b.dash <= 0) b.vx = b.dd * SPD;
    b.lad = 0;
  } else if (b === runtime.player && !b.big && ladderStep(b, inp, dt)) {
    // déplacement sur l'échelle déjà traité par ladderStep
  } else {
    b.lock = Math.max(0, (b.lock || 0) - dt);
    var ws = b.g ? 0 : wallSide(b);
    if (ws) {
      b.ws = ws;
      b.wc = 0.1;
    } else b.wc = Math.max(0, (b.wc || 0) - dt);
    const tv = (inp.r - inp.l) * SP,
      a = (b.g ? 2800 : 1600) * dt;
    if (!(b.lock > 0)) {
      b.vx = b.vx < tv ? Math.min(tv, b.vx + a) : Math.max(tv, b.vx - a);
      if (tv) b.face = Math.sign(tv);
    }
    b.jb = inp.jp ? 0.12 : Math.max(0, b.jb - dt);
    b.co = b.g ? 0.1 : Math.max(0, b.co - dt);
    if (b.jb > 0 && b.co > 0) {
      b.vy = -JMP;
      b.jb = 0;
      b.co = 0;
      b.g = false;
      b.jumped = 1;
    } else if (b.jb > 0 && b.wc > 0) {
      b.vy = -JMP;
      b.vx = -b.ws * SPD * 1.05;
      b.face = -b.ws;
      b.lock = 0.18;
      b.jb = 0;
      b.wc = 0;
      b.jumped = 1;
    } else if (b.fly && b.jb > 0 && b.dj > 0 && !b.g && b.co <= 0) {
      b.vy = -JMP * 0.95;
      b.jb = 0;
      b.dj = 0;
      b.jumped = 1;
      b.djfx = 0.25;
    }
    if (b.g || b.wc > 0) b.dj = 1;
    if (b.g) b.noVar = 0;
    let g = G;
    if (b.vy < 0 && !inp.jh && !b.noVar) g *= 2.2;
    b.vy = Math.min(MAXF, b.vy + g * dt);
    if (ws && b.vy > 150 && (ws === 1 ? inp.r : inp.l)) b.vy = 150;
  }
  let dx = b.vx * dt,
    n = Math.ceil(Math.abs(dx)),
    sx = Math.sign(dx);
  for (let i = 0; i < n; i++) {
    const st = sx * Math.min(1, Math.abs(dx) - i);
    b.x += st;
    if (collide(b)) {
      b.x -= st;
      b.vx = 0;
      break;
    }
  }
  let dy = b.vy * dt;
  n = Math.ceil(Math.abs(dy));
  const sy = Math.sign(dy);
  b.g = false;
  for (let i = 0; i < n; i++) {
    const st = sy * Math.min(1, Math.abs(dy) - i);
    b.y += st;
    if (collide(b)) {
      b.y -= st;
      if (sy > 0) b.g = true;
      b.vy = 0;
      break;
    }
  }
  if (b.lad && b.g) {
    b.lad = 0;
    b.ladCd = 0.15;
  }
}
export function hurt(b) {
  const x0 = Math.floor(b.x / T),
    x1 = Math.floor((b.x + b.w) / T),
    y0 = Math.floor(b.y / T),
    y1 = Math.floor((b.y + b.h) / T);
  for (let r = y0; r <= y1; r++)
    for (let c = x0; c <= x1; c++)
      if (runtime.grid[r] && runtime.grid[r][c] === '^') {
        const sx = c * T + 5,
          sy = r * T + 14,
          sw = T - 10,
          sh = T - 14;
        if (b.x + 3 < sx + sw && b.x + b.w - 3 > sx && b.y + 3 < sy + sh && b.y + b.h - 3 > sy) return true;
      }
  return false;
}
const bodies = () => (runtime.echoClone ? [runtime.player, runtime.echoClone] : [runtime.player]);
export const ov = (a, b, m = 0) =>
  a.x + m < b.x + b.w - m && a.x + a.w - m > b.x + m && a.y + m < b.y + b.h - m && a.y + a.h - m > b.y + m;
export function updCrumble(dt) {
  for (const b of bodies()) {
    if (!b.g) continue;
    const r = Math.floor((b.y + b.h + 1) / T);
    if (r >= 17) continue;
    for (let c = Math.floor(b.x / T); c <= Math.floor((b.x + b.w - 0.001) / T); c++)
      if (runtime.grid[r][c] === '~') {
        const k = r * 30 + c;
        runtime.ctm[k] = (runtime.ctm[k] || 0) + dt;
        if (runtime.ctm[k] >= 0.07) {
          delete runtime.ctm[k];
          runtime.brokenLog.push([c, r, '~']);
          runtime.grid[r][c] = '.';
          sfx('break');
        }
      }
  }
  // les planches ne reviennent que lorsque TOUTES sont tombées
  if (runtime.CR.length) {
    if (runtime.CR.every(([c, r]) => runtime.grid[r][c] !== '~')) {
      runtime.crT += dt;
      if (
        runtime.crT >= 1.2 &&
        runtime.CR.every(
          ([c, r]) =>
            !bodies().some((b) =>
              ov(b, {
                x: c * T,
                y: r * T,
                w: T,
                h: T,
              }),
            ),
        )
      ) {
        for (const [c, r] of runtime.CR) runtime.grid[r][c] = '~';
        runtime.ctm = {};
        runtime.crT = 0;
        sfx('plate');
      }
    } else runtime.crT = 0;
  }
}
export function updPlates(dt) {
  for (const a of runtime.anchors) {
    const x = a.c * T + 2,
      y = a.r * T + T - 10;
    for (const b of bodies())
      if (b.x < x + T - 4 && b.x + b.w > x && b.y + b.h > y && b.y < y + 10 && !gameState.anch[a.id]) {
        gameState.anch[a.id] = 1;
        sfx('plate');
      }
  }
  for (const p of runtime.plates) {
    const x = p.c * T + 2,
      y = p.r * T + T - 10;
    let on = false;
    for (const b of bodies())
      if (b.x < x + T - 4 && b.x + b.w > x && b.y + b.h > y && b.y < y + 10) on = true;
    if (on) p.t = PLT;
    else p.t = Math.max(0, p.t - dt);
    if (p.t > 0 && !p.was) sfx('plate');
    p.was = p.t > 0 ? 1 : 0;
  }
}
export function updDoors() {
  runtime.open = {};
  const ids = {};
  for (const p of runtime.plates) {
    (ids[p.id] = ids[p.id] || []).push(p.t > 0);
  }
  for (const id in ids) runtime.open[id] = ids[id].every(Boolean);
  runtime.open.x = !!gameState.anch['1'];
  runtime.open.y = !!gameState.anch['2'];
  runtime.open.z = !!gameState.anch['3'];
  for (let r = 0; r < 17; r++)
    for (let c = 0; c < 30; c++) {
      const ch = runtime.grid[r][c];
      if (isDoor(ch) && !runtime.open[ch.toLowerCase()]) {
        for (const b of bodies())
          if (b.x < c * T + T && b.x + b.w > c * T && b.y < r * T + T && b.y + b.h > r * T)
            runtime.open[ch.toLowerCase()] = true;
      }
    }
}
// salle de boss : des grilles tombent des deux côtés tant que le boss est vivant (on peut s'y accrocher et sauter dessus)
export function sealRoom() {
  if (gameState.sealed) return;
  gameState.sealed = 1;
  gameState.sealAt = gameState.time;
  runtime.SEAL = [];
  sfx('tick');
  say('Des grilles tombent : il faut vaincre le boss !', 2.8);
}
export function sealLand() {
  gameState.sealed = 2;
  for (const c of [0, 29])
    for (let r = 1; r <= 13; r++)
      if (runtime.grid[r][c] === '.') {
        runtime.grid[r][c] = '#';
        runtime.SEAL.push([r, c]);
      }
  if (runtime.player.x < 34) runtime.player.x = 34;
  if (runtime.player.x + runtime.player.w > W - 34) runtime.player.x = W - 34 - runtime.player.w;
  gameState.shake = 0.4;
  sfx('clang');
}
export function unsealRoom() {
  if (!gameState.sealed) return;
  if (gameState.sealed === 2)
    for (const [r, c] of runtime.SEAL) if (runtime.grid[r][c] === '#') runtime.grid[r][c] = '.';
  gameState.sealed = 0;
  runtime.SEAL = [];
  gameState.gateUpAt = gameState.time;
  sfx('gain');
}
runtime.SEAL = [];
