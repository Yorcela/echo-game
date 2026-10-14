import { trackEvent } from '../online/analytics.js';
import { isOnlineEnabled, refreshWorldBoard, submitScore } from '../online/leaderboard.js';
import { runtime } from '../state/runtime.ts';
import { canvas } from '../core/canvas.ts';
import {
  infoEnabled,
  actions,
  gameState,
  input,
  ownedEchoes,
  showMessage,
  setInfoEnabled,
} from '../state/state.ts';
import { resetAll, saveGame, saveScores, scores } from '../state/save.js';
import { loadRoom } from '../world/rooms.js';
import { sleepInBed, extendRewind } from '../game/rewind.js';
import { pick } from '../game/echoes.js';
import { ensureAudio, playSfx } from '../audio/audio.js';
import { hitTestUI } from '../render/primitives.js';
import { HINT_T, nameInputElement, showNameInput } from '../ui/hud.js';
import { endTrial, startTrial } from '../ui/screens.js';
/* ---------- Entrées ---------- */
const KEYS = {
  ArrowLeft: 'l',
  ArrowRight: 'r',
  ArrowUp: 'j',
  Space: 's',
  ArrowDown: 'd',
};
export function press(k, down) {
  if (k === 'l' || k === 'r' || k === 'd') {
    input[k] = down ? 1 : 0;
  } else if (k === 'j') {
    if (down && !input.jh) input.jp = 1;
    input.jh = down ? 1 : 0;
    input.u = down ? 1 : 0;
  } else if (k === 's') {
    if (down && !input.jh) input.jp = 1;
    if (down) input.js = 1;
    input.jh = down ? 1 : 0;
  } else if (!down) return;
  else if (k === 'x') actions.tir = 1;
  else if (k === 'r5') {
    if (gameState.mode === 'rewind') extendRewind();
    else actions.r5 = 1;
  } else if (k === 'r10') actions.r10 = 1;
  else if (k === 'c') actions.cl = 1;
  else if (k === 'p') actions.cyc = 1;
  else if (k === 'h') actions.hit = 1;
}
export function advance(fx, fy) {
  ensureAudio();
  const hit = fx !== undefined && fy !== undefined ? hitTestUI(fx, fy) : null;
  if (hit) {
    gameState.pressedButton = hit;
    gameState.pressedFeedbackTimer = 0.15;
  }
  if (gameState.mode === 'title') {
    if (hit === 'reset') {
      if (gameState.resetArmedTimer > 0) {
        trackEvent('new_game');
        resetAll();
        playSfx('death');
      } else {
        gameState.resetArmedTimer = 3;
        playSfx('tick');
      }
      return;
    }
    if (hit === 'scores') {
      gameState.mode = 'scores';
      gameState.page = 0;
      gameState.scoresTab = isOnlineEnabled() ? 'world' : 'local';
      if (isOnlineEnabled()) refreshWorldBoard();
      trackEvent('scores_opened', { tab: gameState.scoresTab });
      playSfx('tick');
      return;
    }
    if (hit === 'trial') {
      gameState.mode = 'trial';
      playSfx('tick');
      return;
    }
    if (hit === 'play' || fx === undefined) {
      trackEvent('game_start', {
        resumed: Boolean(gameState.hasTimeEcho) || Object.keys(gameState.visitedRooms).length > 1,
        rooms_visited: Object.keys(gameState.visitedRooms).length,
      });
      loadRoom(gameState.currentRoom);
      gameState.fade = 0.4;
    }
  } else if (gameState.mode === 'trial') {
    if (hit && hit.startsWith('tr') && hit !== 'trial' && hit !== 'tback') {
      startTrial(+hit.slice(2));
      return;
    }
    if (hit === 'tback' || fx === undefined) {
      gameState.mode = 'title';
      playSfx('tick');
    }
  } else if (gameState.mode === 'scores') {
    if (hit === 'stab_local' || hit === 'stab_world') {
      gameState.scoresTab = hit === 'stab_world' ? 'world' : 'local';
      if (gameState.scoresTab === 'world') refreshWorldBoard();
      playSfx('tick');
      return;
    }
    if (hit === 'sback' || fx === undefined) {
      gameState.mode = 'title';
      playSfx('tick');
    }
  } else if (gameState.mode === 'play') {
    if (hit === 'pause') pauseGame();
    else if (hit === 'rew') {
      actions.r5 = 1;
    } else if (hit === 'bedz') {
      if (gameState.isNearBed) {
        gameState.mode = 'sleep';
        input.l = input.r = input.jh = input.u = input.d = 0;
        playSfx('tick');
      } else
        showMessage(
          runtime.bed &&
            runtime.player.g &&
            Math.abs(runtime.player.x + runtime.player.w / 2 - runtime.bed.x) < 40 &&
            Math.abs(runtime.player.y + runtime.player.h - runtime.bed.y) < 22
            ? 'Tu es en pleine forme : le lit ne sert que si tu es blessé ou si ton Temps est entamé.'
            : 'Approche-toi du lit pour y dormir.',
          2.5,
        );
    } else if (hit === 'bed' || (fx === undefined && gameState.isNearBed)) {
      gameState.mode = 'sleep';
      input.l = input.r = input.jh = input.u = input.d = 0;
      playSfx('tick');
    } else if (hit === 'hint' || hit === 'toast' || fx === undefined) {
      gameState.hintTimer = HINT_T;
      gameState.messageTimer = 0;
    }
  } else if (gameState.mode === 'sleep') {
    if (hit === 'no') {
      gameState.mode = 'play';
      input.jp = 0;
    } else if (hit === 'yes' || fx === undefined) sleepInBed();
  } else if (gameState.mode === 'pause') {
    if (hit === 'menu') {
      if (gameState.trial) {
        endTrial();
        return;
      }
      gameState.mode = 'title';
      saveGame();
      playSfx('tick');
    } else if (hit === 'map') openMap('pause');
    else if (hit === 'info') {
      setInfoEnabled(!infoEnabled);
      playSfx('tick');
    } else if (hit === 'resume' || fx === undefined) {
      gameState.mode = 'play';
      input.jp = 0;
      playSfx('tick');
    }
  } else if (gameState.mode === 'map') {
    if (hit === 'mback' || fx === undefined) mapBack();
    else if (hit && /^m\d+$/.test(hit)) {
      const i = +hit.slice(1);
      gameState.fade = 0.45;
      loadRoom(i, 'p');
      playSfx('tick');
    }
  } else if (gameState.mode === 'rewind') {
    if (hit === 'rew') extendRewind();
  } else if (gameState.mode === 'gain' && gameState.gainTimer > 0.8) {
    if (gameState.trial) {
      endTrial();
      return;
    }
    gameState.mode = 'play';
    input.jp = 0;
  } else if (gameState.mode === 'end') {
    resetAll();
  } else if (gameState.mode === 'over') {
    if (gameState.overPhase === 0) {
      if (hit === 'ok' || fx === undefined) submitOver();
    } else if (hit === 'again' || fx === undefined) {
      resetAll();
      playSfx('tick');
    }
  }
}
export function submitOver() {
  if (gameState.mode !== 'over' || gameState.overPhase !== 0) return;
  const n = (nameInputElement.value || '').trim().slice(0, 20) || 'Anonyme',
    e = {
      n,
      l: gameState.exploredAtEnd,
      t: +gameState.runTime.toFixed(2),
      v: gameState.victory ? 1 : 0,
    };
  scores.over.push(e);
  scores.over.sort((a, b) => (b.v | 0) - (a.v | 0) || (a.v && b.v ? a.t - b.t : b.l - a.l || a.t - b.t));
  scores.over = scores.over.slice(0, 10);
  gameState.leaderboardRank = scores.over.indexOf(e) + 1;
  saveScores();
  // classement mondial : envoi en arrière-plan, sans jamais bloquer ni faire échouer la partie
  trackEvent('score_submitted', { rooms: e.l, run_time_s: Math.round(e.t), victory: e.v });
  submitScore(e).then((res) => {
    if (res.ok) refreshWorldBoard();
  });
  gameState.overPhase = 1;
  showNameInput(false);
  playSfx('win');
}
function openMap(from) {
  gameState.mapOpenedFrom = from;
  gameState.mode = 'map';
  input.l = input.r = input.jh = input.u = input.d = 0;
  playSfx('tick');
}
function mapBack() {
  if (gameState.mapOpenedFrom === 'pause') {
    gameState.mode = 'pause';
  } else {
    gameState.mode = 'play';
    input.jp = 0;
  }
  playSfx('tick');
}
function pauseGame() {
  if (gameState.mode !== 'play') return;
  gameState.mode = 'pause';
  input.l = input.r = input.jh = input.u = input.d = 0;
  playSfx('tick');
}
/* clavier (indépendant de la disposition AZERTY/QWERTY : on lit la lettre tapée)
   flèches = bouger · ↑ ou Espace = sauter · A = coup · Z = écho · E = changer d'écho · R/T = rembobiner · P = pause */
