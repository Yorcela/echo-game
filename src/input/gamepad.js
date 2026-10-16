// Manette (Xbox, PlayStation, Switch Pro… : disposition « standard » du navigateur).
// Les boutons rejouent les touches du clavier (événements synthétiques) : même logique, menus compris.
//
//   Stick gauche / croix : bouger (haut = grimper / nager vers le haut, bas = descendre / plonger)
//   A (Xbox) · ✕ (PS) · B (Switch) : sauter / valider dans les menus
//   X (Xbox) · □ (PS) · Y (Switch) : coup
//   Y (Xbox) · △ (PS) · X (Switch) : tir          (aussi RT)
//   B (Xbox) · ○ (PS) · A (Switch) : écho · retour dans les menus
//   RB / R1 : changer d'écho          LB / L1 : rembobiner 5 s          LT / L2 : rembobiner 10 s
//   Menu / Start / + : pause           Vue / Share / − : carte
import { gameState, input, showMessage } from '../state/state.ts';

const STICK = 0.5;
const KEY = {
  jump: { code: 'Space', key: ' ' },
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
  0: () => tap(KEY.jump),
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
let prev = [];
let held = { left: false, right: false, down: false, jump: false };
let wasConnected = false;
let prevUp = false;
const setHeld = (name, on) => {
  if (held[name] === on) return;
  held[name] = on;
  fire(on ? 'keydown' : 'keyup', KEY[name]);
};

/** À appeler une fois par image : lit la première manette connectée. */
export function pollGamepad() {
  const pads = (navigator.getGamepads && navigator.getGamepads()) || [];
  const pad = Array.prototype.find.call(pads, (p) => p && p.connected && p.mapping === 'standard') || null;
  if (!pad) {
    if (wasConnected) {
      for (const n of Object.keys(held)) setHeld(n, false);
      input.u = 0;
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
  setHeld('jump', b(0) && gameState.mode === 'play');
  const ax = pad.axes[0] || 0,
    ay = pad.axes[1] || 0;
  const left = ax < -STICK || b(14),
    right = ax > STICK || b(15),
    down = ay > STICK || b(13),
    up = ay < -STICK || b(12);
  setHeld('left', left && !right);
  setHeld('right', right && !left);
  setHeld('down', down);
  // haut : grimper / nager vers le haut (sans sauter)
  if (up !== prevUp) input.u = up && gameState.mode === 'play' ? 1 : 0;
  prevUp = up;
}
