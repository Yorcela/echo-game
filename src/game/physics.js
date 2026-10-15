import { runtime } from '../state/runtime.ts';
import {
  GRAVITY,
  JUMP_SPEED,
  MAX_FALL_SPEED,
  PLATE_HOLD_TIME,
  MOVE_SPEED,
  TILE,
  WIDTH,
} from '../core/config.ts';
import { gameState, showMessage } from '../state/state.ts';
import { playSfx } from '../audio/audio.js';
/* ---------- Physique ---------- */
export const isDoor = (ch) => ch >= 'A' && ch <= 'Z' && ch !== 'E' && ch !== 'P';
let edgeCrossingEnabled = false;
export const gateOK = (k) => {
  const g = k.gate;
  if (!g) return true;
  if (g.cl !== undefined && !gameState.clearedBossRooms[g.cl]) return false;
  if (g.pw !== undefined && !gameState.echoesOwned[g.pw]) return false;
  if (g.t && !gameState.hasTimeEcho) return false;
  if (g.all && !g.all.every((p) => gameState.echoesOwned[p])) return false;
  if (g.any && !g.any.some((p) => gameState.echoesOwned[p])) return false;
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
runtime.kingAiActive = 0;
runtime.bossCollisionMode = 0;
runtime.colossusFloor = {
  cnt: [],
  rise: [],
  last: -1,
};
function kingSolid(c, r) {
  if (c < 0 || c >= 30 || r < 0) return true;
  if (r >= 17) return false;
  for (let q = r; q < 17; q++) {
    const y = runtime.grid[q][c];
    if (!(y === '#' || y === '%' || y === '&' || y === '~')) return false;
  }
  return true;
}
runtime.knockbackTimer = 0;
const isPlat = (c, r) => r >= 6 && r <= 7 && ((c >= 6 && c <= 12) || (c >= 17 && c <= 23));
export function solid(c, r) {
  if (runtime.kingAiActive) return kingSolid(c, r);
  if (runtime.bossCollisionMode)
    return (
      (r >= 14 && r < 17 && c >= 1 && c <= 28) ||
      c < 1 ||
      c >= 29 ||
      (runtime.bossCollisionMode === 2 && r >= 0 && r < 14 && c < 30 && runtime.grid[r][c] === '#')
    );
  if (c < 0) return !(edgeCrossingEnabled && edgeOpen('l', r));
  if (c >= 30) return !(edgeCrossingEnabled && edgeOpen('r', r));
  if (r < 0) return !(edgeCrossingEnabled && c >= 0 && c < 30 && linkAt('t', c));
  if (r >= 17) return false;
  const ch = runtime.grid[r][c];
  if (runtime.knockbackTimer > 0 && ch === '#' && isPlat(c, r)) return false;
  return (
    ch === '#' ||
    ch === '%' ||
    ch === '&' ||
    ch === '~' ||
    (isDoor(ch) && !runtime.openDoors[ch.toLowerCase()])
  );
}
export function collide(b) {
  const x0 = Math.floor(b.x / TILE),
    x1 = Math.floor((b.x + b.w - 0.001) / TILE),
    y0 = Math.floor(b.y / TILE),
    y1 = Math.floor((b.y + b.h - 0.001) / TILE);
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
  edgeCrossingEnabled = b === runtime.player;
  try {
    moveBodyCore(b, inp, dt);
  } finally {
    edgeCrossingEnabled = false;
  }
}
const LADDER_SPEED = 135;
function isOnLadder(b) {
  const c = Math.floor((b.x + b.w / 2) / TILE),
    y0 = Math.floor((b.y + 4) / TILE),
    y1 = Math.floor((b.y + b.h - 4) / TILE);
  for (let r = y0; r <= y1; r++) if (r >= 0 && r < 17 && runtime.grid[r][c] === '|') return c;
  return -1;
}
function ladderStep(body, inp, dt) {
  // renvoie true si le corps est (resté) sur l'échelle
  body.ladCd = Math.max(0, (body.ladCd || 0) - dt);
  const lc = isOnLadder(body);
  if (body.lad) {
    if (lc < 0) {
      // sorti par le haut ou le bas : petit saut de côté
      body.lad = 0;
      body.ladCd = 0.25;
      const c = Math.floor((body.x + body.w / 2) / TILE);
      const dir = solid(c + 1, 14) ? 1 : solid(c - 1, 14) ? -1 : body.face || 1;
      body.vx = dir * MOVE_SPEED * 0.7;
      body.vy = body.vy < 0 ? -330 : 0;
      body.face = dir;
      return false;
    }
    if (inp.js) {
      body.lad = 0;
      body.ladCd = 0.3;
      body.vy = -JUMP_SPEED * 0.85;
      body.vx = (inp.r - inp.l) * MOVE_SPEED;
      if (inp.r || inp.l) body.face = inp.r ? 1 : -1;
      body.g = false;
      body.jumped = 1;
      body.dj = 1;
      return false;
    }
    const up = inp.u,
      dn = inp.d;
    body.vy = up && !dn ? -LADDER_SPEED : dn && !up ? LADDER_SPEED : 0;
    body.vx = 0;
    body.g = false;
    body.co = 0;
    body.jb = 0;
    body.dj = 1;
    body.x += (lc * TILE + TILE / 2 - body.w / 2 - body.x) * Math.min(1, dt * 20);
    return true;
  }
  if (lc >= 0 && body.ladCd <= 0 && inp.u && !body.dash) {
    body.lad = 1;
    body.vx = 0;
    body.vy = 0;
    body.g = false;
    return ladderStep(body, inp, dt);
  }
  return false;
}
// matières posées sur le sol (dans la rangée où l'on marche) : toile d'araignée (GLUE_TILE) = freine, glace = glisse
export const GLUE_TILE = ',';
export const ICE_TILE = '_';
const GLUE_SPEED_FACTOR = 0.5; // toile d'araignée : on avance à moitié vitesse
const ICE_SPEED_FACTOR = 1.25;
// la glace s'emballe vite mais freine très mal : on glisse
const ICE_ACCELERATION = 800;
const ICE_BRAKING = 330;
const ICE_AIR_BRAKING = 40; // l'élan pris sur la glace se garde pendant le saut
/** Matière sous les pieds du corps (GLUE_TILE = toile, ICE_TILE ou null). */
function groundSurface(body) {
  const r = Math.floor((body.y + body.h - 1) / TILE),
    c = Math.floor((body.x + body.w / 2) / TILE);
  if (r < 0 || r >= 17 || c < 0 || c >= 30) return null;
  const ch = runtime.grid[r][c];
  return ch === GLUE_TILE || ch === ICE_TILE ? ch : null;
}
// eau : cases '"' (non solides). Sans la nage on s'y blesse (voir water.js) ; avec, on y nage.
export const WATER_TILE = '"';
/** Le centre du corps est-il dans l'eau ? */
export function inWater(body, dy = 0) {
  const c = Math.floor((body.x + body.w / 2) / TILE),
    r = Math.floor((body.y + body.h / 2 + dy) / TILE);
  return r >= 0 && r < 17 && c >= 0 && c < 30 && runtime.grid[r][c] === WATER_TILE;
}
const SWIM_SPEED_FACTOR = 0.62;
const SWIM_RISE = 150;
const SWIM_DIVE = 150;
const SWIM_SINK = 40;
function swimStep(body, inp, dt) {
  body.lock = Math.max(0, (body.lock || 0) - dt);
  const tvx = (inp.r - inp.l) * (body.spd || MOVE_SPEED) * SWIM_SPEED_FACTOR;
  const a = 1500 * dt;
  if (!(body.lock > 0)) {
    body.vx = body.vx < tvx ? Math.min(tvx, body.vx + a) : Math.max(tvx, body.vx - a);
    if (tvx) body.face = Math.sign(tvx);
  }
  // brasse : haut (flèche ou saut) remonte, bas plonge, sinon on coule doucement
  const tvy = inp.u || inp.jh ? -SWIM_RISE : inp.d ? SWIM_DIVE : SWIM_SINK;
  body.vy += (tvy - body.vy) * Math.min(1, dt * 7);
  // à la surface, un saut fait jaillir hors de l'eau
  if (inp.jp && !inWater(body, -TILE * 0.9)) {
    body.vy = -JUMP_SPEED * 0.85;
    body.jumped = 1;
  }
  body.g = false;
  body.co = 0.1;
  body.dj = 1;
  body.lad = 0;
}
function moveBodyCore(body, inp, dt) {
  const SP = body.spd || MOVE_SPEED;
  if (body.dash > 0) {
    body.dash -= dt;
    body.vy = 0;
    body.vx = body.dd * 820;
    if (body.dash <= 0) body.vx = body.dd * MOVE_SPEED;
    body.lad = 0;
  } else if (body.swim && inWater(body)) {
    swimStep(body, inp, dt);
  } else if (body === runtime.player && !body.big && ladderStep(body, inp, dt)) {
    // déplacement sur l'échelle déjà traité par ladderStep
  } else {
    body.lock = Math.max(0, (body.lock || 0) - dt);
    var ws = body.g ? 0 : wallSide(body);
    if (ws) {
      body.ws = ws;
      body.wc = 0.1;
    } else body.wc = Math.max(0, (body.wc || 0) - dt);
    // matière du sol : la toile freine, la glace fait glisser (et accélère) ; l'élan de la glace se garde en l'air
    const surface = body.g ? groundSurface(body) : null;
    if (surface === ICE_TILE) body.iceMomentum = 0.9;
    else if (body.g) body.iceMomentum = 0;
    else body.iceMomentum = Math.max(0, (body.iceMomentum || 0) - dt);
    const speedFactor =
      surface === GLUE_TILE ? GLUE_SPEED_FACTOR : surface === ICE_TILE ? ICE_SPEED_FACTOR : 1;
    const tv = (inp.r - inp.l) * SP * speedFactor;
    let a = (body.g ? 2800 : 1600) * dt;
    const gaining =
      Math.abs(tv) > Math.abs(body.vx) && (tv === 0 || Math.sign(tv) === Math.sign(body.vx) || body.vx === 0);
    if (surface === ICE_TILE) a = (gaining ? ICE_ACCELERATION : ICE_BRAKING) * dt;
    else if (
      !body.g &&
      body.iceMomentum > 0 &&
      Math.abs(body.vx) > Math.abs(tv) &&
      Math.sign(body.vx) !== -Math.sign(tv)
    )
      a = ICE_AIR_BRAKING * dt;
    if (!(body.lock > 0)) {
      body.vx = body.vx < tv ? Math.min(tv, body.vx + a) : Math.max(tv, body.vx - a);
      if (tv) body.face = Math.sign(tv);
    }
    body.jb = inp.jp ? 0.12 : Math.max(0, body.jb - dt);
    body.co = body.g ? 0.1 : Math.max(0, body.co - dt);
    // pris dans la toile d'araignée, on ne peut pas sauter
    if (body.jb > 0 && body.co > 0 && surface !== GLUE_TILE) {
      body.vy = -JUMP_SPEED;
      body.jb = 0;
      body.co = 0;
      body.g = false;
      body.jumped = 1;
    } else if (body.jb > 0 && body.wc > 0) {
      body.vy = -JUMP_SPEED;
      body.vx = -body.ws * MOVE_SPEED * 1.05;
      body.face = -body.ws;
      body.lock = 0.18;
      body.jb = 0;
      body.wc = 0;
      body.jumped = 1;
    } else if (body.fly && body.jb > 0 && body.dj > 0 && !body.g && body.co <= 0) {
      body.vy = -JUMP_SPEED * 0.95;
      body.jb = 0;
      body.dj = 0;
      body.jumped = 1;
      body.djfx = 0.25;
    }
    if (body.g || body.wc > 0) body.dj = 1;
    if (body.g) body.noVar = 0;
    let g = GRAVITY;
    if (body.vy < 0 && !inp.jh && !body.noVar) g *= 2.2;
    body.vy = Math.min(MAX_FALL_SPEED, body.vy + g * dt);
    if (ws && body.vy > 150 && (ws === 1 ? inp.r : inp.l)) body.vy = 150;
  }
  let dx = body.vx * dt,
    n = Math.ceil(Math.abs(dx)),
    sx = Math.sign(dx);
  for (let i = 0; i < n; i++) {
    const st = sx * Math.min(1, Math.abs(dx) - i);
    body.x += st;
    if (collide(body)) {
      body.x -= st;
      body.vx = 0;
      break;
    }
  }
  let dy = body.vy * dt;
  n = Math.ceil(Math.abs(dy));
  const sy = Math.sign(dy);
  body.g = false;
  for (let i = 0; i < n; i++) {
    const st = sy * Math.min(1, Math.abs(dy) - i);
    body.y += st;
    if (collide(body)) {
      body.y -= st;
      if (sy > 0) body.g = true;
      body.vy = 0;
      break;
    }
  }
  if (body.lad && body.g) {
    body.lad = 0;
    body.ladCd = 0.15;
  }
}
export function hurt(b) {
  const x0 = Math.floor(b.x / TILE),
    x1 = Math.floor((b.x + b.w) / TILE),
    y0 = Math.floor(b.y / TILE),
    y1 = Math.floor((b.y + b.h) / TILE);
  for (let r = y0; r <= y1; r++)
    for (let c = x0; c <= x1; c++)
      if (runtime.grid[r] && runtime.grid[r][c] === '^') {
        const sx = c * TILE + 5,
          sy = r * TILE + 14,
          sw = TILE - 10,
          sh = TILE - 14;
        if (b.x + 3 < sx + sw && b.x + b.w - 3 > sx && b.y + 3 < sy + sh && b.y + b.h - 3 > sy) return true;
      }
  return false;
}
const bodies = () => (runtime.echoClone ? [runtime.player, runtime.echoClone] : [runtime.player]);
export const overlaps = (a, b, m = 0) =>
  a.x + m < b.x + b.w - m && a.x + a.w - m > b.x + m && a.y + m < b.y + b.h - m && a.y + a.h - m > b.y + m;
export function updateCrumblingTiles(dt) {
  for (const b of bodies()) {
    if (!b.g) continue;
    const r = Math.floor((b.y + b.h + 1) / TILE);
    if (r >= 17) continue;
    for (let c = Math.floor(b.x / TILE); c <= Math.floor((b.x + b.w - 0.001) / TILE); c++)
      if (runtime.grid[r][c] === '~') {
        const k = r * 30 + c;
        runtime.crumbleTileTimers[k] = (runtime.crumbleTileTimers[k] || 0) + dt;
        if (runtime.crumbleTileTimers[k] >= 0.07) {
          delete runtime.crumbleTileTimers[k];
          runtime.brokenTilesLog.push([c, r, '~']);
          runtime.grid[r][c] = '.';
          playSfx('break');
        }
      }
  }
  // les planches ne reviennent que lorsque TOUTES sont tombées
  if (runtime.crumbleTiles.length) {
    if (runtime.crumbleTiles.every(([c, r]) => runtime.grid[r][c] !== '~')) {
      runtime.crumbleTimer += dt;
      if (
        runtime.crumbleTimer >= 1.2 &&
        runtime.crumbleTiles.every(
          ([c, r]) =>
            !bodies().some((b) =>
              overlaps(b, {
                x: c * TILE,
                y: r * TILE,
                w: TILE,
                h: TILE,
              }),
            ),
        )
      ) {
        for (const [c, r] of runtime.crumbleTiles) runtime.grid[r][c] = '~';
        runtime.crumbleTileTimers = {};
        runtime.crumbleTimer = 0;
        playSfx('plate');
      }
    } else runtime.crumbleTimer = 0;
  }
}
export function updatePlates(dt) {
  for (const a of runtime.anchors) {
    const x = a.c * TILE + 2,
      y = a.r * TILE + TILE - 10;
    for (const b of bodies())
      if (
        b.x < x + TILE - 4 &&
        b.x + b.w > x &&
        b.y + b.h > y &&
        b.y < y + 10 &&
        !gameState.roomAnchors[a.id]
      ) {
        gameState.roomAnchors[a.id] = 1;
        playSfx('plate');
      }
  }
  for (const p of runtime.plates) {
    const x = p.c * TILE + 2,
      y = p.r * TILE + TILE - 10;
    let on = false;
    for (const b of bodies())
      if (b.x < x + TILE - 4 && b.x + b.w > x && b.y + b.h > y && b.y < y + 10) on = true;
    if (on) p.t = PLATE_HOLD_TIME;
    else p.t = Math.max(0, p.t - dt);
    if (p.t > 0 && !p.was) playSfx('plate');
    p.was = p.t > 0 ? 1 : 0;
  }
}
export function updateDoors() {
  runtime.openDoors = {};
  const ids = {};
  for (const p of runtime.plates) {
    (ids[p.id] = ids[p.id] || []).push(p.t > 0);
  }
  for (const id in ids) runtime.openDoors[id] = ids[id].every(Boolean);
  runtime.openDoors.x = !!gameState.roomAnchors['1'];
  runtime.openDoors.y = !!gameState.roomAnchors['2'];
  runtime.openDoors.z = !!gameState.roomAnchors['3'];
  for (let r = 0; r < 17; r++)
    for (let c = 0; c < 30; c++) {
      const ch = runtime.grid[r][c];
      if (isDoor(ch) && !runtime.openDoors[ch.toLowerCase()]) {
        for (const b of bodies())
          if (b.x < c * TILE + TILE && b.x + b.w > c * TILE && b.y < r * TILE + TILE && b.y + b.h > r * TILE)
            runtime.openDoors[ch.toLowerCase()] = true;
      }
    }
}
// salle de boss : des grilles tombent des deux côtés tant que le boss est vivant (on peut s'y accrocher et sauter dessus)
export function sealRoom() {
  if (gameState.sealed) return;
  gameState.sealed = 1;
  gameState.sealStartTime = gameState.time;
  runtime.sealedTiles = [];
  playSfx('tick');
  showMessage('Des grilles tombent : il faut vaincre le boss !', 2.8);
}
export function sealLand() {
  gameState.sealed = 2;
  for (const c of [0, 29])
    for (let r = 1; r <= 13; r++)
      if (runtime.grid[r][c] === '.') {
        runtime.grid[r][c] = '#';
        runtime.sealedTiles.push([r, c]);
      }
  if (runtime.player.x < 34) runtime.player.x = 34;
  if (runtime.player.x + runtime.player.w > WIDTH - 34) runtime.player.x = WIDTH - 34 - runtime.player.w;
  gameState.shake = 0.4;
  playSfx('clang');
}
export function unsealRoom() {
  if (!gameState.sealed) return;
  if (gameState.sealed === 2)
    for (const [r, c] of runtime.sealedTiles) if (runtime.grid[r][c] === '#') runtime.grid[r][c] = '.';
  gameState.sealed = 0;
  runtime.sealedTiles = [];
  gameState.gateRaisedAt = gameState.time;
  playSfx('gain');
}
runtime.sealedTiles = [];
