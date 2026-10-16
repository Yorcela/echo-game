// Manette (Xbox, PlayStation, Switch Pro… : disposition « standard » du navigateur).
// Les boutons rejouent les touches du clavier (événements synthétiques) : même logique, menus compris.
//
//   Stick gauche / croix : bouger (haut = grimper / nager vers le haut, bas = descendre / plonger)
//   A (Xbox) · ✕ (PS) · B (Switch) : sauter / valider dans les menus ; près d'un lit utile : dormir (pas de saut)
//   X (Xbox) · □ (PS) · Y (Switch) : coup
//   Y (Xbox) · △ (PS) · X (Switch) : tir          (aussi RT)
//   B (Xbox) · ○ (PS) · A (Switch) : écho · retour dans les menus
//   RB / R1 : changer d'écho          LB / L1 : rembobiner 5 s          LT / L2 : rembobiner 10 s
//   Menu / Start / + : pause           Vue / Share / − : carte
import { gameState, input, showMessage } from '../state/state.ts';
import { ctx } from '../core/canvas.ts';
import { HEIGHT, WIDTH } from '../core/config.ts';
import { INK_COLOR, roundRectPath, uiFocus, uiHitBoxes } from '../render/primitives.js';
import { advance } from './input.js';

const STICK = 0.5;
const KEY = {
  jump: { code: 'Space', key: ' ' },
  enter: { code: 'Enter', key: 'Enter' },
  hit: { code: 'KeyA', key: 'a' },
  shoot: { code: 'KeyX', key: 'x' },
  echo: { code: 'KeyZ', key: 'z' },
  cycle: { code: 'KeyE', key: 'e' },
  back5: { code: 'KeyR', key: 'r' },
  back10: { code: 'KeyT', key: 't' },
  map: { code: 'KeyM', key: 'm' },
  esc: { code: 'Escape', key: 'Escape' },
  left: { code: 'ArrowLeft', key: 'ArrowLeft' },
  right: { code: 'ArrowRight', key: 'ArrowRight' },
  down: { code: 'ArrowDown', key: 'ArrowDown' },
};
const fire = (type, k) => dispatchEvent(new KeyboardEvent(type, { ...k, bubbles: true, cancelable: true }));
const tap = (k) => {
  fire('keydown', k);
  fire('keyup', k);
};
// bouton standard → action (appelée sur le front montant)
const BUTTONS = {
  0: () => {
    if (menuConfirm()) return;
    // à côté d'un lit utile (blessé ou Temps entamé) : A dort au lieu de sauter
    if (gameState.mode === 'play' && gameState.isNearBed) {
      noJumpUntilRelease = true;
      tap(KEY.enter);
      return;
    }
    tap(KEY.jump);
  },
  1: () => tap(gameState.mode === 'play' ? KEY.echo : KEY.esc),
  2: () => tap(KEY.hit),
  3: () => tap(KEY.shoot),
  4: () => tap(KEY.back5),
  5: () => tap(KEY.cycle),
  6: () => tap(KEY.back10),
  7: () => tap(KEY.shoot),
  8: () => tap(KEY.map),
  9: () => tap(KEY.esc),
};
// navigation dans les menus : le focus saute d'un bouton à l'autre dans la direction du stick ou de la croix
const MENUS = ['title', 'pause', 'controls', 'scores', 'trial', 'map', 'sleep'];
let focusId = null;
// miroir de focusId lisible par le dessin des boutons
const setFocus = (id) => {
  focusId = id;
  uiFocus.id = id;
};
let navCooldown = 0;
let lastMode = '';
let lastFocusMode = '';
let pendingDefault = 0;
const DEFAULT_FOCUS = ['title', 'pause', 'controls', 'scores', 'trial', 'sleep'];
const centerOf = (u) => [u.x + u.w / 2, u.y + u.h / 2];
function moveFocus(dx, dy) {
  // hors boutons du HUD (pause, lit) qui ne font pas partie du menu
  const boxes = uiHitBoxes.filter((u) => u.w > 0 && !['pause', 'bed', 'bedz'].includes(u.id));
  if (!boxes.length) return;
  const first = boxes.reduce((a, b) => (b.y < a.y - 4 || (Math.abs(b.y - a.y) <= 4 && b.x < a.x) ? b : a));
  const last = boxes.reduce((a, b) => (b.y > a.y + 4 || (Math.abs(b.y - a.y) <= 4 && b.x > a.x) ? b : a));
  // à l'ouverture, le bouton du haut est le point de départ implicite : bas = le suivant, haut = le dernier
  const cur = boxes.find((u) => u.id === focusId) || first;
  const [cx, cy] = centerOf(cur);
  let best = null,
    bs = Infinity;
  for (const u of boxes) {
    if (u === cur) continue;
    const [ux, uy] = centerOf(u),
      mx = ux - cx,
      my = uy - cy,
      along = dx ? mx * dx : my * dy,
      across = dx ? Math.abs(my) : Math.abs(mx);
    if (along <= 4) continue;
    const score = along + across * 2;
    if (score < bs) {
      bs = score;
      best = u;
    }
  }
  // rien dans cette direction : on boucle (haut depuis le premier → dernier, bas depuis le dernier → premier)
  if (!best && (dy || dx))
    best = (dy < 0 || dx < 0 ? last : first) === cur ? null : dy < 0 || dx < 0 ? last : first;
  if (best) setFocus(best.id);
  else if (!focusId) setFocus(cur.id);
}
/** Anneau doré autour du bouton sélectionné à la manette (à dessiner après l'écran). */
export function drawMenuFocus() {
  if (!focusId || !MENUS.includes(gameState.mode)) return;
  const u = uiHitBoxes.find((q) => q.id === focusId);
  // les boutons se signalent par leur taille ; le cadre ne sert qu'aux éléments qui n'en ont pas (cases de la carte)
  if (!u || u.sc !== undefined) return;
  const pulse = 0.5 + 0.5 * Math.sin(gameState.time * 8);
  ctx.save();
  const k = u.sc || 1,
    mx = u.x + u.w / 2,
    my = u.y + u.h / 2,
    rw = u.w * k + 10,
    rh = u.h * k + 10;
  roundRectPath(mx - rw / 2, my - rh / 2, rw, rh, 14);
  ctx.lineWidth = 7;
  ctx.strokeStyle = INK_COLOR;
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(255,236,150,' + (0.75 + 0.25 * pulse) + ')';
  ctx.stroke();
  ctx.restore();
}
/** Navigation de menu au clavier : déplace le focus ; renvoie true si l'événement est traité. */
export function menuNavigate(dx, dy) {
  if (!MENUS.includes(gameState.mode)) return false;
  moveFocus(dx, dy);
  return true;
}
/** Valide le bouton ciblé (Entrée / Espace / A) ; false s'il n'y a pas de focus. */
export function menuConfirm() {
  const u = MENUS.includes(gameState.mode) && focusId && uiHitBoxes.find((q) => q.id === focusId);
  if (!u) return false;
  advance((u.x + u.w / 2) / WIDTH, (u.y + u.h / 2) / HEIGHT);
  return true;
}
/** À la souris ou au tactile, on repasse en tailles normales. */
export function clearMenuFocus() {
  setFocus(null);
}
let prev = [];
let held = { left: false, right: false, down: false, jump: false };
let wasConnected = false;
let prevUp = false;
let noJumpUntilRelease = false;
const setHeld = (name, on) => {
  if (held[name] === on) return;
  held[name] = on;
  fire(on ? 'keydown' : 'keyup', KEY[name]);
};

