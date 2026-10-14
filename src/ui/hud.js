import { runtime } from '../state/runtime.js';
import { H, W } from '../core/config.js';
import { canvas, ctx } from '../core/canvas.js';
import { TYPES } from '../data/echoes.js';
import { levels } from '../data/levels.js';
import { INFO, fmt, gameState, owned } from '../state/state.js';
import { scores } from '../state/save.js';
import { FB, INK, TOUCH, UI, btn, outlined, rr, wrap } from '../render/primitives.js';
// cœur partiellement rempli (fraction f de 0 à 1, par quarts)
function drawHeartF(x, y, s, f, blue) {
  if (f >= 0.999) {
    drawHeart(x, y, s, true, blue);
    return;
  }
  drawHeart(x, y, s, false, blue);
  if (f <= 0) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - s, y - s, s * 2 * f + 0, s * 2);
  ctx.clip();
  drawHeart(x, y, s, true, blue);
  ctx.restore();
}
function heartPath(x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.38);
  ctx.bezierCurveTo(x - s * 0.62, y - s * 0.02, x - s * 0.5, y - s * 0.62, x - s * 0.02, y - s * 0.28);
  ctx.lineTo(x, y - s * 0.28);
  ctx.lineTo(x + s * 0.02, y - s * 0.28);
  ctx.bezierCurveTo(x + s * 0.5, y - s * 0.62, x + s * 0.62, y - s * 0.02, x, y + s * 0.38);
  ctx.closePath();
}
export function drawHeart(x, y, s, full, blue) {
  ctx.save();
  ctx.lineJoin = 'round';
  heartPath(x, y + 2, s);
  ctx.fillStyle = '#261704';
  ctx.fill();
  heartPath(x, y, s);
  ctx.lineWidth = s * 0.13;
  ctx.strokeStyle = INK;
  ctx.stroke();
  const g = ctx.createLinearGradient(0, y - s * 0.5, 0, y + s * 0.4);
  if (full && blue) {
    g.addColorStop(0, '#8FD0FF');
    g.addColorStop(1, '#2A63C9');
  } else if (full) {
    g.addColorStop(0, '#FF7A6B');
    g.addColorStop(1, '#C92A2A');
  } else {
    g.addColorStop(0, '#6B625A');
    g.addColorStop(1, '#3F3832');
  }
  ctx.fillStyle = g;
  heartPath(x, y, s);
  ctx.fill();
  if (full) {
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    ctx.beginPath();
    ctx.ellipse(x - s * 0.27, y - s * 0.2, s * 0.11, s * 0.07, -0.6, 0, 7);
    ctx.fill();
  }
  ctx.restore();
}
export function drawHUD() {
  ctx.textAlign = 'left';
  // en haut à gauche : médaillon rond + barre (Temps) et bouton pause
  let px0 = 16;
  if (gameState.haveT) {
    const cx = 44,
      cy = 40;
    ctx.globalAlpha = 0.92;
    UI.push({
      id: 'rew',
      x: 12,
      y: 6,
      w: 196,
      h: 68,
    });
    ctx.fillStyle = 'rgba(27,22,18,.78)';
    rr(cx, cy - 13, 150, 26, 13);
    ctx.fill();
    ctx.strokeStyle = '#F6EBCB';
    ctx.lineWidth = 2;
    rr(cx, cy - 13, 150, 26, 13);
    ctx.stroke();
    const gw = (98 * gameState.gauge) / 10;
    ctx.fillStyle = gameState.gauge >= 10 ? '#4DB8B1' : gameState.gauge >= 5 ? '#F2C45A' : '#E8604C';
    rr(cx + 36, cy - 6, Math.max(6, gw), 12, 6);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    rr(cx + 39, cy - 4.5, Math.max(2, gw - 6), 3, 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(246,235,203,.9)';
    ctx.fillRect(cx + 36 + 49 - 1, cy - 8, 2, 16);
    if (gameState.flash < 0) {
      ctx.strokeStyle = '#E8604C';
      ctx.lineWidth = 3;
      rr(cx, cy - 13, 150, 26, 13);
      ctx.stroke();
      gameState.flash = Math.min(0, gameState.flash + 0.03);
    }
    ctx.beginPath();
    ctx.arc(cx, cy, 24, 0, 7);
    ctx.fillStyle = '#1B1612';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, 7);
    ctx.fillStyle = '#4DB8B1';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#F6EBCB';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, 7);
    ctx.fillStyle = '#FFF8E1';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - 7);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + 5, cy + 3);
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.globalAlpha = 1;
    px0 = 212;
  }
  if (gameState.mode === 'play' || gameState.mode === 'pause') {
    ctx.globalAlpha = 0.9;
    btn('pause', px0, 14, 46, 34, '', {
      lip: 6,
      r: 10,
      c: '#55C2BA',
      d: '#23807A',
      icon: (x, y) => {
        ctx.fillStyle = '#FFF8E1';
        ctx.strokeStyle = INK;
        ctx.lineWidth = 2;
        for (const dx of [-7, 3]) {
          rr(x + dx, y - 9, 6, 18, 2);
          ctx.fill();
          ctx.stroke();
        }
      },
    });
    ctx.globalAlpha = 1;
  }
  if (gameState.mode !== 'title') {
    const hx = px0 + 78;
    for (let i = 0; i < gameState.hpMax; i++) {
      const f = Math.max(0, Math.min(1, gameState.hp - i)),
        bump =
          f > 0 && f <= 1 && i === Math.ceil(gameState.hp) - 1 && gameState.inv > 0
            ? Math.sin(gameState.time * 14) * 1.5
            : 0;
      drawHeartF(hx + i * 31, 31 + bump, 29, f);
    }
    const nb = Math.ceil(gameState.sh - 1e-6);
    for (let j = 0; j < nb; j++)
      drawHeartF(hx + (gameState.hpMax + j) * 31, 31, 29, Math.min(1, gameState.sh - j), true);
  }
  // échos possédés : petites pastilles en haut à droite
  const o = TOUCH ? [] : owned();
  let x = W - 16;
  ctx.globalAlpha = 0.9;
  for (let i = o.length - 1; i >= 0; i--) {
    const t = o[i],
      sel = gameState.sel === t;
    x -= sel ? 34 : 28;
    rr(x, 14, sel ? 30 : 24, sel ? 30 : 24, 7);
    ctx.fillStyle = sel ? TYPES[t].c : 'rgba(246,235,203,.75)';
    ctx.fill();
    ctx.lineWidth = sel ? 3.5 : 2.5;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.font = '800 ' + (sel ? 13 : 11) + 'px ' + FB;
    ctx.textAlign = 'center';
    ctx.fillText(String(t + 1), x + (sel ? 15 : 12), sel ? 34 : 30);
  }
  if (o.length && gameState.have[gameState.sel]) {
    ctx.font = '800 11px ' + FB;
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(27,22,18,.75)';
    ctx.fillText(TYPES[gameState.sel].n.toUpperCase(), W - 16, 56);
  }
  ctx.globalAlpha = 1;
  // boss
  const bl = runtime.ents.filter((e) => e.k === 'b' && e.alive);
  if (bl.length) {
    const B = runtime.level.boss,
      bw = 220,
      bx = (W - bw) / 2 + 80,
      hp = B.kind === 'mirror' ? Math.max(...bl.map((e) => e.hp)) : bl.reduce((s, e) => s + e.hp, 0);
    ctx.fillStyle = 'rgba(27,22,18,.6)';
    rr(bx - 3, 14, bw + 6, 12, 6);
    ctx.fill();
    ctx.fillStyle = B.c;
    rr(bx, 17, Math.max(6, (bw * hp) / Math.max(1, gameState.bmax)), 6, 3);
    ctx.fill();
    ctx.fillStyle = 'rgba(27,22,18,.8)';
    ctx.font = '800 11px ' + FB;
    ctx.textAlign = 'center';
    ctx.fillText(B.n.toUpperCase(), bx + bw / 2, 40);
  }
  // chronomètre de toute la partie
  ctx.font = '900 15px ' + FB;
  ctx.textAlign = 'left';
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(27,22,18,.85)';
  ctx.lineJoin = 'round';
  const tt = '⏱ ' + fmt(gameState.run);
  ctx.strokeText(tt, 16, 88);
  ctx.fillStyle = '#FFF8E1';
  ctx.fillText(tt, 16, 88);
  // nom du niveau, discret
  ctx.fillStyle = 'rgba(27,22,18,.4)';
  ctx.font = '800 11px ' + FB;
  ctx.textAlign = 'left';
  ctx.fillText(runtime.level.name.toUpperCase(), 16, H - 8);
  if (gameState.bedNear && gameState.mode === 'play') {
    const tx = TOUCH ? 'Touche ici pour dormir' : 'Entrée : dormir';
    ctx.font = '800 15px ' + FB;
    const w = ctx.measureText(tx).width + 36,
      bx = W / 2 - w / 2,
      by = H - 110;
    UI.push({
      id: 'bed',
      x: bx,
      y: by,
      w,
      h: 34,
    });
    ctx.fillStyle = INK;
    rr(bx, by, w, 34, 12);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#F2C45A';
    rr(bx, by, w, 34, 12);
    ctx.stroke();
    ctx.fillStyle = '#F6EBCB';
    ctx.textAlign = 'center';
    ctx.fillText('🛏 ' + tx, W / 2, by + 22);
  }
  if (gameState.bedT > 0 && gameState.mode === 'play') {
    ctx.globalAlpha = Math.min(1, gameState.bedT);
    outlined('REPOS : cœurs et Temps rechargés', W / 2, H / 2 - 70, 30, '#F2C45A');
    ctx.globalAlpha = 1;
  }
  if (INFO && runtime.level.hint && gameState.hintT < HINT_T && gameState.mode === 'play')
    drawHint(runtime.level.hint, Math.min(1, HINT_T - gameState.hintT, gameState.hintT * 2.5 + 0.001));
  if (gameState.msgT > 0) {
    ctx.globalAlpha = Math.min(1, gameState.msgT);
    ctx.font = '700 14px ' + FB;
    const w = ctx.measureText(gameState.msg).width + 28;
    UI.push({
      id: 'toast',
      x: W / 2 - w / 2,
      y: H - 60,
      w,
      h: 28,
    });
    ctx.fillStyle = INK;
    rr(W / 2 - w / 2, H - 60, w, 28, 10);
    ctx.fill();
    ctx.fillStyle = '#F6EBCB';
    ctx.textAlign = 'center';
    ctx.fillText(gameState.msg, W / 2, H - 41);
    ctx.globalAlpha = 1;
  }
}
export const HINT_T = 21;
function drawHint(txt, al) {
  const bw = 640,
    bx = (W - bw) / 2,
    y = 60,
    tx = bx + 62,
    tw = bw - 62 - 22;
  ctx.save();
  ctx.font = '700 15px ' + FB;
  let lines = 1,
    line = '';
  for (const w of txt.split(' ')) {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width > tw && line) {
      lines++;
      line = w;
    } else line = t;
  }
  const h = Math.max(58, lines * 20 + 28);
  ctx.globalAlpha = al * 0.96;
  UI.push({
    id: 'hint',
    x: bx,
    y,
    w: bw,
    h,
  });
  ctx.fillStyle = 'rgba(8,6,14,.45)';
  rr(bx + 5, y + 6, bw, h, 6);
  ctx.fill();
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#EBDAA9');
  g.addColorStop(0.5, '#DCC690');
  g.addColorStop(1, '#C4A96D');
  rr(bx, y, bw, h, 6);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  rr(bx, y, bw, h, 6);
  ctx.clip();
  ctx.strokeStyle = 'rgba(88,52,22,.42)';
  ctx.lineWidth = 14;
  rr(bx, y, bw, h, 6);
  ctx.stroke();
  ctx.fillStyle = 'rgba(110,70,30,.10)';
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    ctx.arc(bx + 60 + i * 93, y + (i % 2 ? h - 10 : 12), 9 + (i % 3) * 3, 0, 7);
    ctx.fill();
  }
  ctx.restore();
  ctx.lineWidth = 4;
  ctx.strokeStyle = INK;
  rr(bx, y, bw, h, 6);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#7B5A24';
  rr(bx + 7, y + 7, bw - 14, h - 14, 3);
  ctx.stroke();
  for (const [cx, cy] of [
    [bx + 7, y + 7],
    [bx + bw - 7, y + 7],
    [bx + 7, y + h - 7],
    [bx + bw - 7, y + h - 7],
  ]) {
    ctx.fillStyle = '#2A2018';
    ctx.beginPath();
    ctx.arc(cx, cy, 4.5, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#B98B3E';
    ctx.beginPath();
    ctx.arc(cx - 1, cy - 1, 1.8, 0, 7);
    ctx.fill();
  }
  // chandelle
  const fx = bx + 34,
    fy = y + h / 2,
    fl = 1 + 0.14 * Math.sin(gameState.time * 9) + 0.07 * Math.sin(gameState.time * 23);
  const gl = ctx.createRadialGradient(fx, fy - 14, 2, fx, fy - 14, 34);
  gl.addColorStop(0, 'rgba(255,214,110,.55)');
  gl.addColorStop(1, 'rgba(255,214,110,0)');
  ctx.fillStyle = gl;
  ctx.fillRect(fx - 36, fy - 50, 72, 72);
  ctx.fillStyle = INK;
  rr(fx - 11, fy + 14, 22, 5, 2);
  ctx.fill();
  ctx.fillStyle = '#F4EBD0';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  rr(fx - 5, fy - 6, 10, 21, 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#F28C28';
  ctx.beginPath();
  ctx.ellipse(fx, fy - 14, 5 * fl * 0.9, 9 * fl, 0, 0, 7);
  ctx.fill();
  ctx.fillStyle = '#FFE08A';
  ctx.beginPath();
  ctx.ellipse(fx, fy - 12, 2.4, 5 * fl, 0, 0, 7);
  ctx.fill();
  ctx.fillStyle = '#2B1D12';
  ctx.textAlign = 'left';
  ctx.font = '700 15px ' + FB;
  wrap(txt, tx, y + h / 2 - (lines - 1) * 10 + 5, tw, 20, 15);
  ctx.restore();
}
export const nmEl = document.createElement('input');
{
  nmEl.id = 'nm';
  nmEl.type = 'text';
  nmEl.maxLength = 20;
  nmEl.autocomplete = 'off';
  nmEl.spellcheck = false;
  nmEl.placeholder = 'Ton nom';
  nmEl.style.cssText =
    'position:fixed;display:none;z-index:20;box-sizing:border-box;text-align:center;font:900 26px Nunito,system-ui,sans-serif;color:#1B1612;background:#F6EBCB;border:4px solid #1B1612;border-radius:12px;outline:3px solid #F2C45A;padding:0 10px;user-select:text;-webkit-user-select:text;touch-action:auto';
  document.body.appendChild(nmEl);
}
export function showNameInput(v) {
  nmEl.style.display = v ? 'block' : 'none';
  if (v) {
    nmEl.value = '';
    setTimeout(() => {
      try {
        nmEl.focus();
      } catch (e) {}
    }, 50);
  } else nmEl.blur();
}
export function positionName() {
  if (nmEl.style.display === 'none') return;
  const r = canvas.getBoundingClientRect(),
    k = r.width / W;
  nmEl.style.width = 440 * k + 'px';
  nmEl.style.height = 50 * k + 'px';
  nmEl.style.left = r.left + (W / 2 - 220) * k + 'px';
  nmEl.style.top = r.top + 236 * k + 'px';
  nmEl.style.fontSize = 26 * k + 'px';
  nmEl.style.borderWidth = Math.max(2, 4 * k) + 'px';
}
export function drawOver() {
  ctx.fillStyle = 'rgba(27,22,18,.88)';
  ctx.fillRect(0, 0, W, H);
  if (gameState.victory) outlined('VICTOIRE !', W / 2, 112, 66, '#E2A93B');
  else {
    for (let i = 0; i < 3; i++) drawHeart(W / 2 - 52 + i * 52, 56, 40, false);
    outlined('PLUS DE CŒURS !', W / 2, 128, 52, '#D0402E');
  }
  ctx.fillStyle = '#F6EBCB';
  ctx.textAlign = 'center';
  ctx.font = '800 20px ' + FB;
  ctx.fillText(
    'Salles explorées : ' + gameState.lost + '/' + levels.length + ' · temps ' + fmt(gameState.run),
    W / 2,
    168,
  );
  if (gameState.ph === 0) {
    ctx.fillText('Entre ton nom (20 caractères maximum)', W / 2, 214);
    ctx.font = '700 15px ' + FB;
    ctx.fillText(
      gameState.victory
        ? 'Le Roi des Échos est vaincu !'
        : 'La partie est terminée : tu recommenceras de zéro.',
      W / 2,
      324,
    );
    btn('ok', W / 2 - 110, 370, 220, 52, 'VALIDER', {
      size: 26,
    });
  } else {
    ctx.fillStyle = '#F6EBCB';
    ctx.font = '800 18px ' + FB;
    ctx.fillText('Classement', W / 2, 206);
    const L = scores.over.slice(0, 7);
    for (let i = 0; i < 7; i++) {
      const e = L[i],
        y = 238 + i * 28,
        me = gameState.lostRank === i + 1;
      ctx.fillStyle = me ? '#F2C45A' : '#F6EBCB';
      ctx.font = '900 19px ' + FB;
      ctx.textAlign = 'left';
      ctx.fillText(i + 1 + '.', W / 2 - 300, y);
      ctx.fillText(e ? e.n : '---', W / 2 - 262, y);
      ctx.textAlign = 'right';
      ctx.fillText(e ? (e.v ? 'VICTOIRE' : e.l + ' salles') : '', W / 2 + 210, y);
      ctx.fillText(e ? fmt(e.t) : '', W / 2 + 300, y);
    }
    btn('again', W / 2 - 130, 446, 260, 52, 'MENU PRINCIPAL', {
      size: 24,
    });
  }
}
