// La Pieuvre : au milieu d'un bassin, elle abat ses tentacules sur les plateformes une par une. Une marque annonce l'impact (1 s) ;
// si le héros est sur la plateforme, il perd un cœur. La tentacule reste 2 s plantée : c'est le moment de la frapper.
// À 60 % de vie elle en abat 2 à la fois, à 30 % 3. Au bout de 3 coups, une plateforme s'effondre. Tomber à l'eau coûte 1 cœur.
import { PLAYER_H, TILE } from '../core/config.ts';
import { runtime } from '../state/runtime.ts';
import { gameState } from '../state/state.ts';
import { hurtPlayer } from './rewind.js';
import { overlaps } from './physics.js';
import { playSfx } from '../audio/audio.js';

export const OCTOPUS_TELE_TIME = 1.0;
export const OCTOPUS_FALL_TIME = 0.18;
export const OCTOPUS_STUCK_TIME = 2.0;
export const OCTOPUS_RETRACT_TIME = 0.25;
export const OCTOPUS_HITS_TO_BREAK = 3;
const VOLLEY_PAUSE = 0.9;
const BREAK_SHAKE = 0.8;
const TENTACLE_H = 70; // hauteur d'une tentacule plantée, en px
const TENTACLE_W = 28;
const WATER_MARGIN = 8;

export const waterTop = () => (runtime.level.water || 14) * TILE;
/** Nombre de tentacules abattues en même temps selon la vie restante (60 % : 2, 30 % : 3). */
export const tentaclesFor = (hp, max) => (hp / max <= 0.3 ? 3 : hp / max <= 0.6 ? 2 : 1);
/** Rectangle d'une plateforme en px. */
export const platformRect = (p) => ({ x: p.c0 * TILE, y: p.r * TILE, w: (p.c1 - p.c0 + 1) * TILE, h: TILE });
/** Rectangle où une tentacule plantée sur la plateforme peut être frappée. */
export const tentacleRect = (p) => {
  const r = platformRect(p);
  return { x: r.x + r.w / 2 - TENTACLE_W / 2, y: r.y - TENTACLE_H, w: TENTACLE_W, h: TENTACLE_H };
};

