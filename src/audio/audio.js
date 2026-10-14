import { runtime } from '../state/runtime.js';
import { bossAlive, gameState } from '../state/state.js';
/* ---------- Son : tout est synthétisé, aucun fichier ---------- */
let AC = null,
  master,
  musicOn = false;
runtime.mute = false;
export function aud() {
  if (!AC) {
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      master = AC.createGain();
      master.gain.value = 0.55;
      master.connect(AC.destination);
    } catch (e) {
      AC = null;
      return;
    }
  }
  if (AC.state === 'suspended') AC.resume();
  if (!musicOn && AC) {
    musicOn = true;
    music(0);
  }
}
function tone(f, d, type = 'square', v = 0.12, slide = 0, delay = 0) {
  if (!AC || runtime.mute) return;
  const t = AC.currentTime + delay,
    o = AC.createOscillator(),
    g = AC.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
  g.gain.setValueAtTime(v, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + d);
  o.connect(g);
  g.connect(master);
  o.start(t);
  o.stop(t + d + 0.03);
}
function noise(d, v = 0.15, delay = 0) {
  if (!AC || runtime.mute) return;
  const n = Math.floor(AC.sampleRate * d),
    b = AC.createBuffer(1, n, AC.sampleRate),
    a = b.getChannelData(0);
  for (let i = 0; i < n; i++) a[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = AC.createBufferSource(),
    g = AC.createGain(),
    f = AC.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = 900;
  g.gain.value = v;
  s.buffer = b;
  s.connect(f);
  f.connect(g);
  g.connect(master);
  s.start(AC.currentTime + delay);
}
export function sfx(k) {
  switch (k) {
    case 'shot':
      tone(880, 0.07, 'square', 0.06, -500);
      tone(520, 0.1, 'triangle', 0.05, -200, 0.03);
      break;
    case 'jump':
      tone(340, 0.14, 'square', 0.07, 380);
      break;
    case 'land':
      noise(0.09, 0.12);
      break;
    case 'plate':
      tone(220, 0.08, 'square', 0.09);
      tone(440, 0.12, 'square', 0.08, 0, 0.06);
      break;
    case 'clone':
      tone(660, 0.1, 'triangle', 0.14);
      tone(990, 0.22, 'triangle', 0.12, 0, 0.08);
      break;
    case 'off':
      tone(520, 0.14, 'triangle', 0.1, -280);
      break;
    case 'tick':
      tone(800, 0.04, 'square', 0.06);
      break;
    case 'fail':
      tone(130, 0.16, 'square', 0.09);
      break;
    case 'hit':
      tone(180, 0.1, 'square', 0.12, -90);
      noise(0.08, 0.12);
      break;
    case 'break':
      noise(0.3, 0.2);
      tone(120, 0.2, 'sawtooth', 0.08, -60);
      break;
    case 'clang':
      tone(900, 0.12, 'square', 0.07, -500);
      tone(650, 0.2, 'triangle', 0.1, -300, 0.03);
      break;
    case 'dash':
      tone(300, 0.16, 'sawtooth', 0.08, 900);
      noise(0.12, 0.08);
      break;
    case 'rewind':
      for (let i = 0; i < 10; i++) tone(1000 - i * 85, 0.09, 'sawtooth', 0.05, -260, i * 0.05);
      noise(0.5, 0.08);
      break;
    case 'rewindEnd':
      tone(200, 0.18, 'triangle', 0.12);
      tone(300, 0.18, 'triangle', 0.1, 0, 0.08);
      break;
    case 'death':
      tone(330, 0.45, 'sawtooth', 0.12, -250);
      noise(0.2, 0.14);
      break;
    case 'win':
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.13, 0, i * 0.1));
      break;
    case 'gain':
      [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.4, 'triangle', 0.12, 0, i * 0.12));
      break;
  }
}
const BASS = [131, 165, 196, 165, 175, 220, 262, 220, 196, 247, 294, 247, 131, 165, 196, 247];
const BBASS = [110, 110, 131, 110, 98, 98, 123, 98, 110, 110, 131, 147, 139, 131, 123, 117];
const BLEAD = [440, 0, 523, 0, 622, 0, 587, 523, 0, 494, 0, 415, 0, 440, 0, 0];
let inBossMus = false;
function bossMusic() {
  try {
    return gameState.mode === 'play' && typeof bossAlive === 'function' && bossAlive();
  } catch (e) {
    return false;
  }
}
function music(i) {
  if (!AC) return;
  const bm = bossMusic();
  inBossMus = bm;
  if (!runtime.mute && gameState.mode !== 'rewind') {
    if (bm) {
      const k = i % 16;
      tone(BBASS[k], 0.16, 'sawtooth', 0.075);
      tone(BBASS[k] / 2, 0.2, 'triangle', 0.09);
      if (i % 4 === 0) {
        tone(90, 0.12, 'sine', 0.18, -50);
        noise(0.05, 0.06);
      }
      if (i % 4 === 2) noise(0.07, 0.07);
      if (BLEAD[k]) tone(BLEAD[k], 0.14, 'square', 0.03);
      if (k === 0 || k === 8) {
        [220, 262, 311].forEach((f) => tone(f, 0.3, 'sawtooth', 0.02));
      }
    } else {
      tone(BASS[i % 16], 0.2, 'triangle', 0.07);
      if (i % 2) {
        const c = i % 8 < 4 ? [262, 330, 392] : i % 8 < 6 ? [262, 349, 440] : [247, 294, 392];
        c.forEach((f) => tone(f, 0.12, 'square', 0.012));
      }
    }
  }
  setTimeout(() => music(i + 1), bm ? 115 : i % 2 ? 170 : 230);
}
