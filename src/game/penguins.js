// Pingouin : glisse sur le ventre tout le long de la glace. Bras repliés en arrière, puis poussée brutale jusqu'à 3 fois la vitesse
// du héros ; il ralentit ensuite régulièrement sur la distance disponible, jusqu'à 0,7 fois cette vitesse au bout de la glace,
// où il se retourne et se repousse. On ne l'élimine qu'en lui sautant dessus.
import { MOVE_SPEED, TILE } from '../core/config.ts';
import { runtime } from '../state/runtime.ts';
import { moveBody, solid } from './physics.js';

export const PENGUIN_TOP_SPEED = 3 * MOVE_SPEED;
export const PENGUIN_END_SPEED = 0.7 * MOVE_SPEED;
export const PENGUIN_WINDUP_TIME = 0.4; // bras pliés en arrière
export const PENGUIN_PUSH_TIME = 0.26; // poussée jusqu'à pleine vitesse
const PUSH_ACCEL = PENGUIN_TOP_SPEED / PENGUIN_PUSH_TIME;
const MIN_RUN = 24; // en dessous, pas la place de se lancer : demi-tour

/** Le corps, décalé en x, est-il bloqué (mur, piques, vide) ? */
function blockedAt(e, x) {
  const r0 = Math.floor(e.y / TILE),
    r1 = Math.floor((e.y + e.h - 2) / TILE),
    rf = Math.floor((e.y + e.h + 4) / TILE),
    x0 = Math.floor(x / TILE),
    x1 = Math.floor((x + e.w) / TILE);
  for (let c = x0; c <= x1; c++) {
    for (let r = r0; r <= r1; r++)
      if (solid(c, r) || (runtime.grid[r] && runtime.grid[r][c] === '^')) return true;
    if (!solid(c, rf)) return true;
  }
  return false;
}
/** Distance libre devant lui (en px), jusqu'au mur, aux piques ou au vide. */
function freeRun(e) {
  let d = 0;
  while (d < 30 * TILE && !blockedAt(e, e.x + e.dir * (d + 4))) d += 8;
  return d;
}
function endRun(e) {
  e.dir = -e.dir;
  e.pst = 'rest';
  e.pt = PENGUIN_WINDUP_TIME;
}
export function updatePenguin(e, dt) {
  if (e.pst === undefined) {
    e.pst = 'rest';
    e.pt = 0.3 + (e.ph % 1) * 0.5; // départs décalés d'un pingouin à l'autre
    e.pv = 0;
  }
  let v = e.pv;
  if (e.pst === 'rest') {
    v = 0;
    e.pt -= dt;
    if (e.pt <= 0) {
      e.span = freeRun(e);
      e.runx = e.x;
      if (e.span < MIN_RUN) endRun(e);
      else e.pst = 'push';
    }
  } else {
    const run = Math.abs(e.x - e.runx);
    if (e.pst === 'push') {
      v = Math.min(PENGUIN_TOP_SPEED, Math.abs(v) + PUSH_ACCEL * dt) * e.dir;
      e.pt = 0;
      if (Math.abs(v) >= PENGUIN_TOP_SPEED) e.pst = 'glide';
    } else {
      // de 3× à 0,7× la vitesse du héros, linéairement sur la distance de glace
      const u = Math.min(1, run / Math.max(1, e.span));
      v = (PENGUIN_TOP_SPEED - (PENGUIN_TOP_SPEED - PENGUIN_END_SPEED) * u) * e.dir;
    }
    if (run >= e.span - 4 || blockedAt(e, e.x + e.dir * (Math.abs(v) * dt + 2))) {
      v = 0;
      endRun(e);
    }
  }
  e.ph = (e.ph || 0) + dt;
  e.vx = v;
  // verrou : moveBody ne touche pas à la vitesse horizontale (il glisse même sur une dalle ordinaire)
  e.lock = 1;
  moveBody(e, { l: 0, r: 0, jp: 0, jh: 0 }, dt);
  // le décor l'a arrêté : fin de course
  if (v && Math.abs(e.vx) < Math.abs(v) * 0.5) {
    v = 0;
    if (e.pst !== 'rest') endRun(e);
  }
  e.vx = v;
  e.pv = v;
}
