import {
  BOSS_ARENAS,
  kingRoom,
  namedRooms,
  BOSS_ORDER,
  APPROACH_ROOM_POOL,
  handLevels,
  levels,
} from '../data/levels.js';
import { generateRoom, seededRandom } from './generator.js';
import { HUB_ROOM } from '../state/state.ts';
import {
  colossusAlcove,
  boltAlcove,
  WING_NAME_BY_BOSS,
  ROOM_ENEMIES,
  FL,
  GENERATED_CELLS,
  LAST_HANDMADE_ROOM,
  NO_FLIP,
  ROOM_PATCHES,
  ROOM_POSITIONS,
  REST_ROOM_AT,
  WING_SLOTS,
  TIER_AT_CELL,
  WORLD,
  ZONE_BY_BOSS,
  roomAtCell,
  reverseRow,
  setTile,
  swapLeftRightText,
} from './world.js';
import {
  CORRIDOR_SUFFIXES,
  GATE_REQUIREMENTS,
  CORRIDOR_NAMES,
  HINT_FREE,
  HINT_BY_KIND,
  HINT_BY_TIER,
  edgeColumns,
  horizontalEdge,
  verticalEdge,
} from './edges.js';
// choix des 4 salles d'approche d'une aile : elles n'exigent que des échos déjà possédés (O), dont le dernier gagné (newest)
function chooseApproachRoom(r, O, newest, used, rnd) {
  if (r === 1)
    return [namedRooms.pont1, namedRooms.pont2, namedRooms.pont3, namedRooms.pont4].map((x) => ({
      r: x,
      need: [],
      d: 0,
    }));
  const fits = APPROACH_ROOM_POOL.filter(
    (p) => (p.multi || !used.has(p)) && p.need.every((entity) => O.has(entity)),
  );
  const pickOf = (a) => a[Math.floor(rnd() * a.length)];
  const chosen = [],
    cov = new Set();
  const take = (p) => {
    chosen.push(p);
    if (!p.multi) used.add(p);
    p.need.forEach((entity) => cov.add(entity));
  };
  for (let k = 0; k < 2; k++) {
    const c = fits.filter((p) => p.need.includes(newest) && (p.multi || !chosen.includes(p)));
    if (c.length) take(pickOf(c));
  }
  while (chosen.length < 4) {
    const c = fits.filter((p) => p.multi || !chosen.includes(p));
    if (!c.length) break;
    let best = -1,
      bl = [];
    for (const p of c) {
      const g = p.need.filter((entity) => !cov.has(entity)).length;
      if (g > best) {
        best = g;
        bl = [p];
      } else if (g === best) bl.push(p);
    }
    take(pickOf(bl));
  }
  while (chosen.length < 4)
    chosen.push({
      gen: 'F',
      need: [],
      d: 0,
      multi: 1,
    });
  chosen.forEach((p) => (p._o = rnd()));
  chosen.sort((a, b) => a.d - b.d || a._o - b._o);
  return chosen;
}
function prepareHandmadeRoom(l, i) {
  l.rows = l.rows.slice();
  let sw = 0;
  if (l.rev && !NO_FLIP) {
    l.rows = l.rows.map(reverseRow);
    sw++;
  }
  for (let r = 0; r < 17; r++) if (l.rows[r].includes('E')) l.rows[r] = l.rows[r].replace(/E/g, '.');
  for (const [r, c0, c1, ch] of ROOM_PATCHES[l.name] || [])
    for (let c = c0; c <= c1; c++) setTile(l, r, c, ch);
  // portes et murs renforcés sur toute la hauteur : le double saut ne doit pas les contourner
  if (l.need && !l.boss && !l.noExt)
    for (let c = 1; c < 29; c++) {
      const ch = l.rows[13][c];
      if ((ch >= 'A' && ch <= 'Z' && ch !== 'E' && ch !== 'P') || ch === '&') {
        let r0 = 13;
        while (r0 > 1 && l.rows[r0 - 1][c] === ch) r0--;
        for (let r = 1; r < r0; r++) if (l.rows[r][c] === '.') setTile(l, r, c, ch);
      }
    }
  {
    const en = (ROOM_ENEMIES[l.name] || []).slice();
    for (let r = 0; r < 17; r++)
      if (l.rows[r].includes('*')) l.rows[r] = l.rows[r].replace(/\*/g, () => en.shift() || '+');
  }
  if (l.name === 'Pics en rafale') setTile(l, 13, 22, '?');
  if (l.name === 'Les petites bêtes')
    l.plug = {
      to: 39,
      cells: [
        [4, 29],
        [5, 29],
        [6, 29],
        [7, 29],
      ],
    };
  if (!l.boss && l.links.some((k) => k.s === 't')) {
    for (const [r, c0, c1] of [
      [12, 4, 5],
      [10, 0, 2],
      [8, 4, 6],
      [6, 0, 2],
      [4, 4, 6],
      [2, 0, 2],
    ])
      for (let c = c0; c <= c1; c++) if (l.rows[r][c] === '.') setTile(l, r, c, '#');
  }
  if (FL[i]) {
    l.rows = l.rows.map(reverseRow);
    l.flip = 1;
    if (l.sym) l.rows = l.rows.map((r) => r.replace(/[@$]/g, (q) => (q === '@' ? '$' : '@')));
    sw++;
    if (l.plug) l.plug.cells = l.plug.cells.map(([r, c]) => [r, 29 - c]);
  }
  if (sw % 2 && l.hint) l.hint = swapLeftRightText(l.hint);
  for (const k of l.links)
    if (k.s === 'l' || k.s === 'r') {
      const col = k.s === 'l' ? 0 : 29;
      for (let r = k.r0; r <= k.r1; r++) setTile(l, r, col, '.');
    }
  if (l.plug) for (const [r, c] of l.plug.cells) setTile(l, r, c, '&');
  if (l.boss) l.bossIdx = i;
}
// tests : installe une salle du catalogue (par son nom) en salle 0, avec une sortie à droite
export function installRoom(name) {
  const r = [...Object.values(namedRooms), ...handLevels, kingRoom].find(
    (x) => x && x.name === name && x.rows,
  );
  if (!r) throw new Error('salle inconnue : ' + name);
  const l = {
    ...r,
    rows: r.rows.slice(),
    links: [
      {
        s: 'r',
        r0: 1,
        r1: 13,
        to: HUB_ROOM,
        fwd: 1,
      },
    ],
    pos: ROOM_POSITIONS[0],
  };
  const pe = APPROACH_ROOM_POOL.find((p) => p.r && p.r.name === name);
  if (pe) l.need = pe.need.slice();
  levels[0] = l;
  prepareHandmadeRoom(l, 0);
  return 0;
}
export function buildWorld(seed) {
  seed = seed | 0;
  const rnd = seededRandom(seed ^ 0x2545f491);
  levels.length = 0;
  WORLD.seed = seed;
  WORLD.ranks = [];
  WORLD.perm = [];
  const mk = (r) => ({
    ...r,
    rows: r.rows.slice(),
    links: [],
  });
  // 1. contenu des salles à la main
  const H = [];
  [handLevels[0], handLevels[1], handLevels[2], namedRooms.bestioles, namedRooms.briques].forEach(
    (r, i) => (H[i] = mk(r)),
  );
  H[5] = mk(BOSS_ARENAS.t);
  H[39] = mk(colossusAlcove);
  H[40] = mk(boltAlcove);
  const perm = WING_SLOTS.map((_, k) => k);
  for (let k = perm.length - 1; k > 0; k--) {
    const j = Math.floor(rnd() * (k + 1));
    [perm[k], perm[j]] = [perm[j], perm[k]];
  }
  const used = new Set(),
    O = new Set(),
    plan = [];
  for (let r = 1; r <= 7; r++) {
    const gain = BOSS_ORDER[r],
      slot = WING_SLOTS[perm[r - 1]],
      newest = BOSS_ORDER[r - 1];
    if (r >= 2) O.add(newest);
    const ap = chooseApproachRoom(r, O, newest, used, rnd);
    H[slot.b] = mk(BOSS_ARENAS[gain]);
    ap.forEach((p, j) => {
      const i = slot.ap[j];
      H[i] = p.gen
        ? {
            name: '',
            hint: '',
            rows: [],
            links: [],
            genFill: p.gen,
            need: p.need.slice(),
          }
        : mk(p.r);
      H[i].need = p.need.slice();
      H[i].zoneG = gain;
    });
    H[slot.b].zoneG = gain;
    plan.push({
      r,
      gain,
      slot,
      gate:
        r === 1
          ? {
              t: 1,
            }
          : {
              pw: newest,
            },
      ap: ap.map((p) => (p.r ? p.r.name : '(couloir ' + p.gen + ')')),
    });
  }
  for (let i = 0; i <= LAST_HANDMADE_ROOM; i++) {
    if (!H[i]) throw new Error('salle manquante ' + i);
    levels[i] = H[i];
  }
  levels[HUB_ROOM] = {
    name: 'Hall des Échos',
    hint: '',
    rows: [],
    hub: true,
    bench: true,
    links: [],
  };
  GENERATED_CELLS.forEach((o) => {
    if (o.skip) return;
    levels[o.i] = {
      name: '',
      hint: '',
      rows: [],
      gen: 1,
      pos: [o.x, o.y],
      links: [],
    };
  });
  levels.forEach((l, i) => {
    l.pos = ROOM_POSITIONS[i];
  });
  WORLD.perm = perm;
  WORLD.ranks = plan.map((p) => ({
    r: p.r,
    gain: p.gain,
    boss: p.slot.b,
    from: p.slot.from,
    ap: p.slot.ap,
    gate: p.gate,
    names: p.ap,
  }));

  // 2. liens
  {
    const strip = (a, b) => {
      for (let i = a; i < b; i++)
        horizontalEdge(
          i,
          i + 1,
          {
            fwd: 1,
          },
          {},
        );
    };
    horizontalEdge(HUB_ROOM, 0, {}, {});
    strip(0, 2);
    {
      const c = FL[2] ? [1, 3] : [26, 28];
      verticalEdge(2, 3, {
        c0: c[0],
        c1: c[1],
        kind: 'stairs',
        auto: 1,
        fwd: 1,
      });
      const c2 = FL[3] ? [1, 3] : [26, 28];
      verticalEdge(3, 4, {
        c0: c2[0],
        c1: c2[1],
        kind: 'stairs',
        auto: 1,
        fwd: 1,
      });
    }
    horizontalEdge(
      2,
      40,
      {
        sec: 1,
      },
      {
        sec: 1,
      },
    );
    horizontalEdge(
      3,
      39,
      {
        sec: 1,
      },
      {
        sec: 1,
      },
    );
    horizontalEdge(
      4,
      5,
      {
        fwd: 1,
      },
      {},
    );
    for (const p of plan) {
      const ch = [...p.slot.ap, p.slot.b];
      horizontalEdge(
        p.slot.from,
        ch[0],
        {
          gate: p.gate,
        },
        {},
      );
      for (let k = 0; k < ch.length - 1; k++)
        horizontalEdge(
          ch[k],
          ch[k + 1],
          {
            fwd: 1,
          },
          {},
        );
    }
    horizontalEdge(roomAtCell(6, 9), roomAtCell(7, 9));
    horizontalEdge(roomAtCell(7, 9), roomAtCell(8, 9));
    for (let x = 0; x < 12; x++) {
      horizontalEdge(roomAtCell(x, 0), roomAtCell(x + 1, 0));
      horizontalEdge(roomAtCell(x, 8), roomAtCell(x + 1, 8));
    }
    for (const [a, b] of [
      [
        [0, 2],
        [1, 2],
      ],
      [
        [11, 2],
        [12, 2],
      ],
      [
        [11, 4],
        [12, 4],
      ],
      [
        [11, 6],
        [12, 6],
      ],
      [
        [0, 6],
        [1, 6],
      ],
      [
        [1, 6],
        [2, 6],
      ],
      [
        [5, 7],
        [6, 7],
      ],
    ])
      horizontalEdge(roomAtCell(...a), roomAtCell(...b));
    const SPINE = ['gap', 'ladder', 'stairs', 'stairs', 'ladder', 'stairs', 'ladder', 'stairs', 'stairs'];
    const vs = (x, y, kind) => {
      const u = roomAtCell(x, y),
        d = roomAtCell(x, y + 1);
      if (u === undefined || d === undefined) throw new Error('puits ' + x + ',' + y);
      const c = edgeColumns(y, kind);
      verticalEdge(u, d, {
        c0: c[0],
        c1: c[1],
        kind,
        gate: GATE_REQUIREMENTS[kind],
      });
    };
    SPINE.forEach((k, y) => vs(6, y, k));
    ['stairs', 'ladder', 'stairs', 'ladder', 'dj', 'stairs', 'ladder', 'stairs'].forEach((k, y) =>
      vs(0, y, k),
    );
    ['ladder', 'stairs', 'dj', 'stairs', 'gap', 'ladder', 'stairs', 'stairs'].forEach((k, y) => vs(12, y, k));
    for (const [k, b] of Object.entries(REST_ROOM_AT)) {
      if (b < 0) continue;
      const [x, y] = k.split(',').map(Number);
      if (roomAtCell(x, y + 1) !== b) throw new Error('boss ' + b + ' pas sous la salle de repos ' + k);
      verticalEdge(roomAtCell(x, y), b, {
        c0: -1,
        c1: -1,
        kind: 'ladder',
        lad: 1,
        boss: b,
        fwd: 0,
      });
      levels[b].links[levels[b].links.length - 1].gate = {
        cl: b,
      };
      levels[roomAtCell(x, y)].links[levels[roomAtCell(x, y)].links.length - 1].gate = {
        cl: b,
      };
    }
  }

  // 3. transformation des salles écrites à la main (retournement, remplissage, escaliers, ennemis…)
  levels.forEach((l, i) => {
    if (i > LAST_HANDMADE_ROOM || l.genFill) return;
    prepareHandmadeRoom(l, i);
  });
  // colonne de l'échelle de chaque boss : la plus centrale dont les lignes 1..13 sont vides
  const ladderCol = (rows) => {
    const cs = [];
    for (let c = 4; c <= 26; c++) {
      let ok = true;
      for (let r = 1; r <= 13 && ok; r++) if (rows[r][c] !== '.') ok = false;
      if (ok) cs.push(c);
    }
    cs.sort((a, b) => Math.abs(a - 14) - Math.abs(b - 14));
    if (!cs.length) throw new Error('pas de place pour une échelle');
    return cs[0];
  };
  for (const [k, b] of Object.entries(REST_ROOM_AT)) {
    if (b < 0) continue;
    const col = ladderCol(levels[b].rows);
    const [x, y] = k.split(',').map(Number);
    const lk1 = levels[b].links.find((q) => q.lad && q.s === 't'),
      lk2 = levels[roomAtCell(x, y)].links.find((q) => q.lad && q.s === 'b');
    lk1.c0 = lk1.c1 = lk2.c0 = lk2.c1 = col;
  }

  // 4. salles générées (couloirs, puits, repos) + couloirs d'approche
  const used2 = {};
  const nameOf = (o, tier, vt, restB) => {
    let nm,
      k = 0;
    do {
      nm =
        CORRIDOR_NAMES[(o.x * 3 + o.y * 5 + k) % CORRIDOR_NAMES.length] +
        ' ' +
        CORRIDOR_SUFFIXES[(o.x * 7 + o.y * 11 + k * 3) % CORRIDOR_SUFFIXES.length];
      k++;
    } while (used2[nm]);
    used2[nm] = 1;
    if (restB !== undefined) {
      nm = restB > 0 ? 'Repos ' + WING_NAME_BY_BOSS[levels[restB].gain] : 'Alcôve de repos';
    } else if (vt.length) {
      const a = vt.find((q) => q.s === 't') || vt[0];
      nm =
        (a.kind === 'ladder' ? 'Puits ' : 'Cheminée ') +
        CORRIDOR_SUFFIXES[(o.x * 5 + o.y * 7) % CORRIDOR_SUFFIXES.length];
      if (used2[nm]) nm += ' ' + (o.x + o.y);
      used2[nm] = 1;
    }
    return nm;
  };
  GENERATED_CELLS.forEach((o) => {
    if (o.skip) return;
    const l = levels[o.i],
      key = o.x + ',' + o.y,
      restB = REST_ROOM_AT[key];
    l.rest = restB !== undefined;
    l.bench = l.rest;
    l.tier = TIER_AT_CELL[key] || 'F';
    const sd = o.fresh ? o.i * 7919 + 13 : (42 + o.k) * 7919 + 13;
    const sp = {
      links: l.links,
      tier: l.tier,
      rest: l.rest,
      seed: sd,
      crabs: l.rest ? 0 : l.tier === 'F' || l.tier === 'E' ? 1 + ((42 + o.k) % 2) : 0,
    };
    const g = generateRoom(sp);
    l.rows = g.rows;
    l.hs = g.hs;
    const vt = l.links.filter((q) => q.s === 't' || q.s === 'b');
    const nm = nameOf(o, l.tier, vt, restB);
    let hint;
    if (l.rest)
      hint =
        "Salle de repos : approche-toi du lit puis appuie sur Entrée (ou touche le lit sur mobile) pour dormir : cœurs et Temps (5 s / 10 s) rechargés en entier, mais 20 s s'ajoutent au chrono. Le statut sauvegarde la partie." +
        (restB > 0 ? " L'échelle ouverte descend jusqu'à la salle du boss." : '');
    else if (vt.length) {
      const a = vt.find((q) => q.s === 't') || vt[0];
      hint = HINT_BY_KIND[a.kind] || '';
    } else hint = l.tier === 'F' ? HINT_FREE[(42 + o.k) % HINT_FREE.length] : HINT_BY_TIER[l.tier];
    l.name = nm;
    l.hint = hint;
  });
  // salles d'approche remplies par le générateur (couloirs à obstacle de palier)
  levels.forEach((l, i) => {
    if (i > LAST_HANDMADE_ROOM || !l.genFill) return;
    const g = generateRoom({
      links: l.links,
      tier: l.genFill,
      rest: false,
      seed: i * 104729 + (seed & 0xffff),
      crabs: l.genFill === 'F' ? 1 : 0,
    });
    l.rows = g.rows;
    l.hs = g.hs;
    l.gen = 1;
    l.tier = l.genFill;
    l.name =
      CORRIDOR_NAMES[i % CORRIDOR_NAMES.length] +
      ' ' +
      CORRIDOR_SUFFIXES[(i * 7 + (seed & 15)) % CORRIDOR_SUFFIXES.length];
    l.hint = l.tier === 'F' ? HINT_FREE[i % HINT_FREE.length] : HINT_BY_TIER[l.tier];
  });
  // Hall des Échos (départ au centre, arène du Roi à la fin)
  {
    const l = levels[HUB_ROOM];
    const g = generateRoom({
      links: l.links,
      tier: 'F',
      rest: true,
      seed: 4141,
    });
    const rows = g.rows.map((r) => r.replace('=', '.').replace('P', '.'));
    const a = rows[13].split('');
    a[14] = 'P';
    rows[13] = a.join('');
    l.rows = rows;
    l.hs = [];
    l.zone = 0;
  }
  // zones de décor : celle du boss de l'aile ; les couloirs générés prennent celle de la salle écrite la plus proche
  levels.forEach((l, i) => {
    if (i > LAST_HANDMADE_ROOM) return;
    l.zone = i <= 5 || i === 39 || i === 40 || l.zoneG === undefined ? 0 : ZONE_BY_BOSS[l.zoneG];
  });
  levels.forEach((l, i) => {
    if (i <= LAST_HANDMADE_ROOM) return;
    if (i === HUB_ROOM) {
      l.zone = 0;
      return;
    }
    let best = 99,
      z = 0;
    for (let j = 0; j <= LAST_HANDMADE_ROOM; j++) {
      const d =
        Math.abs(ROOM_POSITIONS[j][0] - ROOM_POSITIONS[i][0]) +
        Math.abs(ROOM_POSITIONS[j][1] - ROOM_POSITIONS[i][1]);
      if (d < best) {
        best = d;
        z = levels[j].zone;
      }
    }
    l.zone = z;
  });
  for (let i = 0; i < levels.length; i++)
    for (const k of levels[i].links) {
      const o = levels[k.to].links.find((q) => q.to === i);
      if (!o) throw new Error('lien sans retour ' + i + '>' + k.to);
    }
  return levels;
}
