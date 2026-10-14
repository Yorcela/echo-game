import { runtime } from '../state/runtime.js';
import { HERO_BASE_H, HERO_BASE_W } from '../core/config.js';
import { ctx } from '../core/canvas.js';
import { gameState } from '../state/state.js';
import { SPRITES } from './sprites.js';
import { INK_COLOR, roundRectPath } from './primitives.js';
/* le héros : petit fantôme en salopette de jean (cartoon 1930) */
export function drawHero(b, o = {}) {
  const k = b.h / HERO_BASE_H,
    sy = b.lad ? 1 : 1 + Math.min(0.28, Math.abs(b.vy) / 1800),
    sx = 1 / sy,
    cx = b.x + b.w / 2,
    by = b.y + b.h,
    f = b.face || 1,
    t = gameState.time,
    lad = !!b.lad,
    cq = b.y * 0.08;
  const jean = o.jean || '#3F6296',
    cuff = o.cuff || '#9DBBE0',
    tie = o.tie || '#D0402E',
    body = o.body || '#FBF6E6';
  const run = Math.abs(b.vx) > 20 && b.g,
    air = !b.g,
    up = air && b.vy < 0,
    ph = t * 21 + (o.ph || 0),
    hit = b.hit > 0;
  const lw = 2.5 / Math.sqrt(k);
  ctx.save();
  ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
  ctx.translate(cx, by);
  ctx.scale(f * k * 1.08 * sx, k * 1.08 * sy);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK_COLOR;
  const bob = run ? -Math.abs(Math.sin(ph)) * 2.4 : air ? 0 : Math.sin(t * 3) * 0.7;
  ctx.translate(lad ? Math.sin(cq) * 1.1 : 0, lad ? -Math.abs(Math.sin(cq)) * 1.2 : bob);
  const pivot = -14;
  let lean = run ? 0.13 : hit ? 0.42 : up ? -0.05 : 0;
  if (b.djfx > 0) lean += ((0.25 - b.djfx) / 0.25) * Math.PI * 2;
  ctx.translate(0, pivot);
  ctx.rotate(lean);
  ctx.translate(0, -pivot);
  /* forme « fantôme-drap » pendant l'éclair */
  if (b.dash > 0) {
    const w = Math.sin(t * 34) * 2.2;
    ctx.beginPath();
    ctx.moveTo(-30, -9);
    ctx.quadraticCurveTo(-16, -33, 6, -29);
    ctx.arc(6, -17, 12, -Math.PI / 2, Math.PI / 2);
    ctx.quadraticCurveTo(-3, -3 + w, -11, -8 - w);
    ctx.quadraticCurveTo(-19, -2 + w, -24, -8 - w);
    ctx.quadraticCurveTo(-28, -4 + w, -30, -9);
    ctx.closePath();
    ctx.fillStyle = body;
    ctx.fill();
    ctx.lineWidth = lw;
    ctx.stroke();
    ctx.fillStyle = '#1B1612';
    for (const ex of [3, 11]) {
      ctx.beginPath();
      ctx.ellipse(ex, -19, 2.2, 3.4, 0, 0, 7);
      ctx.fill();
    }
    ctx.fillStyle = '#fff';
    for (const ex of [2.4, 10.4]) {
      ctx.beginPath();
      ctx.arc(ex, -20.4, 0.9, 0, 7);
      ctx.fill();
    }
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(7, -14.5);
    ctx.quadraticCurveTo(3, -12.5, -1, -15);
    ctx.moveTo(7, -14.5);
    ctx.quadraticCurveTo(11, -12.5, 15, -15);
    ctx.stroke();
    ctx.fillStyle = jean;
    roundRectPath(-8, -10, 10, 5, 2);
    ctx.fill();
    ctx.lineWidth = lw * 0.7;
    ctx.stroke();
    ctx.restore();
    return;
  }
  /* jambes */
  const sw = run ? Math.sin(ph) * 6.5 : 0;
  let L = [
      [-4, -3 + (run ? Math.max(0, -Math.cos(ph)) * -3 : 0)],
      [4, -3 + (run ? Math.max(0, Math.cos(ph)) * -3 : 0)],
    ],
    lx = [-4 - sw, 4 + sw];
  if (lad) {
    L = [
      [-3.5, -3 - Math.max(0, Math.sin(cq)) * 8],
      [3.5, -3 - Math.max(0, -Math.sin(cq)) * 8],
    ];
    lx = [-3.5, 3.5];
  } else if (up) {
    L = [
      [-3, -9],
      [5.5, -6],
    ];
    lx = [-3, 6];
  } else if (air) {
    const s = Math.sin(t * 14) * 1.5;
    L = [
      [-5 + s, -3],
      [5 - s, -4],
    ];
    lx = [-5 + s, 5 - s];
  }
  const legs = [0, 1].map((i) => ({
    hx: i ? 4 : -4,
    ax: lx[i],
    ay: (run || !air) && !up ? L[i][1] : L[i][1],
  }));
  for (const g of legs) {
    ctx.lineWidth = lw + 6.2;
    ctx.beginPath();
    ctx.moveTo(g.hx, -12);
    ctx.lineTo(g.ax, g.ay - 3);
    ctx.stroke();
    ctx.strokeStyle = jean;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(g.hx, -12);
    ctx.lineTo(g.ax, g.ay - 3);
    ctx.stroke();
    ctx.strokeStyle = INK_COLOR;
    ctx.fillStyle = cuff;
    ctx.beginPath();
    ctx.ellipse(g.ax, g.ay - 3.4, 3.9, 2.1, 0, 0, 7);
    ctx.fill();
    ctx.lineWidth = lw * 0.7;
    ctx.stroke();
    ctx.fillStyle = '#1B1612';
    ctx.beginPath();
    ctx.ellipse(g.ax + 1.8, g.ay - 0.6, 5.2, 2.7, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.beginPath();
    ctx.ellipse(g.ax + 2.6, g.ay - 1.6, 1.8, 0.8, 0, 0, 7);
    ctx.fill();
  }
  /* bras du fond */
  const arm = (side, front) => {
    const sh = [side * 8.5, -18];
    let hx, hy;
    if (lad) {
      const a = Math.sin(cq + (side > 0 ? 0 : Math.PI));
      hx = side * 7.8;
      hy = -30 - a * 6.5;
    } else if (up) {
      hx = side * 11;
      hy = -28;
    } else if (air) {
      hx = side * 14.5;
      hy = -19.5 + Math.sin(t * 12 + side) * 1.2;
    } else if (run) {
      const a = Math.sin(ph + (side > 0 ? 0 : Math.PI)) * 0.95;
      hx = side * 5 + a * 10;
      hy = -14 + Math.abs(a) * -2;
    } else if (side > 0 && t % 6 < 1.1) {
      hx = 13 + Math.sin(t * 16) * 2;
      hy = -29;
    } else {
      hx = side * 12.5;
      hy = -12.5 + Math.sin(t * 3 + side) * 0.5;
    }
    if (hit) {
      hx = side * -8;
      hy = -14;
    }
    ctx.lineWidth = lw + 1.4;
    ctx.beginPath();
    ctx.moveTo(sh[0], sh[1]);
    ctx.quadraticCurveTo((sh[0] + hx) / 2 + side * 2, (sh[1] + hy) / 2 + 2, hx, hy);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(hx, hy, 3.4, 0, 7);
    ctx.fill();
    ctx.lineWidth = lw * 0.8;
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(hx - 1, hy + 0.6);
    ctx.lineTo(hx + 1.4, hy + 2);
    ctx.stroke();
  };
  arm(-1);
  /* corps de fantôme */
  ctx.beginPath();
  ctx.moveTo(-10.5, -12);
  ctx.lineTo(-10.5, -26);
  ctx.arc(0, -26, 10.5, Math.PI, 0);
  ctx.lineTo(10.5, -12);
  ctx.quadraticCurveTo(0, -9, -10.5, -12);
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();
  ctx.lineWidth = lw;
  ctx.stroke();
  ctx.fillStyle = 'rgba(120,110,90,.16)';
  ctx.beginPath();
  ctx.ellipse(6, -22, 3, 9, 0, 0, 7);
  ctx.fill();
  /* salopette */
  ctx.beginPath();
  ctx.moveTo(-10, -19);
  ctx.lineTo(10, -19);
  ctx.lineTo(10.5, -12);
  ctx.quadraticCurveTo(0, -9, -10.5, -12);
  ctx.closePath();
  ctx.fillStyle = jean;
  ctx.fill();
  ctx.lineWidth = lw;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.18)';
  ctx.fillRect(-8, -17.5, 3, 5);
  ctx.beginPath();
  ctx.moveTo(-6.5, -19);
  ctx.lineTo(-8.2, -25.5);
  ctx.moveTo(6.5, -19);
  ctx.lineTo(8.2, -25.5);
  ctx.lineWidth = 2.6;
  ctx.stroke();
  ctx.strokeStyle = jean;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-6.5, -19);
  ctx.lineTo(-8.2, -25.5);
  ctx.moveTo(6.5, -19);
  ctx.lineTo(8.2, -25.5);
  ctx.stroke();
  ctx.strokeStyle = INK_COLOR;
  ctx.fillStyle = '#F2D27A';
  for (const bx of [-6.5, 6.5]) {
    ctx.beginPath();
    ctx.arc(bx, -19, 1.3, 0, 7);
    ctx.fill();
  }
  ctx.lineWidth = 1.1;
  roundRectPath(-3.2, -17, 6.4, 3.6, 1);
  ctx.stroke();
  /* visage */
  const lk = Math.max(-1, Math.min(1, b.vx / 220)) * 1.3,
    ly = lad ? -0.9 : Math.max(-1, Math.min(1.4, b.vy / 380)),
    blink = t % 3.4 < 0.12;
  for (const ex of [-3.6, 4]) {
    const X = ex + 1.2;
    if (blink) {
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(X - 2, -28);
      ctx.lineTo(X + 2, -28);
      ctx.stroke();
      continue;
    }
    ctx.fillStyle = '#1B1612';
    ctx.beginPath();
    ctx.ellipse(X + lk * 0.5, -28 + ly * 0.5, 2.5, 3.7, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(X + lk * 0.5 - 0.7, -29.4 + ly * 0.5, 0.95, 0, 7);
    ctx.fill();
  }
  ctx.strokeStyle = INK_COLOR;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(1.2, -23.6);
  ctx.quadraticCurveTo(-3, -21, -7, -23.8);
  ctx.moveTo(1.2, -23.6);
  ctx.quadraticCurveTo(5.5, -21, 9, -23.8);
  ctx.stroke();
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-7, -23.8);
  ctx.quadraticCurveTo(-8.6, -25.2, -7.2, -26);
  ctx.moveTo(9, -23.8);
  ctx.quadraticCurveTo(10.6, -25.2, 9.2, -26);
  ctx.stroke();
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(0, -35.6);
  ctx.quadraticCurveTo(-2.5, -40, -5, -38.5);
  ctx.stroke();
  /* nœud papillon */
  ctx.fillStyle = tie;
  ctx.lineWidth = lw * 0.7;
  ctx.beginPath();
  ctx.moveTo(1.2, -19.2);
  ctx.lineTo(-4.8, -21.6);
  ctx.lineTo(-4.8, -16.8);
  ctx.closePath();
  ctx.moveTo(1.2, -19.2);
  ctx.lineTo(7.2, -21.6);
  ctx.lineTo(7.2, -16.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(1.2, -19.2, 1.4, 0, 7);
  ctx.fill();
  ctx.stroke();
  arm(1);
  ctx.restore();
  if (o.clone) {
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = o.col || jean;
    ctx.lineWidth = 2;
    ctx.restore();
    if (b.ttl < Infinity) {
      ctx.fillStyle = INK_COLOR;
      ctx.fillRect(b.x - 4, b.y - 14, b.w + 8, 5);
      ctx.fillStyle = o.col || jean;
      ctx.fillRect(b.x - 3, b.y - 13, (b.w + 6) * Math.max(0, b.ttl / 8), 3);
    }
  }
}
export function drawChar(body, col, alpha, clone) {
  const k = body.h / HERO_BASE_H,
    sy = 1 + Math.min(0.28, Math.abs(body.vy) / 1800),
    sx = 1 / sy,
    cx = body.x + body.w / 2,
    by = body.y + body.h,
    run = Math.abs(body.vx) > 20 && body.g;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, by);
  ctx.scale(k * sx * (1 + (run ? Math.sin(gameState.time * 22) * 0.04 : 0)), k * sy);
  const leg = run ? Math.sin(gameState.time * 24) * 5 : 0,
    lw = 4 / Math.sqrt(k);
  ctx.strokeStyle = INK_COLOR;
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-5, -4);
  ctx.lineTo(-5 + leg, 0);
  ctx.moveTo(5, -4);
  ctx.lineTo(5 - leg, 0);
  ctx.stroke();
  roundRectPath(-HERO_BASE_W / 2 - 3, -HERO_BASE_H, HERO_BASE_W + 6, HERO_BASE_H - 3, 11);
  ctx.fillStyle = col;
  ctx.fill();
  ctx.lineWidth = lw * 0.9;
  ctx.stroke();
  ctx.fillStyle = 'rgba(246,235,203,.35)';
  roundRectPath(-HERO_BASE_W / 2, -HERO_BASE_H + 4, 6, 10, 3);
  ctx.fill();
  const f = body.face;
  ctx.fillStyle = '#F6EBCB';
  for (const ex of [-4, 6]) {
    ctx.beginPath();
    ctx.ellipse(ex + f * 1.5, -HERO_BASE_H + 11, 5, 6.5, 0, 0, 7);
    ctx.fill();
    ctx.lineWidth = lw * 0.65;
    ctx.stroke();
    ctx.fillStyle = INK_COLOR;
    ctx.beginPath();
    ctx.arc(ex + f * 3.4, -HERO_BASE_H + 11.5 + Math.max(-1.5, Math.min(2, body.vy / 300)), 2.4, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#F6EBCB';
  }
  ctx.beginPath();
  ctx.moveTo(-4 + f * 2, -HERO_BASE_H + 21);
  ctx.quadraticCurveTo(1 + f * 2, -HERO_BASE_H + 24, 6 + f * 2, -HERO_BASE_H + 21);
  ctx.lineWidth = lw * 0.65;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -HERO_BASE_H + 1);
  ctx.quadraticCurveTo(-4 * f, -HERO_BASE_H - 8, -8 * f, -HERO_BASE_H - 6);
  ctx.lineWidth = lw * 0.8;
  ctx.stroke();
  ctx.restore();
  if (clone) {
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.restore();
    if (body.ttl < Infinity) {
      ctx.fillStyle = INK_COLOR;
      ctx.fillRect(body.x - 4, body.y - 14, body.w + 8, 5);
      ctx.fillStyle = col;
      ctx.fillRect(body.x - 3, body.y - 13, (body.w + 6) * Math.max(0, body.ttl / 8), 3);
    }
  }
}
export function starPath(cx, cy, R, r, rot) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rot + (i * Math.PI) / 5,
      q = i % 2 ? r : R;
    ctx.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q);
  }
  ctx.closePath();
}
export function drawWalker(entity) {
  const cx = entity.x + entity.w / 2,
    by = entity.y + entity.h,
    t = gameState.time;
  ctx.save();
  ctx.translate(cx, by);
  ctx.scale(entity.dir, 1);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = INK_COLOR;
  if (entity.inv > 0 && entity.t === 'r' && Math.floor(t * 30) % 2) {
    ctx.globalAlpha = 0.55;
  }
  if (entity.t === 'c') drawCrab(entity, t);
  else if (entity.t === 'r') drawRebel(entity, t);
  else drawSpook(entity, t);
  ctx.restore();
}
const METAL = '#A9B4B6',
  METAL_D = '#6F7C80';
