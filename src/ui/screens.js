import { HEIGHT, WIDTH } from '../core/config.js';
import { ctx } from '../core/canvas.js';
import { ECHO_TYPES } from '../data/echoes.js';
import { BOSS_ORDER, levels } from '../data/levels.js';
import { MAP_COLS, HUB_ROOM, infoEnabled, formatTime, gameState, ownedEchoes } from '../state/state.js';
import { loadSavedGame, scores } from '../state/save.js';
import { ROOM_POSITIONS, WORLD } from '../world/world.js';
import { hasBed, loadRoom } from '../world/rooms.js';
import { gateOK } from '../game/physics.js';
import { playSfx } from '../audio/audio.js';
import {
  FONT_BODY,
  INK_COLOR,
  uiHitBoxes,
  drawButton,
  drawOutlinedText,
  roundRectPath,
} from '../render/primitives.js';
import { drawBackground, drawPaperBackground } from '../render/background.js';
import { drawHero } from '../render/characters.js';
import { emblem } from '../render/bosses.js';
export function drawTitle() {
  drawPaperBackground();
  uiHitBoxes.length = 0;
  ctx.save();
  ctx.translate(WIDTH / 2, 150);
  ctx.rotate(-0.04);
  ctx.globalAlpha = 0.35;
  drawOutlinedText('ECHO', 26, 70, 128, '#E2A93B');
  ctx.globalAlpha = 0.6;
  drawOutlinedText('ECHO', 13, 60, 128, '#E2A93B');
  ctx.globalAlpha = 1;
  drawOutlinedText('ECHO', 0, 50, 128, '#D0402E');
  ctx.restore();
  drawHero(
    {
      x: 150,
      y: 218,
      vx: 0,
      vy: 0,
      face: 1,
      g: true,
      w: 22,
      h: 28,
    },
    {},
  );
  drawHero(
    {
      x: WIDTH - 172,
      y: 218,
      vx: 0,
      vy: 0,
      face: -1,
      g: true,
      w: 22,
      h: 28,
    },
    {
      jean: '#2F8F8A',
      cuff: '#F6EBCB',
      tie: '#F6EBCB',
      body: '#F4F1E6',
      alpha: 0.85,
      clone: 1,
      col: '#2F8F8A',
    },
  );
  ctx.fillStyle = INK_COLOR;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '800 17px ' + FONT_BODY;
  const n = gameState.currentRoom || 0;
  ctx.fillStyle = INK_COLOR;
  ctx.font = '900 21px ' + FONT_BODY;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    levels[n].name + ' · ' + Object.keys(gameState.visitedRooms).length + ' / ' + levels.length + ' salles',
    WIDTH / 2,
    324,
  );
  const prog =
    gameState.hasTimeEcho || ownedEchoes().length || Object.keys(gameState.visitedRooms).length > 1;
  drawButton('play', WIDTH / 2 - 150, 352, 300, 58, prog ? 'CONTINUER' : 'JOUER', {
    size: 32,
    lip: 12,
    r: 16,
  });
  const armed = gameState.resetArmedTimer > 0;
  drawButton('scores', WIDTH / 2 + 60, 436, 170, 38, 'SCORES', {
    size: 19,
    lip: 8,
    r: 12,
  });
  drawButton('reset', WIDTH / 2 - 240, 436, 290, 38, armed ? 'SÛR ? TOUCHE ENCORE' : 'NOUVELLE PARTIE', {
    size: armed ? 17 : 19,
    lip: 8,
    r: 12,
    c: armed ? '#E2604B' : undefined,
    d: armed ? '#7A1F14' : undefined,
  });
  ctx.textBaseline = 'alphabetic';
  const o = ownedEchoes();
  ctx.font = '700 13px ' + FONT_BODY;
  ctx.fillStyle = 'rgba(27,22,18,.7)';
  ctx.textAlign = 'center';
  ctx.fillText(
    'Échos gagnés : ' +
      ((gameState.hasTimeEcho ? ['Temps'] : []).concat(o.map((i) => ECHO_TYPES[i].n)).join(' · ') || 'aucun'),
    WIDTH / 2,
    HEIGHT - 14,
  );
}
export function drawScores() {
  drawPaperBackground();
  uiHitBoxes.length = 0;
  drawOutlinedText('CLASSEMENT', WIDTH / 2, 70, 46, '#E2A93B');
  ctx.fillStyle = INK_COLOR;
  ctx.textBaseline = 'alphabetic';
  ctx.font = '800 15px ' + FONT_BODY;
  ctx.textAlign = 'center';
  ctx.fillText('Seules les parties terminées entrent au classement.', WIDTH / 2, 104);
  for (let i = 0; i < 10; i++) {
    const entity = scores.over[i],
      y = 146 + i * 30;
    ctx.font = '900 20px ' + FONT_BODY;
    ctx.textAlign = 'left';
    ctx.fillText(i + 1 + '.', WIDTH / 2 - 330, y);
    ctx.fillText(entity ? entity.n : '—', WIDTH / 2 - 290, y);
    ctx.textAlign = 'right';
    ctx.fillText(entity ? (entity.v ? 'VICTOIRE' : entity.l + ' salles') : '', WIDTH / 2 + 210, y);
    ctx.fillText(entity ? formatTime(entity.t) : '', WIDTH / 2 + 330, y);
  }
  drawButton('sback', WIDTH / 2 - 90, HEIGHT - 82, 180, 34, 'RETOUR', {
    size: 19,
    lip: 7,
    r: 11,
  });
  ctx.textBaseline = 'alphabetic';
}

