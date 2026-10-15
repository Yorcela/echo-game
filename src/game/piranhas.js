// Piranha : ne quitte jamais l'eau ; fonce sur le héros ou son clone (le plus proche, s'il est dans l'eau), sinon patrouille.
// Il n'est éliminé que par un dash qui le traverse (le héros lancé en dash est insensible à sa morsure).
import { TILE } from '../core/config.ts';
import { runtime } from '../state/runtime.ts';
import { gameState } from '../state/state.ts';
import { WATER_TILE, overlaps } from './physics.js';
import { playSfx } from '../audio/audio.js';

const SIGHT = 11 * TILE;
const WATER_SPEED_BOOST = 1.35; // plus vif quand il a sa proie en vue

const waterAt = (x, y) => {
  const c = Math.floor(x / TILE),
    r = Math.floor(y / TILE);
  return r >= 0 && r < 17 && c >= 0 && c < 30 && runtime.grid[r][c] === WATER_TILE;
};
/** Le rectangle (x, y, w, h) est-il entièrement dans l'eau ? */
const inPool = (x, y, w, h) =>
  waterAt(x + 1, y + 1) &&
  waterAt(x + w - 1, y + 1) &&
  waterAt(x + 1, y + h - 1) &&
  waterAt(x + w - 1, y + h - 1);
const inWaterBody = (b) => waterAt(b.x + b.w / 2, b.y + b.h / 2);

/** Sommet de la colonne d'eau au-dessus de (x, y) : où une bulle éclate. */
function surfaceY(x, y) {
  const c = Math.floor(x / TILE);
  let r = Math.floor(y / TILE);
  while (r > 0 && runtime.grid[r - 1] && runtime.grid[r - 1][c] === WATER_TILE) r--;
  return r * TILE;
}
export function updatePiranha(e, dt) {
  if (e.ph === undefined) e.ph = 0;
  e.ph += dt;
  // petites bulles : naissent à la bouche, remontent en ondulant et éclatent à la surface
  e.bub = e.bub || [];
  e.bt = (e.bt === undefined ? 0.2 + (e.ph % 0.4) : e.bt) - dt;
  if (e.bt <= 0) {
    e.bt = 0.35 + 0.25 * Math.abs(Math.sin(e.ph * 3.1));
    e.bub.push({
      x: e.x + e.w / 2 + e.dir * (e.w / 2 - 4),
      y: e.y + e.h / 2 - 3,
      r: 1.8 + (e.bub.length % 3) * 0.8,
      s: e.ph,
    });
  }
  for (const b of e.bub) {
    b.y -= (34 + b.r * 6) * dt;
    b.x += Math.sin(b.s * 4 + b.y * 0.08) * 8 * dt;
  }
  e.bub = e.bub.filter((b) => b.y > surfaceY(b.x, b.y) + 2);
  // proie : héros ou clone dans l'eau, le plus proche et à portée
  let prey = null,
    best = SIGHT;
  for (const b of runtime.echoClone ? [runtime.player, runtime.echoClone] : [runtime.player]) {
    if (!inWaterBody(b)) continue;
    const d = Math.hypot(b.x + b.w / 2 - (e.x + e.w / 2), b.y + b.h / 2 - (e.y + e.h / 2));
    if (d < best) {
      best = d;
      prey = b;
    }
  }
  let vx, vy;
  if (prey) {
    const dx = prey.x + prey.w / 2 - (e.x + e.w / 2),
      dy = prey.y + prey.h / 2 - (e.y + e.h / 2),
      n = Math.hypot(dx, dy) || 1;
    vx = (dx / n) * e.spd * WATER_SPEED_BOOST;
    vy = (dy / n) * e.spd * WATER_SPEED_BOOST;
  } else {
    // patrouille : va et vient avec un léger ondoiement ; fait demi-tour au bord de l'eau
    vx = e.dir * e.spd * 0.45;
    vy = Math.sin(e.ph * 2.2) * 22;
  }
  const nx = e.x + vx * dt,
    ny = e.y + vy * dt;
  if (inPool(nx, e.y, e.w, e.h)) e.x = nx;
  else if (!prey) e.dir = -e.dir;
  if (inPool(e.x, ny, e.w, e.h)) e.y = ny;
  if (vx) e.dir = Math.sign(vx) || e.dir;
  // un dash qui le traverse l'élimine
  const P = runtime.player;
  if (P.dash > 0 && overlaps(P, e, 2)) {
    e.alive = 0;
    playSfx('hit');
    gameState.shake = Math.max(gameState.shake, 0.18);
  }
}
