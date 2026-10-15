import { cellNumber, roomNumberOf } from '../data/room-numbers.js';
import {
  BOSS_ARENAS,
  OCTOPUS_ARENA,
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
  GENERATED_LINKS,
  AQUATIC_WING,
  AQUATIC_SLOT,
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
  CORRIDOR_NAMES,
  HINT_FREE,
  HINT_BY_KIND,
  HINT_BY_TIER,
  edgeColumns,
  horizontalEdge,
  verticalEdge,
} from './edges.js';

// salles dont tout le sol est englué ou verglacé (cases colonne,ligne : 9,3 / 8,2 / 9,7)
const FLOOR_MATERIAL_AT_CELL = { '9,3': 'ice', '8,2': 'glue', '9,7': 'glue' };
// mécanisme imposé à une case de la carte (« colonne,ligne ») : salle 316 = une araignée
const MECHANISM_AT_CELL = { '9,7': 'spider' };
// mécanisme (ennemis, piège ou énigme) d'une salle générée : environ 7 salles sur 10, selon la graine du monde
// (la glace et la toile au sol ne viennent plus d'ici : voir assignFloorMaterials)
const MECHANISMS_FREE_ROOM = [
  'switch',
  'guards',
  'swarm',
  'web',
  'spikes',
  'guards',
  'swarm',
  'switch',
  'guards',
  'web',
];
const MECHANISMS_TIER_ROOM = ['guards', 'swarm', 'web', 'spikes', 'spikes', 'guards', 'swarm', 'web'];
function mechanismFor(key, tier, rest, vertical, worldSeed) {
  if (rest) return undefined;
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  h = Math.imul(h ^ (worldSeed | 0) ^ (h >>> 15), 2246822507) >>> 0;
  if (h % 100 >= 72) return undefined;
  const list = tier === 'F' ? MECHANISMS_FREE_ROOM : MECHANISMS_TIER_ROOM;
  const mech = list[(h >>> 8) % list.length];
  return mech === 'switch' && vertical ? 'guards' : mech;
}
const ICE_ROOM_SHARE = 0.1;
const WEB_ROOM_SHARE = 0.15;
const FLOOR_ENEMY_MIN = 1;
const FLOOR_ENEMY_MAX = 3;
/** Recouvre le sol libre de glace (tout) ou de toile (sauf près des fossés, des piques et des obstacles : on n'y saute pas). */
function coverRoomFloor(l, material) {
  const rows = l.rows.map((r) => r.split(''));
  const ch = material === 'ice' ? '_' : ',';
  // glace : tout le sol libre ; toile : seulement là où l'on peut encore sauter
  const ok = (c) => rows[13][c] === '.' && rows[14][c] === '#' && (material === 'ice' || rows[12][c] === '.');
  const blocked = (c) => {
    for (let k = c - 5; k <= c + 5; k++) if (k >= 0 && k < 30 && rows[14][k] !== '#') return true;
    for (let k = c - 2; k <= c + 2; k++)
      if (k >= 0 && k < 30 && (!['.', ',', '_', 'P', 'E'].includes(rows[13][k]) || rows[12][k] !== '.'))
        return true;
    return false;
  };
  for (let c = 1; c < 29; c++) if (ok(c) && (material === 'ice' || !blocked(c))) rows[13][c] = ch;
  l.rows = rows.map((r) => r.join(''));
}
/** Retire tous les ennemis de la salle (crabes, colosses, fantômes, araignées) : seuls restent les pingouins. */
function stripEnemies(l) {
  l.rows = l.rows.map((r) => r.replace(/[*+!?;]/g, '.'));
}
/** Pose une paire de piques sur le sol libre (deux cases de plain-pied, à l'écart du reste). */
function addFloorSpikes(l, rnd) {
  const rows = l.rows.map((r) => r.split(''));
  const okc = (c) => ['.', '_', ','].includes(rows[13][c]) && rows[12][c] === '.' && rows[14][c] === '#';
  const spots = [];
  for (let c = 4; c < 25; c++)
    if ([-1, 0, 1, 2].every((d) => okc(c + d) && rows[13][c + d] !== ':' && rows[13][c + d] !== ';'))
      spots.push(c);
  if (!spots.length) return;
  const c = spots[Math.floor(rnd() * spots.length)];
  rows[13][c] = rows[13][c + 1] = '^';
  l.rows = rows.map((r) => r.join(''));
}
/** Pose `n` ennemis de la matière (':' pingouin, ';' araignée) sur des cases de sol espacées. */
function addFloorEnemies(l, char, n, rnd) {
  const rows = l.rows.map((r) => r.split(''));
  const have = rows[13].filter((q) => q === char).length;
  const spots = [];
  for (let c = 3; c < 27; c++) {
    const near = rows[13].slice(c - 1, c + 2);
    if (
      ['.', '_', ','].includes(rows[13][c]) &&
      rows[12][c] === '.' &&
      rows[14][c] === '#' &&
      !near.some((q) => !['.', '_', ','].includes(q))
    )
      spots.push(c);
  }
  let placed = have;
  while (placed < n && spots.length) {
    const c = spots.splice(Math.floor(rnd() * spots.length), 1)[0];
    rows[13][c] = char;
    placed++;
    for (let k = spots.length - 1; k >= 0; k--) if (Math.abs(spots[k] - c) < 4) spots.splice(k, 1);
  }
  l.rows = rows.map((r) => r.join(''));
}
// salles (par numéro) qui reçoivent une mare : un petit bassin de 4 cases creusé dans le sol, avec un piranha
const POOL_ROOM_NUMBERS = [20, 2, 63, 10, 85];
/** Creuse une mare (4 cases de large, 2 de profondeur) dans une portion plate du sol, loin des puits, des pointes et des ennemis. */
function addPool(l) {
  const rows = l.rows.map((r) => r.split(''));
  const shaft = new Set();
  for (const k of l.links)
    if (k.s === 't' || k.s === 'b') for (let c = k.c0 - 2; c <= k.c1 + 2; c++) shaft.add(c);
  // portion de sol plate : d'abord avec une marge d'une case de chaque côté et de l'air au-dessus, puis sans exigence
  const solid = (c) => c >= 1 && c < 29 && rows[14][c] === '#' && rows[15][c] === '#' && !shaft.has(c);
  const free = (c) => ['.', '_', ','].includes(rows[13][c]);
  const tiers = [
    (c) => solid(c) && free(c) && rows[12][c] === '.',
    (c) => solid(c) && free(c),
    (c) => solid(c) && rows[13][c] !== '^' && rows[13][c] !== 'P' && rows[13][c] !== 'E',
  ];
  let best = -1;
  for (const ok of tiers) {
    for (let c = 4; c <= 24; c++) {
      const span = ok === tiers[0] ? [-1, 0, 1, 2, 3, 4] : [0, 1, 2, 3];
      if (!span.every((d) => ok(c + d))) continue;
      if (best < 0 || Math.abs(c + 2 - 14) < Math.abs(best + 2 - 14)) best = c;
    }
    if (best >= 0) break;
  }
  if (best < 0) return false;
  for (let d = 0; d < 4; d++) rows[14][best + d] = rows[15][best + d] = '"';
  rows[14][best + 1] = '`'; // un piranha
  l.rows = rows.map((r) => r.join(''));
  return true;
}
function addPools() {
  levels.forEach((l, i) => {
    if (!l.rows || l.boss || l.rest || i === HUB_ROOM || !l.pos) return;
    if (POOL_ROOM_NUMBERS.includes(cellNumber(l.pos))) addPool(l);
  });
}
/**
 * 10 % des salles ont un sol de glace (salle entièrement gelée), 15 % un sol de toile d'araignée ; chacune reçoit
 * 1 à 3 pingouins (glace) ou araignées (toile). Les salles déjà ainsi (299, 300, 316, patinoire) comptent dans le quota.
 */