// ---- salle d'essai : aller directement voir un boss (sans toucher à la sauvegarde)
const TRIAL_NAMES = [
  'Le Gardien du Temps',
  'Les Jumeaux',
  "L'Envol",
  'Le Colosse',
  'Le Reflet',
  'La Sorcière',
  'La Mémoire',
  "L'Éclair",
];
function trialRoom(r) {
  return r === 0 ? 5 : WORLD.ranks[r - 1] ? WORLD.ranks[r - 1].boss : 5;
}
export function drawTrial() {
  drawPaperBackground();
  uiHitBoxes.length = 0;
  drawOutlinedText("SALLE D'ESSAI", WIDTH / 2, 66, 46, '#E2A93B');
  ctx.fillStyle = INK_COLOR;
  ctx.textBaseline = 'alphabetic';
  ctx.font = '800 15px ' + FONT_BODY;
  ctx.textAlign = 'center';
  ctx.fillText(
    "Va directement voir un boss, avec les échos qu'il faut. Ta partie n'est pas touchée.",
    WIDTH / 2,
    100,
  );
  for (let r = 0; r < 8; r++) {
    const col = r % 2,
      row = Math.floor(r / 2),
      x = WIDTH / 2 - 300 + col * 310,
      y = 128 + row * 74;
    drawButton('tr' + r, x, y, 290, 56, r + 1 + '. ' + TRIAL_NAMES[r].toUpperCase(), {
      size: 19,
      lip: 9,
      r: 14,
    });
  }
  drawButton('tback', WIDTH / 2 - 90, HEIGHT - 70, 180, 34, 'RETOUR', {
    size: 19,
    lip: 7,
    r: 11,
  });
  ctx.textBaseline = 'alphabetic';
}
export function startTrial(r) {
  gameState.trial = 1;
  gameState.echoesOwned = [0, 0, 0, 0, 0, 0, 0];
  gameState.hasTimeEcho = r > 0 ? 1 : 0;
  for (let k = 1; k <= r; k++) {
    const g = BOSS_ORDER[k - 1];
    if (g !== 't') gameState.echoesOwned[g] = 1;
  }
  gameState.selectedEcho = 0;
  for (let k = 0; k < 7; k++)
    if (gameState.echoesOwned[k]) {
      gameState.selectedEcho = k;
      break;
    }
  gameState.hp = gameState.hpMax = 3;
  gameState.shieldHearts = 0;
  gameState.gauge = 10;
  gameState.clearedBossRooms = {};
  gameState.solvedRooms = {};
  gameState.anchorsByRoom = {};
  gameState.runTime = 0;
  loadRoom(trialRoom(r));
  gameState.mode = 'play';
  gameState.fade = 0.4;
  playSfx('tick');
}
export function endTrial() {
  gameState.trial = 0;
  gameState.clearedBossRooms = {};
  loadSavedGame();
  loadRoom(gameState.currentRoom);
  gameState.mode = 'title';
  playSfx('tick');
}
export function drawMap() {
  drawBackground(0, 0);
  uiHitBoxes.length = 0;
  ctx.fillStyle = 'rgba(14,10,22,.80)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  drawOutlinedText('CARTE', WIDTH / 2, 52, 44, '#E2A93B');
  ctx.fillStyle = '#F6EBCB';
  ctx.font = '800 15px ' + FONT_BODY;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(
    Object.keys(gameState.visitedRooms).length + ' / ' + levels.length + ' salles explorées',
    WIDTH / 2,
    74,
  );
  const cw = 58,
    ch = 30,
    sx = 64,
    sy = 38,
    x0 = (WIDTH - (MAP_COLS * sx - (sx - cw))) / 2,
    y0 = 86,
    at = (i) => ({
      x: x0 + ROOM_POSITIONS[i][0] * sx,
      y: y0 + ROOM_POSITIONS[i][1] * sy,
    });
  const nearV = (i) => gameState.visitedRooms[i] || levels[i].links.some((k) => gameState.visitedRooms[k.to]);
  const show = (i) => !!gameState.visitedRooms[i] || !!levels[i].boss || nearV(i);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // liaisons
  for (let i = 0; i < levels.length; i++) {
    if (!ROOM_POSITIONS[i]) continue;
    for (const k of levels[i].links) {
      if (k.to < i || !ROOM_POSITIONS[k.to]) continue;
      if (!(gameState.visitedRooms[i] || gameState.visitedRooms[k.to])) continue;
      const a = at(i),
        b = at(k.to),
        ax = a.x + cw / 2,
        ay = a.y + ch / 2,
        bx = b.x + cw / 2,
        by = b.y + ch / 2,
        lk = k.gate && !gateOK(k);
      ctx.strokeStyle = lk ? '#D0402E' : 'rgba(246,235,203,.85)';
      ctx.lineWidth = 4;
      if (k.kind === 'dj' || k.kind === 'gap' || k.sec) {
        ctx.setLineDash([5, 4]);
      }
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
      ctx.setLineDash([]);
      if (k.s === 't' || k.s === 'b') {
        const mx = (ax + bx) / 2,
          my = (ay + by) / 2;
        if (k.kind === 'ladder' || k.lad) {
          ctx.strokeStyle = '#E2B96F';
          ctx.lineWidth = 2;
          for (let q = -1; q <= 1; q++) {
            ctx.beginPath();
            ctx.moveTo(mx - 5, my + q * 4);
            ctx.lineTo(mx + 5, my + q * 4);
            ctx.stroke();
          }
        }
        if (lk) {
          ctx.fillStyle = '#D0402E';
          ctx.beginPath();
          ctx.arc(mx, my, 5, 0, 7);
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = INK_COLOR;
          ctx.stroke();
        }
      }
    }
  }
  // salles
  for (let i = 0; i < levels.length; i++) {
    if (!ROOM_POSITIONS[i] || !show(i)) continue;
    const { x, y } = at(i),
      v = !!gameState.visitedRooms[i],
      bo = levels[i].boss,
      cur = i === gameState.loadedRoom,
      done = !!gameState.clearedBossRooms[i];
    if (!v && !bo) {
      ctx.fillStyle = 'rgba(246,235,203,.14)';
      roundRectPath(x, y, cw, ch, 6);
      ctx.fill();
      ctx.fillStyle = 'rgba(246,235,203,.55)';
      ctx.font = '900 14px ' + FONT_BODY;
      ctx.textBaseline = 'middle';
      ctx.fillText('?', x + cw / 2, y + ch / 2 + 1);
      ctx.textBaseline = 'alphabetic';
      continue;
    }
    ctx.fillStyle = bo
      ? done
        ? '#3E7F7A'
        : v
          ? '#B5392A'
          : '#6B2A2A'
      : i === HUB_ROOM
        ? '#E2B04A'
        : '#F6EBCB';
    roundRectPath(x, y, cw, ch, 6);
    ctx.fill();
    ctx.lineWidth = cur ? 5 : 3;
    ctx.strokeStyle = cur ? '#F2C45A' : INK_COLOR;
    roundRectPath(x, y, cw, ch, 6);
    ctx.stroke();
    if (bo) {
      const B = levels[i].boss;
      emblem(
        {
          x: x + cw / 2 - 5,
          y: y - 14,
          w: 10,
          h: 44,
        },
        B,
      );
      {
        const nm = (B.n || '').toUpperCase();
        let fs = 8;
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        do {
          ctx.font = '900 ' + fs + 'px ' + FONT_BODY;
          fs -= 0.5;
        } while (ctx.measureText(nm).width > cw - 4 && fs > 4.5);
        ctx.fillText(nm, x + cw / 2, y + ch - 3);
      }
      if (done) {
        ctx.strokeStyle = '#F2C45A';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + cw - 14, y + 7);
        ctx.lineTo(x + cw - 10, y + 11);
        ctx.lineTo(x + cw - 4, y + 3);
        ctx.stroke();
      }
    } else if (i === HUB_ROOM) {
      ctx.fillStyle = INK_COLOR;
      ctx.font = '900 16px ' + FONT_BODY;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillText('★', x + cw / 2, y + ch / 2 + 1);
      ctx.textBaseline = 'alphabetic';
    }
    if (levels[i].rest && v) {
      // lit
      ctx.fillStyle = gameState.usedBeds[i] ? '#8A8F98' : '#D0402E';
      roundRectPath(x + cw / 2 - 9, y + ch / 2 - 4, 18, 9, 2);
      ctx.fill();
      ctx.fillStyle = '#F6EBCB';
      roundRectPath(x + cw / 2 - 8, y + ch / 2 - 6, 7, 6, 2);
      ctx.fill();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = INK_COLOR;
      roundRectPath(x + cw / 2 - 9, y + ch / 2 - 4, 18, 9, 2);
      ctx.stroke();
    }
    if (v && hasBed(i)) {
      ctx.fillStyle = '#4DB8B1';
      ctx.beginPath();
      ctx.arc(x + cw - 7, y + 7, 6, 0, 7);
      ctx.fill();
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = INK_COLOR;
      ctx.stroke();
      uiHitBoxes.push({
        id: 'm' + i,
        x: x - 3,
        y: y - 3,
        w: cw + 6,
        h: ch + 6,
      });
    }
    if (v && !bo && !hasBed(i) && levels[i].st) {
      ctx.fillStyle = '#4DB8B1';
      ctx.beginPath();
      ctx.arc(x + cw - 7, y + 7, 5, 0, 7);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = INK_COLOR;
      ctx.stroke();
    }
  }
  // le héros sur la salle active : petit saut, halo qui pulse, flèche qui rebondit
  if (ROOM_POSITIONS[gameState.loadedRoom]) {
    const { x, y } = at(gameState.loadedRoom),
      t = gameState.time,
      cxp = x + cw / 2,
      ph = t * 5.5,
      hop = Math.abs(Math.sin(ph)),
      air = hop > 0.12;
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.25 * Math.sin(t * 4);
    ctx.strokeStyle = '#F2C45A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cxp, y + ch / 2, cw / 2 + 6 + Math.sin(t * 4) * 3, ch / 2 + 5 + Math.sin(t * 4) * 2, 0, 0, 7);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.3 - 0.12 * hop;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(cxp, y + ch - 3, 10 - hop * 3, 3, 0, 0, 7);
    ctx.fill();
    ctx.restore();
    const hh = 30,
      hw = (hh * 22) / 28;
    drawHero(
      {
        x: cxp - hw / 2,
        y: y + ch - 3 - hh - hop * 11,
        w: hw,
        h: hh,
        vx: 0,
        vy: air ? (Math.cos(ph) > 0 ? 260 : -260) : 0,
        face: Math.sin(t * 1.3) > 0 ? 1 : -1,
        g: !air,
        hit: 0,
        dash: 0,
      },
      {},
    );
    const ay = y - hh - 12 + Math.sin(t * 6) * 3;
    ctx.save();
    ctx.fillStyle = '#F2C45A';
    ctx.strokeStyle = INK_COLOR;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cxp - 7, ay);
    ctx.lineTo(cxp + 7, ay);
    ctx.lineTo(cxp, ay + 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = '#F6EBCB';
  ctx.font = '700 12px ' + FONT_BODY;
  ctx.textAlign = 'center';
  ctx.fillText(
    'rouge : boss · vert-de-gris : vaincu · rond turquoise : statue ou lit = voyage rapide · doré : ici · ? : à découvrir',
    WIDTH / 2,
    HEIGHT - 60,
  );
  drawButton('mback', WIDTH / 2 - 100, HEIGHT - 52, 200, 36, 'RETOUR', {
    size: 20,
    lip: 8,
    r: 12,
  });
}
export function drawSleep() {
  ctx.fillStyle = 'rgba(27,22,18,.62)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  drawOutlinedText('DORMIR ?', WIDTH / 2, HEIGHT / 2 - 96, 56, '#E2A93B');
  ctx.fillStyle = '#F6EBCB';
  ctx.font = '800 19px ' + FONT_BODY;
  ctx.textAlign = 'center';
  ctx.fillText('Cœurs et Temps entièrement rechargés', WIDTH / 2, HEIGHT / 2 - 48);
  ctx.fillText('mais +20 secondes ajoutées au chrono', WIDTH / 2, HEIGHT / 2 - 20);
  drawButton('yes', WIDTH / 2 - 190, HEIGHT / 2 + 10, 170, 52, 'DORMIR', {
    size: 24,
    c: '#55C2BA',
    d: '#23807A',
  });
  drawButton('no', WIDTH / 2 + 20, HEIGHT / 2 + 10, 170, 52, 'NON', {
    size: 24,
  });
  ctx.font = '700 14px ' + FONT_BODY;
  ctx.fillStyle = 'rgba(246,235,203,.8)';
  ctx.fillText('Entrée : dormir · Échap : non', WIDTH / 2, HEIGHT / 2 + 104);
}
export function drawPause() {
  ctx.fillStyle = 'rgba(27,22,18,.62)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  drawOutlinedText('PAUSE', WIDTH / 2, HEIGHT / 2 - 90, 64, '#E2A93B');
  drawButton('resume', WIDTH / 2 - 140, HEIGHT / 2 - 58, 280, 56, 'REPRENDRE', {
    size: 28,
    lip: 11,
    r: 15,
  });
  drawButton('map', WIDTH / 2 - 120, HEIGHT / 2 + 22, 240, 44, 'CARTE', {
    size: 20,
    lip: 9,
    r: 13,
    c: '#55C2BA',
    d: '#23807A',
  });
  drawButton('menu', WIDTH / 2 - 120, HEIGHT / 2 + 88, 240, 44, 'MENU PRINCIPAL', {
    size: 20,
    lip: 9,
    r: 13,
  });
  drawButton(
    'info',
    WIDTH / 2 - 120,
    HEIGHT / 2 + 154,
    240,
    38,
    infoEnabled ? 'INFOS : OUI (I)' : 'INFOS : NON (I)',
    {
      size: 18,
      lip: 8,
      r: 12,
      c: infoEnabled ? '#55C2BA' : '#9A9A9A',
      d: infoEnabled ? '#23807A' : '#5E5E5E',
    },
  );
}

/* ---------- Entrées ---------- */
