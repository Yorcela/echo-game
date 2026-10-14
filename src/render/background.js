import { runtime } from '../state/runtime.ts';
import { FLOOR_Y, HEIGHT, TILE, WIDTH } from '../core/config.ts';
import { ctx } from '../core/canvas.ts';
import { levels } from '../data/levels.js';
import { gameState } from '../state/state.ts';
import { INK_COLOR } from './primitives.js';
/* ---------- Décor : château hanté ---------- */
const ZONE_PALETTES = [
  {
    w: '#4C566C',
    w2: '#424B60',
    w3: '#58637C',
    m: '#2A3041',
    gl: '#FFD27A',
    tp: '#8E2F3A',
    win: '#9FC4E8',
  },
  {
    w: '#574C69',
    w2: '#4C415D',
    w3: '#645878',
    m: '#2E2640',
    gl: '#FFC27A',
    tp: '#2F6E78',
    win: '#C4A8E8',
  },
  {
    w: '#41595F',
    w2: '#384E54',
    w3: '#4C6B72',
    m: '#213338',
    gl: '#FFE08A',
    tp: '#8E2F3A',
    win: '#A8E8D8',
  },
  {
    w: '#5E4D48',
    w2: '#524440',
    w3: '#6C5A54',
    m: '#30231F',
    gl: '#FFB066',
    tp: '#2F5E78',
    win: '#E8C8A0',
  },
  {
    w: '#5A4556',
    w2: '#4E3B4A',
    w3: '#685263',
    m: '#2F2030',
    gl: '#FF9A7A',
    tp: '#C79A2F',
    win: '#E8A8C8',
  },
  {
    w: '#475849',
    w2: '#3D4B3F',
    w3: '#546856',
    m: '#232E27',
    gl: '#FFE08A',
    tp: '#7A3A8E',
    win: '#B8E8A8',
  },
  {
    w: '#4E5062',
    w2: '#44465A',
    w3: '#5A5D74',
    m: '#2A2B3D',
    gl: '#9AD8FF',
    tp: '#8E2F3A',
    win: '#A8D0FF',
  },
  {
    w: '#5F4B3A',
    w2: '#534131',
    w3: '#6C5744',
    m: '#33261B',
    gl: '#FFC85A',
    tp: '#6E2F8E',
    win: '#FFE0A0',
  },
];
const zoneOf = (i) => Math.min((levels[i] && levels[i].zone) | 0, ZONE_PALETTES.length - 1);
const mulberry32 = (a) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const backgroundCache = {};
function archPath(g, x, y, w, h) {
  // arc brisé : base (x..x+w, y+h), sommet (x+w/2,y)
  g.beginPath();
  g.moveTo(x, y + h);
  g.lineTo(x, y + w * 0.55);
  g.quadraticCurveTo(x, y + w * 0.12, x + w / 2, y);
  g.quadraticCurveTo(x + w, y + w * 0.12, x + w, y + w * 0.55);
  g.lineTo(x + w, y + h);
  g.closePath();
}
function buildCastleBackground(i) {
  if (backgroundCache[i]) return backgroundCache[i];
  const cv = document.createElement('canvas');
  cv.width = WIDTH;
  cv.height = HEIGHT;
  const layerCtx = cv.getContext('2d');
  const R = mulberry32(9137 + i * 131),
    Z = ZONE_PALETTES[zoneOf(i)],
    lights = [],
    eyes = [],
    flames = [];
  // mur de pierre
  layerCtx.fillStyle = Z.w;
  layerCtx.fillRect(0, 0, WIDTH, HEIGHT);
  for (let r = 0; r < 34; r++) {
    const off = (r % 2) * 16;
    for (let c = -1; c < 31; c++) {
      const v = R(),
        x = c * 32 + off,
        y = r * 16;
      layerCtx.fillStyle = v < 0.3 ? Z.w2 : v < 0.6 ? Z.w : Z.w3;
      layerCtx.fillRect(x, y, 32, 16);
    }
  }
  layerCtx.strokeStyle = Z.m;
  layerCtx.lineWidth = 2;
  layerCtx.globalAlpha = 0.75;
  layerCtx.beginPath();
  for (let r = 0; r <= 34; r++) {
    layerCtx.moveTo(0, r * 16);
    layerCtx.lineTo(WIDTH, r * 16);
  }
  for (let r = 0; r < 34; r++) {
    const off = (r % 2) * 16;
    for (let c = -1; c < 31; c++) {
      layerCtx.moveTo(c * 32 + off, r * 16);
      layerCtx.lineTo(c * 32 + off, r * 16 + 16);
    }
  }
  layerCtx.stroke();
  layerCtx.globalAlpha = 1;
  // ombre profonde en haut et en bas
  let gr = layerCtx.createLinearGradient(0, 0, 0, HEIGHT);
  gr.addColorStop(0, 'rgba(8,6,16,.55)');
  gr.addColorStop(0.28, 'rgba(8,6,16,0)');
  gr.addColorStop(0.7, 'rgba(8,6,16,0)');
  gr.addColorStop(1, 'rgba(8,6,16,.5)');
  layerCtx.fillStyle = gr;
  layerCtx.fillRect(0, 0, WIDTH, HEIGHT);
  // travées : piliers + arcs brisés
  const bays = 4,
    bw = WIDTH / bays;
  for (let b = 0; b < bays; b++) {
    const x0 = b * bw + 22,
      w = bw - 44;
    // fond de l'arcade (plus sombre = profondeur)
    archPath(layerCtx, x0, 70, w, 300);
    layerCtx.fillStyle = 'rgba(12,10,26,.34)';
    layerCtx.fill();
    layerCtx.lineWidth = 7;
    layerCtx.strokeStyle = Z.m;
    layerCtx.stroke();
    layerCtx.lineWidth = 2.5;
    layerCtx.strokeStyle = Z.w3;
    archPath(layerCtx, x0 + 5, 76, w - 10, 294);
    layerCtx.stroke();
    // contenu de la travée
    const kind = R(),
      cx = x0 + w / 2;
    if (kind < 0.34) {
      // fenêtre gothique au clair de lune
      const ww = w * 0.5,
        wx = cx - ww / 2,
        wy = 118,
        wh = 190;
      archPath(layerCtx, wx, wy, ww, wh);
      const gl = layerCtx.createLinearGradient(0, wy, 0, wy + wh);
      gl.addColorStop(0, Z.win);
      gl.addColorStop(1, '#243050');
      layerCtx.fillStyle = gl;
      layerCtx.fill();
      layerCtx.lineWidth = 5;
      layerCtx.strokeStyle = Z.m;
      layerCtx.stroke();
      layerCtx.lineWidth = 3;
      layerCtx.beginPath();
      layerCtx.moveTo(cx, wy + 4);
      layerCtx.lineTo(cx, wy + wh);
      layerCtx.moveTo(wx, wy + wh * 0.5);
      layerCtx.lineTo(wx + ww, wy + wh * 0.5);
      layerCtx.moveTo(wx, wy + wh * 0.28);
      layerCtx.lineTo(wx + ww, wy + wh * 0.28);
      layerCtx.stroke();
      layerCtx.globalAlpha = 0.1;
      layerCtx.fillStyle = Z.win;
      layerCtx.beginPath();
      layerCtx.moveTo(wx, wy + wh);
      layerCtx.lineTo(wx + ww, wy + wh);
      layerCtx.lineTo(wx + ww + 60, HEIGHT - 40);
      layerCtx.lineTo(wx - 60, HEIGHT - 40);
      layerCtx.fill();
      layerCtx.globalAlpha = 1;
    } else if (kind < 0.62) {
      // tapisserie
      const tw = w * 0.34,
        tx = cx - tw / 2,
        ty = 96,
        th = 200;
      layerCtx.fillStyle = '#2A2018';
      layerCtx.fillRect(tx - 8, ty - 8, tw + 16, 8);
      layerCtx.beginPath();
      layerCtx.moveTo(tx, ty);
      layerCtx.lineTo(tx + tw, ty);
      layerCtx.lineTo(tx + tw, ty + th);
      layerCtx.lineTo(tx + tw / 2, ty + th - 26);
      layerCtx.lineTo(tx, ty + th);
      layerCtx.closePath();
      layerCtx.fillStyle = Z.tp;
      layerCtx.fill();
      layerCtx.lineWidth = 4;
      layerCtx.strokeStyle = INK_COLOR;
      layerCtx.stroke();
      layerCtx.strokeStyle = '#E2B04A';
      layerCtx.lineWidth = 3;
      layerCtx.beginPath();
      layerCtx.moveTo(tx + 8, ty + 10);
      layerCtx.lineTo(tx + tw - 8, ty + 10);
      layerCtx.stroke();
      // emblème : écu au croissant
      layerCtx.fillStyle = '#E2B04A';
      layerCtx.beginPath();
      layerCtx.moveTo(cx - 18, ty + 50);
      layerCtx.lineTo(cx + 18, ty + 50);
      layerCtx.lineTo(cx + 18, ty + 90);
      layerCtx.quadraticCurveTo(cx, ty + 112, cx - 18, ty + 90);
      layerCtx.closePath();
      layerCtx.fill();
      layerCtx.strokeStyle = INK_COLOR;
      layerCtx.lineWidth = 3;
      layerCtx.stroke();
      layerCtx.fillStyle = Z.tp;
      layerCtx.beginPath();
      layerCtx.arc(cx, ty + 72, 9, 0, 7);
      layerCtx.fill();
      layerCtx.fillStyle = '#E2B04A';
      layerCtx.beginPath();
      layerCtx.arc(cx + 3, ty + 70, 8, 0, 7);
      layerCtx.fill();
      layerCtx.fillStyle = '#E2B04A';
      for (let k = 0; k < 5; k++)
        layerCtx.fillRect(tx + 6 + k * ((tw - 14) / 4) - 2, ty + th - 34 + (k % 2) * 6, 4, 12);
    } else if (kind < 0.86) {
      // portrait aux yeux brillants
      const pw = 70,
        ph = 92,
        px = cx - pw / 2,
        py = 130 + R() * 40;
      layerCtx.fillStyle = '#8A6A2E';
      layerCtx.fillRect(px - 8, py - 8, pw + 16, ph + 16);
      layerCtx.lineWidth = 4;
      layerCtx.strokeStyle = INK_COLOR;
      layerCtx.strokeRect(px - 8, py - 8, pw + 16, ph + 16);
      layerCtx.fillStyle = '#BFA05A';
      layerCtx.fillRect(px - 4, py - 4, pw + 8, 4);
      layerCtx.fillRect(px - 4, py + ph, pw + 8, 4);
      layerCtx.fillStyle = '#1A1624';
      layerCtx.fillRect(px, py, pw, ph);
      layerCtx.fillStyle = '#0C0A14';
      layerCtx.beginPath();
      layerCtx.ellipse(cx, py + ph * 0.42, 17, 22, 0, 0, 7);
      layerCtx.fill();
      layerCtx.beginPath();
      layerCtx.moveTo(px + 4, py + ph);
      layerCtx.quadraticCurveTo(cx, py + ph * 0.52, px + pw - 4, py + ph);
      layerCtx.fill();
      if (R() < 0.5) {
        layerCtx.beginPath();
        layerCtx.moveTo(cx - 18, py + ph * 0.28);
        layerCtx.lineTo(cx - 8, py + ph * 0.1);
        layerCtx.lineTo(cx + 8, py + ph * 0.1);
        layerCtx.lineTo(cx + 18, py + ph * 0.28);
        layerCtx.fill();
      }
      eyes.push({
        x: cx - 7,
        y: py + ph * 0.42,
        k: R() * 9,
      });
      eyes.push({
        x: cx + 7,
        y: py + ph * 0.42,
        k: eyes[eyes.length - 1].k,
      });
    } else {
      // armure dans une niche
      const ax = cx,
        ay = 300;
      layerCtx.fillStyle = '#0F0D1A';
      archPath(layerCtx, cx - 34, 150, 68, 210);
      layerCtx.fill();
      layerCtx.lineWidth = 4;
      layerCtx.strokeStyle = Z.m;
      layerCtx.stroke();
      layerCtx.fillStyle = '#7C8496';
      layerCtx.strokeStyle = INK_COLOR;
      layerCtx.lineWidth = 3;
      layerCtx.beginPath();
      layerCtx.ellipse(ax, ay - 62, 13, 15, 0, 0, 7);
      layerCtx.fill();
      layerCtx.stroke();
      layerCtx.fillStyle = '#10101A';
      layerCtx.fillRect(ax - 8, ay - 65, 16, 4);
      layerCtx.fillStyle = '#7C8496';
      roundRectPathOn(layerCtx, ax - 17, ay - 48, 34, 48, 6);
      layerCtx.fill();
      layerCtx.stroke();
      layerCtx.fillRect(ax - 26, ay - 46, 10, 34);
      layerCtx.fillRect(ax + 16, ay - 46, 10, 34);
      layerCtx.fillStyle = '#9AA2B4';
      layerCtx.fillRect(ax + 30, ay - 90, 4, 92);
      layerCtx.fillStyle = '#CFC4A0';
      layerCtx.beginPath();
      layerCtx.moveTo(ax + 25, ay - 90);
      layerCtx.lineTo(ax + 39, ay - 90);
      layerCtx.lineTo(ax + 32, ay - 108);
      layerCtx.fill();
      layerCtx.fillStyle = '#6C7486';
      layerCtx.fillRect(ax - 18, ay, 36, 52);
      layerCtx.strokeRect(ax - 18, ay, 36, 52);
    }
    // pilier à droite de la travée
    const px = b * bw + bw - 22;
    layerCtx.fillStyle = Z.w2;
    layerCtx.fillRect(px - 14, 60, 28, HEIGHT);
    layerCtx.fillStyle = Z.w3;
    layerCtx.fillRect(px - 14, 60, 6, HEIGHT);
    layerCtx.fillStyle = 'rgba(8,6,16,.25)';
    layerCtx.fillRect(px + 6, 60, 8, HEIGHT);
    layerCtx.strokeStyle = INK_COLOR;
    layerCtx.lineWidth = 3;
    layerCtx.strokeRect(px - 14, 60, 28, HEIGHT);
    layerCtx.fillStyle = Z.w3;
    layerCtx.fillRect(px - 20, 52, 40, 14);
    layerCtx.strokeRect(px - 20, 52, 40, 14);
    layerCtx.fillRect(px - 20, HEIGHT - 62, 40, 12);
    layerCtx.strokeRect(px - 20, HEIGHT - 62, 40, 12);
    // gargouille sur le chapiteau
    if (R() < 0.7) {
      layerCtx.fillStyle = '#6E7688';
      layerCtx.strokeStyle = INK_COLOR;
      layerCtx.lineWidth = 3;
      layerCtx.beginPath();
      layerCtx.moveTo(px - 14, 76);
      layerCtx.lineTo(px - 26, 70);
      layerCtx.lineTo(px - 28, 86);
      layerCtx.lineTo(px - 16, 92);
      layerCtx.closePath();
      layerCtx.fill();
      layerCtx.stroke();
      layerCtx.fillStyle = '#FFD27A';
      layerCtx.fillRect(px - 24, 76, 3, 3);
      layerCtx.beginPath();
      layerCtx.moveTo(px - 26, 70);
      layerCtx.lineTo(px - 30, 62);
      layerCtx.lineTo(px - 22, 68);
      layerCtx.fill();
    }
    // lanterne murale
    if (R() < 0.75) {
      const ly = 210 + R() * 60,
        lx = px;
      layerCtx.fillStyle = '#1A1410';
      layerCtx.fillRect(lx - 2, ly - 14, 4, 10);
      layerCtx.fillRect(lx - 8, ly - 4, 16, 18);
      layerCtx.strokeStyle = INK_COLOR;
      layerCtx.lineWidth = 2.5;
      layerCtx.strokeRect(lx - 8, ly - 4, 16, 18);
      layerCtx.fillStyle = Z.gl;
      layerCtx.fillRect(lx - 5, ly - 1, 10, 12);
      lights.push({
        x: lx,
        y: ly + 6,
        r: 110,
        k: R() * 9,
      });
    }
  }
  // piliers d'extrémité gauche
  layerCtx.fillStyle = Z.w2;
  layerCtx.fillRect(0, 60, 22, HEIGHT);
  layerCtx.strokeStyle = INK_COLOR;
  layerCtx.lineWidth = 3;
  layerCtx.strokeRect(-2, 60, 24, HEIGHT);
  // lustres
  const nl = 1 + (R() < 0.6 ? 1 : 0);
  for (let k = 0; k < nl; k++) {
    const lx = 180 + R() * 600,
      ly = 120 + R() * 50;
    layerCtx.strokeStyle = '#17120E';
    layerCtx.lineWidth = 3;
    layerCtx.beginPath();
    layerCtx.moveTo(lx, 0);
    layerCtx.lineTo(lx, ly - 16);
    layerCtx.stroke();
    layerCtx.beginPath();
    layerCtx.ellipse(lx, ly, 5, 5, 0, 0, 7);
    layerCtx.fillStyle = '#3A2E22';
    layerCtx.fill();
    layerCtx.lineWidth = 4;
    layerCtx.strokeStyle = '#17120E';
    layerCtx.beginPath();
    layerCtx.moveTo(lx - 46, ly + 10);
    layerCtx.quadraticCurveTo(lx - 30, ly + 30, lx, ly + 8);
    layerCtx.quadraticCurveTo(lx + 30, ly + 30, lx + 46, ly + 10);
    layerCtx.stroke();
    layerCtx.lineWidth = 3;
    layerCtx.strokeStyle = '#8A6A2E';
    layerCtx.beginPath();
    layerCtx.moveTo(lx - 46, ly + 10);
    layerCtx.quadraticCurveTo(lx - 30, ly + 30, lx, ly + 8);
    layerCtx.quadraticCurveTo(lx + 30, ly + 30, lx + 46, ly + 10);
    layerCtx.stroke();
    for (const dx of [-46, -23, 0, 23, 46]) {
      const fy = ly + (dx ? 10 - Math.abs(dx) * 0.0 : 6) - 2;
      layerCtx.fillStyle = '#F4EBD0';
      layerCtx.fillRect(lx + dx - 3, fy - 12, 6, 12);
      layerCtx.strokeStyle = INK_COLOR;
      layerCtx.lineWidth = 1.5;
      layerCtx.strokeRect(lx + dx - 3, fy - 12, 6, 12);
      flames.push({
        x: lx + dx,
        y: fy - 15,
        k: R() * 9,
      });
    }
    lights.push({
      x: lx,
      y: ly - 8,
      r: 170,
      k: R() * 9,
    });
  }
  // toiles d'araignée dans les coins
  const web = (x, y, sx, sy, sz) => {
    layerCtx.strokeStyle = 'rgba(235,235,245,.38)';
    layerCtx.lineWidth = 1.4;
    layerCtx.beginPath();
    for (let k = 0; k <= 5; k++) {
      const a = ((k / 5) * Math.PI) / 2;
      layerCtx.moveTo(x, y);
      layerCtx.lineTo(x + sx * Math.cos(a) * sz, y + sy * Math.sin(a) * sz);
    }
    for (let r = 1; r <= 4; r++) {
      const rr_ = (sz * r) / 4;
      layerCtx.moveTo(x + sx * rr_, y);
      for (let k = 1; k <= 5; k++) {
        const a = ((k / 5) * Math.PI) / 2,
          m = rr_ * (0.88 + 0.04 * (k % 2));
        layerCtx.lineTo(x + sx * Math.cos(a) * m, y + sy * Math.sin(a) * m);
      }
    }
    layerCtx.stroke();
  };
  web(24, 34, 1, 1, 92);
  web(WIDTH - 24, 34, -1, 1, 80);
  // grandes poutres du plafond
  layerCtx.fillStyle = 'rgba(8,6,16,.4)';
  for (let k = 0; k < 5; k++) layerCtx.fillRect((k * WIDTH) / 4 - 8, 34, 16, 26);
  // vignette
  const v = layerCtx.createRadialGradient(
    WIDTH / 2,
    HEIGHT / 2,
    HEIGHT * 0.38,
    WIDTH / 2,
    HEIGHT / 2,
    HEIGHT * 0.98,
  );
  v.addColorStop(0, 'rgba(6,4,14,0)');
  v.addColorStop(1, 'rgba(6,4,14,.62)');
  layerCtx.fillStyle = v;
  layerCtx.fillRect(0, 0, WIDTH, HEIGHT);
  return (backgroundCache[i] = {
    cv,
    lights,
    eyes,
    flames,
    Z,
  });
}
export function drawPaperBackground() {
  drawBackground(0, 0);
  ctx.fillStyle = 'rgba(238,224,184,.80)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const v = ctx.createRadialGradient(
    WIDTH / 2,
    HEIGHT / 2,
    HEIGHT * 0.3,
    WIDTH / 2,
    HEIGHT / 2,
    HEIGHT * 0.95,
  );
  v.addColorStop(0, 'rgba(60,35,10,0)');
  v.addColorStop(1, 'rgba(40,22,8,.45)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}
function roundRectPathOn(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
export function drawBackground(boil, i = 0) {
  const B = buildCastleBackground(i);
  ctx.drawImage(B.cv, 0, 0);
  const t = gameState.time;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const l of B.lights) {
    const f = 0.75 + 0.25 * Math.sin(t * 7 + l.k) + 0.1 * Math.sin(t * 17 + l.k * 3);
    const gr = ctx.createRadialGradient(l.x, l.y, 2, l.x, l.y, l.r);
    gr.addColorStop(0, 'rgba(255,200,110,' + 0.34 * f + ')');
    gr.addColorStop(1, 'rgba(255,200,110,0)');
    ctx.fillStyle = gr;
    ctx.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
  }
  ctx.restore();
  for (const f of B.flames) {
    const fl = 1 + 0.18 * Math.sin(t * 11 + f.k) + 0.1 * Math.sin(t * 27 + f.k);
    ctx.fillStyle = '#F28C28';
    ctx.beginPath();
    ctx.ellipse(f.x, f.y, 3.2, 6.5 * fl, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#FFE08A';
    ctx.beginPath();
    ctx.ellipse(f.x, f.y + 1.5, 1.5, 3.4 * fl, 0, 0, 7);
    ctx.fill();
  }
  for (const entity of B.eyes) {
    const bl = Math.sin(t * 0.9 + entity.k) > 0.93 ? 0 : 1;
    if (!bl) continue;
    const gl = 0.6 + 0.4 * Math.sin(t * 3 + entity.k);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(180,255,140,' + 0.35 * gl + ')';
    ctx.beginPath();
    ctx.arc(entity.x, entity.y, 9, 0, 7);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#D8FF8A';
    ctx.beginPath();
    ctx.ellipse(entity.x, entity.y, 2.6, 3.4, 0, 0, 7);
    ctx.fill();
  }
  // brume rampante
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = '#B8C6E0';
  for (let k = 0; k < 4; k++) {
    const x = ((t * 14 + k * 260) % 1300) - 220;
    ctx.beginPath();
    ctx.ellipse(x, HEIGHT - 120 + Math.sin(t * 0.6 + k) * 8, 190, 26, 0, 0, 7);
    ctx.fill();
  }
  ctx.restore();
}
export function drawFloorFx() {
  if (!runtime.level.boss || runtime.level.boss.kind !== 'giant') return;
  const t = gameState.time;
  ctx.save();
  ctx.lineCap = 'round';
  // fissures sur les deux dalles qui tomberont aux prochains pas
  {
    const heavy = (runtime.colossusFloor.steps || 0) % 2 === 1;
    let l = -1,
      r = -1;
    for (let q = 1; q <= 10; q++)
      if (runtime.grid[14][q] !== '.') {
        l = q;
        break;
      }
    for (let q = 28; q >= 19; q--)
      if (runtime.grid[14][q] !== '.') {
        r = q;
        break;
      }
    for (const cc of [l, r]) {
      if (cc < 0) continue;
      const x = cc * TILE;
      ctx.strokeStyle = INK_COLOR;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x + 6, FLOOR_Y + 1);
      ctx.lineTo(x + 12, FLOOR_Y + 9);
      ctx.lineTo(x + 9, FLOOR_Y + 17);
      ctx.lineTo(x + 16, FLOOR_Y + 27);
      if (heavy) {
        ctx.moveTo(x + 26, FLOOR_Y + 2);
        ctx.lineTo(x + 20, FLOOR_Y + 11);
        ctx.lineTo(x + 24, FLOOR_Y + 20);
        ctx.moveTo(x + 2, FLOOR_Y + 14);
        ctx.lineTo(x + 14, FLOOR_Y + 16);
        ctx.lineTo(x + 30, FLOOR_Y + 12);
      }
      ctx.stroke();
      if (heavy && Math.floor(t * 6 + cc) % 3 === 0) {
        ctx.fillStyle = 'rgba(233,223,196,.8)';
        ctx.fillRect(x + 4 + ((cc * 7) % 20), FLOOR_Y - 2 - ((t * 30) % 10), 3, 3);
      }
    }
  }
  // débris qui tombent
  const nf = [];
  for (const f of runtime.colossusFloor.fx || []) {
    const a = t - f.t;
    if (a > 1.6) continue;
    nf.push(f);
    for (let r = 0; r < 3; r++)
      for (let q = 0; q < 2; q++) {
        const sd = ((f.c * 13 + r * 7 + q * 5) % 9) - 4,
          x0 = f.c * TILE + q * 16 + 8,
          vy0 = -60 - ((f.c + r * 3 + q) % 5) * 30;
        const x = x0 + sd * a * 18,
          y = FLOOR_Y + r * TILE + 16 + vy0 * a + 950 * a * a,
          rot = a * (sd || 1) * 3;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.globalAlpha = Math.max(0, 1 - a / 1.6);
        ctx.fillStyle = (f.c + r + q) % 2 ? '#51424A' : '#5C4B50';
        ctx.strokeStyle = INK_COLOR;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.rect(-8, -7, 16, 14);
        ctx.fill();
        ctx.stroke();
        if (r === 0) {
          ctx.fillStyle = '#CDB98A';
          ctx.fillRect(-8, -7, 16, 4);
        }
        ctx.restore();
      }
  }
  runtime.colossusFloor.fx = nf;
  // dalles qui reviennent : projetées en l'air, elles retombent à leur place
  for (let c = 1; c <= 28; c++) {
    const rs = runtime.colossusFloor.rise[c];
    if (!rs) continue;
    const a = t - rs;
    if (a >= 0.9) continue;
    const u = a / 0.9,
      off = -Math.pow(1 - u, 2) * (260 + ((c * 37) % 5) * 40),
      rot = (1 - u) * (c % 2 ? 0.5 : -0.5);
    for (let r = 14; r <= 16; r++) {
      ctx.save();
      ctx.translate(c * TILE + TILE / 2, r * TILE + TILE / 2 + off);
      ctx.rotate(rot);
      ctx.fillStyle = (c + r) % 3 ? '#51424A' : '#5C4B50';
      ctx.strokeStyle = INK_COLOR;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.rect(-TILE / 2, -TILE / 2, TILE, TILE);
      ctx.fill();
      ctx.stroke();
      if (r === 14) {
        ctx.fillStyle = '#CDB98A';
        ctx.fillRect(-TILE / 2, -TILE / 2, TILE, 7);
      }
      ctx.restore();
    }
  }
  ctx.restore();
}