function assignFloorMaterials(seed) {
  const rnd = seededRandom((seed ^ 0x9e3779b1) >>> 0);
  const material = (l) => (l.rows[13].includes('_') ? 'ice' : l.rows[13].includes(',') ? 'web' : null);
  const eligible = [],
    have = { ice: [], web: [] };
  levels.forEach((l, i) => {
    if (!l.rows || l.boss || l.rest || i === HUB_ROOM) return;
    const m = material(l);
    if (m) have[m].push(l);
    else if (i > LAST_HANDMADE_ROOM || l.gen) eligible.push(l);
  });
  for (let k = eligible.length - 1; k > 0; k--) {
    const j = Math.floor(rnd() * (k + 1));
    [eligible[k], eligible[j]] = [eligible[j], eligible[k]];
  }
  for (const [m, share] of [
    ['ice', ICE_ROOM_SHARE],
    ['web', WEB_ROOM_SHARE],
  ]) {
    const want = Math.round(levels.length * share);
    while (have[m].length < want && eligible.length) {
      const l = eligible.pop(),
        before = l.rows;
      // on ne saute pas sur la toile : jamais dans un puits (escalade), ni dans une salle déjà creusée d'une mare
      if (m === 'web' && l.links.some((k) => k.s === 't' || k.s === 'b')) continue;
      if (m === 'web' && l.rows.join('').includes('"')) continue;
      if (m === 'ice') stripEnemies(l);
      coverRoomFloor(l, m);
      // sol trop encombré (rien n'a pu être recouvert) : on passe à la salle suivante
      if (material(l) === m) have[m].push(l);
      else l.rows = before;
    }
    // une salle qui a déjà un peu de matière (patinoire écrite à la main) est gelée en entier
    // une salle de glace n'a que des pingouins comme ennemis
    for (const l of have[m])
      if (m === 'ice') {
        stripEnemies(l);
        coverRoomFloor(l, 'ice');
      }
    // salle gelée : au moins une paire de stalagmites (piques) sur le sol
    if (m === 'ice') for (const l of have[m]) if (!l.rows[13].includes('^')) addFloorSpikes(l, rnd);
    for (const l of have[m]) {
      const n = FLOOR_ENEMY_MIN + Math.floor(rnd() * (FLOOR_ENEMY_MAX - FLOOR_ENEMY_MIN + 1));
      addFloorEnemies(l, m === 'ice' ? ':' : ';', n, rnd);
    }
  }
}
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
  // salle d'eau : entrée et sortie au niveau de la berge (la porte n'ouvre pas dans les murs de la berge)
  if (l.shore) for (const k of l.links) if (k.s === 'l' || k.s === 'r') k.r1 = Math.min(k.r1, l.shore);
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
  let handSlot = 0;
  for (let r = 1; r < BOSS_ORDER.length; r++) {
    const gain = BOSS_ORDER[r],
      aquatic = gain === 7, // l'aile de la Pieuvre est fixe : ses salles sont générées sur la carte
      slot = aquatic ? AQUATIC_SLOT : WING_SLOTS[perm[handSlot++]],
      newest = BOSS_ORDER[r - 1];
    if (r >= 2) O.add(newest);
    const ap = aquatic ? [] : chooseApproachRoom(r, O, newest, used, rnd);
    if (!aquatic) H[slot.b] = mk(BOSS_ARENAS[gain]);
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
    if (!aquatic) H[slot.b].zoneG = gain;
    plan.push({
      r,
      gain,
      slot,
      // une seule porte fermée dans tout le monde : l'entrée de la première aile, avant l'écho du Temps.
      // Les autres ailes sont ouvertes : ce sont leurs salles d'approche qui exigent physiquement le pouvoir.
      gate:
        r === 1
          ? {
              t: 1,
            }
          : undefined,
      ap: aquatic ? ['(salles générées)'] : ap.map((p) => (p.r ? p.r.name : '(couloir ' + p.gen + ')')),
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
      if (p.slot.aquatic) continue; // liens générés avec la grille
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
    // salles générées : voisines d'une même ligne reliées, puits (escaliers / échelles) entre les lignes
    for (const [a, b] of GENERATED_LINKS.horizontal) horizontalEdge(a, b);
    for (const [u, d, kind, y] of GENERATED_LINKS.vertical) {
      const c = edgeColumns(y, kind);
      // pas de trappe verrouillée : c'est la géométrie du puits qui décide
      verticalEdge(u, d, { c0: c[0], c1: c[1], kind });
    }
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
      // pas de toile dans un puits : on ne saute pas dessus
      floor:
        FLOOR_MATERIAL_AT_CELL[key] === 'glue' && l.links.some((q) => q.s === 't' || q.s === 'b')
          ? undefined
          : FLOOR_MATERIAL_AT_CELL[key],
      crabs: l.rest ? 0 : l.tier === 'F' || l.tier === 'E' ? 1 + ((42 + o.k) % 2) : 0,
      mech:
        MECHANISM_AT_CELL[key] ||
        mechanismFor(
          'c' + key,
          l.tier,
          l.rest,
          l.links.some((q) => q.s === 't' || q.s === 'b'),
          seed,
        ),
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
  // arène de la Pieuvre : remplace la salle générée de la case du boss aquatique (cul-de-sac relié à sa voisine de gauche)
  {
    const i = roomAtCell(AQUATIC_WING.col, AQUATIC_WING.row),
      l = {
        ...OCTOPUS_ARENA,
        rows: OCTOPUS_ARENA.rows.slice(),
        links: levels[i].links,
        pos: ROOM_POSITIONS[i],
      };
    levels[i] = l;
    prepareHandmadeRoom(l, i);
    l.tier = 'F';
  }
  // salles d'approche remplies par le générateur (couloirs à obstacle de palier)
  levels.forEach((l, i) => {
    if (i > LAST_HANDMADE_ROOM || !l.genFill) return;
    const g = generateRoom({
      links: l.links,
      tier: l.genFill,
      rest: false,
      seed: i * 104729 + (seed & 0xffff),
      crabs: l.genFill === 'F' ? 1 : 0,
      mech: mechanismFor('f' + i, l.genFill, false, false, seed),
      floor: ROOM_POSITIONS[i] && FLOOR_MATERIAL_AT_CELL[ROOM_POSITIONS[i].join(',')],
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
  addPools();
  assignFloorMaterials(seed);
  // numéro stable de chaque salle (voir data/room-numbers.js)
  levels.forEach((l, i) => {
    l.number = roomNumberOf(l, ROOM_POSITIONS[i]);
  });
  return levels;
}
