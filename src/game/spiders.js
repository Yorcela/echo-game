// Arachnides : elles courent sur les surfaces (sol, murs, plafond, plateformes) à la poursuite du héros ou de son clone
// (miroir, jumeau, rémanence) et, du plafond, font descendre une toile qui blesse. Déterministe (aucun tirage).
import { TILE } from '../core/config.ts';
import { runtime } from '../state/runtime.ts';
import { solid } from './physics.js';

const DIRS = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
]; // droite, bas, gauche, haut
const WALL_ORDER = [1, 3, 2, 0]; // sol d'abord
const WEB_SPEED = 260;
const WEB_RETRACT_SPEED = 220;
const WEB_HOLD = 1.1;
const WEB_COOLDOWN = 2.2;
const WEB_TRIGGER = 4 * TILE;
const BODY_H = 22;
const WALL_SPEED_FACTOR = 2; // sur un mur ou au plafond elle va deux fois plus vite
const isSolid = (c, r) => c < 0 || c >= 30 || r < 0 || r >= 17 || solid(c, r);
/** Case libre qui touche le décor (y compris en diagonale) : la spider peut s'y tenir. Sur un sol de toile : sol seulement. */
function isSurface(c, r, mode) {
  if (isSolid(c, r)) return false;
  if (mode === 'floor') return isSolid(c, r + 1);
  if (mode === 'ceiling') return isSolid(c, r - 1);
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && isSolid(c + dx, r + dy)) return true;
  return false;
}
const bodyCell = (b) => [
  Math.min(29, Math.max(0, Math.floor((b.x + b.w / 2) / TILE))),
  Math.min(16, Math.max(0, Math.floor((b.y + b.h / 2) / TILE))),
];
/** La cible vivante la plus proche : le héros ou son clone. */
function nearestTarget(e) {
  let best = runtime.player,
    bd = Infinity;
  for (const b of runtime.echoClone ? [runtime.player, runtime.echoClone] : [runtime.player]) {
    const d = Math.hypot(b.x + b.w / 2 - (e.x + e.w / 2), b.y + b.h / 2 - (e.y + e.h / 2));
    if (d < bd) {
      bd = d;
      best = b;
    }
  }
  return best;
}
function wallDir(c, r, prev) {
  if (prev !== undefined && isSolid(c + DIRS[prev][0], r + DIRS[prev][1])) return prev;
  for (const d of WALL_ORDER) if (isSolid(c + DIRS[d][0], r + DIRS[d][1])) return d;
  return prev === undefined ? 1 : prev;
}
function attach(e) {
  // une toile au sol : l'arachnide y reste, elle ne grimpe pas aux murs ni au plafond
  // toile au sol : l'arachnide reste au sol ; sinon elle reste au plafond (et y tisse sa toile)
  e.mode = runtime.grid.some((row) => row.includes(',')) ? 'floor' : 'ceiling';
  e.cx = Math.floor((e.x + e.w / 2) / TILE);
  e.cy = Math.floor((e.y + e.h / 2) / TILE);
  // en l'air : on descend jusqu'à une surface
  if (e.mode === 'floor') while (!isSurface(e.cx, e.cy, e.mode) && e.cy < 16) e.cy++;
  else while (!isSurface(e.cx, e.cy, e.mode) && e.cy > 0) e.cy--;
  e.wd = wallDir(e.cx, e.cy, undefined);
  e.prog = 0;
  e.mx = e.cx;
  e.my = e.cy;
  e.flip = 1;
  e.ang = Math.atan2(DIRS[(e.wd + 3) % 4][1], DIRS[(e.wd + 3) % 4][0]);
  e.wst = 0;
  e.wlen = 0;
  e.wcd = 1.2;
  e.wp = e.ph || 0;
}
/** Plus court chemin (en cases) vers la surface atteignable la plus proche de la cible ; renvoie la première case. */
function nextStep(e, target) {
  const [tx, ty] = bodyCell(target),
    key = (c, r) => r * 30 + c,
    prev = new Map([[key(e.cx, e.cy), -1]]),
    queue = [[e.cx, e.cy]];
  let best = [e.cx, e.cy],
    bd = Math.hypot(e.cx - tx, e.cy - ty);
  for (let q = 0; q < queue.length; q++) {
    const [c, r] = queue[q];
    for (const [dx, dy] of DIRS) {
      const nc = c + dx,
        nr = r + dy,
        k = key(nc, nr);
      if (nc < 0 || nc >= 30 || nr < 0 || nr >= 17 || prev.has(k) || !isSurface(nc, nr, e.mode)) continue;
      prev.set(k, key(c, r));
      queue.push([nc, nr]);
      const d = Math.hypot(nc - tx, nr - ty);
      if (d < bd) {
        bd = d;
        best = [nc, nr];
      }
    }
  }
  const start = key(e.cx, e.cy);
  let k = key(best[0], best[1]);
  if (k === start) return null;
  while (prev.get(k) !== start) k = prev.get(k);
  return [k % 30, Math.floor(k / 30)];
}
function place(e) {
  const [wx, wy] = DIRS[e.wd],
    mx = e.mx - e.cx,
    my = e.my - e.cy,
    px = (e.cx + 0.5 + mx * e.prog) * TILE,
    py = (e.cy + 0.5 + my * e.prog) * TILE;
  // point de contact avec le mur ; le corps est posé dessus
  e.sx = px + wx * (TILE / 2);
  e.sy = py + wy * (TILE / 2);
  e.x = e.sx - wx * (BODY_H / 2) - e.w / 2;
  e.y = e.sy - wy * (BODY_H / 2) - e.h / 2;
}
export function updateSpider(e, dt) {
  if (e.cx === undefined) attach(e);
  e.wcd = Math.max(0, e.wcd - dt);
  const target = nearestTarget(e),
    tcx = target.x + target.w / 2,
    onCeiling = e.wd === 3;
  if (e.wst === 0) {
    if (e.mx === e.cx && e.my === e.cy) {
      const step = nextStep(e, target);
      if (step) {
        e.mx = step[0];
        e.my = step[1];
        e.prog = 0;
      }
    }
    if (e.mx !== e.cx || e.my !== e.cy) {
      e.prog += (e.spd * (e.wd === 1 ? 1 : WALL_SPEED_FACTOR) * dt) / TILE;
      e.wp += dt * 5;
      // l'avant du sprite suit le mur : on le retourne quand elle va dans l'autre sens
      const [fx, fy] = DIRS[(e.wd + 3) % 4],
        dot = (e.mx - e.cx) * fx + (e.my - e.cy) * fy;
      if (dot) e.flip = dot > 0 ? 1 : -1;
      if (e.prog >= 1) {
        e.cx = e.mx;
        e.cy = e.my;
        e.prog = 0;
        e.wd = wallDir(e.cx, e.cy, e.wd);
      }
    }
    if (
      onCeiling &&
      e.wcd <= 0 &&
      e.prog < 0.1 &&
      target.y > e.y &&
      Math.abs(tcx - (e.x + e.w / 2)) < WEB_TRIGGER
    ) {
      // le fil descend jusqu'au sol
      let n = 0;
      while (!isSolid(e.cx, e.cy + 1 + n)) n++;
      e.wmax = (n + 1) * TILE - BODY_H;
      if (e.wmax >= 16) {
        e.wst = 1;
        e.wt = 0;
      } else e.wcd = 1;
    }
  } else if (e.wst === 1) {
    e.wlen = Math.min(e.wmax, e.wlen + WEB_SPEED * dt);
    if (e.wlen >= e.wmax) {
      e.wst = 2;
      e.wt = WEB_HOLD;
    }
  } else if (e.wst === 2) {
    e.wt -= dt;
    if (e.wt <= 0) e.wst = 3;
  } else {
    e.wlen = Math.max(0, e.wlen - WEB_RETRACT_SPEED * dt);
    if (e.wlen <= 0) {
      e.wst = 0;
      e.wcd = WEB_COOLDOWN;
    }
  }
  // le sprite repose sur son mur : le bas du sprite regarde la paroi, l'avant va vers la gauche ou la droite du mur
  const fwd = (e.wd + 3) % 4,
    target2 = Math.atan2(DIRS[fwd][1], DIRS[fwd][0]);
  let d = target2 - e.ang;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  e.ang += d * Math.min(1, dt * 14);
  place(e);
}
/** Rectangle de la toile qui blesse, ou null. */
export function webRect(e) {
  if (e.t !== 'a' || !(e.wlen > 6)) return null;
  return { x: e.sx - 3, y: e.y + e.h, w: 6, h: e.wlen };
}
