import { runtime } from '../state/runtime.js';
import { ctx } from '../core/canvas.js';
import { gameState } from '../state/state.js';
import { BCRI, BINFO, BRUN, SPR, sprOK } from './sprites.js';
import { INK, outlined } from './primitives.js';
import { star } from './characters.js';
export function drawBolt(e) {
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