function init(e) {
  e.oct = {
    plats: runtime.level.platforms.map(([r, c0, c1]) => ({ r, c0, c1, hits: 0, alive: true, shake: 0 })),
    tents: [],
    debris: [],
    cd: 1.6,
    safe: 0,
    seq: 7,
    flash: 0,
  };
}
const rnd = (o) => {
  o.seq = (Math.imul(o.seq, 1664525) + 1013904223) >>> 0;
  return o.seq / 4294967296;
};
const alivePlats = (o) => o.plats.map((p, i) => (p.alive && !p.breaking ? i : -1)).filter((i) => i >= 0);
/** Plateforme sous (ou la plus proche de) la case du corps. */
function platformUnder(o, b) {
  const cx = b.x + b.w / 2,
    foot = b.y + b.h;
  let best = -1,
    bd = Infinity;
  o.plats.forEach((p, i) => {
    if (!p.alive) return;
    const r = platformRect(p);
    const dx = cx < r.x ? r.x - cx : cx > r.x + r.w ? cx - r.x - r.w : 0,
      dy = Math.abs(foot - r.y);
    const d = dx * 2 + dy;
    if (d < bd) {
      bd = d;
      best = i;
    }
  });
  return best;
}
function dropPlatform(o, p) {
  const r = platformRect(p);
  for (let c = p.c0; c <= p.c1; c++) runtime.grid[p.r][c] = '.';
  for (let k = 0; k < 6; k++)
    o.debris.push({ x: r.x + (r.w * (k + 0.5)) / 6, y: r.y, vy: 40 + k * 15, vx: (k - 2.5) * 22, t: 1.2 });
  p.alive = false;
  playSfx('break');
  gameState.shake = Math.max(gameState.shake, 0.3);
}
function startVolley(e, o) {
  const B = runtime.level.boss,
    n = Math.min(tentaclesFor(e.hp, B.hp), alivePlats(o).length);
  const chosen = [];
  // première cible : la plateforme du héros ; les autres au hasard parmi celles qui restent
  const first = platformUnder(o, runtime.player);
  if (first >= 0 && !o.plats[first].breaking) chosen.push(first);
  const pool = alivePlats(o).filter((i) => !chosen.includes(i));
  while (chosen.length < n && pool.length) chosen.push(pool.splice(Math.floor(rnd(o) * pool.length), 1)[0]);
  for (const p of chosen) o.tents.push({ p, st: 'tele', t: OCTOPUS_TELE_TIME, y: 0 });
}
function impact(e, o, tent) {
  const p = o.plats[tent.p],
    r = platformRect(p);
  p.hits++;
  p.shake = 0.35;
  gameState.shake = Math.max(gameState.shake, 0.22);
  playSfx('land');
  // le héros sur la plateforme (ou juste au-dessus) prend un cœur
  const zone = { x: r.x, y: r.y - 64, w: r.w, h: 70 };
  for (const b of runtime.echoClone ? [runtime.player, runtime.echoClone] : [runtime.player]) {
    if (b === runtime.player && overlaps(b, zone) && gameState.invulnerableTimer <= 0)
      hurtPlayer(1, false, r.x + r.w / 2);
    else if (b === runtime.echoClone && overlaps(b, zone)) b.inv = b.inv || 0;
  }
  if (p.hits >= OCTOPUS_HITS_TO_BREAK) {
    p.breaking = true;
    p.shake = BREAK_SHAKE;
  }
}
export function octopusAI(e, dt) {
  if (!e.oct) init(e);
  const o = e.oct;
  o.flash = Math.max(0, o.flash - dt);
  e.inv = 9; // seules les tentacules se frappent
  // plateformes qui se fissurent puis s'effondrent
  for (const p of o.plats) {
    if (!p.alive) continue;
    p.shake = Math.max(0, p.shake - dt);
    if (p.breaking && p.shake <= 0) {
      dropPlatform(o, p);
      o.tents = o.tents.filter((t) => o.plats[t.p].alive);
    }
  }
  for (const d of o.debris) {
    d.vy += 900 * dt;
    d.y += d.vy * dt;
    d.x += d.vx * dt;
    d.t -= dt;
  }
  o.debris = o.debris.filter((d) => d.t > 0);
  // tentacules
  for (const t of o.tents) {
    t.t -= dt;
    if (t.st === 'tele' && t.t <= 0) {
      t.st = 'fall';
      t.t = OCTOPUS_FALL_TIME;
    } else if (t.st === 'fall' && t.t <= 0) {
      impact(e, o, t);
      t.st = 'stuck';
      t.t = OCTOPUS_STUCK_TIME;
    } else if (t.st === 'stuck' && t.t <= 0) {
      t.st = 'retract';
      t.t = OCTOPUS_RETRACT_TIME;
    }
  }
  o.tents = o.tents.filter((t) => t.st !== 'retract' || t.t > 0);
  if (!o.tents.length) {
    o.cd -= dt;
    if (o.cd <= 0 && alivePlats(o).length) {
      startVolley(e, o);
      o.cd = VOLLEY_PAUSE;
    }
  }
  // le héros : dernière plateforme sûre, chute à l'eau
  const P = runtime.player;
  if (P.g) {
    const i = platformUnder(o, P);
    if (i >= 0 && Math.abs(P.y + P.h - platformRect(o.plats[i]).y) < 2) o.safe = i;
  }
  if (P.y + P.h > waterTop() + WATER_MARGIN && gameState.mode === 'play') {
    const wasFatal = gameState.hp + gameState.shieldHearts <= 1 + 1e-6;
    if (gameState.invulnerableTimer <= 0) hurtPlayer(1, false, P.x + P.w / 2);
    if (gameState.mode === 'play' && !wasFatal) {
      let i = o.safe;
      if (!o.plats[i] || !o.plats[i].alive)
        i = platformUnder(o, { x: P.x, w: P.w, y: waterTop() - PLAYER_H, h: PLAYER_H });
      if (i < 0 || !o.plats[i]) {
        // plus aucune plateforme : retour au départ de la salle
        P.x = runtime.spawnPoint.x;
        P.y = runtime.spawnPoint.y;
      } else {
        const r = platformRect(o.plats[i]);
        P.x = r.x + r.w / 2 - P.w / 2;
        P.y = r.y - P.h - 1;
      }
      P.vx = 0;
      P.vy = 0;
      P.g = false;
    }
  }
  // un clone qui tombe à l'eau disparaît (sans blesser l'original)
  const C = runtime.echoClone;
  if (C && C.y + C.h > waterTop() + WATER_MARGIN) runtime.echoClone = null;
}
/** Coup de poing : touche-t-il une tentacule plantée ? Renvoie true (et la fait se retirer) si oui. */
export function octopusPunch(e, box) {
  const o = e.oct;
  if (!o) return false;
  for (const t of o.tents) {
    if (t.st !== 'stuck' || !overlaps(box, tentacleRect(o.plats[t.p]))) continue;
    t.st = 'retract';
    t.t = OCTOPUS_RETRACT_TIME;
    o.flash = 0.4;
    return true;
  }
  return false;
}
