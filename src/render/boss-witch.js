import { runtime } from '../state/runtime.ts';
import { FLOOR_Y, WIDTH } from '../core/config.ts';
import { ctx } from '../core/canvas.ts';
import { gameState } from '../state/state.ts';
import { BEAM_H } from '../game/reflets.js';
import { SPRITES, WITCH_SPRITE_METRICS, isSpriteReady } from './sprites.js';
import { FONT_BODY, INK_COLOR } from './primitives.js';
import { starPath } from './characters.js';
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
  ctx.strokeStyle = INK_COLOR;
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
  ctx.strokeStyle = INK_COLOR;
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
  ctx.strokeStyle = INK_COLOR;
  ctx.beginPath();
  ctx.arc(0, 0, r2 * 1.4, 0, 7);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  ctx.restore();
}
export function energyCharge(x, y, u, t, tone, R = 60, N = 22) {
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
  const gradient = ctx.createRadialGradient(x, y, 2, x, y, R * (0.5 + 0.8 * u));
  gradient.addColorStop(0, 'rgba(' + c1 + ',' + (0.55 * u + 0.1) + ')');
  gradient.addColorStop(1, 'rgba(' + c1 + ',0)');
  ctx.fillStyle = gradient;
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
export function drawOrb(entity) {
  const x = entity.x + entity.w / 2,
    y = entity.y + entity.h / 2,
    t = gameState.time - entity.t0,
    drop = entity.ph === 1;
  ctx.save();
  const u = drop ? 1 : 1 - Math.max(0, entity.tm) / 2,
    R = 22 + Math.min(6, entity.n * 3) + Math.sin(t * 14) * 1.5 + u * 4;
  if (drop) {
    for (let i = 1; i <= 5; i++) {
      ctx.globalAlpha = 0.4 / i;
      yinYang(x, y - i * 11, R * (1 - i * 0.1), t * 5 - i * 0.4);
    }
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const gradient = ctx.createLinearGradient(0, y - 120, 0, y);
    gradient.addColorStop(0, 'rgba(255,255,255,0)');
    gradient.addColorStop(1, 'rgba(255,230,160,.5)');
    ctx.fillStyle = gradient;
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
    const gradient = ctx.createLinearGradient(0, y - 190, 0, y);
    gradient.addColorStop(0, 'rgba(255,255,255,0)');
    gradient.addColorStop(1, 'rgba(255,225,150,1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - R * 0.55, y - 190, R * 1.1, 190);
    ctx.restore();
    energyCharge(x, y, u, t, 'both', 70 + 30 * u, 28);
  }
  if (entity.nk) {
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
  if (entity.nk && !drop) {
    ctx.fillStyle = '#D0402E';
    ctx.strokeStyle = INK_COLOR;
    ctx.lineWidth = 3;
    ctx.font = '800 15px ' + FONT_BODY;
    ctx.textAlign = 'center';
    ctx.strokeText('☢ ABRI !', x, y - R - 32);
    ctx.fillText('☢ ABRI !', x, y - R - 32);
  }
  if (!drop) {
    ctx.fillStyle = 'rgba(27,22,18,.85)';
    ctx.font = '800 12px ' + FONT_BODY;
    ctx.textAlign = 'center';
    ctx.fillText(Math.max(0, entity.tm).toFixed(1) + ' s', x, y - R - 14);
  }
  ctx.restore();
}
export function drawTelegraph(entity) {
  const mm = entity.hp > 4 ? 1 : entity.hp > 2 ? 1.2 : 1.4,
    u = Math.max(0, Math.min(1, (0.9 / mm - Math.max(0, entity.t)) / 0.6)),
    t = gameState.time;
  ctx.save();
  for (const sd of [-1, 1]) {
    const x = sd < 0 ? 34 : WIDTH - 34,
      col = sd < 0 ? '255,210,90' : '170,190,255';
    ctx.globalCompositeOperation = 'lighter';
    const gradient = ctx.createLinearGradient(0, FLOOR_Y - BEAM_H, 0, FLOOR_Y);
    gradient.addColorStop(0, 'rgba(' + col + ',0)');
    gradient.addColorStop(1, 'rgba(' + col + ',.8)');
    ctx.globalAlpha = (0.3 + 0.6 * u) * (0.75 + 0.25 * Math.sin(t * 35));
    ctx.fillStyle = gradient;
    ctx.fillRect(x - 14 * u - 4, FLOOR_Y - BEAM_H, 28 * u + 8, BEAM_H);
    ctx.fillStyle = 'rgba(' + col + ',.9)';
    for (let i = 0; i < 16; i++) {
      const k = (t * 1.6 + i / 16) % 1;
      ctx.globalAlpha = (1 - k) * u;
      ctx.beginPath();
      ctx.arc(x + Math.sin(i * 5 + t * 4) * 18 * u, FLOOR_Y - k * BEAM_H, 1.5 + 2 * u, 0, 7);
      ctx.fill();
    }
    ctx.globalAlpha = 0.55 * u;
    const r = ctx.createRadialGradient(x, FLOOR_Y, 2, x, FLOOR_Y, 70 * u + 10);
    r.addColorStop(0, 'rgba(' + col + ',.9)');
    r.addColorStop(1, 'rgba(' + col + ',0)');
    ctx.fillStyle = r;
    ctx.beginPath();
    ctx.ellipse(x, FLOOR_Y, 70 * u + 10, 16 * u + 4, 0, 0, 7);
    ctx.fill();
  }
  ctx.restore();
}
export function drawWitch(entity, alpha) {
  const TH = 470,
    hh = runtime.level.boss.sprH,
    k = hh / TH,
    cx = entity.x + entity.w / 2,
    by = entity.y + entity.h + 3,
    t = gameState.time,
    f = entity.face || 1,
    WI = WITCH_SPRITE_METRICS;
  const dtf = Math.min(0.05, Math.max(0, t - (entity._lt === undefined ? t : entity._lt)));
  entity._lt = t;
  const vx = entity.vx || 0;
  entity._sw = (entity._sw || 0) + ((vx * f) / 180 - (entity._sw || 0)) * Math.min(1, dtf * 7);
  const tele = entity.st === 'tele',
    vol = entity.st === 'volley',
    stun = entity.st === 'stun',
    walk = Math.abs(vx) > 8 && entity.st === 'idle',
    sp = Math.min(1, Math.abs(vx) / 180);
  entity._ph = (entity._ph || 0) + (walk ? dtf * (6 + sp * 5) : 0);
  let flick = 0,
    cock = 0;
  if (vol) {
    const at = [0.8, 0.5, 0.2];
    let last = -1;
    for (const a of at) if (entity.t <= a) last = a;
    if (last < 0) cock = 1;
    else {
      const p = last - entity.t;
      flick = p < 0.08 ? p / 0.08 : Math.exp(-(p - 0.08) * 7);
    }
  }
  if (tele) cock = Math.max(0, Math.min(1, (0.59 - Math.max(0, entity.t)) / 0.45));
  const rage = entity.st === 'rage';
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
  let skirt = -entity._sw * 0.9 + Math.sin(t * 2.6) * 0.18 + lean * -0.6 - flick * 0.5 + cock * 0.35;
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
  ctx.globalAlpha = alpha;
  ctx.translate(cx, by + dy);
  ctx.rotate(rot + lean);
  ctx.scale((f > 0 ? -1 : 1) * sx * k, sy * k);
  ctx.translate(-101, -465);
  const img = (n, x, y, w, h) => ctx.drawImage(SPRITES[n], x, y, w || WI[n].w, h || WI[n].h);
  // mèches (derrière)
  [
    ['witch-hair-1', 34, 176],
    ['witch-hair-2', 92, 180],
    ['witch-hair-3', 150, 176],
  ].forEach(([n, x, y], i) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(t * 2.2 + i * 1.7) * 0.07 + skirt * 0.22 + (stun ? 0.1 : 0));
    img(n, -WI[n].w / 2, -4);
    ctx.restore();
  });
  // jambes
  const lg = [
    ['witch-leg-left', 64, Math.max(0, Math.sin(entity._ph))],
    ['witch-leg-right', 100, Math.max(0, -Math.sin(entity._ph))],
  ];
  for (const [n, x, l] of lg) {
    ctx.save();
    const hgt = WI[n].h,
      py = 465 - hgt - (stun ? 0 : l * 16);
    ctx.translate(x + WI[n].w / 2, py);
    ctx.rotate(l * 0.22 * (entity._sw < 0 ? -1 : 1) + (stun ? (n === 'witch-leg-left' ? -0.2 : 0.25) : 0));
    img(n, -WI[n].w / 2, 0);
    ctx.restore();
  }
  // jupe : ourlet ondulant
  {
    const n = 'witch-skirt',
      iw = SPRITES[n].naturalWidth,
      ih = SPRITES[n].naturalHeight,
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
        SPRITES[n],
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
  img('witch-body', 0, 0);
  // bras libre (droite du corps)
  {
    const castF = cock > 0.15 || flick > 0.05,
      n = castF ? 'witch-free-arm-cast' : 'witch-free-arm-up',
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
    const n = stun ? 'witch-wand-arm-down' : flick > 0.12 ? 'witch-wand-arm-flick' : 'witch-wand-arm-up',
      p = WI[n].pv,
      w = WI[n].wt;
    let a = Math.sin(t * 2.1) * 0.05 + sp * Math.sin(t * 9) * 0.1;
    if (n === 'witch-wand-arm-up') a += cock * -0.35 + (tele ? Math.sin(t * 45) * 0.03 : 0);
    if (n === 'witch-wand-arm-flick') a += (1 - flick) * 0.12;
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
      const gradient = ctx.createRadialGradient(tipX, tipY, 1, tipX, tipY, 40);
      gradient.addColorStop(0, 'rgba(240,190,255,1)');
      gradient.addColorStop(1, 'rgba(190,110,255,0)');
      ctx.fillStyle = gradient;
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
      starPath(cx + Math.cos(a) * 24, entity.y - 14 + Math.sin(a) * 6, 7, 3, a);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = INK_COLOR;
      ctx.stroke();
    }
  }
}
export function drawAfter(g) {
  const i = SPRITES['ghost-afterimage'],
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
  for (const entity of runtime.entities)
    if (entity.alive && entity.k === 'b' && entity.inv > 0.4) {
      const k = (entity.inv - 0.4) / 0.2,
        x = entity.x + entity.w / 2,
        y = entity.y + entity.h * 0.45;
      ctx.save();
      ctx.globalAlpha = Math.min(1, k * 1.5);
      ctx.fillStyle = '#FFF8E1';
      ctx.strokeStyle = INK_COLOR;
      ctx.lineWidth = 2.5;
      starPath(x, y, 34 * (1.3 - k * 0.3), 12, t * 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#8FD3FF';
      starPath(x, y, 18, 7, -t * 4);
      ctx.fill();
      ctx.restore();
    }
}
export const BOLT_OK = () =>
  ['bolt-torso', 'bolt-arm-left', 'bolt-arm-right', 'bolt-leg-left', 'bolt-leg-right'].every(isSpriteReady);
