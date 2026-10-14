import { runtime } from '../state/runtime.js';
import { BH, FLOOR, H, T, W } from '../core/config.js';
import { ctx } from '../core/canvas.js';
import { gameState } from '../state/state.js';
import { gateOK } from '../game/physics.js';
import { BEAM_H, DC, doorOpen } from '../game/reflets.js';
import { BCRI, BINFO, BRUN, SPR, WINFO, sprOK } from './sprites.js';
import { FB, INK, outlined, rr } from './primitives.js';
import { drawChar, drawSprBoss, drawWorm, star, wormTint } from './characters.js';
function drawEnvol(e, al, tint) {
  const B = runtime.level.boss,
    iB = SPR.envB,
    IW = iB.naturalWidth,
    IH = iB.naturalHeight,
    k = B.sprH / IH,
    cx = e.x + e.w / 2,
    by = e.y + e.h + 3,
    py = 82,
    pL = 209,
    pR = IW - 209;
  let ang = -0.6,
    sx = 0.8,
    bob = 0;
  if (e.fly) {
    if (e.st === 'dive') {
      ang = 1.15;
      sx = 0.55;
    } else if (e.st === 'ftele') {
      ang = 0.85 + Math.sin(gameState.time * 70) * 0.06;
      sx = 1;
    } else {
      const f = Math.sin(gameState.time * (e.st === 'rise' ? 20 : 13));
      ang = 0.12 + f * 0.6;
      sx = 1 - 0.14 * Math.max(0, -f);
      bob = -f * 3.5;
    }
  } else if (e.st === 'stun') {
    ang = -1.05;
    sx = 0.62;
  }
  for (let pass = 0; pass < (tint ? 2 : 1); pass++) {
    const g = (n) => (pass ? wormTint(n, tint[0]) : SPR[n]);
    ctx.save();
    ctx.translate(cx, by + bob);
    ctx.scale(k, k);
    ctx.translate(-IW / 2, -IH);
    ctx.globalAlpha = pass ? al * tint[1] : al;
    for (const sd of [-1, 1]) {
      ctx.save();
      const px = sd < 0 ? pL : pR;
      ctx.translate(px, py);
      ctx.rotate(-sd * ang);
      ctx.scale(sx, 1);
      ctx.translate(-px, -py);
      ctx.drawImage(g(sd < 0 ? 'envL' : 'envR'), 0, 0);
      ctx.restore();
    }
    ctx.drawImage(g('envB'), 0, 0);
    ctx.restore();
  }
}