addEventListener('keydown', (e) => {
  if (e.target === nameInputElement) {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitOver();
    }
    return;
  }
  const ch = (e.key || '').length === 1 ? e.key.toLowerCase() : '';
  const k = KEYS[e.code];
  if (
    k ||
    ['a', 'z', 'e', 'x', 'r', 't', 'm', 'n', 'p', 'i'].includes(ch) ||
    ['Enter', 'Escape', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].includes(e.code)
  )
    e.preventDefault();
  if (e.repeat) return;
  ensureAudio();
  if (gameState.mode === 'over') {
    if (e.code === 'Enter' && gameState.overPhase === 1) advance();
    return;
  }
  if (k === 'd') {
    press(k, true);
    return;
  }
  if (k) {
    press(k, true);
    if (gameState.mode !== 'play' && gameState.mode !== 'pause' && gameState.mode !== 'sleep') advance();
    return;
  }
  if (e.code === 'Enter') {
    advance();
    return;
  }
  if (e.code === 'Escape' || ch === 'p') {
    if (gameState.mode === 'play') pauseGame();
    else if (gameState.mode === 'sleep') {
      gameState.mode = 'play';
      input.jp = 0;
    } else if (gameState.mode === 'pause' || gameState.mode === 'scores' || gameState.mode === 'trial')
      advance();
    else if (gameState.mode === 'map') mapBack();
    return;
  }
  if (gameState.mode === 'trial' && /^Digit[1-8]$/.test(e.code)) {
    startTrial(+e.code.slice(5) - 1);
    return;
  }
  if (/^Digit[1-5]$/.test(e.code)) {
    if (gameState.mode === 'play') pick(+e.code.slice(5) - 1);
    return;
  }
  if (ch === 'a') press('h', true);
  else if (ch === 'x') press('x', true);
  else if (ch === 'z') press('c', true);
  else if (ch === 'e') press('p', true);
  else if (ch === 'r') press('r5', true);
  else if (ch === 't') press('r10', true);
  else if (ch === 'n') runtime.mute = !runtime.mute;
  else if (ch === 'i') setInfoEnabled(!infoEnabled);
  else if (ch === 'm') {
    if (gameState.mode === 'play') openMap('play');
    else if (gameState.mode === 'map') mapBack();
  }
});
addEventListener('keyup', (e) => {
  const k = KEYS[e.code];
  if (k) press(k, false);
});
function fitKeyboardOverlay() {
  try {
    const k = document.querySelector('.keys'),
      kb = k && k.firstElementChild;
    if (!kb || getComputedStyle(k).display === 'none') return;
    kb.style.transform = '';
    k.style.height = '';
    const r = k.getBoundingClientRect(),
      w = kb.scrollWidth,
      h = kb.scrollHeight,
      s = Math.max(0.45, Math.min(1, (innerHeight - r.top - 8) / h, k.clientWidth / w));
    kb.style.transform = 'scale(' + s + ')';
    k.style.height = h * s + 'px';
  } catch (_) {}
}
addEventListener('resize', fitKeyboardOverlay);
addEventListener('load', () => {
  fitKeyboardOverlay();
  setTimeout(fitKeyboardOverlay, 300);
});
const keyboardKeyId = (e) => {
  const k = e.key || '';
  return k.length === 1 && /[a-zà-ÿ]/i.test(k) && !/^Digit/.test(e.code)
    ? 'L' + k.toUpperCase()
    : /^Digit[0-9]$/.test(e.code) || /^(Arrow|Space|Enter|Minus|Equal)/.test(e.code)
      ? e.code
      : '';
};
const markKeyboardKey = (e, on) => {
  try {
    const id = keyboardKeyId(e);
    if (!id) return;
    const el = document.querySelector('[data-kc="' + id + '"]');
    if (el) el.classList.toggle('on', on);
  } catch (_) {}
};
addEventListener('keydown', (e) => markKeyboardKey(e, true));
addEventListener('keyup', (e) => markKeyboardKey(e, false));
addEventListener('blur', () => document.querySelectorAll('.kb2.on').forEach((x) => x.classList.remove('on')));
canvas.addEventListener('pointerdown', (e) => {
  ensureAudio();
  const r = canvas.getBoundingClientRect();
  advance((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
});
document.querySelectorAll('#pad button').forEach((b) => {
  const k = b.dataset.k,
    hold = k === 'j';
  b.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    ensureAudio();
    if (k[0] === 's') {
      if (gameState.mode === 'play') pick(+k[1]);
      return;
    }
    b.classList.add('on');
    press(k === 'j' ? 's' : k, true);
    if (gameState.mode !== 'play' && gameState.mode !== 'pause' && gameState.mode !== 'sleep') advance();
  });
  const up = () => {
    b.classList.remove('on');
    if (hold) press('s', false);
  };
  b.addEventListener('pointerup', up);
  b.addEventListener('pointercancel', up);
  b.addEventListener('pointerleave', up);
});
// joystick tactile : glisser le pouce à gauche ou à droite
{
  const joy = document.getElementById('joy'),
    knob = document.getElementById('knob');
  let pid = null;
  const upd = (e) => {
    const r = joy.getBoundingClientRect(),
      R = r.width / 2,
      dx = e.clientX - (r.left + R),
      dy = e.clientY - (r.top + R),
      d = Math.hypot(dx, dy) || 1,
      m = Math.min(d, R * 0.7);
    knob.style.transform = 'translate(' + (dx / d) * m + 'px,' + (dy / d) * m + 'px)';
    const t = R * 0.22;
    input.l = dx < -t ? 1 : 0;
    input.r = dx > t ? 1 : 0;
    input.u = dy < -R * 0.5 ? 1 : 0;
    input.d = dy > R * 0.5 ? 1 : 0;
  };
  const end = (e) => {
    if (e.pointerId !== pid) return;
    pid = null;
    joy.classList.remove('held');
    knob.style.transform = '';
    input.l = input.r = input.u = input.d = 0;
  };
  joy.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    ensureAudio();
    pid = e.pointerId;
    joy.setPointerCapture(pid);
    joy.classList.add('held');
    upd(e);
    if (gameState.mode !== 'play' && gameState.mode !== 'pause' && gameState.mode !== 'sleep') advance();
  });
  joy.addEventListener('pointermove', (e) => {
    if (e.pointerId === pid) upd(e);
  });
  joy.addEventListener('pointerup', end);
  joy.addEventListener('pointercancel', end);
}
addEventListener('blur', () => {
  input.l = input.r = input.jh = input.u = input.d = 0;
});
// les boutons n'apparaissent qu'avec les échos gagnés
const touchPadElement = document.getElementById('pad');
const powerButtons = document.querySelectorAll('#pw button');
export function syncTouchPad() {
  touchPadElement.dataset.m = gameState.mode;
  const n = ownedEchoes().length,
    key =
      (gameState.hasTimeEcho ? 1 : 0) + '-' + gameState.echoesOwned.join('') + '-' + gameState.selectedEcho;
  if (syncTouchPad.k !== key) {
    syncTouchPad.k = key;
    touchPadElement.dataset.t = gameState.hasTimeEcho ? 1 : 0;
    touchPadElement.dataset.p = n ? 1 : 0;
    touchPadElement.dataset.x = gameState.echoesOwned[6] ? 1 : 0;
    document
      .querySelectorAll('.kb2[data-echo]')
      .forEach((el) => el.classList.toggle('kd', !gameState.echoesOwned[+el.dataset.echo]));
    document.querySelectorAll('.kb2[data-need]').forEach((el) => {
      const q = el.dataset.need;
      el.classList.toggle(
        'kd',
        q === 'x' ? !gameState.echoesOwned[6] : q === 't' ? !gameState.hasTimeEcho : n < 1,
      );
    });
    setTimeout(fitKeyboardOverlay, 0);
    powerButtons.forEach((b, i) => {
      b.hidden = !gameState.echoesOwned[i];
      b.classList.toggle('sel', gameState.selectedEcho === i);
    });
  }
}

/* ---------- Boucle ---------- */