/** À appeler une fois par image : lit la première manette connectée. */
export function pollGamepad() {
  // le focus de menu (clavier ou manette) ne survit pas à un changement d'écran
  if (gameState.mode !== lastFocusMode) {
    lastFocusMode = gameState.mode;
    setFocus(null);
    pendingDefault = DEFAULT_FOCUS.includes(gameState.mode) ? 2 : 0; // attend que le menu ait été dessiné
  }
  // à l'ouverture d'un menu, son premier bouton (Reprendre, Jouer…) est sélectionné par défaut
  if (pendingDefault && --pendingDefault === 0) {
    const boxes = uiHitBoxes.filter((u) => u.w > 0 && !['pause', 'bed', 'bedz'].includes(u.id));
    if (boxes.length)
      setFocus(boxes.reduce((a, b) => (b.y < a.y - 4 || (Math.abs(b.y - a.y) <= 4 && b.x < a.x) ? b : a)).id);
  }
  const pads = (navigator.getGamepads && navigator.getGamepads()) || [];
  const pad = Array.prototype.find.call(pads, (p) => p && p.connected && p.mapping === 'standard') || null;
  if (!pad) {
    if (wasConnected) {
      for (const n of Object.keys(held)) setHeld(n, false);
      input.u = 0;
      setFocus(null);
      wasConnected = false;
      prev = [];
    }
    return;
  }
  if (!wasConnected) {
    wasConnected = true;
    showMessage('Manette connectée', 2.2);
  }
  const b = (i) => !!(pad.buttons[i] && (pad.buttons[i].pressed || pad.buttons[i].value > 0.5));
  // boutons : front montant
  for (const i of Object.keys(BUTTONS)) {
    const on = b(+i);
    if (on && !prev[+i]) BUTTONS[i]();
    prev[+i] = on;
  }
  // saut maintenu (hauteur de saut variable) : le bouton A reste enfoncé
  if (!b(0)) noJumpUntilRelease = false;
  setHeld('jump', b(0) && gameState.mode === 'play' && !noJumpUntilRelease);
  const ax = pad.axes[0] || 0,
    ay = pad.axes[1] || 0;
  const left = ax < -STICK || b(14),
    right = ax > STICK || b(15),
    down = ay > STICK || b(13),
    up = ay < -STICK || b(12);
  if (MENUS.includes(gameState.mode)) {
    // menus : le stick et la croix déplacent le focus (répétition toutes les 0,22 s)
    for (const n of Object.keys(held)) if (n !== 'jump') setHeld(n, false);
    if (gameState.mode !== lastMode) {
      lastMode = gameState.mode;
      setFocus(null);
    }
    navCooldown = Math.max(0, navCooldown - (gameState.dtPad || 1 / 60));
    const dir = left ? [-1, 0] : right ? [1, 0] : up ? [0, -1] : down ? [0, 1] : null;
    if (dir && navCooldown <= 0) {
      moveFocus(dir[0], dir[1]);
      navCooldown = 0.22;
    } else if (!dir) navCooldown = 0;
    prevUp = false;
    return;
  }
  lastMode = gameState.mode;
  setFocus(null);
  setHeld('left', left && !right);
  setHeld('right', right && !left);
  setHeld('down', down);
  // haut : grimper / nager vers le haut (sans sauter)
  if (up !== prevUp) input.u = up && gameState.mode === 'play' ? 1 : 0;
  prevUp = up;
}
