// Écran « Commandes » (menu pause) : onglet Clavier (liste) et onglet Manette (manette dessinée, indications autour des boutons).
// Le choix du dispositif est mémorisé : en mode manette, le clavier à l'écran sous le jeu est masqué.
import { HEIGHT, WIDTH } from '../core/config.ts';
import { ctx } from '../core/canvas.ts';
import { drawBackground } from '../render/background.js';
import {
  FONT_BODY,
  INK_COLOR,
  drawButton,
  drawOutlinedText,
  roundRectPath,
  uiHitBoxes,
} from '../render/primitives.js';

let scheme = 'keyboard';
try {
  scheme = localStorage.getItem('echo-controls') === 'gamepad' ? 'gamepad' : 'keyboard';
} catch {}
const applyScheme = () => {
  try {
    document.body.classList.toggle('pad-mode', scheme === 'gamepad');
  } catch {}
};
applyScheme();
export const getScheme = () => scheme;
export function setScheme(s) {
  scheme = s === 'gamepad' ? 'gamepad' : 'keyboard';
  try {
    localStorage.setItem('echo-controls', scheme);
  } catch {}
  applyScheme();
}

const KEYBOARD_ROWS = [
  ['← → (ou Q D)', 'Bouger'],
  ['↑ ou Espace', 'Sauter · grimper · nager vers le haut'],
  ['↓', 'Descendre l’échelle · plonger'],
  ['A', 'Coup de poing'],
  ['X', 'Tir (une fois le pouvoir gagné)'],
  ['Z', 'Lancer l’écho choisi'],
  ['E', 'Changer d’écho'],
  ['1 – 5', 'Choisir un écho directement'],
  ['R · T', 'Rembobiner 5 s · 10 s'],
  ['M', 'Carte'],
  ['P ou Échap', 'Pause'],
  ['I · N', 'Infos · son'],
  ['Entrée', 'Dormir · valider'],
];
function text(t, x, y, size, color, align = 'left', weight = 800) {
  ctx.font = weight + ' ' + size + 'px ' + FONT_BODY;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  ctx.fillText(t, x, y);
}
function drawKeyboardTab() {
  const x0 = WIDTH / 2 - 330,
    y0 = 158,
    rh = 25;
  KEYBOARD_ROWS.forEach(([k, a], i) => {
    const y = y0 + i * rh;
    roundRectPath(x0, y - 19, 150, 24, 7);
    ctx.fillStyle = '#F6EBCB';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK_COLOR;
    ctx.stroke();
    text(k, x0 + 75, y - 2, 14, INK_COLOR, 'center', 900);
    text(a, x0 + 170, y - 2, 16, '#F6EBCB');
  });
}
// pastille de bouton : disque + lettre
function dot(x, y, r, fill, label, labelColor = INK_COLOR) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 7);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = INK_COLOR;
  ctx.stroke();
  if (label) text(label, x, y + 5, 13, labelColor, 'center', 900);
}
/** Indication : trait du bouton (bx,by) au texte posé en (tx,ty) ; align = côté du texte. */
function callout(bx, by, tx, ty, lines, align) {
  ctx.font = '900 16px ' + FONT_BODY;
  const w = Math.max(
    ...lines.map(
      (l, k) =>
        (ctx.font = (k ? 700 : 900) + ' ' + (k ? 13 : 16) + 'px ' + FONT_BODY) && ctx.measureText(l).width,
    ),
  );
  // le trait s'arrête au bord du texte, à mi-hauteur de sa première ligne
  const ex = align === 'left' ? tx + w + 8 : align === 'right' ? tx - w - 8 : tx;
  const ey = align === 'center' ? ty - 22 : ty - 5;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(ex, ey);
  ctx.strokeStyle = 'rgba(246,235,203,.55)';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.stroke();
  ctx.setLineDash([]);
  lines.forEach((l, i) =>
    text(l, tx, ty + i * 17, i ? 13 : 16, i ? 'rgba(246,235,203,.7)' : '#F6EBCB', align, i ? 700 : 900),
  );
}
function drawGamepadTab() {
  const cx = WIDTH / 2,
    cy = 296;
  // corps de la manette
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 150, cy - 70);
  ctx.quadraticCurveTo(cx, cy - 100, cx + 150, cy - 70);
  ctx.quadraticCurveTo(cx + 215, cy - 40, cx + 225, cy + 40);
  ctx.quadraticCurveTo(cx + 240, cy + 125, cx + 190, cy + 135);
  ctx.quadraticCurveTo(cx + 150, cy + 140, cx + 120, cy + 70);
  ctx.quadraticCurveTo(cx, cy + 55, cx - 120, cy + 70);
  ctx.quadraticCurveTo(cx - 150, cy + 140, cx - 190, cy + 135);
  ctx.quadraticCurveTo(cx - 240, cy + 125, cx - 225, cy + 40);
  ctx.quadraticCurveTo(cx - 215, cy - 40, cx - 150, cy - 70);
  ctx.closePath();
  ctx.fillStyle = '#4A5568';
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = INK_COLOR;
  ctx.stroke();
  ctx.restore();
  // gâchettes et pare-chocs
  for (const s of [-1, 1]) {
    roundRectPath(cx + s * 150 - 38, cy - 96, 76, 20, 8);
    ctx.fillStyle = '#718096';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK_COLOR;
    ctx.stroke();
    roundRectPath(cx + s * 150 - 30, cy - 124, 60, 24, 9);
    ctx.fillStyle = '#A0AEC0';
    ctx.fill();
    ctx.stroke();
  }
  // sticks, croix, boutons
  dot(cx - 120, cy - 8, 27, '#2D3748');
  dot(cx - 120, cy - 8, 17, '#171923');
  dot(cx + 60, cy + 46, 26, '#2D3748');
  dot(cx + 60, cy + 46, 16, '#171923');
  const dp = cx - 60,
    dq = cy + 46;
  ctx.fillStyle = '#E2E8F0';
  ctx.fillRect(dp - 8, dq - 25, 16, 50);
  ctx.fillRect(dp - 25, dq - 8, 50, 16);
  ctx.strokeStyle = INK_COLOR;
  ctx.lineWidth = 3;
  ctx.strokeRect(dp - 8, dq - 25, 16, 50);
  ctx.strokeRect(dp - 25, dq - 8, 50, 16);
  const fx = cx + 120,
    fy = cy - 8;
  dot(fx, fy + 28, 16, '#5BC27A', '▼');
  dot(fx + 28, fy, 16, '#E2574C', '●');
  dot(fx - 28, fy, 16, '#4D8FE0', '■');
  dot(fx, fy - 28, 16, '#F2C45A', '▲');
  dot(cx - 22, cy - 34, 8, '#E2E8F0');
  dot(cx + 22, cy - 34, 8, '#E2E8F0');
  // indications
  callout(cx - 150, cy - 124, 40, 128, ['Rembobiner 10 s', 'LT · L2 · ZL'], 'left');
  callout(cx - 150, cy - 96, 40, 188, ['Rembobiner 5 s', 'LB · L1 · L'], 'left');
  callout(cx - 120, cy - 8, 40, 288, ['Bouger', '↑ grimper / nager · ↓ plonger'], 'left');
  callout(dp, dq + 10, 40, 360, ['Croix : comme le stick'], 'left');
  callout(cx - 22, cy - 34, cx - 110, 452, ['Carte', 'Vue · Share · −'], 'center');
  callout(cx + 22, cy - 34, cx + 110, 452, ['Pause', 'Menu · Options · +'], 'center');
  callout(cx + 150, cy - 124, WIDTH - 40, 128, ['Tir', 'RT · R2 · ZR'], 'right');
  callout(cx + 150, cy - 96, WIDTH - 40, 188, ['Changer d’écho', 'RB · R1 · R'], 'right');
  callout(fx, fy - 28, WIDTH - 40, 258, ['Tir', '△ · Y (Xbox) · X (Switch)'], 'right');
  callout(fx + 28, fy, WIDTH - 40, 318, ['Écho · retour', '○ · B (Xbox) · A (Switch)'], 'right');
  callout(fx - 28, fy, WIDTH - 40, 378, ['Coup', '□ · X (Xbox) · Y (Switch)'], 'right');
  callout(fx, fy + 28, WIDTH - 40, 438, ['Sauter · valider', '✕ · A (Xbox) · B (Switch)'], 'right');
}
export function drawControls() {
  drawBackground(0, 0);
  uiHitBoxes.length = 0;
  ctx.fillStyle = 'rgba(14,10,22,.86)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  drawOutlinedText('COMMANDES', WIDTH / 2, 62, 44, '#E2A93B');
  const on = { c: '#E2A93B', d: '#A9741B' },
    off = { c: '#9A9A9A', d: '#5E5E5E' };
  drawButton('ctab_k', WIDTH / 2 - 250, 78, 240, 44, 'CLAVIER', {
    size: 20,
    lip: 9,
    r: 13,
    ...(scheme === 'keyboard' ? on : off),
  });
  drawButton('ctab_g', WIDTH / 2 + 10, 78, 240, 44, 'MANETTE', {
    size: 20,
    lip: 9,
    r: 13,
    ...(scheme === 'gamepad' ? on : off),
  });
  if (scheme === 'keyboard') drawKeyboardTab();
  else drawGamepadTab();
  drawButton('cback', WIDTH / 2 - 90, HEIGHT - 52, 180, 36, 'RETOUR', { size: 19, lip: 8, r: 12 });
}
