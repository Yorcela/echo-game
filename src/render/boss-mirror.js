import { runtime } from '../state/runtime.js';
import { FLOOR_Y, HEIGHT, WIDTH } from '../core/config.js';
import { ctx } from '../core/canvas.js';
import { gameState } from '../state/state.js';
import { SPRITES } from './sprites.js';
import { INK_COLOR } from './primitives.js';
import { starPath } from './characters.js';
import { energyCharge } from './boss-witch.js';
// Soleil / Lune : tronc + 2 jambes articulées
export function drawReflet(entity, alpha) {
  const key = entity.id ? 'moon' : 'sun',
    iT = SPRITES[key + '-torso'],
    IW = iT.naturalWidth,
    IH = iT.naturalHeight,
    B = runtime.level.boss,
    k = B.sprH / IH,
    cx = entity.x + entity.w / 2,
    by = entity.y + entity.h + 2;
  const d = entity.face || 1,
    sn = Math.sin(entity.ph || 0),
    wa = entity.wa || 0,
    t = gameState.time,
    hy = entity.id ? 177.5 : 179.5,
    hxL = entity.id ? 47.5 : 49.5,
    hxR = entity.id ? 70 : 72;
  let lean = 0,
    sc = 1,
    dy = -Math.abs(sn) * 2.2 * wa;
  if (entity.dn) {
    lean = d * 0.5;
    sc = 0.8;
    dy = 14 + Math.sin(t * 5) * 0.8;
  } else if (entity.st === 'tele') {
    const u = Math.max(0, Math.min(1, (0.9 - Math.max(0, entity.t)) / 0.3));
    lean = -d * 0.1 * u;
    sc = 1 + 0.04 * u;
    dy += Math.sin(t * 40) * 0.8;
  } else if (entity.st === 'fire') {
    lean = d * 0.14 * (entity.t / 0.35);
  } else if (entity.st === 'stun') {
    lean = d * 0.32;
    sc = 0.93;
    dy = 4 + Math.sin(t * 6) * 0.8;
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, by);
  ctx.scale(k, k);
  ctx.translate(-IW / 2, -IH);
  for (const sd of [-1, 1]) {
    const px = sd < 0 ? hxL : hxR,
      ph2 = sd < 0 ? sn : -sn,
      lift = Math.max(0, ph2) * 5 * wa;
    ctx.save();
    ctx.translate(px, hy);
    ctx.rotate(ph2 * 0.4 * wa);
    ctx.translate(-px, -hy - lift);
    ctx.drawImage(SPRITES[key + (sd < 0 ? '-leg-left' : '-leg-right')], 0, 0);
    ctx.restore();
  }
  ctx.translate(IW / 2, hy);
  ctx.rotate(lean);
  ctx.scale(sc, sc);
  ctx.translate(-IW / 2, -hy + dy);
  ctx.drawImage(iT, 0, 0);
  ctx.restore();
  // énergie qui se concentre autour du boss pendant la charge
  if (entity.st === 'tele') {
    const u = Math.max(0, Math.min(1, (0.9 - Math.max(0, entity.t)) / 0.7));
    energyCharge(cx, by - 52, u, t, entity.id ? 'moon' : 'sun', 34 + 34 * u, 18);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.25 + 0.3 * u;
    const gradient = ctx.createLinearGradient(0, by - 150, 0, by);
    gradient.addColorStop(0, 'rgba(255,255,255,0)');
    gradient.addColorStop(1, entity.id ? 'rgba(150,175,255,.8)' : 'rgba(255,200,80,.8)');
    ctx.fillStyle = gradient;
    ctx.fillRect(cx - 18, by - 150, 36, 150);
    ctx.restore();
  }
  if (entity.st === 'stun' || entity.dn) {
    for (let q = 0; q < 3; q++) {
      const a2 = t * 4 + q * 2.1;
      ctx.fillStyle = entity.id ? '#CFE0FF' : '#E2A93B';
      starPath(cx + Math.cos(a2) * 22, by - entity.h - 10 + Math.sin(a2) * 5, 7, 3, a2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = INK_COLOR;
      ctx.stroke();
    }
  }
}
export function drawBeam(entity) {
  const sun = entity.tone === 'sun',
    x = entity.x + entity.w / 2,
    t = gameState.time - entity.t0,
    y0 = entity.y,
    y1 = entity.y + entity.h;
  ctx.save();
  ctx.lineJoin = 'round';
  const fill = sun ? '#F6C94E' : '#CFE0FF',
    core = sun ? '#FFF6D0' : '#FFFFFF',
    glow = sun ? 'rgba(255,200,80,' : 'rgba(170,190,255,';
  const gradient = ctx.createLinearGradient(x - 34, 0, x + 34, 0);
  gradient.addColorStop(0, glow + '0)');
  gradient.addColorStop(0.5, glow + '.35)');
  gradient.addColorStop(1, glow + '0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(x - 34, y0, 68, y1 - y0);
  ctx.fillStyle = fill;
  ctx.strokeStyle = INK_COLOR;
  ctx.lineWidth = 3;
  ctx.beginPath();
  const n = Math.max(4, Math.round((y1 - y0) / 14));
  for (let i = 0; i <= n; i++) {
    const yy = y0 + ((y1 - y0) * i) / n,
      w = 10 + (i % 2 ? 5 : 0) + Math.sin(t * 25 + i) * 2;
    ctx.lineTo(x - w, yy);
  }
  for (let i = n; i >= 0; i--) {
    const yy = y0 + ((y1 - y0) * i) / n,
      w = 10 + (i % 2 ? 5 : 0) + Math.sin(t * 25 + i + 1) * 2;
    ctx.lineTo(x + w, yy);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = core;
  ctx.fillRect(x - 3, y0 + 4, 6, y1 - y0 - 8);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = sun ? 'rgba(255,220,120,.8)' : 'rgba(190,210,255,.8)';
  for (let i = 0; i < 10; i++) {
    const k = (t * 1.5 + i / 10) % 1;
    ctx.globalAlpha = 1 - k;
    ctx.beginPath();
    ctx.arc(x + Math.sin(i * 4 + t * 5) * 20, y1 - k * (y1 - y0), 2.2, 0, 7);
    ctx.fill();
  }
  ctx.restore();
  if (!sun) {
    ctx.fillStyle = '#FFF1A8';
    for (let i = 0; i < 4; i++) {
      const yy = y0 + 14 + ((t * 60 + i * 38) % (y1 - y0 - 20));
      starPath(x + Math.sin(i * 2 + t * 3) * 6, yy, 5, 2.2, t * 5 + i);
      ctx.fill();
    }
  }
  ctx.restore();
}
export function drawNuke(e) {
  const u = 1 - Math.max(0, e.life) / 1.7,
    cx = WIDTH / 2,
    t = gameState.time - e.t0;
  ctx.save();
  ctx.lineJoin = 'round';
  // souterrain : éclat
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, FLOOR_Y, WIDTH, HEIGHT);
  ctx.clip();
  ctx.globalAlpha = Math.max(0, 1 - u * 1.5);
  ctx.fillStyle = '#FFF1B8';
  ctx.beginPath();
  ctx.arc(cx, FLOOR_Y + 30, 30 + u * 90, 0, 7);
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.rect(0, 0, WIDTH, FLOOR_Y);
  ctx.clip();
  const eo = 1 - Math.pow(1 - Math.min(1, u * 1.6), 3),
    fl = Math.max(0, 1 - u * 3.5);
  ctx.fillStyle = 'rgba(255,246,214,' + fl * 0.95 + ')';
  ctx.fillRect(0, 0, WIDTH, FLOOR_Y);
  const sh = u < 0.75 ? 1 - u / 0.75 : 0; // onde de choc au sol
  ctx.globalCompositeOperation = 'lighter';
  for (const sd of [-1, 1]) {
    const x = cx + sd * (eo * WIDTH * 0.55);
    const gradient = ctx.createLinearGradient(x - sd * 140, 0, x, 0);
    gradient.addColorStop(0, 'rgba(255,200,90,0)');
    gradient.addColorStop(1, 'rgba(255,236,170,' + 0.75 * sh + ')');
    ctx.fillStyle = gradient;
    ctx.fillRect(Math.min(x, x - sd * 140), FLOOR_Y - 230 * (1 - u * 0.4), 140, 230 * (1 - u * 0.4));
  }
  ctx.globalCompositeOperation = 'source-over';
  const stemH = 300 * eo,
    capR = 40 + 150 * eo,
    top = FLOOR_Y - stemH,
    al = u < 0.8 ? 1 : 1 - (u - 0.8) / 0.2;
  ctx.globalAlpha = Math.max(0, al);
  const puffs = (n, col, rad, yy, sp) => {
    ctx.fillStyle = col;
    ctx.strokeStyle = INK_COLOR;
    ctx.lineWidth = 3;
    for (let i = 0; i < n; i++) {
      const a = (i * Math.PI * 2) / n + t * sp,
        px = cx + Math.cos(a) * rad * (1 + 0.06 * Math.sin(t * 5 + i)),
        py = yy + Math.sin(a) * rad * 0.42;
      ctx.beginPath();
      ctx.arc(px, py, rad * 0.42, 0, 7);
      ctx.fill();
      ctx.stroke();
    }
  };
  // pied
  for (let k = 0; k < 9; k++) {
    const kk = k / 8,
      yy = FLOOR_Y - stemH * kk,
      rw = (26 + 22 * (1 - kk)) * (0.8 + 0.2 * Math.sin(t * 6 + k));
    ctx.fillStyle = kk < 0.35 ? '#E8742A' : '#C8501E';
    ctx.strokeStyle = INK_COLOR;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx, yy, rw, 16, 0, 0, 7);
    ctx.fill();
    ctx.stroke();
  }
  // chapeau
  puffs(10, '#C8501E', capR, top + 10, 0.6);
  puffs(8, '#F08A32', capR * 0.8, top - 2, -0.7);
  puffs(6, '#FFD05A', capR * 0.5, top - 12, 1.1);
  ctx.fillStyle = '#FFF1B8';
  ctx.beginPath();
  ctx.ellipse(cx, top - 14, capR * 0.32, capR * 0.18, 0, 0, 7);
  ctx.fill();
  // braises
  ctx.fillStyle = '#FFD05A';
  for (let i = 0; i < 26; i++) {
    const a = i * 2.4,
      rr2 = (60 + i * 9) * eo,
      px = cx + Math.cos(a) * rr2 * 1.4,
      py = FLOOR_Y - 20 - Math.abs(Math.sin(a * 1.7)) * rr2 * 1.1 - u * 40;
    ctx.globalAlpha = Math.max(0, al * (1 - u * 0.6));
    ctx.beginPath();
    ctx.arc(px, py, 2 + (i % 3), 0, 7);
    ctx.fill();
  }
  ctx.restore();
}
export function drawBoom(entity) {
  const u = 1 - Math.max(0, entity.life) / 0.4,
    x = entity.x + entity.w / 2,
    y = entity.y + 10;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, FLOOR_Y, WIDTH, HEIGHT);
  ctx.clip();
  ctx.lineJoin = 'round';
  ctx.globalAlpha = 1 - u * 0.7;
  for (let i = 0; i < 14; i++) {
    const a = (i * Math.PI) / 7 + u,
      r = (20 + u * 70) * (i % 2 ? 0.7 : 1);
    ctx.fillStyle = i % 2 ? '#F6C94E' : '#CFE0FF';
    ctx.strokeStyle = INK_COLOR;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a - 0.12) * r, y + Math.sin(a - 0.12) * r);
    ctx.lineTo(x + Math.cos(a + 0.12) * r, y + Math.sin(a + 0.12) * r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = '#FFF6D0';
  ctx.beginPath();
  ctx.arc(x, y, 16 + u * 20, 0, 7);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.8 * (1 - u);
  ctx.fillStyle = '#FFF6D0';
  ctx.fillRect(x - 22, FLOOR_Y - 80 * u, 44, 80 * u);
  ctx.restore();
}
export function drawPuff(entity) {
  const u = 1 - Math.max(0, entity.life) / 0.3,
    x = entity.x + entity.w / 2,
    y = entity.y + entity.h / 2;
  ctx.save();
  ctx.globalAlpha = 1 - u;
  ctx.fillStyle = entity.tone === 'sun' ? '#F6C94E' : '#CFE0FF';
  ctx.strokeStyle = INK_COLOR;
  ctx.lineWidth = 2;
  starPath(x, y, 8 + u * 14, 3 + u * 4, u * 3);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
export function drawMirrorBG() {
  if (!runtime.level.boss || runtime.level.boss.kind !== 'mirror') return;
  const t = gameState.time;
  ctx.save();
  let gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, 'rgba(255,232,160,.30)');
  gradient.addColorStop(1, 'rgba(255,196,110,.14)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH / 2, HEIGHT);
  gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, 'rgba(8,14,72,.66)');
  gradient.addColorStop(1, 'rgba(20,20,70,.48)');
  ctx.fillStyle = gradient;
  ctx.fillRect(WIDTH / 2, 0, WIDTH / 2, HEIGHT);
  for (const sd of [-1, 1]) {
    const cx = WIDTH / 2 + sd * 232,
      top = 70,
      w = 128,
      h = 170,
      x0 = cx - w / 2;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const lg = ctx.createLinearGradient(0, top + h, 0, FLOOR_Y);
    lg.addColorStop(0, sd < 0 ? 'rgba(255,220,130,.22)' : 'rgba(130,150,255,.20)');
    lg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(x0 + 8, top + h);
    ctx.lineTo(x0 + w - 8, top + h);
    ctx.lineTo(x0 + w + 60, FLOOR_Y);
    ctx.lineTo(x0 - 60, FLOOR_Y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x0, top + h);
    ctx.lineTo(x0, top + w / 2);
    ctx.arc(cx, top + w / 2, w / 2, Math.PI, 0);
    ctx.lineTo(x0 + w, top + h);
    ctx.closePath();
    ctx.clip();
    const sky = ctx.createLinearGradient(0, top, 0, top + h);
    if (sd < 0) {
      sky.addColorStop(0, '#6FC2F0');
      sky.addColorStop(1, '#FCEBB0');
    } else {
      sky.addColorStop(0, '#070B38');
      sky.addColorStop(1, '#2C3180');
    }
    ctx.fillStyle = sky;
    ctx.fillRect(x0, top, w, h);
    if (sd < 0) {
      ctx.fillStyle = '#FFD45A';
      ctx.strokeStyle = INK_COLOR;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, top + 60, 22, 0, 7);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#FFD45A';
      ctx.lineWidth = 3;
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6 + t * 0.3;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * 28, top + 60 + Math.sin(a) * 28);
        ctx.lineTo(cx + Math.cos(a) * 38, top + 60 + Math.sin(a) * 38);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      for (const [qx, qy, qr] of [
        [x0 + 26, top + 120, 12],
        [x0 + 44, top + 114, 15],
        [x0 + 98, top + 138, 11],
      ]) {
        ctx.beginPath();
        ctx.arc(qx + Math.sin(t * 0.4 + qx) * 4, qy, qr, 0, 7);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = '#FFF1A8';
      for (let i = 0; i < 14; i++) {
        const sx = x0 + ((i * 37) % w),
          sy = top + ((i * 53) % (h - 10)),
          tw = 0.5 + 0.5 * Math.sin(t * 3 + i);
        ctx.globalAlpha = 0.4 + 0.6 * tw;
        starPath(sx, sy, 2.5 + tw * 1.5, 1, i);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#E4E8F4';
      ctx.strokeStyle = INK_COLOR;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, top + 62, 24, 0, 7);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#2C3180';
      ctx.beginPath();
      ctx.arc(cx + 11, top + 56, 21, 0, 7);
      ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = INK_COLOR;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(x0, top + h);
    ctx.lineTo(x0, top + w / 2);
    ctx.arc(cx, top + w / 2, w / 2, Math.PI, 0);
    ctx.lineTo(x0 + w, top + h);
    ctx.closePath();
    ctx.stroke();
    ctx.strokeStyle = '#8B8497';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = INK_COLOR;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx, top);
    ctx.lineTo(cx, top + h);
    ctx.moveTo(x0, top + h * 0.55);
    ctx.lineTo(x0 + w, top + h * 0.55);
    ctx.stroke();
    ctx.fillStyle = '#6A6277';
    ctx.fillRect(x0 - 8, top + h, w + 16, 8);
    ctx.strokeStyle = INK_COLOR;
    ctx.lineWidth = 3;
    ctx.strokeRect(x0 - 8, top + h, w + 16, 8);
  }
  ctx.restore();
}
