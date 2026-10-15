// La Pieuvre : tête au milieu du bassin, tentacules décoratives, tentacules qui s'abattent sur les plateformes
// (marque d'impact, chute, tentacule plantée à frapper), fissures des plateformes, débris et eau.
import { runtime } from '../state/runtime.ts';
import { TILE } from '../core/config.ts';
import { ctx } from '../core/canvas.ts';
import { gameState } from '../state/state.ts';
import { SPRITES, isSpriteReady } from './sprites.js';
import { INK_COLOR } from './primitives.js';
import {
  OCTOPUS_FALL_TIME,
  OCTOPUS_HITS_TO_BREAK,
  OCTOPUS_RETRACT_TIME,
  OCTOPUS_STUCK_TIME,
  OCTOPUS_TELE_TIME,
  platformRect,
  waterTop,
} from '../game/octopus.js';

const KEYS = [
  'octopus-head',
  'octopus-head-hurt',
  'octopus-head-fury',
  'octopus-long',
  'octopus-curl-a',
  'octopus-curl-b',
  'octopus-curl-c',
  'octopus-s',
];

/** Sprite posé par le bas-centre (cx, by), de hauteur h, retourné si flip. */
function put(key, cx, by, h, rot = 0, flip = false, sy = 1) {
  const im = SPRITES[key],
    w = (h * im.naturalWidth) / im.naturalHeight;
  ctx.save();
  ctx.translate(cx, by);
  ctx.rotate(rot);
  ctx.scale(flip ? -1 : 1, sy);
  ctx.drawImage(im, -w / 2, -h, w, h);
  ctx.restore();
}
function drawCracks(p) {
  const r = platformRect(p);
  const dx = p.shake > 0 ? Math.sin(gameState.time * 90) * 1.5 : 0;
  if (p.hits <= 0 && !p.breaking) return;
  ctx.save();
  ctx.translate(dx, 0);
  ctx.strokeStyle = INK_COLOR;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const marks = Math.min(p.hits, OCTOPUS_HITS_TO_BREAK);
  for (let k = 0; k < marks; k++) {
    const x = r.x + ((k + 0.5) * r.w) / Math.max(1, OCTOPUS_HITS_TO_BREAK);
    ctx.beginPath();
    ctx.moveTo(x - 4, r.y + 3);
    ctx.lineTo(x + 3, r.y + 12);
    ctx.lineTo(x - 3, r.y + 20);
    ctx.lineTo(x + 5, r.y + TILE - 3);
    ctx.stroke();
  }
  if (p.breaking) {
    ctx.fillStyle = 'rgba(208,64,46,.28)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
  }
  ctx.restore();
}
/** Point d'une courbe de Bézier quadratique. */
const bez = (a, c, b, u) => ({
  x: (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * c.x + u * u * b.x,
  y: (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * c.y + u * u * b.y,
});
/**
 * Tentacule accrochée au corps : le sprite de la longue tentacule est découpé en tranches posées le long de la courbe
 * `a` (flanc de la tête) → `c` → `b` (pointe) ; `len` (0..1) = part du trajet couverte (rétractation).
 */
function strokeTentacle(a, c, b, len = 1, thickness = 30, wave = null) {
  const im = SPRITES['octopus-long'],
    N = 30,
    sw = im.naturalWidth / N,
    left = b.x < a.x,
    time = gameState.time;
  // points de la courbe, avec une ondulation qui grandit vers la pointe (la base reste accrochée au corps)
  const P = [];
  for (let k = 0; k <= N; k++) {
    const u = (k / N) * len,
      p = bez(a, c, b, u),
      q = bez(a, c, b, Math.min(1, u + 0.01)),
      r = bez(a, c, b, Math.max(0, u - 0.01)),
      dx = q.x - r.x,
      dy = q.y - r.y,
      n = Math.hypot(dx, dy) || 1,
      off = wave ? wave.amp * (k / N) * Math.sin((k / N) * wave.freq * Math.PI * 2 - time * wave.speed) : 0;
    P.push({ x: p.x - (dy / n) * off, y: p.y + (dx / n) * off });
  }
  for (let k = 0; k < N; k++) {
    const p0 = P[k],
      p1 = P[k + 1],
      dx = p1.x - p0.x,
      dy = p1.y - p0.y,
      L = Math.hypot(dx, dy) || 0.01;
    ctx.save();
    ctx.translate(p0.x, p0.y);
    ctx.rotate(Math.atan2(dy, dx));
    if (left) ctx.scale(1, -1); // les ventouses restent sous la tentacule
    ctx.drawImage(im, k * sw, 0, sw + 0.6, im.naturalHeight, 0, -thickness * 0.5, L + 1, thickness);
    ctx.restore();
  }
}
/** Éclat d'impact : couronne de pointes crème, cercle de poussière et petits nuages qui s'écartent. */
function drawImpact(cx, y, u) {
  // u : 0 (choc) → 1 (fini)
  const R = 14 + 34 * u,
    a = 1 - u;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK_COLOR;
  ctx.fillStyle = '#F6EBCB';
  ctx.lineWidth = 3;
  ctx.beginPath();
  const spikes = 10;
  for (let k = 0; k < spikes * 2; k++) {
    const ang = Math.PI + (k / (spikes * 2)) * Math.PI,
      rr = k % 2 ? R * 0.55 : R;
    const px = cx + Math.cos(ang) * rr * 1.5,
      py = y + Math.sin(ang) * rr * 0.9;
    if (k) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  for (const side of [-1, 1]) {
    const px = cx + side * (18 + 40 * u),
      py = y - 6 - 8 * u;
    ctx.beginPath();
    ctx.arc(px, py, 7 + 5 * u, 0, 7);
    ctx.arc(px + side * 7, py + 3, 5 + 4 * u, 0, 7);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}
function drawTentacle(e, o, t, idx) {
  const p = o.plats[t.p],
    r = platformRect(p),
    cx = r.x + r.w / 2,
    top = r.y,
    time = gameState.time,
    hx = e.x + e.w / 2,
    wy = waterTop();
  // attache sur le flanc de la tête : gauche, droite ou haut selon la tentacule
  const dir = idx % 3 === 0 ? (cx < hx ? -1 : 1) : idx % 3 === 1 ? (cx < hx ? 1 : -1) : 0;
  // attache sous la tête, à la ligne d'eau : la base est cachée derrière la tête et sous la surface
  const a = { x: hx + dir * 34, y: wy + 6 };
  const reach = Math.abs(cx - a.x);
  if (t.st === 'tele') {
    // la tentacule se dresse au-dessus de la plateforme visée (pointe qui tremble) ; la cible est marquée au sol
    const u = 1 - t.t / OCTOPUS_TELE_TIME,
      pulse = 0.55 + 0.45 * Math.sin(time * 18);
    ctx.save();
    ctx.globalAlpha = 0.25 + 0.5 * u;
    ctx.fillStyle = '#D0402E';
    ctx.fillRect(r.x + 2, top - 4, r.w - 4, 6);
    ctx.globalAlpha = 0.45 + 0.4 * pulse;
    ctx.strokeStyle = '#D0402E';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(cx, top - 2, r.w / 2 - 2, 9, 0, 0, 7);
    ctx.stroke();
    ctx.fillStyle = '#D0402E';
    for (let k = 0; k < 3; k++) {
      const ay = top - 30 - ((time * 90 + k * 22) % 66);
      ctx.beginPath();
      ctx.moveTo(cx - 9, ay);
      ctx.lineTo(cx + 9, ay);
      ctx.lineTo(cx, ay + 12);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    // elle se dresse et gigote de plus en plus, puis se ramasse en arrière juste avant de frapper
    const windup = Math.max(0, (u - 0.82) / 0.18),
      hover = { x: cx - dir * 22 * windup, y: top - 150 - 40 * windup - 22 * (1 - u) };
    const c = { x: (a.x + hover.x) / 2 - dir * 30, y: Math.min(a.y, hover.y) - 70 - reach * 0.18 };
    strokeTentacle(a, c, hover, 0.5 + 0.5 * Math.min(1, u * 2.2), 30, {
      amp: (10 + 26 * u) * (1 - 0.7 * windup),
      freq: 2.4,
      speed: 11 + 6 * u,
    });
    return;
  }
  let tip = { x: cx, y: top };
  let len = 1;
  if (t.st === 'fall') {
    const f = t.t / OCTOPUS_FALL_TIME; // 1 → 0 : de la position dressée vers la plateforme
    tip = { x: cx, y: top - 150 * f * f };
  }
  if (t.st === 'retract') len = Math.max(0.05, t.t / OCTOPUS_RETRACT_TIME);
  const sway = t.st === 'stuck' ? Math.sin(time * 7 + t.p) * 2.5 : 0;
  tip.x += sway;
  const c = {
    x: (a.x + tip.x) / 2 - dir * 30,
    y: Math.min(a.y, tip.y) - 40 - reach * 0.15 + (t.st === 'stuck' ? 0 : 0),
  };
  if (t.st === 'stuck') {
    // cible à frapper : halo + barre du temps restant, au niveau de la pointe
    ctx.save();
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(time * 14);
    ctx.fillStyle = '#F6D56A';
    ctx.beginPath();
    ctx.ellipse(cx, top - 26, 26, 30, 0, 0, 7);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = INK_COLOR;
    ctx.fillRect(cx - 17, top - 66, 34, 7);
    ctx.fillStyle = '#F6D56A';
    ctx.fillRect(cx - 15, top - 64, 30 * Math.max(0, t.t / OCTOPUS_STUCK_TIME), 3);
  }
  strokeTentacle(a, c, tip, len, 30, t.st === 'stuck' ? { amp: 4, freq: 1.6, speed: 5 } : null);
  if (t.st === 'stuck' && t.t > OCTOPUS_STUCK_TIME - 0.35)
    drawImpact(cx, top - 2, 1 - (t.t - (OCTOPUS_STUCK_TIME - 0.35)) / 0.35);
}
export function drawOctopus(entity) {
  const o = entity.oct;
  if (!KEYS.every(isSpriteReady) || !o) return;
  const cx = entity.x + entity.w / 2,
    wy = waterTop(),
    t = gameState.time,
    hurt = o.flash > 0;
  // plateformes fissurées et débris
  for (const p of o.plats) if (p.alive) drawCracks(p);
  ctx.fillStyle = '#51424A';
  for (const d of o.debris) {
    ctx.globalAlpha = Math.min(1, d.t);
    ctx.fillRect(d.x - 6, d.y, 12, 10);
  }
  ctx.globalAlpha = 1;
  // tentacules décoratives qui ondulent autour de la tête
  put('octopus-curl-a', cx - 84, wy + 16, 44, Math.sin(t * 1.9) * 0.1);
  put('octopus-curl-b', cx + 86, wy + 16, 42, Math.sin(t * 1.6 + 1.3) * 0.1, true);
  put('octopus-s', cx + 118, wy + 14, 50, Math.sin(t * 1.3 + 2) * 0.06);
  // tentacules qui frappent : dessinées DERRIÈRE la tête, leur base part de dessous
  o.tents.forEach((tt, k) => drawTentacle(entity, o, tt, k));
  // tête, à moitié immergée : touchée → yeux en croix et tremblement, sous 30 % de vie → furieuse
  const bob = Math.sin(t * 2.2) * 3,
    shake = hurt ? Math.sin(t * 70) * 3 : 0,
    fury = entity.hp / runtime.level.boss.hp <= 0.3;
  put(
    hurt ? 'octopus-head-hurt' : fury ? 'octopus-head-fury' : 'octopus-head',
    cx + shake,
    wy + 30 + bob,
    entity.h + 16,
  );
}
