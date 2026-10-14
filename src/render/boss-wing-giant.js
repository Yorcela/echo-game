import { runtime } from '../state/runtime.js';
import { ctx } from '../core/canvas.js';
import { gameState } from '../state/state.js';
import { SPRITES } from './sprites.js';
import { getTintedSprite } from './characters.js';
export function drawEnvol(e, al, tint) {
  const B = runtime.level.boss,
    iB = SPRITES['wing-body'],
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
    const g = (n) => (pass ? getTintedSprite(n, tint[0]) : SPRITES[n]);
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
      ctx.drawImage(g(sd < 0 ? 'wing-left' : 'wing-right'), 0, 0);
      ctx.restore();
    }
    ctx.drawImage(g('wing-body'), 0, 0);
    ctx.restore();
  }
}

// Le Colosse : torse + 2 bras + 2 jambes articulés
export function drawColossus(e, al, tint) {
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
    const g = (n) => (pass ? getTintedSprite(n, tint[0]) : SPRITES[n]);
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
      ctx.drawImage(g(sd < 0 ? 'giant-leg-left' : 'giant-leg-right'), 0, 0);
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
      ctx.drawImage(g(sd < 0 ? 'giant-arm-left' : 'giant-arm-right'), 0, 0);
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
        key = g(sd < 0 ? 'giant-arm-left' : 'giant-arm-right'),
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
    ctx.drawImage(g('giant-torso'), 0, 0);
    ctx.restore();
  }
}
// Soleil / Lune : tronc + 2 jambes articulées
