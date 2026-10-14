import { HEIGHT, WIDTH } from '../core/config.js';
import { ctx } from '../core/canvas.js';
import { gameState } from '../state/state.js';
export const IS_TOUCH_DEVICE = typeof matchMedia !== 'undefined' && matchMedia('(pointer:coarse)').matches;
export const grainTexture = document.createElement('canvas');
grainTexture.width = grainTexture.height = 256;
{
  const g = grainTexture.getContext('2d');
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = Math.random() < 0.5 ? 'rgba(60,35,10,.35)' : 'rgba(255,248,220,.3)';
    g.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 1.5, 1 + Math.random() * 1.5);
  }
}
export const INK_COLOR = '#1B1612',
  DIRT_COLOR = '#3B2B1E';
export const FONT_DISPLAY = 'Chango,Impact,sans-serif',
  FONT_BODY = 'Nunito,system-ui,sans-serif';
export function roundRectPath(x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h);
}
export function drawOutlinedText(txt, x, y, size, fill, align = 'center') {
  ctx.font = size + 'px ' + FONT_DISPLAY;
  ctx.textAlign = align;
  ctx.lineJoin = 'round';
  ctx.lineWidth = size / 5;
  ctx.strokeStyle = INK_COLOR;
  ctx.strokeText(txt, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(txt, x, y);
}
export const uiHitBoxes = [];
/* bouton « touche de clavier » : face orange, lèvre brune, ombre sombre décalée, texte blanc ombré */
export function drawButton(id, x, y, w, h, label, o = {}) {
  const lip = o.lip || 10,
    pr = gameState.pressedButton === id,
    d = pr ? lip - 3 : 0,
    col = o.c || '#F0A64B',
    dk = o.d || '#8A5419',
    R = o.r || 14;
  uiHitBoxes.push({
    id,
    x: x - 4,
    y: y - 4,
    w: w + 8,
    h: h + lip + 8,
  });
  ctx.save();
  ctx.fillStyle = '#261704';
  roundRectPath(x - 5, y + 5 - (pr ? 2 : 0), w + 10, h + lip + 1, R + 3);
  ctx.fill();
  ctx.fillStyle = dk;
  roundRectPath(x, y + d, w, h + lip - d, R);
  ctx.fill();
  ctx.fillStyle = col;
  roundRectPath(x, y + d, w, h, R);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.35)';
  roundRectPath(x + 3, y + d + 1.5, w - 6, 3, 2);
  ctx.fill();
  const fs = o.size || 26;
  ctx.font = '900 ' + fs + 'px ' + FONT_BODY;
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
export const hitTestUI = (fx, fy) => {
  const px = fx * WIDTH,
    py = fy * HEIGHT;
  for (const u of uiHitBoxes) if (px >= u.x && px <= u.x + u.w && py >= u.y && py <= u.y + u.h) return u.id;
  return null;
};
export function drawWrappedText(txt, x, y, maxW, lh, size = 16) {
  ctx.font = '700 ' + size + 'px ' + FONT_BODY;
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