// Le Colosse : torse + 2 bras + 2 jambes articulés
function drawColossus(e, al, tint) {
  const B = runtime.level.boss,
    IW = 507,
    IH = 313,
    k = B.sprH / IH,
    cx = e.x + e.w / 2,
    by = e.y + e.h + 3,
    f = e.face || 1,
    ph = e.ph || 0,
    wa = e.wa || 0,
    t = gameState.time;
  const st = e.st,
    cr = e.cr || 0;
  const sn = Math.sin(ph),
    bob = -Math.abs(sn) * 3.2 * wa;
  let lean = Math.sin(ph) * 0.025 * wa,
    aL = sn * 0.2 * wa,
    aR = -sn * 0.2 * wa,
    arm = 0;
  if (st === 'arm' || st === 'rarm') {
    const u = Math.min(1, ((e.d0 || 2) - e.t) / 0.45);
    arm = 2.85 * (1 - Math.pow(1 - u, 2)) + Math.sin(t * 50) * 0.05 * (e.t < 0.7 ? 1 : 0.3);
    lean = -0.05 * u;
  } else if (st === 'smash' || st === 'rsmash') {
    const u = Math.min(1, (0.55 - e.t) / 0.2),
      v = u * u * (3 - 2 * u);
    arm = 2.85 + (0.2 - 2.85) * v;
    lean = 0.12 * v * (e.t > 0.1 ? 1 : 0.5);
  } else if (st === 'die') {
    arm = e.jmp ? 2.9 : 2.4 * cr + Math.sin(t * 40) * 0.06 * cr;
  }
  const sy = 1 - cr * 0.28,
    drop = (1 - sy) * (IH - 223.8);
  for (let pass = 0; pass < (tint ? 2 : 1); pass++) {
    const g = (n) => (pass ? wormTint(n, tint[0]) : SPR[n]);
    ctx.save();
    ctx.globalAlpha = pass ? al * tint[1] : al;
    ctx.translate(cx, by);
    ctx.scale(k, k);
    ctx.translate(-IW / 2, -IH);
    // jambes
    for (const sd of [-1, 1]) {
      const hx = sd < 0 ? 195.6 : 306,
        hy = 223.8,
        ph2 = sd < 0 ? sn : -sn,
        lift = Math.max(0, ph2) * 16 * wa;
      ctx.save();
      ctx.translate(0, -lift * (1 - cr));
      ctx.translate(hx, hy);
      ctx.rotate(ph2 * 0.3 * wa * sd * -1 + (cr ? 0 : 0));
      ctx.translate(-hx, -hy);
      ctx.translate(0, IH);
      ctx.scale(1, sy);
      ctx.translate(0, -IH);
      ctx.drawImage(g(sd < 0 ? 'colLL' : 'colLR'), 0, 0);
      ctx.restore();
    }
    // torse + bras (le torse suit le balancement)
    ctx.translate(0, bob + drop);
    ctx.translate(IW / 2, 223.8);
    ctx.rotate(lean * f);
    ctx.translate(-IW / 2, -223.8);
    for (const sd of [-1, 1]) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(sd < 0 ? 157 : 349, 74, 38, 40, 0, 0, 7);
      ctx.clip();
      ctx.drawImage(g(sd < 0 ? 'colAL' : 'colAR'), 0, 0);
      ctx.restore();
    }
    for (const sd of [-1, 1]) {
      const px = sd < 0 ? 123.6 : 378,
        py = 76.8,
        facing = sd === f;
      let a = sd < 0 ? aL : aR;
      if ((facing && (st === 'arm' || st === 'smash')) || st === 'rarm' || st === 'rsmash' || st === 'die')
        a = arm;
      const a1 = a > 0.9 ? a * 0.44 : a,
        a2 = a > 0.9 ? a * 0.56 : 0,
        key = g(sd < 0 ? 'colAL' : 'colAR'),
        m = sd < 0 ? IW : 0,
        X = (x) => (sd < 0 ? IW - x : x),
        ex = X(442),
        ey = 150;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(-sd * a1);
      ctx.translate(-px, -py);
      if (a > 0.9) {
        // coude : le bras se plie
        ctx.save();
        ctx.beginPath();
        if (sd > 0) ctx.rect(364, 0, IW, 158);
        else ctx.rect(0, 0, IW - 364, 158);
        ctx.clip();
        ctx.drawImage(key, 0, 0);
        ctx.restore();
        ctx.translate(ex, ey);
        ctx.rotate(-sd * a2);
        ctx.translate(-ex, -ey);
        ctx.beginPath();
        if (sd > 0) ctx.rect(400, 148, IW, IH);
        else ctx.rect(0, 148, IW - 400, IH);
        ctx.clip();
        ctx.drawImage(key, 0, 0);
      } else ctx.drawImage(key, 0, 0);
      ctx.restore();
    }
    ctx.drawImage(g('colT'), 0, 0);
    ctx.restore();
  }
}
// Soleil / Lune : tronc + 2 jambes articulées
function drawReflet(e, al) {
  const key = e.id ? 'moon' : 'sun',
    iT = SPR[key + 'T'],
    IW = iT.naturalWidth,
    IH = iT.naturalHeight,
    B = runtime.level.boss,
    k = B.sprH / IH,
    cx = e.x + e.w / 2,
    by = e.y + e.h + 2;
  const d = e.face || 1,
    sn = Math.sin(e.ph || 0),
    wa = e.wa || 0,
    t = gameState.time,
    hy = e.id ? 177.5 : 179.5,
    hxL = e.id ? 47.5 : 49.5,
    hxR = e.id ? 70 : 72;
  let lean = 0,
    sc = 1,
    dy = -Math.abs(sn) * 2.2 * wa;
  if (e.dn) {
    lean = d * 0.5;
    sc = 0.8;
    dy = 14 + Math.sin(t * 5) * 0.8;
  } else if (e.st === 'tele') {
    const u = Math.max(0, Math.min(1, (0.9 - Math.max(0, e.t)) / 0.3));
    lean = -d * 0.1 * u;
    sc = 1 + 0.04 * u;
    dy += Math.sin(t * 40) * 0.8;
  } else if (e.st === 'fire') {
    lean = d * 0.14 * (e.t / 0.35);
  } else if (e.st === 'stun') {
    lean = d * 0.32;
    sc = 0.93;
    dy = 4 + Math.sin(t * 6) * 0.8;
  }
  ctx.save();
  ctx.globalAlpha = al;
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
    ctx.drawImage(SPR[key + (sd < 0 ? 'LL' : 'LR')], 0, 0);
    ctx.restore();
  }
  ctx.translate(IW / 2, hy);
  ctx.rotate(lean);
  ctx.scale(sc, sc);
  ctx.translate(-IW / 2, -hy + dy);
  ctx.drawImage(iT, 0, 0);
  ctx.restore();
  // énergie qui se concentre autour du boss pendant la charge
  if (e.st === 'tele') {
    const u = Math.max(0, Math.min(1, (0.9 - Math.max(0, e.t)) / 0.7));
    energyCharge(cx, by - 52, u, t, e.id ? 'moon' : 'sun', 34 + 34 * u, 18);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.25 + 0.3 * u;
    const g = ctx.createLinearGradient(0, by - 150, 0, by);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(1, e.id ? 'rgba(150,175,255,.8)' : 'rgba(255,200,80,.8)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - 18, by - 150, 36, 150);
    ctx.restore();
  }
  if (e.st === 'stun' || e.dn) {
    for (let q = 0; q < 3; q++) {
      const a2 = t * 4 + q * 2.1;
      ctx.fillStyle = e.id ? '#CFE0FF' : '#E2A93B';
      star(cx + Math.cos(a2) * 22, by - e.h - 10 + Math.sin(a2) * 5, 7, 3, a2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = INK;
      ctx.stroke();
    }
  }
}
function drawBeam(e) {
  const sun = e.tone === 'sun',
    x = e.x + e.w / 2,
    t = gameState.time - e.t0,
    y0 = e.y,
    y1 = e.y + e.h;
  ctx.save();
  ctx.lineJoin = 'round';
  const fill = sun ? '#F6C94E' : '#CFE0FF',
    core = sun ? '#FFF6D0' : '#FFFFFF',
    glow = sun ? 'rgba(255,200,80,' : 'rgba(170,190,255,';
  const g = ctx.createLinearGradient(x - 34, 0, x + 34, 0);
  g.addColorStop(0, glow + '0)');
  g.addColorStop(0.5, glow + '.35)');
  g.addColorStop(1, glow + '0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 34, y0, 68, y1 - y0);
  ctx.fillStyle = fill;
  ctx.strokeStyle = INK;
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
      star(x + Math.sin(i * 2 + t * 3) * 6, yy, 5, 2.2, t * 5 + i);
      ctx.fill();
    }
  }
  ctx.restore();
}
function drawNuke(e) {
  const u = 1 - Math.max(0, e.life) / 1.7,
    cx = W / 2,
    t = gameState.time - e.t0;
  ctx.save();
  ctx.lineJoin = 'round';
  // souterrain : éclat
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, FLOOR, W, H);
  ctx.clip();
  ctx.globalAlpha = Math.max(0, 1 - u * 1.5);
  ctx.fillStyle = '#FFF1B8';
  ctx.beginPath();
  ctx.arc(cx, FLOOR + 30, 30 + u * 90, 0, 7);
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.rect(0, 0, W, FLOOR);
  ctx.clip();
  const eo = 1 - Math.pow(1 - Math.min(1, u * 1.6), 3),
    fl = Math.max(0, 1 - u * 3.5);
  ctx.fillStyle = 'rgba(255,246,214,' + fl * 0.95 + ')';
  ctx.fillRect(0, 0, W, FLOOR);
  const sh = u < 0.75 ? 1 - u / 0.75 : 0; // onde de choc au sol
  ctx.globalCompositeOperation = 'lighter';
  for (const sd of [-1, 1]) {
    const x = cx + sd * (eo * W * 0.55);
    const g = ctx.createLinearGradient(x - sd * 140, 0, x, 0);
    g.addColorStop(0, 'rgba(255,200,90,0)');
    g.addColorStop(1, 'rgba(255,236,170,' + 0.75 * sh + ')');
    ctx.fillStyle = g;
    ctx.fillRect(Math.min(x, x - sd * 140), FLOOR - 230 * (1 - u * 0.4), 140, 230 * (1 - u * 0.4));
  }
  ctx.globalCompositeOperation = 'source-over';
  const stemH = 300 * eo,
    capR = 40 + 150 * eo,
    top = FLOOR - stemH,
    al = u < 0.8 ? 1 : 1 - (u - 0.8) / 0.2;
  ctx.globalAlpha = Math.max(0, al);
  const puffs = (n, col, rad, yy, sp) => {
    ctx.fillStyle = col;
    ctx.strokeStyle = INK;
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
      yy = FLOOR - stemH * kk,
      rw = (26 + 22 * (1 - kk)) * (0.8 + 0.2 * Math.sin(t * 6 + k));
    ctx.fillStyle = kk < 0.35 ? '#E8742A' : '#C8501E';
    ctx.strokeStyle = INK;
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
      py = FLOOR - 20 - Math.abs(Math.sin(a * 1.7)) * rr2 * 1.1 - u * 40;
    ctx.globalAlpha = Math.max(0, al * (1 - u * 0.6));
    ctx.beginPath();
    ctx.arc(px, py, 2 + (i % 3), 0, 7);
    ctx.fill();
  }
  ctx.restore();
}
function drawBoom(e) {
  const u = 1 - Math.max(0, e.life) / 0.4,
    x = e.x + e.w / 2,
    y = e.y + 10;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, FLOOR, W, H);
  ctx.clip();
  ctx.lineJoin = 'round';
  ctx.globalAlpha = 1 - u * 0.7;
  for (let i = 0; i < 14; i++) {
    const a = (i * Math.PI) / 7 + u,
      r = (20 + u * 70) * (i % 2 ? 0.7 : 1);
    ctx.fillStyle = i % 2 ? '#F6C94E' : '#CFE0FF';
    ctx.strokeStyle = INK;
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
  ctx.fillRect(x - 22, FLOOR - 80 * u, 44, 80 * u);
  ctx.restore();
}
function drawPuff(e) {
  const u = 1 - Math.max(0, e.life) / 0.3,
    x = e.x + e.w / 2,
    y = e.y + e.h / 2;
  ctx.save();
  ctx.globalAlpha = 1 - u;
  ctx.fillStyle = e.tone === 'sun' ? '#F6C94E' : '#CFE0FF';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  star(x, y, 8 + u * 14, 3 + u * 4, u * 3);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
export function drawMirrorBG() {
  if (!runtime.level.boss || runtime.level.boss.kind !== 'mirror') return;
  const t = gameState.time;
  ctx.save();
  let g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgba(255,232,160,.30)');
  g.addColorStop(1, 'rgba(255,196,110,.14)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W / 2, H);
  g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgba(8,14,72,.66)');
  g.addColorStop(1, 'rgba(20,20,70,.48)');
  ctx.fillStyle = g;
  ctx.fillRect(W / 2, 0, W / 2, H);
  for (const sd of [-1, 1]) {
    const cx = W / 2 + sd * 232,
      top = 70,
      w = 128,
      h = 170,
      x0 = cx - w / 2;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const lg = ctx.createLinearGradient(0, top + h, 0, FLOOR);
    lg.addColorStop(0, sd < 0 ? 'rgba(255,220,130,.22)' : 'rgba(130,150,255,.20)');
    lg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(x0 + 8, top + h);
    ctx.lineTo(x0 + w - 8, top + h);
    ctx.lineTo(x0 + w + 60, FLOOR);
    ctx.lineTo(x0 - 60, FLOOR);
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
      ctx.strokeStyle = INK;
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
        star(sx, sy, 2.5 + tw * 1.5, 1, i);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#E4E8F4';
      ctx.strokeStyle = INK;
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
    ctx.strokeStyle = INK;
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
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx, top);
    ctx.lineTo(cx, top + h);
    ctx.moveTo(x0, top + h * 0.55);
    ctx.lineTo(x0 + w, top + h * 0.55);
    ctx.stroke();
    ctx.fillStyle = '#6A6277';
    ctx.fillRect(x0 - 8, top + h, w + 16, 8);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.strokeRect(x0 - 8, top + h, w + 16, 8);
  }
  ctx.restore();
}
export function drawTunnelBG() {
  if (!runtime.level.boss || runtime.level.boss.kind !== 'mirror') return;
  ctx.save();
  for (let r = 14; r <= 15; r++)
    for (let c = 1; c <= 28; c++)
      if (runtime.grid[r][c] === '.') {
        const g = ctx.createLinearGradient(0, r * T, 0, r * T + T);
        g.addColorStop(0, '#2A2030');
        g.addColorStop(1, '#16101C');
        ctx.fillStyle = g;
        ctx.fillRect(c * T, r * T, T, T);
      }
  ctx.fillStyle = 'rgba(255,214,120,.5)';
  for (let c = 3; c <= 26; c += 3)
    if (runtime.grid[15][c] === '.' && runtime.grid[15][c + 1] === '.') {
      const f = 0.5 + 0.5 * Math.sin(gameState.time * 3 + c);
      ctx.globalAlpha = 0.35 + 0.35 * f;
      ctx.beginPath();
      ctx.arc(c * T + 16, 15 * T + 6, 3, 0, 7);
      ctx.fill();
    }
  ctx.restore();
}
export function drawDoors() {
  if (!runtime.level.boss || runtime.level.boss.kind !== 'mirror') return;
  ctx.save();
  for (let d = 0; d < 3; d++) {
    const x = DC[d][0] * T,
      y = 14 * T,
      open = doorOpen(d);
    if (!open) {
      ctx.fillStyle = '#9A6532';
      ctx.fillRect(x, y, 2 * T, 12);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 1.5, y + 1.5, 2 * T - 3, 9);
      ctx.beginPath();
      ctx.moveTo(x + T, y + 1);
      ctx.lineTo(x + T, y + 11);
      ctx.stroke();
      ctx.fillStyle = '#D8C07A';
      for (const bx of [x + 8, x + T - 8, x + T + 8, x + 2 * T - 8]) {
        ctx.beginPath();
        ctx.arc(bx, y + 6, 2, 0, 7);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(208,64,46,.9)';
      ctx.font = '800 12px ' + FB;
      ctx.textAlign = 'center';
      ctx.fillText('✕', x + T, y - 5);
    } else {
      const f = 0.5 + 0.5 * Math.sin(gameState.time * 5 + d);
      ctx.fillStyle = 'rgba(120,230,150,' + (0.5 + 0.4 * f) + ')';
      ctx.font = '800 13px ' + FB;
      ctx.textAlign = 'center';
      ctx.fillText('▾', x + T, y - 4 + f * 3);
    }
  }
  ctx.restore();
}
function yinYang(x, y, R, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.lineJoin = 'round';
  ctx.fillStyle = '#2C3180';
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#F6C94E';
  ctx.beginPath();
  ctx.arc(0, 0, R, -Math.PI / 2, Math.PI / 2, true);
  ctx.arc(0, R / 2, R / 2, Math.PI / 2, -Math.PI / 2, true);
  ctx.arc(0, -R / 2, R / 2, Math.PI / 2, -Math.PI / 2, false);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(2.5, R * 0.1);
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, R / 2, R / 2, Math.PI / 2, -Math.PI / 2, true);
  ctx.arc(0, -R / 2, R / 2, Math.PI / 2, -Math.PI / 2, false);
  ctx.stroke();
  const r2 = R * 0.2;
  ctx.save();
  ctx.translate(0, -R / 2);
  ctx.rotate(-rot);
  ctx.fillStyle = '#E4E8F4';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r2 * 1.5, 0, 7);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#F6C94E';
  ctx.beginPath();
  ctx.arc(r2 * 0.7, -r2 * 0.3, r2 * 1.3, 0, 7);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.translate(0, R / 2);
  ctx.rotate(-rot);
  ctx.strokeStyle = '#FFD45A';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r2 * 1.5, Math.sin(a) * r2 * 1.5);
    ctx.lineTo(Math.cos(a) * r2 * 2.2, Math.sin(a) * r2 * 2.2);
    ctx.stroke();
  }
  ctx.fillStyle = '#FFD45A';
  ctx.strokeStyle = INK;
  ctx.beginPath();
  ctx.arc(0, 0, r2 * 1.4, 0, 7);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  ctx.restore();
}
function energyCharge(x, y, u, t, tone, R = 60, N = 22) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const c1 =
      tone === 'magic'
        ? '200,110,255'
        : tone === 'sun'
          ? '255,200,80'
          : tone === 'moon'
            ? '150,175,255'
            : '255,225,150',
    c2 = tone === 'both' ? '150,175,255' : c1;
  const g = ctx.createRadialGradient(x, y, 2, x, y, R * (0.5 + 0.8 * u));
  g.addColorStop(0, 'rgba(' + c1 + ',' + (0.55 * u + 0.1) + ')');
  g.addColorStop(1, 'rgba(' + c1 + ',0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, R * (0.5 + 0.8 * u), 0, 7);
  ctx.fill();
  for (let i = 0; i < N; i++) {
    const ph = (t * 1.3 + i / N) % 1,
      r = R * (1 - ph) * (0.5 + 0.5 * u) + 4,
      a = t * (4 + u * 5) + i * ((Math.PI * 2) / N) + ph * 3;
    ctx.fillStyle = 'rgba(' + (i % 2 ? c1 : c2) + ',' + 0.9 * (1 - ph * 0.4) + ')';
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.75, 1.5 + 2.5 * u * (1 - ph), 0, 7);
    ctx.fill();
    ctx.strokeStyle = 'rgba(' + (i % 2 ? c1 : c2) + ',' + 0.35 * (1 - ph) + ')';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.75);
    ctx.lineTo(x + Math.cos(a - 0.35) * (r + 10), y + Math.sin(a - 0.35) * (r + 10) * 0.75);
    ctx.stroke();
  }
  if (u > 0.4) {
    ctx.strokeStyle = 'rgba(255,255,255,' + 0.5 * u + ')';
    ctx.lineWidth = 1.5;
    for (let k = 0; k < 3; k++) {
      if (Math.floor(t * 14 + k * 5) % 3 === 0) continue;
      let px = x,
        py = y;
      ctx.beginPath();
      ctx.moveTo(px, py);
      const a = k * 2.1 + Math.floor(t * 10) * 1.7;
      for (let s = 1; s <= 4; s++) {
        px += Math.cos(a) * (R * 0.2) + (Math.random() - 0.5) * 8;
        py += Math.sin(a) * (R * 0.2) + (Math.random() - 0.5) * 8;
        ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}
function drawOrb(e) {
  const x = e.x + e.w / 2,
    y = e.y + e.h / 2,
    t = gameState.time - e.t0,
    drop = e.ph === 1;
  ctx.save();
  const u = drop ? 1 : 1 - Math.max(0, e.tm) / 2,
    R = 22 + Math.min(6, e.n * 3) + Math.sin(t * 14) * 1.5 + u * 4;
  if (drop) {
    for (let i = 1; i <= 5; i++) {
      ctx.globalAlpha = 0.4 / i;
      yinYang(x, y - i * 11, R * (1 - i * 0.1), t * 5 - i * 0.4);
    }
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(0, y - 120, 0, y);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(255,230,160,.5)');
    ctx.fillStyle = g;
    ctx.fillRect(x - R * 0.8, y - 120, R * 1.6, 120);
    ctx.restore();
  } else {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const k = (t * 0.9 + i / 3) % 1;
      ctx.globalAlpha = 0.7 * (1 - k);
      ctx.strokeStyle = i % 2 ? '#9FB4FF' : '#FFD866';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(x, y + R * 0.6, R + k * 80, (R + k * 80) * 0.28, 0, 0, 7);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.25 + 0.3 * u;
    const g = ctx.createLinearGradient(0, y - 190, 0, y);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(255,225,150,1)');
    ctx.fillStyle = g;
    ctx.fillRect(x - R * 0.55, y - 190, R * 1.1, 190);
    ctx.restore();
    energyCharge(x, y, u, t, 'both', 70 + 30 * u, 28);
  }
  if (e.nk) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const f = 0.5 + 0.5 * Math.sin(t * 12);
    ctx.fillStyle = 'rgba(255,60,30,' + (0.25 + 0.25 * f) + ')';
    ctx.beginPath();
    ctx.arc(x, y, R * 2.2 + f * 10, 0, 7);
    ctx.fill();
    ctx.restore();
  }
  yinYang(x, y, R, t * (drop ? 10 : 2.2));
  if (e.nk && !drop) {
    ctx.fillStyle = '#D0402E';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.font = '800 15px ' + FB;
    ctx.textAlign = 'center';
    ctx.strokeText('☢ ABRI !', x, y - R - 32);
    ctx.fillText('☢ ABRI !', x, y - R - 32);
  }
  if (!drop) {
    ctx.fillStyle = 'rgba(27,22,18,.85)';
    ctx.font = '800 12px ' + FB;
    ctx.textAlign = 'center';
    ctx.fillText(Math.max(0, e.tm).toFixed(1) + ' s', x, y - R - 14);
  }
  ctx.restore();
}
function drawTelegraph(e) {
  const mm = e.hp > 4 ? 1 : e.hp > 2 ? 1.2 : 1.4,
    u = Math.max(0, Math.min(1, (0.9 / mm - Math.max(0, e.t)) / 0.6)),
    t = gameState.time;
  ctx.save();
  for (const sd of [-1, 1]) {
    const x = sd < 0 ? 34 : W - 34,
      col = sd < 0 ? '255,210,90' : '170,190,255';
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(0, FLOOR - BEAM_H, 0, FLOOR);
    g.addColorStop(0, 'rgba(' + col + ',0)');
    g.addColorStop(1, 'rgba(' + col + ',.8)');
    ctx.globalAlpha = (0.3 + 0.6 * u) * (0.75 + 0.25 * Math.sin(t * 35));
    ctx.fillStyle = g;
    ctx.fillRect(x - 14 * u - 4, FLOOR - BEAM_H, 28 * u + 8, BEAM_H);
    ctx.fillStyle = 'rgba(' + col + ',.9)';
    for (let i = 0; i < 16; i++) {
      const k = (t * 1.6 + i / 16) % 1;
      ctx.globalAlpha = (1 - k) * u;
      ctx.beginPath();
      ctx.arc(x + Math.sin(i * 5 + t * 4) * 18 * u, FLOOR - k * BEAM_H, 1.5 + 2 * u, 0, 7);
      ctx.fill();
    }
    ctx.globalAlpha = 0.55 * u;
    const r = ctx.createRadialGradient(x, FLOOR, 2, x, FLOOR, 70 * u + 10);
    r.addColorStop(0, 'rgba(' + col + ',.9)');
    r.addColorStop(1, 'rgba(' + col + ',0)');
    ctx.fillStyle = r;
    ctx.beginPath();
    ctx.ellipse(x, FLOOR, 70 * u + 10, 16 * u + 4, 0, 0, 7);
    ctx.fill();
  }
  ctx.restore();
}
function drawWitch(e, al) {
  const TH = 470,
    hh = runtime.level.boss.sprH,
    k = hh / TH,
    cx = e.x + e.w / 2,
    by = e.y + e.h + 3,
    t = gameState.time,
    f = e.face || 1,
    WI = WINFO;
  const dtf = Math.min(0.05, Math.max(0, t - (e._lt === undefined ? t : e._lt)));
  e._lt = t;
  const vx = e.vx || 0;
  e._sw = (e._sw || 0) + ((vx * f) / 180 - (e._sw || 0)) * Math.min(1, dtf * 7);
  const tele = e.st === 'tele',
    vol = e.st === 'volley',
    stun = e.st === 'stun',
    walk = Math.abs(vx) > 8 && e.st === 'idle',
    sp = Math.min(1, Math.abs(vx) / 180);
  e._ph = (e._ph || 0) + (walk ? dtf * (6 + sp * 5) : 0);
  const wf = e.wf || 1;
  let flick = 0,
    cock = 0;
  if (vol) {
    const at = [0.8, 0.5, 0.2];
    let last = -1;
    for (const a of at) if (e.t <= a) last = a;
    if (last < 0) cock = 1;
    else {
      const p = last - e.t;
      flick = p < 0.08 ? p / 0.08 : Math.exp(-(p - 0.08) * 7);
    }
  }
  if (tele) cock = Math.max(0, Math.min(1, (0.59 - Math.max(0, e.t)) / 0.45));
  const rage = e.st === 'rage';
  if (rage) {
    flick = 0.75 + 0.25 * Math.sin(t * 40);
    cock = 0;
  }
  let lean = 0,
    sy = 1,
    sx = 1,
    dy = -2 - Math.sin(t * 3) * 2.6 - sp * Math.abs(Math.sin(t * 9)) * 3,
    rot = Math.sin(t * 2) * 0.012 + sp * (Math.sin(t * 9) * 0.025 + f * 0.05);
  lean = -f * 0.14 * cock + f * 0.13 * flick;
  sy = 1 + 0.05 * cock - 0.04 * flick;
  sx = 1 - 0.03 * cock + 0.04 * flick;
  dy += -4 * cock - 3 * flick;
  let skirt = -e._sw * 0.9 + Math.sin(t * 2.6) * 0.18 + lean * -0.6 - flick * 0.5 + cock * 0.35;
  if (stun) {
    rot = f * 0.3;
    sy = 0.86;
    dy = 7 + Math.sin(t * 6);
    lean = f * 0.12;
    skirt = 0.3;
  }
  const M0 = ctx.getTransform();
  let tip = null;
  ctx.save();
  ctx.globalAlpha = al;
  ctx.translate(cx, by + dy);
  ctx.rotate(rot + lean);
  ctx.scale((f > 0 ? -1 : 1) * sx * k, sy * k);
  ctx.translate(-101, -465);
  const img = (n, x, y, w, h) => ctx.drawImage(SPR[n], x, y, w || WI[n].w, h || WI[n].h);
  // mèches (derrière)
  [
    ['h1', 34, 176],
    ['h2', 92, 180],
    ['h3', 150, 176],
  ].forEach(([n, x, y], i) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(t * 2.2 + i * 1.7) * 0.07 + skirt * 0.22 + (stun ? 0.1 : 0));
    img(n, -WI[n].w / 2, -4);
    ctx.restore();
  });
  // jambes
  const lg = [
    ['wLL', 64, Math.max(0, Math.sin(e._ph))],
    ['wLR', 100, Math.max(0, -Math.sin(e._ph))],
  ];
  for (const [n, x, l] of lg) {
    ctx.save();
    const hgt = WI[n].h,
      py = 465 - hgt - (stun ? 0 : l * 16);
    ctx.translate(x + WI[n].w / 2, py);
    ctx.rotate(l * 0.22 * (e._sw < 0 ? -1 : 1) + (stun ? (n === 'wLL' ? -0.2 : 0.25) : 0));
    img(n, -WI[n].w / 2, 0);
    ctx.restore();
  }
  // jupe : ourlet ondulant
  {
    const n = 'wS',
      iw = SPR[n].naturalWidth,
      ih = SPR[n].naturalHeight,
      w = WI[n].w,
      h = WI[n].h,
      S3 = 3;
    ctx.save();
    ctx.translate(50 + w / 2, 238);
    ctx.rotate(skirt * 0.1);
    for (let s0 = 0; s0 < ih; s0 += S3) {
      const v = s0 / ih,
        u = v * v;
      const dx = skirt * 14 * u + (v > 0.7 ? (Math.sin(v * 30 - t * 7) * 2 * (v - 0.7)) / 0.3 : 0);
      ctx.drawImage(
        SPR[n],
        0,
        s0,
        iw,
        Math.min(S3, ih - s0),
        -w / 2 + dx,
        v * h,
        w,
        (Math.min(S3, ih - s0) * h) / ih + 0.7,
      );
    }
    ctx.restore();
  }
  img('wB', 0, 0);
  // bras libre (droite du corps)
  {
    const castF = cock > 0.15 || flick > 0.05,
      n = castF ? 'fE' : 'fU',
      p = WI[n].pv;
    let a = Math.sin(t * 3.1) * 0.06 - sp * Math.sin(t * 9) * 0.15;
    if (castF) a += -cock * 0.25 + flick * 0.2;
    if (stun) a = 0.7 + Math.sin(t * 5) * 0.1;
    ctx.save();
    ctx.translate(125, 203);
    ctx.rotate(a);
    img(n, -p[0], -p[1]);
    ctx.restore();
  }
  // bras à baguette (gauche du corps) : levé au repos, tendu au lancer, tombant si étourdie
  {
    const n = stun ? 'wD' : flick > 0.12 ? 'wE' : 'wU',
      p = WI[n].pv,
      w = WI[n].wt;
    let a = Math.sin(t * 2.1) * 0.05 + sp * Math.sin(t * 9) * 0.1;
    if (n === 'wU') a += cock * -0.35 + (tele ? Math.sin(t * 45) * 0.03 : 0);
    if (n === 'wE') a += (1 - flick) * 0.12;
    if (stun) a = Math.sin(t * 5) * 0.06;
    ctx.save();
    ctx.translate(76, 203);
    ctx.rotate(a);
    img(n, -p[0], -p[1]);
    const m = ctx.getTransform();
    const pt = m.transformPoint(new DOMPoint(w[0] - p[0] + 0, w[1] - p[1] + 0));
    // pointe : coordonnées d'image, ctx est déjà décalé au pivot -> point (w-p) dans le repère pivot
    tip = pt;
    ctx.restore();
  }
  ctx.restore();
  if (tip) {
    const q = M0.inverse().transformPoint(tip),
      tipX = q.x,
      tipY = q.y;
    if (cock > 0 && !stun) {
      energyCharge(tipX, tipY, cock, t, 'magic', 22 + 34 * cock, 16);
    }
    if (flick > 0.02) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.min(1, flick);
      const g = ctx.createRadialGradient(tipX, tipY, 1, tipX, tipY, 40);
      g.addColorStop(0, 'rgba(240,190,255,1)');
      g.addColorStop(1, 'rgba(190,110,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(tipX, tipY, 40, 0, 7);
      ctx.fill();
      ctx.restore();
    } else if (!stun && !cock) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let q = 0; q < 3; q++) {
        const a = t * 3 + q * 2.1;
        ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 6 + q);
        ctx.fillStyle = 'rgba(215,150,255,1)';
        ctx.beginPath();
        ctx.arc(tipX + Math.cos(a) * 7, tipY + Math.sin(a) * 7, 1.8, 0, 7);
        ctx.fill();
      }
      ctx.restore();
    }
  }
  if (stun) {
    for (let q = 0; q < 3; q++) {
      const a = t * 4 + q * 2.1;
      ctx.fillStyle = '#E2A93B';
      star(cx + Math.cos(a) * 24, e.y - 14 + Math.sin(a) * 6, 7, 3, a);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = INK;
      ctx.stroke();
    }
  }
}
export function drawAfter(g) {
  const i = SPR.ghostR,
    hh = 50,
    ww = (i.naturalWidth * hh) / i.naturalHeight,
    t = gameState.time;
  if (g.mv)
    for (let q = 0; q < 2; q++) {
      const p = g.tr[q];
      ctx.save();
      ctx.globalAlpha = 0.2 - 0.07 * q;
      ctx.drawImage(i, p.x + p.w / 2 - ww / 2, p.y + p.h + 3 - hh, ww, hh);
      ctx.restore();
    }
  const atk = g.hit > 0,
    u = atk ? 1 - g.hit / 0.2 : 0,
    s = atk ? Math.sin(Math.min(1, u) * Math.PI) : 0,
    fc = g.face || 1;
  const bob = g.mv ? Math.abs(Math.sin(t * 14)) * -2.5 : Math.sin(t * 3) * 1.2,
    fl = Math.sin(t * 5) * 0.04;
  const cxp = g.x + g.w / 2,
    fy = g.y + g.h + 3;
  if (atk) {
    // traînée de lancer + arc de coup de tête
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let q = 1; q <= 3; q++) {
      ctx.globalAlpha = (0.22 * s) / q;
      ctx.drawImage(i, cxp - fc * q * 9 - (ww / 2) * (fc < 0 ? -1 : 1) * 0 - ww / 2, fy - hh, ww, hh);
    }
    ctx.globalAlpha = 0.85 * s;
    ctx.strokeStyle = '#CFEFFF';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(
      cxp + fc * 6,
      fy - hh * 0.55,
      30 + u * 14,
      fc > 0 ? -1.0 : Math.PI - 0.5 + 0.0,
      fc > 0 ? 0.5 : Math.PI + 1.0,
      fc < 0,
    );
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
      cxp + fc * 6,
      fy - hh * 0.55,
      22 + u * 12,
      fc > 0 ? -0.8 : Math.PI - 0.3,
      fc > 0 ? 0.3 : Math.PI + 0.8,
      fc < 0,
    );
    ctx.stroke();
    ctx.restore();
  }
  ctx.save();
  ctx.globalAlpha = g.mv || atk ? 0.78 : 0.3;
  ctx.translate(cxp + fc * s * 12, fy + bob);
  ctx.rotate(fl + (g.mv ? fc * 0.07 : 0) + fc * s * 0.45);
  ctx.scale((fc < 0 ? -1 : 1) * (1 + 0.12 * s), 1 - 0.08 * s);
  ctx.drawImage(i, -ww / 2, -hh, ww, hh);
  ctx.restore();
  // impact sur le vieux touché par le fantôme
  for (const e of runtime.ents)
    if (e.alive && e.k === 'b' && e.inv > 0.4) {
      const k = (e.inv - 0.4) / 0.2,
        x = e.x + e.w / 2,
        y = e.y + e.h * 0.45;
      ctx.save();
      ctx.globalAlpha = Math.min(1, k * 1.5);
      ctx.fillStyle = '#FFF8E1';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.5;
      star(x, y, 34 * (1.3 - k * 0.3), 12, t * 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#8FD3FF';
      star(x, y, 18, 7, -t * 4);
      ctx.fill();
      ctx.restore();
    }
}
const BOLT_OK = () => ['bU', 'bAL', 'bAR', 'bLL', 'bLR'].every(sprOK);
function drawBolt(e) {
  const I = BINFO,
    k = runtime.level.boss.sprH / I.H,
    t = gameState.time,
    cx = e.x + e.w / 2,
    by = e.y + e.h + 3,
    f = e.face || 1,
    st = e.st;
  const dtf = Math.min(0.05, Math.max(0, t - (e._lt === undefined ? t : e._lt)));
  e._lt = t;
  const blink = e.inv > 0 && Math.floor(t * 20) % 2;
  let al = blink ? 0.4 : 1;
  const run = st === 'dash',
    cr = st === 'crouch',
    stun = st === 'stun',
    sl = st === 'slap';
  e._ph = (e._ph || 0) + (run ? dtf * 26 : 0);
  // flashs de clignotement
  if (e.ft > 0) {
    const u = e.ft / 0.35;
    for (const xx of [e.fa0, e.fa1]) {
      if (xx === undefined) continue;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.min(1, u * 1.4);
      const g = ctx.createRadialGradient(xx, by - 30, 2, xx, by - 30, 46);
      g.addColorStop(0, 'rgba(255,250,170,1)');
      g.addColorStop(1, 'rgba(255,220,60,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(xx, by - 30, 46, 0, 7);
      ctx.fill();
      ctx.restore();
    }
    const x0 = e.fa0,
      x1 = e.fa1;
    if (x0 !== undefined && x1 !== undefined) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, u * 1.5);
      ctx.strokeStyle = '#FFF2A0';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x0, by - 34);
      ctx.lineTo((x0 + x1) / 2 + (x1 > x0 ? -6 : 6), by - 44);
      ctx.lineTo((x0 + x1) / 2 + (x1 > x0 ? 6 : -6), by - 26);
      ctx.lineTo(x1, by - 34);
      ctx.stroke();
      ctx.restore();
    }
  }
  if (st === 'blink') {
    al *= e.bs === 0 ? Math.max(0, e.t / 0.14) : 1 - Math.max(0, e.t / 0.14);
  }
  if (al <= 0.01) return;
  if (run && ['rHead', 'rTor', 'rFl', 'rLs', 'rFa', 'rLb', 'rSh'].every(sprOK)) {
    const R = BRUN,
      kr = runtime.level.boss.sprH / 712,
      ph = e._ph,
      s1 = Math.sin(ph);
    ctx.save();
    ctx.globalAlpha = al;
    ctx.translate(cx, by);
    ctx.scale(kr * f, kr);
    // éclairs de vitesse derrière lui
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let q = 0; q < 3; q++) {
      ctx.save();
      ctx.globalAlpha = (0.55 - 0.14 * q) * (0.6 + 0.4 * Math.sin(t * 50 + q * 2)) * al;
      ctx.translate(-330 - q * 190, -330 + ((q * 47) % 3) * 40);
      ctx.rotate(-Math.PI / 2);
      ctx.drawImage(SPR.rFl, -R.rFl.w / 2, -R.rFl.h / 2, R.rFl.w, R.rFl.h);
      ctx.restore();
    }
    ctx.restore();
    ctx.translate(0, -300 + Math.abs(Math.sin(ph)) * -16);
    const img = (n, x, y) => ctx.drawImage(SPR[n], x, y, R[n].w, R[n].h);
    const leg = (phi) => {
      const s = Math.sin(phi);
      ctx.save();
      if (s > 0.1) {
        // jambe levée : genou en avant
        ctx.rotate(-0.1 + 0.2 * s);
        img('rLb', -14, -22);
        ctx.save();
        ctx.translate(-14 + 108, -22 + 150);
        ctx.rotate(0.55);
        img('rSh', -90, -25);
        ctx.restore();
      } else {
        const a = 0.12 + 0.75 * (-s > 0 ? -s : 0);
        ctx.rotate(a);
        img('rLs', -25, -10);
        ctx.save();
        ctx.translate(0, 252);
        ctx.rotate(-a + 0.12);
        img('rSh', -90, -25);
        ctx.restore();
      }
      ctx.restore();
    };
    const arm = (ang) => {
      ctx.save();
      ctx.translate(-6, -205 + 0);
      ctx.rotate(0);
      ctx.restore();
    };
    const lean = 0.4;
    // bras éloigné + jambe éloignée
    ctx.save();
    ctx.rotate(lean);
    ctx.save();
    ctx.translate(-6, -200);
    ctx.rotate(1.2 - 0.95 * s1);
    ctx.globalAlpha = al * 0.85;
    img('rFa', -12, -42);
    ctx.restore();
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = al * 0.9;
    leg(ph + Math.PI);
    ctx.restore();
    // torse + tête
    ctx.save();
    ctx.rotate(lean);
    img('rTor', -63, -234);
    ctx.save();
    ctx.translate(0, -228);
    ctx.rotate(0.12 + Math.sin(ph * 2) * 0.03);
    img('rHead', -56, -215 + 10);
    ctx.restore();
    ctx.restore();
    leg(ph);
    ctx.save();
    ctx.rotate(lean);
    ctx.save();
    ctx.translate(-6, -200);
    ctx.rotate(1.2 + 0.95 * s1);
    img('rFa', -12, -42);
    ctx.restore();
    ctx.restore();
    ctx.restore();
    return;
  }
  if (cr && sprOK('bCr')) {
    const J = BCRI,
      p = 1 - Math.max(0, e.t) / 1.2,
      q = Math.max(0, (p - 0.5) / 0.5),
      w = J.w * k,
      h = J.h * k;
    let a = 0.14 * q + (q > 0.6 ? Math.sin(t * 70) * 0.012 : 0) + (p > 0.9 ? (p - 0.9) * 1.2 : 0);
    ctx.save();
    ctx.globalAlpha = al;
    ctx.translate(cx, by);
    ctx.scale(f, 1);
    const pv = [-w / 2 + J.px * k, -h + J.py * k];
    ctx.translate(pv[0], pv[1]);
    ctx.rotate(a);
    ctx.scale(1, 1 + Math.sin(t * 3) * 0.01 * (1 - q));
    ctx.translate(-pv[0], -pv[1]);
    ctx.drawImage(SPR.bCr, -w / 2, -h, w, h);
    ctx.restore();
    if (e.t < 0.4) outlined('!', cx, e.y - 30, 34, '#D0402E');
    return;
  }
  // paramètres de pose
  let up = 0.09,
    drop = 0,
    legA = [0, 0],
    legL = [0, 0],
    armA = [0, 0],
    bob = Math.sin(t * 3) * 1.2,
    sq = [1, 1],
    armFix = 1;
  if (cr) {
    const p = 1 - Math.max(0, e.t) / 1.2; // 0..1
    if (p < 0.55) {
      const q = Math.min(1, p / 0.2);
      up = 0.95 * q;
      drop = 95 * q;
      legA = [0.5 * q, -0.9 * q];
      legL = [0, 0];
      bob = 0;
    } else {
      const q = (p - 0.55) / 0.45;
      up = 0.95 - 0.4 * q;
      drop = 95 - 60 * q;
      legA = [0.5 - 0.2 * q, -0.9 + 0.3 * q];
      bob = Math.sin(q * 40) * 1.5;
      legL = [q * 8, 0];
    }
    armFix = 1;
  } else if (run) {
    up = 0.36;
    drop = 10;
    bob = -Math.abs(Math.sin(e._ph)) * 3;
    armA = [Math.sin(e._ph) * 1.0, -Math.sin(e._ph) * 1.0];
  } else if (stun) {
    up = 0.12 * Math.sin(t * 5);
    drop = 80;
    legA = [1.0, -1.0];
    sq = [1, 0.97];
    bob = 0;
  } else if (sl) {
    const q = e.t > 0.38 ? (0.8 - e.t) / 0.42 : e.t > 0.2 ? 1 : 0;
  }
  ctx.save();
  ctx.globalAlpha = al;
  ctx.translate(cx, by + bob);
  ctx.scale(k * f, k);
  ctx.translate(-I.W / 2, -I.H);
  if (st === 'blink') {
    const s2 = e.bs === 0 ? Math.max(0, e.t / 0.14) : 1 - Math.max(0, e.t / 0.14);
    ctx.translate(I.W / 2, I.H);
    ctx.scale(0.55 + 0.45 * s2, 1 + 0.35 * (1 - s2));
    ctx.translate(-I.W / 2, -I.H);
  }
  const hip = I.hip,
    hx = I.W / 2;
  const img = (n, x, y, w, h) => ctx.drawImage(SPR[n], x, y, w, h);
  const P_ = (n) => I[n];
  // jambes (pivot hanche)
  const leg = (n, ang, lift, sy2) => {
    const p = P_(n),
      px = p.x + p.w / 2,
      py = p.y + 4;
    ctx.save();
    ctx.translate(0, drop);
    ctx.translate(px, py);
    ctx.rotate(ang);
    ctx.scale(1, sy2);
    ctx.translate(-px, -py);
    ctx.translate(0, -lift);
    img(n, p.x, p.y, p.w, p.h);
    ctx.restore();
  };
  let lA = legA[0],
    rA = legA[1],
    lLift = 0,
    rLift = 0,
    lS = 1,
    rS = 1;
  if (run) {
    const s1 = Math.sin(e._ph),
      s2 = -s1;
    lA = s1 * 0.75;
    rA = s2 * 0.75;
    lLift = Math.max(0, s1) * 50;
    rLift = Math.max(0, s2) * 50;
  }
  if (cr) {
    lS = rS = 1 - drop / 285;
    if (1 - Math.max(0, e.t) / 1.2 > 0.75) {
      const q = (1 - Math.max(0, e.t) / 1.2 - 0.75) / 0.25;
      lLift = Math.max(0, Math.sin(q * 18)) * 40;
      rLift = Math.max(0, -Math.sin(q * 18)) * 40;
    }
  }
  if (stun) {
    lS = rS = 0.85;
  }
  leg('bLL', lA, lLift, lS);
  leg('bLR', rA, rLift, rS);
  // haut du corps : pivot à la hanche
  ctx.save();
  ctx.translate(0, drop);
  ctx.translate(hx, hip);
  ctx.rotate(up);
  ctx.scale(sq[0], sq[1]);
  ctx.translate(-hx, -hip);
  img('bU', I.bU.x, I.bU.y, I.bU.w, I.bU.h);
  const arm = (n, sh, ang) => {
    ctx.save();
    ctx.translate(sh[0], sh[1]);
    ctx.rotate(ang);
    ctx.translate(-sh[0], -sh[1]);
    img(n, I[n].x, I[n].y, I[n].w, I[n].h);
    ctx.restore();
  };
  let aL = Math.sin(t * 2.3) * 0.04,
    aR = -Math.sin(t * 2.1) * 0.04;
  if (cr || stun) {
    const fix = -up;
    aL = fix * 0.9 + (stun ? 0.5 : 0);
    aR = fix * 0.9 + (stun ? -0.5 : 0);
  }
  if (run) {
    aL = armA[0] - 0.2;
    aR = armA[1] + 0.2;
  }
  let stretch = 1;
  if (sl) {
    let a;
    if (e.t > 0.24) {
      const q = Math.max(0, Math.min(1, (0.5 - e.t) / 0.26));
      a = q * 2.5;
    } else if (e.t > 0.08) {
      const q = Math.max(0, Math.min(1, (0.24 - e.t) / 0.12));
      a = 2.5 - q * 4.1;
      stretch = 1 + 0.12 * q;
    } else a = -1.6 + ((0.08 - Math.max(0, e.t)) / 0.08) * 1.6;
    aR = a;
  }
  arm('bAL', I.shL, aL);
  if (stretch !== 1) {
    ctx.save();
    ctx.translate(I.shR[0], I.shR[1]);
    ctx.rotate(aR);
    ctx.scale(1, stretch);
    ctx.translate(-I.shR[0], -I.shR[1]);
    img('bAR', I.bAR.x, I.bAR.y, I.bAR.w, I.bAR.h);
    ctx.restore();
  } else arm('bAR', I.shR, aR);
  ctx.restore();
  ctx.restore();
  // traînées de course
  if (run && Math.abs(e.vx) > 100) {
    ctx.save();
    for (let q = 1; q <= 4; q++) {
      ctx.globalAlpha = (0.2 / q) * al;
      ctx.translate(0, 0);
    }
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let q = 0; q < 5; q++) {
      const yy = by - 70 + q * 14,
        len = 60 + ((q * 37) % 40);
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = '#FFF2A0';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx - e.dirc * 20, yy);
      ctx.lineTo(cx - e.dirc * (20 + len), yy);
      ctx.stroke();
    }
    ctx.restore();
  }
  // gifle : onde de choc
  if (sl && e.sl) {
    const u = Math.max(0, Math.min(1, (0.2 - e.t) / 0.12));
    ctx.save();
    ctx.globalAlpha = 0.9 * (1 - u * 0.6);
    ctx.strokeStyle = '#FFF8E1';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    const fx = cx + f * (e.w / 2 + 28);
    ctx.beginPath();
    ctx.arc(fx, by - 52, 22 + u * 10, f > 0 ? -1.1 : Math.PI - 0.7, f > 0 ? 0.7 : Math.PI + 1.1, f < 0);
    ctx.stroke();
    ctx.restore();
  }
  if (cr && e.t < 0.4) {
    outlined('!', cx, e.y - 30, 34, '#D0402E');
  }
  if (sl && e.t > 0.28) {
    outlined('!', cx, e.y - 30, 30, '#D0402E');
  }
  if (stun) {
    for (let q = 0; q < 3; q++) {
      const a = t * 4 + q * 2.1;
      ctx.fillStyle = '#E2A93B';
      star(cx + Math.cos(a) * 26, e.y - 8 + Math.sin(a) * 6, 7, 3, a);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = INK;
      ctx.stroke();
    }
  }
}
function drawBoss0(e) {
  if (runtime.level.boss.kind === 'bolt' && BOLT_OK()) {
    drawBolt(e);
    return;
  }
  if (
    runtime.level.boss.kind === 'shooter' &&
    ['wB', 'wS', 'wLL', 'wLR', 'wU', 'wE', 'wD', 'fU', 'fE', 'h1', 'h2', 'h3'].every(sprOK)
  ) {
    const blink = e.inv > 0 && Math.floor(gameState.time * 20) % 2;
    drawWitch(e, blink ? 0.4 : 1);
    if (e.st === 'tele') outlined('!', e.x + e.w / 2, e.y - 48, 34, '#D0402E');
    return;
  }
  if (
    runtime.level.boss.kind === 'mirror' &&
    ['sunT', 'sunLL', 'sunLR', 'moonT', 'moonLL', 'moonLR'].every(sprOK)
  ) {
    if (e.st === 'tele' && !e.id) drawTelegraph(e);
    drawReflet(e, e.inv > 0 && e.inv < 5 && Math.floor(gameState.time * 20) % 2 ? 0.45 : 1);
    return;
  }
  if (runtime.level.boss.kind === 'giant' && ['colT', 'colAL', 'colAR', 'colLL', 'colLR'].every(sprOK)) {
    const blink = e.inv > 0 && e.inv < 5 && Math.floor(gameState.time * 20) % 2,
      cx = e.x + e.w / 2,
      f = e.face || 1;
    let tint = null;
    if (e.st === 'arm' && e.t < 0.6) tint = ['#D0402E', 0.14 + 0.12 * Math.sin(gameState.time * 40)];
    ctx.save();
    if (e.st === 'die' && e.y + e.h > FLOOR - 6) {
      ctx.beginPath();
      ctx.rect(0, 0, W, FLOOR);
      for (let c = 1; c <= 28; c++) if (runtime.grid[14][c] === '.') ctx.rect(c * T, FLOOR, T, H);
      ctx.clip();
    }
    drawColossus(e, blink ? 0.45 : 1, tint);
    ctx.restore();
    if (e.st === 'arm' || e.st === 'rarm')
      outlined('!', cx, e.y - 30, 38, e.st === 'arm' ? '#D0402E' : '#E2A93B');
    return;
  }
  if (runtime.level.boss.kind === 'wing' && sprOK('envB') && sprOK('envL') && sprOK('envR')) {
    const blink = e.inv > 0 && Math.floor(gameState.time * 20) % 2,
      cx = e.x + e.w / 2;
    drawEnvol(e, blink ? 0.35 : 1, e.st === 'stun' ? ['#9C9380', 0.3] : null);
    if (e.st === 'tele' || e.st === 'ftele') outlined('!', cx, e.y - 34, 34, '#D0402E');
    if (e.st === 'stun') {
      for (let q = 0; q < 3; q++) {
        const a = gameState.time * 4 + q * 2.1;
        ctx.fillStyle = '#E2A93B';
        star(cx + Math.cos(a) * 30, e.y - 24 + Math.sin(a) * 6, 7, 3, a);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = INK;
        ctx.stroke();
      }
    }
    return;
  }
  if (runtime.level.boss.kind === 'twin' && sprOK('twinU') && sprOK('twinA') && sprOK('twinB')) {
    const blink = e.inv > 0 && Math.floor(gameState.time * 20) % 2,
      sh = e.st === 'tele' || e.st === 'stomp' ? Math.sin(gameState.time * 60) * 3 : 0,
      cx = e.x + e.w / 2;
    drawWorm(
      {
        ...e,
        x: e.x + sh,
      },
      blink ? 0.35 : 1,
      e.st === 'stun' ? ['#9C9380', 0.3] : e.fast && e.st === 'tele' ? ['#D0402E', 0.25] : null,
    );
    if (e.st === 'charge' && Math.abs(e.vx) > 20) {
      const d = e.dirc || e.face;
      ctx.save();
      for (let q = 0; q < 4; q++) {
        const t = (gameState.time * 5 + q / 4) % 1;
        ctx.globalAlpha = 0.55 * (1 - t);
        ctx.fillStyle = '#E9DFC4';
        ctx.strokeStyle = INK;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx - d * (e.w / 2 + t * 40), e.y + e.h - 3 - t * 14, 4 + t * 8, 0, 7);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }
    if (e.st === 'tele') outlined('!', cx, e.y - 30, 34, '#D0402E');
    if (e.st === 'stun') {
      for (let q = 0; q < 3; q++) {
        const a = gameState.time * 4 + q * 2.1;
        ctx.fillStyle = '#E2A93B';
        star(cx + Math.cos(a) * (e.w * 0.4 + 10), e.y - 14 + Math.sin(a) * 6, 7, 3, a);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = INK;
        ctx.stroke();
      }
    }
    return;
  }
  if (sprOK(runtime.level.boss.kind)) {
    const blink = e.inv > 0 && Math.floor(gameState.time * 20) % 2,
      sh = e.st === 'tele' || e.st === 'stomp' ? Math.sin(gameState.time * 60) * 3 : 0;
    const e2 = {
      ...e,
      x: e.x + sh,
    };
    drawSprBoss(
      e2,
      e.st === 'rew' ? 0.35 + 0.4 * Math.abs(Math.sin(gameState.time * 14)) : blink ? 0.35 : 1,
      e.st === 'rew' ? ['#6FB0F0', 0.6] : e.st === 'stun' ? ['#9C9380', 0.35] : null,
    );
    const cx = e.x + e.w / 2;
    if (e.st === 'charge' && Math.abs(e.vx) > 20) {
      const d = e.dirc || e.face;
      ctx.save();
      for (let q = 0; q < 4; q++) {
        const t = (gameState.time * 5 + q / 4) % 1;
        ctx.globalAlpha = 0.55 * (1 - t);
        ctx.fillStyle = '#E9DFC4';
        ctx.strokeStyle = INK;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx - d * (16 + t * 40), e.y + e.h - 3 - t * 14, 4 + t * 8, 0, 7);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }
    if (e.st === 'tele') outlined('!', cx, e.y - 34, 34, '#D0402E');
    if (e.st === 'stun') {
      for (let q = 0; q < 3; q++) {
        const a = gameState.time * 4 + q * 2.1;
        ctx.fillStyle = '#E2A93B';
        star(cx + Math.cos(a) * 34, e.y - 30 + Math.sin(a) * 6, 7, 3, a);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = INK;
        ctx.stroke();
      }
    }
    return;
  }
  const B = runtime.level.boss,
    cx = e.x + e.w / 2,
    k = e.h / BH,
    by = e.y + e.h;
  const blink = e.inv > 0 && Math.floor(gameState.time * 20) % 2;
  const sh = e.st === 'tele' || e.st === 'stomp' ? Math.sin(gameState.time * 60) * 3 : 0;
  const b2 = {
    ...e,
    x: e.x + sh,
  };
  drawChar(
    b2,
    e.st === 'stun' ? '#9C9380' : e.st === 'rew' ? '#6FB0F0' : B.c,
    e.st === 'rew' ? 0.35 + 0.4 * Math.abs(Math.sin(gameState.time * 14)) : blink ? 0.35 : 1,
    false,
  );
  ctx.save();
  ctx.translate(cx + sh, by);
  ctx.scale(k, k);
  ctx.strokeStyle = INK;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-10, -BH + 3);
  ctx.lineTo(0, -BH + 9);
  ctx.moveTo(12, -BH + 3);
  ctx.lineTo(2, -BH + 9);
  ctx.stroke();
  ctx.fillStyle = '#E2A93B';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-8, -BH);
  ctx.lineTo(-8, -BH - 8);
  ctx.lineTo(-4, -BH - 4);
  ctx.lineTo(0, -BH - 10);
  ctx.lineTo(4, -BH - 4);
  ctx.lineTo(8, -BH - 8);
  ctx.lineTo(8, -BH);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  if (e.st === 'tele') outlined('!', cx, e.y - 14, 34, '#D0402E');
  if (e.st === 'stun') {
    for (let i = 0; i < 3; i++) {
      const a = gameState.time * 4 + i * 2.1;
      ctx.fillStyle = '#E2A93B';
      star(cx + Math.cos(a) * 26, e.y - 8 + Math.sin(a) * 6, 7, 3, a);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = INK;
      ctx.stroke();
    }
  }
}
function wingsAt(cx, cy, sz, flap, col) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineJoin = 'round';
  ctx.fillStyle = col;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  for (const sd of [-1, 1]) {
    ctx.save();
    ctx.scale(sd, 1);
    ctx.rotate(-0.35 + Math.sin(flap) * 0.45);
    ctx.beginPath();
    ctx.moveTo(sz * 0.25, 0);
    ctx.quadraticCurveTo(sz * 1.1, -sz * 0.9, sz * 1.7, -sz * 0.35);
    ctx.quadraticCurveTo(sz * 1.35, -sz * 0.1, sz * 1.5, sz * 0.3);
    ctx.quadraticCurveTo(sz * 1.0, sz * 0.2, sz * 0.8, sz * 0.5);
    ctx.quadraticCurveTo(sz * 0.5, sz * 0.35, sz * 0.25, sz * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}
export function emblem(e, B) {
  const cx = e.x + e.w / 2,
    cy = e.y + e.h * 0.58,
    s = Math.max(8, e.h * 0.2);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = INK;
  ctx.fillStyle = '#FFF8E1';
  const em = B.em;
  if (em === 'clock') {
    ctx.beginPath();
    ctx.arc(0, 0, s, 0, 7);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.6);
    ctx.lineTo(0, 0);
    ctx.lineTo(s * 0.45, s * 0.25);
    ctx.stroke();
  } else if (em === 'mirror') {
    for (const sd of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(sd * s * 0.15, -s * 0.8);
      ctx.lineTo(sd * s * 1.1, 0);
      ctx.lineTo(sd * s * 0.15, s * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else if (em === 'twin') {
    for (const sd of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(sd * s * 0.6, 0, s * 0.5, 0, 7);
      ctx.fill();
      ctx.stroke();
    }
  } else if (em === 'ghost') {
    ctx.beginPath();
    ctx.moveTo(-s * 0.8, s * 0.8);
    ctx.lineTo(-s * 0.8, -s * 0.1);
    ctx.arc(0, -s * 0.1, s * 0.8, Math.PI, 0);
    ctx.lineTo(s * 0.8, s * 0.8);
    ctx.lineTo(s * 0.4, s * 0.45);
    ctx.lineTo(0, s * 0.8);
    ctx.lineTo(-s * 0.4, s * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (em === 'giant') {
    ctx.beginPath();
    ctx.rect(-s * 0.5, -s * 0.5, s, s);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    for (const [x, y] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ]) {
      ctx.moveTo(x * s * 1.1, y * s * 0.5);
      ctx.lineTo(x * s * 1.1, y * s * 1.1);
      ctx.lineTo(x * s * 0.5, y * s * 1.1);
    }
    ctx.stroke();
  } else if (em === 'bolt') {
    ctx.beginPath();
    ctx.moveTo(s * 0.3, -s * 1.1);
    ctx.lineTo(-s * 0.7, s * 0.2);
    ctx.lineTo(-s * 0.05, s * 0.2);
    ctx.lineTo(-s * 0.35, s * 1.1);
    ctx.lineTo(s * 0.75, -s * 0.3);
    ctx.lineTo(s * 0.1, -s * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (em === 'gun') {
    ctx.beginPath();
    ctx.rect(-s * 0.9, -s * 0.35, s * 1.4, s * 0.6);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.rect(-s * 0.3, s * 0.2, s * 0.5, s * 0.7);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.rect(s * 0.5, -s * 0.22, s * 0.7, s * 0.28);
    ctx.fill();
    ctx.stroke();
  } else if (em === 'king') {
    for (let i = 3; i >= 1; i--) {
      ctx.beginPath();
      ctx.arc(0, 0, s * (0.5 + i * 0.42) + Math.sin(gameState.time * 5 + i) * 2, 0, 7);
      ctx.stroke();
    }
    ctx.fillStyle = '#FFF8E1';
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5 - Math.PI / 2,
        r = i % 2 ? s * 0.35 : s * 0.8;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (em === 'wing') {
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.9);
    ctx.quadraticCurveTo(s * 0.9, -s * 0.2, 0, s * 0.9);
    ctx.quadraticCurveTo(-s * 0.9, -s * 0.2, 0, -s * 0.9);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}
function drawSpell(e) {
  const x = e.x + e.w / 2,
    y = e.y + e.h / 2,
    d = Math.sign(e.vx) || 1,
    ph = gameState.time * 12 + e.x * 0.04,
    tn = e.tn % 3;
  const pal =
    tn === 1
      ? ['120,255,150', '#8CF08A', '#2F8F4A']
      : tn === 2
        ? ['255,130,210', '#FF9AD8', '#B03C88']
        : ['190,110,255', '#C58BFF', '#6A3CB0'];
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 2, x, y, 30);
  g.addColorStop(0, 'rgba(' + pal[0] + ',.85)');
  g.addColorStop(1, 'rgba(' + pal[0] + ',0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, 30, 0, 7);
  ctx.fill();
  for (let i = 0; i < 7; i++) {
    const u = (i + ((gameState.time * 7) % 1)) / 7,
      tx = x - d * u * 58,
      ty = y + Math.sin(ph * 1.3 + i * 1.4) * 8 * u;
    ctx.globalAlpha = 0.7 * (1 - u);
    ctx.fillStyle = 'rgba(' + pal[0] + ',1)';
    ctx.beginPath();
    ctx.arc(tx, ty, 5 * (1 - u) + 1, 0, 7);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.fillStyle = pal[1];
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 11, 0, 7);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = pal[2];
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let q = 0; q < 22; q++) {
    const a = q * 0.35 + ph,
      r = 1 + q * 0.42;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.stroke();
  ctx.fillStyle = '#FFF6D0';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  for (let q = 0; q < 3; q++) {
    const a = ph * 0.8 + q * 2.1;
    star(x + Math.cos(a) * 17, y + Math.sin(a) * 17, 4, 1.6, a);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}
function drawBullet(e) {
  if (e.spell) return drawSpell(e);
  const x = e.x + e.w / 2,
    y = e.y + e.h / 2;
  ctx.save();
  const g = ctx.createRadialGradient(x, y, 1, x, y, 18);
  g.addColorStop(0, 'rgba(255,180,90,.9)');
  g.addColorStop(1, 'rgba(255,120,40,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 18, y - 18, 36, 36);
  ctx.fillStyle = '#FFE08A';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 6.5, 0, 7);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,170,70,.6)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - Math.sign(e.vx) * 8, y);
  ctx.lineTo(x - Math.sign(e.vx) * 26, y);
  ctx.stroke();
  ctx.restore();
}
function drawFist(e) {
  const u = 1 - Math.max(0, e.life) / 0.28,
    x = e.x + e.w / 2,
    y = FLOOR;
  ctx.save();
  ctx.globalAlpha = 1 - u * 0.8;
  ctx.lineJoin = 'round';
  ctx.fillStyle = '#F6EBCB';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  for (let i = 0; i < 9; i++) {
    const a = Math.PI + (i * Math.PI) / 8,
      r = 30 + u * 70 + (i % 2) * 22;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * 12, y + Math.sin(a) * 8);
    ctx.lineTo(x + Math.cos(a + 0.1) * r, y + Math.sin(a + 0.1) * r * 0.7);
    ctx.lineTo(x + Math.cos(a - 0.1) * r * 0.75, y + Math.sin(a - 0.1) * r * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}
function drawShock(e) {
  const x = e.x + e.w / 2,
    y = FLOOR,
    sd = Math.sign(e.vx) || 1,
    t = gameState.time,
    ph = t - (e.t0 || 0);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sd * 1.35, 1.35);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = '#F6EBCB';
  ctx.lineWidth = 2;
  for (let i = 1; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(-12 - i * 14, 0);
    ctx.quadraticCurveTo(-8 - i * 14, -26 + i * 5, 6 - i * 8, -26 + i * 6);
    ctx.stroke();
  }
  for (let i = 0; i < 5; i++) {
    const u = (ph * 3 + i / 5) % 1;
    ctx.globalAlpha = 0.55 * (1 - u);
    ctx.fillStyle = '#E9DFC4';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-14 - u * 52, -3 - u * 10, 3 + u * 7, 0, 7);
    ctx.fill();
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#5C4B50';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const u = (ph * 4 + i * 0.33) % 1,
      px = -6 - i * 10 - u * 14,
      py = -12 - Math.sin(u * Math.PI) * (18 + i * 6);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(ph * 9 + i);
    ctx.beginPath();
    ctx.rect(-3, -3, 6, 6);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  const pulse = 1 + Math.sin(ph * 28) * 0.07;
  ctx.fillStyle = '#F6EBCB';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-12, 0);
  ctx.quadraticCurveTo(-4, -34 * pulse, 16, -30 * pulse);
  ctx.quadraticCurveTo(22, -18, 20, 0);
  ctx.quadraticCurveTo(10, -6, -12, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#E2A93B';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-8, -1);
  ctx.quadraticCurveTo(-1, -22 * pulse, 12, -20 * pulse);
  ctx.quadraticCurveTo(15, -10, 14, -1);
  ctx.quadraticCurveTo(6, -4, -8, -1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-60, 1);
  ctx.lineTo(-44, 3);
  ctx.lineTo(-34, 0);
  ctx.lineTo(-20, 3);
  ctx.stroke();
  ctx.restore();
}
function drawWave(e) {
  const x = e.x + e.w / 2,
    y = e.y + e.h;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(Math.sign(e.vx) || 1, 1);
  ctx.lineJoin = 'round';
  ctx.fillStyle = '#E2A93B';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-14, 0);
  ctx.quadraticCurveTo(-6, -26, 14, -24);
  ctx.quadraticCurveTo(4, -14, 12, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
export function drawTrap(k) {
  const x = k.c0 * T,
    w = (k.c1 - k.c0 + 1) * T,
    ok = gateOK(k),
    t = gameState.time;
  let y = k.s === 't' ? T * 0.4 : 14 * T;
  ctx.save();
  if (!ok) {
    // trappe de fer scellée, cadenas rouge
    ctx.fillStyle = INK;
    rr(x - 4, y - 6, w + 8, 20, 5);
    ctx.fill();
    ctx.fillStyle = '#5B4636';
    rr(x, y - 3, w, 14, 4);
    ctx.fill();
    ctx.strokeStyle = '#2A1F18';
    ctx.lineWidth = 3;
    for (let px = x + 10; px < x + w - 4; px += 16) {
      ctx.beginPath();
      ctx.moveTo(px, y - 3);
      ctx.lineTo(px, y + 11);
      ctx.stroke();
    }
    ctx.fillStyle = '#D0402E';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    const cx = x + w / 2;
    rr(cx - 11, y - 14, 22, 16, 4);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, y - 14, 8, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(cx, y - 7, 2.5, 0, 7);
    ctx.fill();
    ctx.fillStyle = 'rgba(208,64,46,' + (0.12 + 0.08 * Math.sin(t * 3)) + ')';
    ctx.fillRect(x, y - 90, w, 90);
  } else {
    // trappe ouverte : halo doré qui descend vers le boss
    const g = 0.5 + 0.5 * Math.sin(t * 4);
    ctx.fillStyle = 'rgba(242,196,90,' + (0.16 + 0.1 * g) + ')';
    ctx.fillRect(x, y - 110, w, 110);
    ctx.fillStyle = '#F2C45A';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      const ax = x + w / 2,
        ay = y - 70 + ((t * 60 + i * 26) % 78);
      ctx.beginPath();
      ctx.moveTo(ax - 10, ay);
      ctx.lineTo(ax + 10, ay);
      ctx.lineTo(ax, ay + 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = INK;
    rr(x - 4, y - 6, 6, 20, 2);
    ctx.fill();
    rr(x + w - 2, y - 6, 6, 20, 2);
    ctx.fill();
  }
  ctx.restore();
}
export function drawBoss(e) {
  if (e.k === 's') {
    if (e.bul) drawBullet(e);
    else if (e.fist) drawFist(e);
    else if (e.shock) drawShock(e);
    else if (e.beam) drawBeam(e);
    else if (e.orb) drawOrb(e);
    else if (e.boom) drawBoom(e);
    else if (e.nuke) drawNuke(e);
    else if (e.puff) drawPuff(e);
    else drawWave(e);
    return;
  }
  const B = runtime.level.boss;
  if ((B.em === 'wing' || (B.king && e.fly)) && e.alive && !sprOK('envB'))
    wingsAt(
      e.x + e.w / 2,
      e.y + e.h * 0.45,
      e.h * 0.42,
      gameState.time * (e.st === 'dive' ? 5 : 14),
      '#F6EBCB',
    );
  const sp =
    sprOK(B.kind) ||
    (B.kind === 'mirror' && sprOK('sunT')) ||
    (B.kind === 'giant' && sprOK('colT')) ||
    (B.kind === 'twin' && sprOK('twinU')) ||
    (B.kind === 'wing' && sprOK('envB')) ||
    (B.kind === 'shooter' && sprOK('wB')) ||
    (B.kind === 'bolt' && sprOK('bU'));
  if (e.st === 'dash' && B.kind !== 'bolt') {
    for (let i = 1; i <= 3; i++) {
      if (sp)
        drawSprBoss(
          {
            ...e,
            x: e.x - e.dirc * i * 26,
          },
          (0.3 / i) * 1.4,
        );
      else
        drawChar(
          {
            ...e,
            x: e.x - e.dirc * i * 26,
          },
          B.c,
          (0.3 / i) * 1.4,
          false,
        );
    }
  }
  drawBoss0(e);
  if (!sp) emblem(e, B);
}
// cœur partiellement rempli (fraction f de 0 à 1, par quarts)
