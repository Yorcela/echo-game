// Point d'entrée : charge les modules, démarre la boucle ; expose un hook de test en mode « test ».
import { runtime } from './state/runtime.js';
import './styles.css';
import './core/config.js';
import './core/canvas.js';
import './data/level-builders.js';
import './data/bosses.js';
import './data/echoes.js';
import { N, ORDER, POOL, handLevels, levels } from './data/levels.js';
import './world/generator.js';
import { HUB, actions, gameState, input } from './state/state.js';
import { clearSave, loadSave, resetAll, scores } from './state/save.js';
import { GCELLS, POS, SLOTS, WORLD, buildWorld, cellAt, installRoom, kingReady } from './world/world.js';
import { load, pickBlue } from './world/rooms.js';
import { gameOver, hurtP, restore, rewindFrame, snap } from './game/rewind.js';
import { collide, gateOK, moveBody, sealed, solid } from './game/physics.js';
import { pick, useEcho } from './game/echoes.js';
import { bossHit, doHit, startGain } from './game/combat.js';
import './game/colossus.js';
import { ghost } from './game/reflets.js';
import { step } from './game/step.js';
import './render/sprites.js';
import './audio/audio.js';
import './render/primitives.js';
import './render/background.js';
import './render/tiles.js';
import './render/characters.js';
import './render/bosses.js';
import { drawOver, nmEl, showNameInput } from './ui/hud.js';
import { draw } from './render/scene.js';
import { drawMap, drawScores, drawTitle, endTrial, startTrial } from './ui/screens.js';
import { advance, press, submitOver } from './input/input.js';
import { frame } from './game/loop.js';
import './render/sprites.js';

if (import.meta.env.MODE === 'test') {
  globalThis.__T = {
    installRoom: installRoom,
    LV0: handLevels,
    S: gameState,
    step: step,
    load: load,
    I: input,
    A: actions,
    LV: levels,
    buildWorld: buildWorld,
    WORLD: WORLD,
    ORDER: ORDER,
    POOL: POOL,
    N: N,
    SLOTS: SLOTS,
    GCELLS: GCELLS,
    POS: POS,
    cellAt: cellAt,
    get P() {
      return runtime.player;
    },
    get ents() {
      return runtime.ents;
    },
    SC: scores,
    get plates() {
      return runtime.plates;
    },
    snap: snap,
    restore: restore,
    get SH() {
      return runtime.shots;
    },
    get open() {
      return runtime.open;
    },
    ghost: ghost,
    get C() {
      return runtime.echoClone;
    },
    get grid() {
      return runtime.grid;
    },
    draw: draw,
    rewindFrame: rewindFrame,
    startGain: startGain,
    useEcho: useEcho,
    pick: pick,
    doHit: doHit,
    resetAll: resetAll,
    moveBody: moveBody,
    collide: collide,
    solid: solid,
    gateOK: gateOK,
    sealed: sealed,
    kingReady: kingReady,
    hurtP: hurtP,
    gameOver: gameOver,
    pickBlue: pickBlue,
    submitOver: submitOver,
    nmEl: nmEl,
    advance: advance,
    drawMap: drawMap,
    drawOver: drawOver,
    drawTitle: drawTitle,
    drawScores: drawScores,
    clearSave: clearSave,
    HUB: HUB,
    get BED() {
      return runtime.bed;
    },
    get HR() {
      return runtime.hearts;
    },
    get ST() {
      return runtime.statue;
    },
    press: press,
    frame: frame,
    showNameInput: showNameInput,
    bossHit: bossHit,
    startTrial: startTrial,
    endTrial: endTrial,
  };
}

loadSave();
load(gameState.cur);
gameState.mode = 'title';
requestAnimationFrame(frame);