function drawCrab(entity, t) {
  const ph = t * 26 + entity.x * 0.07;
  ctx.lineWidth = 2.6;
  for (const s of [-1, 1])
    for (let i = 0; i < 3; i++) {
      const sw = Math.sin(ph + i * 2 + (s > 0 ? Math.PI : 0)),
        x0 = s * 10,
        y0 = -9 + i * 1.5,
        kx = s * (16 + i * 3),
        ky = -14 + i * 1.5 - Math.max(0, sw) * 3,
        fx = s * (19 + i * 3.4 + sw * 2),
        fy = -Math.max(0, sw) * 2.5;
      ctx.strokeStyle = INK_COLOR;
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(kx, ky);
      ctx.lineTo(fx, fy);
      ctx.stroke();
      ctx.strokeStyle = '#6C9CA8';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(kx, ky);
      ctx.lineTo(fx, fy);
      ctx.stroke();
      ctx.fillStyle = '#8DB7C2';
      ctx.beginPath();
      ctx.arc(kx, ky, 1.7, 0, 7);
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = INK_COLOR;
      ctx.stroke();
    }
  ctx.strokeStyle = INK_COLOR;
  const sn = Math.sin(t * 9 + entity.x) * 0.14;
  for (const s of [-1, 1]) {
    const ax = s * 13,
      ay = -19,
      jx = s * 21,
      jy = -27,
      cx2 = s * 19,
      cy2 = -35;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(jx, jy);
    ctx.lineTo(cx2, cy2 + 6);
    ctx.stroke();
    ctx.strokeStyle = '#6C9CA8';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(jx, jy);
    ctx.lineTo(cx2, cy2 + 6);
    ctx.stroke();
    ctx.strokeStyle = INK_COLOR;
    ctx.save();
    ctx.translate(cx2, cy2);
    ctx.rotate(s * (0.35 + sn));
    ctx.fillStyle = '#6C9CA8';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-4.5, 7);
    ctx.quadraticCurveTo(-8, -4, -2, -11);
    ctx.quadraticCurveTo(0, -5, 1, 0);
    ctx.quadraticCurveTo(2, -6, 6, -9);
    ctx.quadraticCurveTo(9, 0, 4.5, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  /* casserole */
  ctx.fillStyle = METAL;
  ctx.lineWidth = 2.8;
  roundRectPath(-12, -22, 24, 14, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.4)';
  roundRectPath(-9.5, -20, 3, 9, 1.5);
  ctx.fill();
  ctx.lineWidth = 2.4;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(s * 12.5, -16, 3, s > 0 ? -1.4 : Math.PI - 1.7, s > 0 ? 1.4 : Math.PI + 1.7);
    ctx.stroke();
  }
  ctx.fillStyle = METAL_D;
  ctx.beginPath();
  ctx.ellipse(0, -22, 12, 3.2, 0, 0, 7);
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.stroke();
  /* cheveux + algues */
  ctx.fillStyle = '#1B1612';
  ctx.beginPath();
  ctx.moveTo(-9, -22);
  ctx.quadraticCurveTo(-8, -31, 3, -29);
  ctx.quadraticCurveTo(10, -28, 9, -22);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#5C8A3C';
  ctx.lineWidth = 1.8;
  for (const [x, d] of [
    [-6, -1],
    [-1, 1],
    [5, -1],
  ]) {
    ctx.beginPath();
    ctx.moveTo(x, -23);
    ctx.quadraticCurveTo(x + d * 5, -29, x + d * 2, -33 + Math.sin(t * 6 + x) * 1);
    ctx.stroke();
  }
  ctx.strokeStyle = INK_COLOR;
  /* visage */
  ctx.fillStyle = '#fff';
  ctx.lineWidth = 1.8;
  for (const x of [-4.6, 4.6]) {
    ctx.beginPath();
    ctx.ellipse(x, -16.5, 3.4, 4.2, 0, 0, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = INK_COLOR;
    ctx.beginPath();
    ctx.arc(x + 1.2, -16, 1.6, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#fff';
  }
  ctx.fillStyle = '#8A2A22';
  ctx.beginPath();
  ctx.moveTo(-5, -11.4);
  ctx.quadraticCurveTo(0, -7.5, 5, -11.4);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.stroke();
}
function drawRebel(entity, t) {
  const sw = Math.sin(t * 6 + entity.x * 0.05),
    bob = Math.abs(sw) * -1.4;
  ctx.translate(0, bob);
  /* jambes métal + bottes */
  for (const s of [-1, 1]) {
    const l = s * sw * 2.5;
    ctx.fillStyle = METAL;
    ctx.lineWidth = 2.6;
    roundRectPath(s * 6 - 3.6 + l * 0.3, -19, 7.2, 14, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#2B2724';
    ctx.beginPath();
    ctx.moveTo(s * 6 - 5 + l, -7);
    ctx.lineTo(s * 6 + 4.5 + l, -7);
    ctx.lineTo(s * 6 + 9 + l, -1);
    ctx.lineTo(s * 6 + 9 + l, 1);
    ctx.lineTo(s * 6 - 6 + l, 1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  /* bras */
  for (const s of [-1, 1]) {
    const a = s * sw * 2.2;
    ctx.lineWidth = 7;
    ctx.strokeStyle = INK_COLOR;
    ctx.beginPath();
    ctx.moveTo(s * 12, -31);
    ctx.lineTo(s * 15, -22 + a);
    ctx.lineTo(s * 14, -14 + a);
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.strokeStyle = METAL;
    ctx.beginPath();
    ctx.moveTo(s * 12, -31);
    ctx.lineTo(s * 15, -22 + a);
    ctx.lineTo(s * 14, -14 + a);
    ctx.stroke();
    ctx.strokeStyle = INK_COLOR;
    ctx.fillStyle = '#fff';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(s * 14, -11 + a, 6, 0, 7);
    ctx.fill();
    ctx.stroke();
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(s * 14 - 3, -11 + a);
    ctx.lineTo(s * 14 + 3, -11 + a);
    ctx.moveTo(s * 14, -14 + a);
    ctx.lineTo(s * 14, -8 + a);
    ctx.stroke();
  }
  /* torse : chemise + gilet */
  ctx.fillStyle = '#7A7658';
  ctx.lineWidth = 2.6;
  roundRectPath(-11, -35, 22, 18, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#2B2724';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * 3, -35);
    ctx.lineTo(s * 12, -35);
    ctx.lineTo(s * 12.5, -20);
    ctx.lineTo(s * 10, -18);
    ctx.lineTo(s * 9, -21);
    ctx.lineTo(s * 6.5, -18);
    ctx.lineTo(s * 3.5, -24);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.strokeStyle = '#D6B74A';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(-4, -35);
  ctx.quadraticCurveTo(0, -26, 4, -35);
  ctx.stroke();
  ctx.strokeStyle = INK_COLOR;
  ctx.fillStyle = '#E2A93B';
  starPath(0, -28, 4.2, 1.9, -Math.PI / 2);
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.stroke();
  /* tête : boîte de conserve */
  ctx.fillStyle = METAL;
  ctx.lineWidth = 2.8;
  roundRectPath(-9.5, -48, 19, 15, 2.5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.42)';
  ctx.fillRect(-7.5, -46.5, 2.6, 12);
  ctx.strokeStyle = METAL_D;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-9.5, -44);
  ctx.lineTo(9.5, -44);
  ctx.moveTo(-9.5, -37);
  ctx.lineTo(9.5, -37);
  ctx.stroke();
  ctx.strokeStyle = INK_COLOR;
  ctx.fillStyle = '#fff';
  ctx.lineWidth = 1.8;
  for (const x of [-3.6, 3.8]) {
    ctx.beginPath();
    ctx.ellipse(x, -41, 2.9, 3.6, 0, 0, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = INK_COLOR;
    ctx.beginPath();
    ctx.arc(x + 1, -40.6, 1.4, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#fff';
  }
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-4, -36.2);
  ctx.quadraticCurveTo(0, -34.2, 5, -37.4);
  ctx.stroke();
  /* casquette + mèche */
  ctx.fillStyle = '#5E574A';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-10.5, -47);
  ctx.quadraticCurveTo(-2, -55, 10, -49);
  ctx.quadraticCurveTo(14, -48, 15, -46);
  ctx.lineTo(7, -46);
  ctx.lineTo(-10.5, -46);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#1B1612';
  ctx.beginPath();
  ctx.moveTo(-10.5, -46);
  ctx.quadraticCurveTo(-15, -44, -14, -39);
  ctx.quadraticCurveTo(-11, -42, -9.5, -42);
  ctx.closePath();
  ctx.fill();
}
function drawSpook(e, t) {
  const A = e.ph,
    w = Math.sin(A * 1.5);
  ctx.globalAlpha = 0.94;
  const gl = ctx.createRadialGradient(0, -18, 2, 0, -18, 26);
  gl.addColorStop(0, 'rgba(190,150,255,.45)');
  gl.addColorStop(1, 'rgba(190,150,255,0)');
  ctx.fillStyle = gl;
  ctx.beginPath();
  ctx.arc(0, -18, 26, 0, 7);
  ctx.fill();
  /* corps */
  ctx.beginPath();
  ctx.moveTo(-8.5, -20);
  ctx.quadraticCurveTo(-11, -30, 0, -33);
  ctx.quadraticCurveTo(11, -30, 8.5, -20);
  ctx.quadraticCurveTo(7, -9, 12 - w * 3, -4);
  ctx.quadraticCurveTo(22 - w * 5, 0, 26 - w * 4, -9 + w * 3);
  ctx.quadraticCurveTo(24 - w * 3, -3 + w * 2, 16, 2);
  ctx.quadraticCurveTo(0, 6, -6, -8);
  ctx.quadraticCurveTo(-8, -13, -8.5, -20);
  ctx.closePath();
  const gradient = ctx.createLinearGradient(0, -34, 0, 4);
  gradient.addColorStop(0, '#C8B4EE');
  gradient.addColorStop(1, '#8E74C6');
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.lineWidth = 2.6;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.35)';
  ctx.beginPath();
  ctx.ellipse(-4.5, -25, 2, 5, 0.2, 0, 7);
  ctx.fill();
  /* visage */
  ctx.fillStyle = '#fff';
  ctx.lineWidth = 1.6;
  for (const x of [-3.4, 4]) {
    ctx.beginPath();
    ctx.ellipse(x, -24.5, 2.7, 3.4, 0, 0, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = INK_COLOR;
    ctx.beginPath();
    ctx.arc(x + 1, -24.2, 1.4, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#fff';
  }
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-3.5, -19);
  ctx.quadraticCurveTo(0.5, -16, 5, -19);
  ctx.stroke();
  /* mains jointes */
  ctx.fillStyle = '#fff';
  ctx.lineWidth = 2;
  for (const [x, y] of [
    [-1.8, -13],
    [2.6, -14.2],
  ]) {
    ctx.beginPath();
    ctx.arc(x, y, 3.6, 0, 7);
    ctx.fill();
    ctx.stroke();
  }
  /* chapeau */
  ctx.fillStyle = '#7B2D4C';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-8, -34);
  ctx.quadraticCurveTo(-7, -45, 0, -45);
  ctx.quadraticCurveTo(7, -45, 8, -34);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-17, -32);
  ctx.quadraticCurveTo(-8, -38, 0, -35.5);
  ctx.quadraticCurveTo(9, -38, 17, -32);
  ctx.quadraticCurveTo(8, -30, 0, -30.5);
  ctx.quadraticCurveTo(-8, -30, -17, -32);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#A64A6E';
  ctx.beginPath();
  ctx.moveTo(-8, -36);
  ctx.quadraticCurveTo(0, -34.5, 8, -36);
  ctx.lineTo(8.4, -39);
  ctx.quadraticCurveTo(0, -37.5, -8.4, -39);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 1.4;
  ctx.stroke();
  /* étincelles */
  for (let i = 0; i < 3; i++) {
    const a = A * 0.9 + i * 2.1,
      sx = Math.cos(a) * 19,
      sy = -18 + Math.sin(a) * 13;
    ctx.fillStyle = i % 2 ? '#E9A8D6' : '#CDB8F5';
    starPath(sx, sy, 3.4, 1.5, a);
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
function drawSpritePart(i, sx, sy, sw, sh, k) {
  ctx.drawImage(i, sx, sy, sw, sh, sx * k, sy * k, sw * k, sh * k);
}
export function drawSpriteBoss(entity, alpha, tint) {
  let i = SPRITES[runtime.level.boss.kind];
  const hh = runtime.level.boss.sprH || 78,
    k = hh / i.naturalHeight,
    ww = i.naturalWidth * k,
    cx = entity.x + entity.w / 2,
    by = entity.y + entity.h + 3;
  const IW = i.naturalWidth,
    IH = i.naturalHeight,
    CUT = Math.round(IH * (runtime.level.boss.cut || 0.77)),
    MID = IW / 2;
  const run = entity.st === 'charge' && Math.abs(entity.vx) > 20,
    walking = run || (entity.st === 'idle' && Math.abs(entity.vx) > 8),
    sit = entity.st === 'stun';
  const ph = gameState.time * (run ? 19 : walking ? 9 : 0),
    LF = run ? 24 : 14,
    RT = run ? 0.5 : 0.22,
    LEAN = run ? (entity.dirc || entity.face) * 0.24 : entity.face * 0.04,
    BOB = run ? 7 : 4;
  for (let pass = 0; pass < (tint ? 2 : 1); pass++) {
    if (pass) {
      const kk = '_t' + tint[0];
      if (!SPRITES[kk] || SPRITES[kk].src !== SPRITES[runtime.level.boss.kind]) {
        const cv = document.createElement('canvas');
        cv.width = IW;
        cv.height = IH;
        const x = cv.getContext('2d');
        x.drawImage(SPRITES[runtime.level.boss.kind], 0, 0);
        x.globalCompositeOperation = 'source-atop';
        x.fillStyle = tint[0];
        x.fillRect(0, 0, IW, IH);
        cv.src = SPRITES[runtime.level.boss.kind];
        SPRITES[kk] = cv;
      }
      i = SPRITES[kk];
    }
    ctx.save();
    ctx.translate(cx, by);
    ctx.globalAlpha = pass ? alpha * tint[1] : alpha;
    ctx.translate(-ww / 2, -hh);
    const legW = (sx, sw, lift, rot, dx, dy) => {
      // jambe : pivot à la hanche
      ctx.save();
      const px = (sx + sw / 2) * k,
        py = CUT * k;
      ctx.translate(px + dx * k, py + dy * k);
      ctx.rotate(rot);
      ctx.translate(-px, -py);
      ctx.translate(0, -lift * k);
      drawSpritePart(i, sx, CUT, sw, IH - CUT, k);
      ctx.restore();
    };
    if (sit) {
      // assis : jambes écartées vers l'extérieur, corps posé au sol
      const drop = IH * 0.17;
      legW(0, MID, 0, 1.3, -16, drop - 24);
      legW(MID, IW - MID, 0, -1.3, 16, drop - 24);
      ctx.save();
      ctx.translate(0, drop * k);
      ctx.rotate(Math.sin(gameState.time * 5) * 0.04);
      ctx.translate(ww / 2, hh * 0.9);
      ctx.translate(-ww / 2, -hh * 0.9);
      drawSpritePart(i, 0, 0, IW, CUT + 6, k);
      ctx.restore();
    } else if (walking) {
      const sw1 = Math.sin(ph),
        sw2 = Math.sin(ph + Math.PI),
        bob = Math.abs(Math.sin(ph)) * BOB;
      legW(0, MID, Math.max(0, sw1) * LF, sw1 * RT, sw1 * -8, 0);
      legW(MID, IW - MID, Math.max(0, sw2) * LF, sw2 * RT, sw2 * -8, 0);
      ctx.save();
      ctx.translate(ww / 2, hh);
      ctx.rotate(Math.sin(ph) * (run ? 0.03 : 0.05) + LEAN);
      ctx.translate(-ww / 2, -hh - bob * 1.3);
      drawSpritePart(i, 0, 0, IW, CUT + 6, k);
      ctx.restore();
    } else {
      const bob = entity.st === 'idle' ? Math.sin(gameState.time * 3) * 1.3 : 0;
      ctx.translate(0, bob);
      drawSpritePart(i, 0, 0, IW, IH, k);
    }
    ctx.restore();
  }
}
export function getTintedSprite(key, col) {
  const k = '_t' + key + col,
    i = SPRITES[key];
  if (!SPRITES[k] || SPRITES[k].src !== i) {
    const cv = document.createElement('canvas');
    cv.width = i.naturalWidth;
    cv.height = i.naturalHeight;
    const x = cv.getContext('2d');
    x.drawImage(i, 0, 0);
    x.globalCompositeOperation = 'source-atop';
    x.fillStyle = col;
    x.fillRect(0, 0, cv.width, cv.height);
    cv.src = i;
    SPRITES[k] = cv;
  }
  return SPRITES[k];
}
// serpent : l'image est découpée en fines tranches verticales qui ondulent
export function drawWorm(entity, alpha, tint) {
  const B = runtime.level.boss,
    key = entity.join ? 'twin-joined' : entity.spr || 'twin-b',
    img = SPRITES[key],
    IW = img.naturalWidth,
    IH = img.naturalHeight;
  const hh = entity.join ? B.sprH : B.sprH * 0.92,
    k = hh / IH,
    ww = IW * k,
    cx = entity.x + entity.w / 2,
    by = entity.y + entity.h + 4;
  const sp = Math.abs(entity.vx),
    F = entity.fast ? 1.5 : 1,
    dc = entity.dirc || entity.face || 1;
  let amp = 1.5,
    rate = 2.5,
    freq = 1.3,
    sx = 1,
    sy = 1,
    rot = 0;
  if (entity.st === 'idle' && sp > 10) {
    amp = 7;
    rate = 8 * F;
    sx = 1 + Math.sin(gameState.time * 8 * F) * 0.04;
  } else if (entity.st === 'charge' && sp > 20) {
    amp = 13;
    rate = 24 * F;
    freq = 1.9;
    sx = 1.07 + Math.sin(gameState.time * 24) * 0.04;
    rot = dc * 0.1;
  } else if (entity.st === 'tele') {
    amp = 3;
    rate = 45;
    sy = 1.08;
  } else if (entity.st === 'hop' || entity.st === 'slam') {
    amp = 4;
    rate = 10;
    rot = dc * Math.max(-0.5, Math.min(0.5, entity.vy / 1700));
    sy = entity.g ? 1 : 1.08;
  } else if (entity.st === 'stun') {
    amp = 1.6;
    rate = 2.2;
    sy = 0.8;
    sx = 1.06;
  } else amp = 2.2;
  const flip = entity.join ? 1 : (entity.spr === 'twin-a') === entity.face > 0 ? 1 : -1;
  const N = Math.max(10, Math.round(ww / 4)),
    sw = IW / N,
    dw = ww / N,
    ph = gameState.time * rate;
  for (let pass = 0; pass < (tint ? 2 : 1); pass++) {
    const im = pass ? getTintedSprite(key, tint[0]) : img;
    ctx.save();
    ctx.translate(cx, by);
    ctx.globalAlpha = pass ? alpha * tint[1] : alpha;
    ctx.rotate(rot);
    ctx.scale(sx * flip, sy);
    for (let n = 0; n < N; n++) {
      const u = (n + 0.5) / N,
        d = entity.join ? Math.abs(u - 0.5) * 2 : u;
      const lift = amp * (0.5 + 0.5 * Math.sin(ph - d * Math.PI * 2 * freq)) * (amp > 3 ? 1 : 0.6);
      ctx.drawImage(im, n * sw, 0, sw + 0.6, IH, -ww / 2 + n * dw, -hh - lift, dw + 0.6, hh);
    }
    ctx.restore();
  }
}
