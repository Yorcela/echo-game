// Point d'entrée : charge les modules, démarre la boucle ; expose un hook de test en mode « test ».
import { runtime } from './state/runtime.js';
import './styles.css';
import './core/config.js';
import './core/canvas.js';
import './data/level-builders.js';
import './data/bosses.js';
import './data/echoes.js';
import { namedRooms, BOSS_ORDER, APPROACH_ROOM_POOL, handLevels, levels } from './data/levels.js';
import './world/generator.js';
import { HUB_ROOM, actions, gameState, input } from './state/state.js';
import { clearSave, loadSavedGame, resetAll, scores } from './state/save.js';
import {
  GENERATED_CELLS,
  ROOM_POSITIONS,
  WING_SLOTS,
  WORLD,
  roomAtCell,
  isKingReady,
} from './world/world.js';
import { buildWorld, installRoom } from './world/build.js';
import { loadRoom, pickBlueHeartSpots } from './world/rooms.js';
import { gameOver, hurtPlayer, restoreSnapshot, rewindFrame, takeSnapshot } from './game/rewind.js';
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
import { drawOver, nameInputElement, showNameInput } from './ui/hud.js';
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
    load: loadRoom,
    I: input,
    A: actions,
    LV: levels,
    buildWorld: buildWorld,
    WORLD: WORLD,
    ORDER: BOSS_ORDER,
    POOL: APPROACH_ROOM_POOL,
    N: namedRooms,
    SLOTS: WING_SLOTS,
    GCELLS: GENERATED_CELLS,
    POS: ROOM_POSITIONS,
    cellAt: roomAtCell,
    get P() {
      return runtime.player;
    },
    get ents() {
      return runtime.entities;
    },
    SC: scores,
    get plates() {
      return runtime.plates;
    },
    snap: takeSnapshot,
    restore: restoreSnapshot,
    get SH() {
      return runtime.shots;
    },
    get open() {
      return runtime.openDoors;
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
    kingReady: isKingReady,
    hurtP: hurtPlayer,
    gameOver: gameOver,
    pickBlue: pickBlueHeartSpots,
    submitOver: submitOver,
    nmEl: nameInputElement,
    advance: advance,
    drawMap: drawMap,
    drawOver: drawOver,
    drawTitle: drawTitle,
    drawScores: drawScores,
    clearSave: clearSave,
    HUB: HUB_ROOM,
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
loadSavedGame();
loadRoom(gameState.currentRoom);
gameState.mode = 'title';
requestAnimationFrame(frame);
