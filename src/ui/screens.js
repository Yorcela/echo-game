import { H, W } from '../core/config.js';
import { ctx } from '../core/canvas.js';
import { TYPES } from '../data/echoes.js';
import { ORDER, levels } from '../data/levels.js';
import { GW, HUB, INFO, fmt, gameState, owned } from '../state/state.js';
import { loadSave, scores } from '../state/save.js';
import { POS, WORLD } from '../world/world.js';
import { isBench, load } from '../world/rooms.js';
import { gateOK } from '../game/physics.js';
import { sfx } from '../audio/audio.js';
import { FB, INK, UI, btn, outlined, rr } from '../render/primitives.js';
import { drawBG, drawBGPaper } from '../render/background.js';
import { drawHero } from '../render/characters.js';
import { emblem } from '../render/bosses.js';
export function drawTitle() {
  drawBGPaper();
  UI.length = 0;
  ctx.save();
  ctx.translate(W / 2, 150);
  ctx.rotate(-0.04);
  ctx.globalAlpha = 0.35;
  outlined('ECHO', 26, 70, 128, '#E2A93B');
  ctx.globalAlpha = 0.6;
  outlined('ECHO', 13, 60, 128, '#E2A93B');
  ctx.globalAlpha = 1;
  outlined('ECHO', 0, 50, 128, '#D0402E');
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
      x: W - 172,
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
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '800 17px ' + FB;
  const n = gameState.cur || 0;
  const arrow = (dir) => (x, y) => {
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + dir * 8, y - 11);
    ctx.lineTo(x - dir * 8, y);
    ctx.lineTo(x + dir * 8, y + 11);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
  };
  ctx.fillStyle = INK;
  ctx.font = '900 21px ' + FB;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    levels[n].name + ' · ' + Object.keys(gameState.vis).length + ' / ' + levels.length + ' salles',
    W / 2,
    324,
  );
  const prog = gameState.haveT || owned().length || Object.keys(gameState.vis).length > 1;
  btn('play', W / 2 - 150, 352, 300, 58, prog ? 'CONTINUER' : 'JOUER', {
    size: 32,
    lip: 12,
    r: 16,
  });
  const armed = gameState.rst > 0;
  btn('scores', W / 2 + 60, 436, 170, 38, 'SCORES', {
    size: 19,
    lip: 8,
    r: 12,
  });
  btn('reset', W / 2 - 240, 436, 290, 38, armed ? 'SÛR ? TOUCHE ENCORE' : 'NOUVELLE PARTIE', {
    size: armed ? 17 : 19,
    lip: 8,
    r: 12,
    c: armed ? '#E2604B' : undefined,
    d: armed ? '#7A1F14' : undefined,
  });
  ctx.textBaseline = 'alphabetic';
  const o = owned();
  ctx.font = '700 13px ' + FB;
  ctx.fillStyle = 'rgba(27,22,18,.7)';
  ctx.textAlign = 'center';
  ctx.fillText(
    'Échos gagnés : ' +
      ((gameState.haveT ? ['Temps'] : []).concat(o.map((i) => TYPES[i].n)).join(' · ') || 'aucun'),
    W / 2,
    H - 14,
  );
}
export function drawScores() {
  drawBGPaper();
  UI.length = 0;
  outlined('CLASSEMENT', W / 2, 70, 46, '#E2A93B');
  ctx.fillStyle = INK;
  ctx.textBaseline = 'alphabetic';
  ctx.font = '800 15px ' + FB;
  ctx.textAlign = 'center';
  ctx.fillText('Seules les parties terminées entrent au classement.', W / 2, 104);
  for (let i = 0; i < 10; i++) {
    const e = scores.over[i],
      y = 146 + i * 30;
    ctx.font = '900 20px ' + FB;
    ctx.textAlign = 'left';
    ctx.fillText(i + 1 + '.', W / 2 - 330, y);
    ctx.fillText(e ? e.n : '—', W / 2 - 290, y);
    ctx.textAlign = 'right';
    ctx.fillText(e ? (e.v ? 'VICTOIRE' : e.l + ' salles') : '', W / 2 + 210, y);
    ctx.fillText(e ? fmt(e.t) : '', W / 2 + 330, y);
  }
  btn('sback', W / 2 - 90, H - 82, 180, 34, 'RETOUR', {
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
  drawBGPaper();
  UI.length = 0;
  outlined("SALLE D'ESSAI", W / 2, 66, 46, '#E2A93B');
  ctx.fillStyle = INK;
  ctx.textBaseline = 'alphabetic';
  ctx.font = '800 15px ' + FB;
  ctx.textAlign = 'center';
  ctx.fillText(
    "Va directement voir un boss, avec les échos qu'il faut. Ta partie n'est pas touchée.",
    W / 2,
    100,
  );
  for (let r = 0; r < 8; r++) {
    const col = r % 2,
      row = Math.floor(r / 2),
      x = W / 2 - 300 + col * 310,
      y = 128 + row * 74;
    btn('tr' + r, x, y, 290, 56, r + 1 + '. ' + TRIAL_NAMES[r].toUpperCase(), {
      size: 19,
      lip: 9,
      r: 14,
    });
  }
  btn('tback', W / 2 - 90, H - 70, 180, 34, 'RETOUR', {
    size: 19,
    lip: 7,
    r: 11,
  });
  ctx.textBaseline = 'alphabetic';
}
export function startTrial(r) {
  gameState.trial = 1;
  gameState.have = [0, 0, 0, 0, 0, 0, 0];
  gameState.haveT = r > 0 ? 1 : 0;
  for (let k = 1; k <= r; k++) {
    const g = ORDER[k - 1];
    if (g !== 't') gameState.have[g] = 1;
  }
  gameState.sel = 0;
  for (let k = 0; k < 7; k++)
    if (gameState.have[k]) {
      gameState.sel = k;
      break;
    }
  gameState.hp = gameState.hpMax = 3;
  gameState.sh = 0;
  gameState.gauge = 10;
  gameState.cl = {};
  gameState.sol = {};
  gameState.anchAll = {};
  gameState.run = 0;
  load(trialRoom(r));
  gameState.mode = 'play';
  gameState.fade = 0.4;
  sfx('tick');
}
export function endTrial() {
  gameState.trial = 0;
  gameState.cl = {};
  loadSave();
  load(gameState.cur);
  gameState.mode = 'title';
  sfx('tick');
}
export function drawMap() {
  drawBG(0, 0);
  UI.length = 0;
  ctx.fillStyle = 'rgba(14,10,22,.80)';
  ctx.fillRect(0, 0, W, H);
  outlined('CARTE', W / 2, 52, 44, '#E2A93B');
  ctx.fillStyle = '#F6EBCB';
  ctx.font = '800 15px ' + FB;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(Object.keys(gameState.vis).length + ' / ' + levels.length + ' salles explorées', W / 2, 74);
  const cw = 58,
    ch = 30,
    sx = 64,
    sy = 38,
    x0 = (W - (GW * sx - (sx - cw))) / 2,
    y0 = 86,
    at = (i) => ({
      x: x0 + POS[i][0] * sx,
      y: y0 + POS[i][1] * sy,
    });
  const nearV = (i) => gameState.vis[i] || levels[i].links.some((k) => gameState.vis[k.to]);
  const show = (i) => !!gameState.vis[i] || !!levels[i].boss || nearV(i);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // liaisons
  for (let i = 0; i < levels.length; i++) {
    if (!POS[i]) continue;
    for (const k of levels[i].links) {
      if (k.to < i || !POS[k.to]) continue;
      if (!(gameState.vis[i] || gameState.vis[k.to])) continue;
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
          ctx.strokeStyle = INK;
          ctx.stroke();
        }
      }
    }
  }
  // salles
  for (let i = 0; i < levels.length; i++) {
    if (!POS[i] || !show(i)) continue;
    const { x, y } = at(i),
      v = !!gameState.vis[i],
      bo = levels[i].boss,
      cur = i === gameState.lvl,
      done = !!gameState.cl[i];
    if (!v && !bo) {
      ctx.fillStyle = 'rgba(246,235,203,.14)';
      rr(x, y, cw, ch, 6);
      ctx.fill();
      ctx.fillStyle = 'rgba(246,235,203,.55)';
      ctx.font = '900 14px ' + FB;
      ctx.textBaseline = 'middle';
      ctx.fillText('?', x + cw / 2, y + ch / 2 + 1);
      ctx.textBaseline = 'alphabetic';
      continue;
    }
    ctx.fillStyle = bo ? (done ? '#3E7F7A' : v ? '#B5392A' : '#6B2A2A') : i === HUB ? '#E2B04A' : '#F6EBCB';
    rr(x, y, cw, ch, 6);
    ctx.fill();
    ctx.lineWidth = cur ? 5 : 3;
    ctx.strokeStyle = cur ? '#F2C45A' : INK;
    rr(x, y, cw, ch, 6);
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
          ctx.font = '900 ' + fs + 'px ' + FB;
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
    } else if (i === HUB) {
      ctx.fillStyle = INK;
      ctx.font = '900 16px ' + FB;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillText('★', x + cw / 2, y + ch / 2 + 1);
      ctx.textBaseline = 'alphabetic';
    }
    if (levels[i].rest && v) {
      // lit
      ctx.fillStyle = gameState.bu[i] ? '#8A8F98' : '#D0402E';
      rr(x + cw / 2 - 9, y + ch / 2 - 4, 18, 9, 2);
      ctx.fill();
      ctx.fillStyle = '#F6EBCB';
      rr(x + cw / 2 - 8, y + ch / 2 - 6, 7, 6, 2);
      ctx.fill();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = INK;
      rr(x + cw / 2 - 9, y + ch / 2 - 4, 18, 9, 2);
      ctx.stroke();
    }
    if (v && isBench(i)) {
      ctx.fillStyle = '#4DB8B1';
      ctx.beginPath();
      ctx.arc(x + cw - 7, y + 7, 6, 0, 7);
      ctx.fill();
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = INK;
      ctx.stroke();
      UI.push({
        id: 'm' + i,
        x: x - 3,
        y: y - 3,
        w: cw + 6,
        h: ch + 6,
      });
    }
    if (v && !bo && !isBench(i) && levels[i].st) {
      ctx.fillStyle = '#4DB8B1';
      ctx.beginPath();
      ctx.arc(x + cw - 7, y + 7, 5, 0, 7);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = INK;
      ctx.stroke();
    }
  }
  // le héros sur la salle active : petit saut, halo qui pulse, flèche qui rebondit
  if (POS[gameState.lvl]) {
    const { x, y } = at(gameState.lvl),
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
    ctx.strokeStyle = INK;
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
  ctx.font = '700 12px ' + FB;
  ctx.textAlign = 'center';
  ctx.fillText(
    'rouge : boss · vert-de-gris : vaincu · rond turquoise : statue ou lit = voyage rapide · doré : ici · ? : à découvrir',
    W / 2,
    H - 60,
  );
  btn('mback', W / 2 - 100, H - 52, 200, 36, 'RETOUR', {
    size: 20,
    lip: 8,
    r: 12,
  });
}
export function drawSleep() {
  ctx.fillStyle = 'rgba(27,22,18,.62)';
  ctx.fillRect(0, 0, W, H);
  outlined('DORMIR ?', W / 2, H / 2 - 96, 56, '#E2A93B');
  ctx.fillStyle = '#F6EBCB';
  ctx.font = '800 19px ' + FB;
  ctx.textAlign = 'center';
  ctx.fillText('Cœurs et Temps entièrement rechargés', W / 2, H / 2 - 48);
  ctx.fillText('mais +20 secondes ajoutées au chrono', W / 2, H / 2 - 20);
  btn('yes', W / 2 - 190, H / 2 + 10, 170, 52, 'DORMIR', {
    size: 24,
    c: '#55C2BA',
    d: '#23807A',
  });
  btn('no', W / 2 + 20, H / 2 + 10, 170, 52, 'NON', {
    size: 24,
  });
  ctx.font = '700 14px ' + FB;
  ctx.fillStyle = 'rgba(246,235,203,.8)';
  ctx.fillText('Entrée : dormir · Échap : non', W / 2, H / 2 + 104);
}
export function drawPause() {
  ctx.fillStyle = 'rgba(27,22,18,.62)';
  ctx.fillRect(0, 0, W, H);
  outlined('PAUSE', W / 2, H / 2 - 90, 64, '#E2A93B');
  btn('resume', W / 2 - 140, H / 2 - 58, 280, 56, 'REPRENDRE', {
    size: 28,
    lip: 11,
    r: 15,
  });
  btn('map', W / 2 - 120, H / 2 + 22, 240, 44, 'CARTE', {
    size: 20,
    lip: 9,
    r: 13,
    c: '#55C2BA',
    d: '#23807A',
  });
  btn('menu', W / 2 - 120, H / 2 + 88, 240, 44, 'MENU PRINCIPAL', {
    size: 20,
    lip: 9,
    r: 13,
  });
  btn('info', W / 2 - 120, H / 2 + 154, 240, 38, INFO ? 'INFOS : OUI (I)' : 'INFOS : NON (I)', {
    size: 18,
    lip: 8,
    r: 12,
    c: INFO ? '#55C2BA' : '#9A9A9A',
    d: INFO ? '#23807A' : '#5E5E5E',
  });
}

/* ---------- Entrées ---------- */
