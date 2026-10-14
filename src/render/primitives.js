import { H, W } from '../core/config.js';
import { ctx } from '../core/canvas.js';
import { gameState } from '../state/state.js';
export const TOUCH = typeof matchMedia !== 'undefined' && matchMedia('(pointer:coarse)').matches;
export const grain = document.createElement('canvas');
grain.width = grain.height = 256;
{
  const g = grain.getContext('2d');
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = Math.random() < 0.5 ? 'rgba(60,35,10,.35)' : 'rgba(255,248,220,.3)';
    g.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 1.5, 1 + Math.random() * 1.5);
  }
}
export const INK = '#1B1612',
  DIRT = '#3B2B1E';
export const FD = 'Chango,Impact,sans-serif',
  FB = 'Nunito,system-ui,sans-serif';
export function rr(x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h);
}
export function outlined(txt, x, y, size, fill, align = 'center') {
  ctx.font = size + 'px ' + FD;
  ctx.textAlign = align;
  ctx.lineJoin = 'round';
  ctx.lineWidth = size / 5;
  ctx.strokeStyle = INK;
  ctx.strokeText(txt, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(txt, x, y);
}
export const UI = [];
/* bouton « touche de clavier » : face orange, lèvre brune, ombre sombre décalée, texte blanc ombré */
export function btn(id, x, y, w, h, label, o = {}) {
  const lip = o.lip || 10,
    pr = gameState.press === id,
    d = pr ? lip - 3 : 0,
    col = o.c || '#F0A64B',
    dk = o.d || '#8A5419',
    R = o.r || 14;
  UI.push({
    id,
    x: x - 4,
    y: y - 4,
    w: w + 8,
    h: h + lip + 8,
  });
  ctx.save();
  ctx.fillStyle = '#261704';
  rr(x - 5, y + 5 - (pr ? 2 : 0), w + 10, h + lip + 1, R + 3);
  ctx.fill();
  ctx.fillStyle = dk;
  rr(x, y + d, w, h + lip - d, R);
  ctx.fill();
  ctx.fillStyle = col;
  rr(x, y + d, w, h, R);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.35)';
  rr(x + 3, y + d + 1.5, w - 6, 3, 2);
  ctx.fill();
  const fs = o.size || 26;
  ctx.font = '900 ' + fs + 'px ' + FB;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const tx = x + w / 2,
    ty = y + d + h / 2 + 1;
  if (o.icon) {
    o.icon(tx, ty - 1, h);
  } else {
    ctx.fillStyle = '#000';
    ctx.fillText(label, tx + 2, ty + 2);
    ctx.fillStyle = '#fff';
    ctx.fillText(label, tx, ty);
  }
  ctx.restore();
}
export const hitUI = (fx, fy) => {
  const px = fx * W,
    py = fy * H;
  for (const u of UI) if (px >= u.x && px <= u.x + u.w && py >= u.y && py <= u.y + u.h) return u.id;
  return null;
};
export function wrap(txt, x, y, maxW, lh, size = 16) {
  ctx.font = '700 ' + size + 'px ' + FB;
  ctx.textAlign = 'left';
  const w = txt.split(' ');
  let line = '',
    yy = y;
  for (const word of w) {
    const t = line ? line + ' ' + word : word;
    if (ctx.measureText(t).width > maxW && line) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lh;
    } else line = t;
  }
  ctx.fillText(line, x, yy);
  return yy;
}
/* ---------- Décor : château hanté ---------- */
