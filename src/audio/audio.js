import { runtime } from '../state/runtime.js';
import { isBossAlive, gameState } from '../state/state.js';
/* ---------- Son : tout est synthétisé, aucun fichier ---------- */
let audioContext = null,
  master,
  musicOn = false;
runtime.mute = false;
export function ensureAudio() {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      master = audioContext.createGain();
      master.gain.value = 0.55;
      master.connect(audioContext.destination);
    } catch (e) {
      audioContext = null;
      return;
    }
  }
  if (audioContext.state === 'suspended') audioContext.resume();
  if (!musicOn && audioContext) {
    musicOn = true;
    scheduleMusicStep(0);
  }
}
function playTone(f, d, type = 'square', v = 0.12, slide = 0, delay = 0) {
  if (!audioContext || runtime.mute) return;
  const t = audioContext.currentTime + delay,
    o = audioContext.createOscillator(),
    g = audioContext.createGain();
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
function playNoise(d, v = 0.15, delay = 0) {
  if (!audioContext || runtime.mute) return;
  const n = Math.floor(audioContext.sampleRate * d),
    b = audioContext.createBuffer(1, n, audioContext.sampleRate),
    a = b.getChannelData(0);
  for (let i = 0; i < n; i++) a[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = audioContext.createBufferSource(),
    g = audioContext.createGain(),
    f = audioContext.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = 900;
  g.gain.value = v;
  s.buffer = b;
  s.connect(f);
  f.connect(g);
  g.connect(master);
  s.start(audioContext.currentTime + delay);
}
export function playSfx(k) {
  switch (k) {
    case 'shot':
      playTone(880, 0.07, 'square', 0.06, -500);
      playTone(520, 0.1, 'triangle', 0.05, -200, 0.03);
      break;
    case 'jump':
      playTone(340, 0.14, 'square', 0.07, 380);
      break;
    case 'land':
      playNoise(0.09, 0.12);
      break;
    case 'plate':
      playTone(220, 0.08, 'square', 0.09);
      playTone(440, 0.12, 'square', 0.08, 0, 0.06);
      break;
    case 'clone':
      playTone(660, 0.1, 'triangle', 0.14);
      playTone(990, 0.22, 'triangle', 0.12, 0, 0.08);
      break;
    case 'off':
      playTone(520, 0.14, 'triangle', 0.1, -280);
      break;
    case 'tick':
      playTone(800, 0.04, 'square', 0.06);
      break;
    case 'fail':
      playTone(130, 0.16, 'square', 0.09);
      break;
    case 'hit':
      playTone(180, 0.1, 'square', 0.12, -90);
      playNoise(0.08, 0.12);
      break;
    case 'break':
      playNoise(0.3, 0.2);
      playTone(120, 0.2, 'sawtooth', 0.08, -60);
      break;
    case 'clang':
      playTone(900, 0.12, 'square', 0.07, -500);
      playTone(650, 0.2, 'triangle', 0.1, -300, 0.03);
      break;
    case 'dash':
      playTone(300, 0.16, 'sawtooth', 0.08, 900);
      playNoise(0.12, 0.08);
      break;
    case 'rewind':
      for (let i = 0; i < 10; i++) playTone(1000 - i * 85, 0.09, 'sawtooth', 0.05, -260, i * 0.05);
      playNoise(0.5, 0.08);
      break;
    case 'rewindEnd':
      playTone(200, 0.18, 'triangle', 0.12);
      playTone(300, 0.18, 'triangle', 0.1, 0, 0.08);
      break;
    case 'death':
      playTone(330, 0.45, 'sawtooth', 0.12, -250);
      playNoise(0.2, 0.14);
      break;
    case 'win':
      [523, 659, 784, 1047].forEach((f, i) => playTone(f, 0.22, 'triangle', 0.13, 0, i * 0.1));
      break;
    case 'gain':
      [392, 523, 659, 784, 1047, 1319].forEach((f, i) => playTone(f, 0.4, 'triangle', 0.12, 0, i * 0.12));
      break;
  }
}
const CALM_BASS_LINE = [131, 165, 196, 165, 175, 220, 262, 220, 196, 247, 294, 247, 131, 165, 196, 247];
const BOSS_BASS_LINE = [110, 110, 131, 110, 98, 98, 123, 98, 110, 110, 131, 147, 139, 131, 123, 117];
const BOSS_LEAD_LINE = [440, 0, 523, 0, 622, 0, 587, 523, 0, 494, 0, 415, 0, 440, 0, 0];
function isBossMusicActive() {
  try {
    return gameState.mode === 'play' && typeof isBossAlive === 'function' && isBossAlive();
  } catch (e) {
    return false;
  }
}
function scheduleMusicStep(i) {
  if (!audioContext) return;
  const bm = isBossMusicActive();
  if (!runtime.mute && gameState.mode !== 'rewind') {
    if (bm) {
      const k = i % 16;
      playTone(BOSS_BASS_LINE[k], 0.16, 'sawtooth', 0.075);
      playTone(BOSS_BASS_LINE[k] / 2, 0.2, 'triangle', 0.09);
      if (i % 4 === 0) {
        playTone(90, 0.12, 'sine', 0.18, -50);
        playNoise(0.05, 0.06);
      }
      if (i % 4 === 2) playNoise(0.07, 0.07);
      if (BOSS_LEAD_LINE[k]) playTone(BOSS_LEAD_LINE[k], 0.14, 'square', 0.03);
      if (k === 0 || k === 8) {
        [220, 262, 311].forEach((f) => playTone(f, 0.3, 'sawtooth', 0.02));
      }
    } else {
      playTone(CALM_BASS_LINE[i % 16], 0.2, 'triangle', 0.07);
      if (i % 2) {
        const c = i % 8 < 4 ? [262, 330, 392] : i % 8 < 6 ? [262, 349, 440] : [247, 294, 392];
        c.forEach((f) => playTone(f, 0.12, 'square', 0.012));
      }
    }
  }
  setTimeout(() => scheduleMusicStep(i + 1), bm ? 115 : i % 2 ? 170 : 230);
}
