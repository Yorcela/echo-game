import { cellNumber } from '../data/room-numbers.js';
import { kingRoom, levels } from '../data/levels.js';
import { HUB_ROOM, gameState } from '../state/state.ts';
export const isKingReady = () =>
  !!gameState.hasTimeEcho &&
  !!gameState.hasSwim &&
  [0, 1, 2, 3, 4, 5, 6].every((k) => gameState.echoesOwned[k]) &&
  !gameState.clearedBossRooms[HUB_ROOM];
export const kingArenaLevel = () => {
  const r = kingRoom.rows.map((x) => x.slice(0, 29) + '.');
  for (let q = 0; q < 17; q++) if (q === 0 || q >= 14) r[q] = r[q].slice(0, 29) + '#';
  return {
    ...levels[HUB_ROOM],
    name: kingRoom.name,
    hint: kingRoom.hint,
    boss: kingRoom.boss,
    rows: r,
    king: 1,
    links: [],
    bench: false,
    rest: false,
    number: cellNumber(ROOM_POSITIONS[HUB_ROOM]),
  };
};

/* ---------- LE MONDE : une grille de 10 x 10 cases, 100 salles ----------
   Cases et salles de repos fixes ; en revanche le CONTENU des 7 ailes (quelle aile abrite quel boss, et les salles d'approche
   qui obligent à utiliser les échos déjà gagnés) est tiré à chaque nouvelle partie (buildWorld(seed)). */
export const LAST_HANDMADE_ROOM = 42; // salles « à la main » : indices 0..42 ; le Hall est 43 ; les salles générées suivent
export const OPPOSITE_SIDE = {
  l: 'r',
  r: 'l',
  t: 'b',
  b: 't',
};
export const NO_FLIP = typeof globalThis !== 'undefined' && !!globalThis.__NOFLIP; // tests : salles non retournées
export const ENTB = {},
  EXITB = {
    1: [1, 4],
  };
const makeAlcove = (name, hint) => ({
  name,
  hint,
  bench: false,
  rows: (() => {
    const r = [];
    for (let y = 0; y < 17; y++) {
      if (y < 4 || y >= 8) r.push('#'.repeat(30));
      else r.push('#' + '.'.repeat(28) + '#');
    }
    const set = (y, x, ch) => {
      const a = r[y].split('');
      a[x] = ch;
      r[y] = a.join('');
    };
    set(7, 3, 'P');
    set(7, 13, '^');
    set(7, 14, '^');
    return r;
  })(),
});
export const colossusAlcove = makeAlcove('Alcôve du Colosse', '');
export const boltAlcove = makeAlcove("Alcôve de l'Éclair", '');
export const ROOM_PATCHES = {
  'Les petites bêtes': [
    [12, 20, 21, '#'],
    [10, 23, 24, '#'],
    [8, 26, 29, '#'],
    [4, 29, 29, '&'],
    [5, 29, 29, '&'],
    [6, 29, 29, '&'],
    [7, 29, 29, '&'],
  ],
  'Coup de tête': [
    [12, 11, 12, '#'],
    [10, 14, 15, '#'],
    [8, 17, 19, '#'],
    [8, 26, 29, '#'],
  ],
  // un plafond au-dessus des remparts : on ne les franchit pas d'un double saut, seul le clone se glisse dans le couloir du haut
  'Le rempart': [1, 2, 3, 4, 5, 6, 7].map((r) => [r, 10, 12, '#']),
  'Rempart et miroir': [1, 2, 3, 4, 5, 6, 7].map((r) => [r, 13, 15, '#']),
};
export const ROOM_ENEMIES = {
  'Coup de tête': ['+'],
  'Les petites bêtes': ['+', '?', '+'],
  'Mur de briques': ['!'],
  'Pont et gardien': ['+'],
  'Passage étroit': ['+'],
  'Trois remparts': ['!'],
  'Le dernier effort': ['+'],
};
export const setTile = (l, r, c, ch) => {
  const a = l.rows[r].split('');
  a[c] = ch;
  l.rows[r] = a.join('');
};
export const reverseRow = (r) => [...r].reverse().join('');
export const swapLeftRightText = (t) =>
  t.replace(/gauche|droite/g, (m) => (m === 'gauche' ? 'droite' : 'gauche'));

/* ---------- disposition : une grille de 10 × 10 cases ----------
   Une ligne et une colonne par boss : le hall (Roi), l'arène du Gardien (salle 5), les 7 ailes et l'emplacement réservé de
   l'aile aquatique (à venir). Les salles écrites à la main gardent leur orientation (entrée à gauche, ou à droite si retournées). */
export const GRID_SIZE = 10;
const HUB_CELL = [4, 0];
// chemin de départ, relatif au hall : [salle, décalage x, décalage y, entrée à droite ?]
const START_PATH = [
  [0, -1, 0, 1],
  [1, -2, 0, 1],
  [2, -3, 0, 1],
  [40, -4, 0, 1],
  [3, -3, 1, 0],
  [39, -2, 1, 0],
  [4, -3, 2, 1],
  [5, -4, 2, 1],
];
/* les 7 ailes mobiles (salle d'approche ×4 + boss) : ligne, colonne du boss, et sens (boss à droite : couloir de gauche à droite)
   + l'aile aquatique réservée (ligne 4, cases générées pour l'instant) */
const WING_LAYOUT = [
  { ap: [6, 7, 8, 9], b: 10, row: 1, col: 8, right: true },
  { ap: [11, 12, 13, 14], b: 15, row: 3, col: 3, right: false },
  { ap: [16, 17, 18, 19], b: 20, row: 5, col: 7, right: true },
  { ap: [21, 22, 23, 24], b: 25, row: 8, col: 6, right: true },
  { ap: [26, 27, 28, 29], b: 30, row: 6, col: 2, right: false },
  { ap: [31, 32, 33, 34], b: 35, row: 9, col: 9, right: true },
  { ap: [37, 38, 41, 42], b: 36, row: 7, col: 1, right: false },
];
export const AQUATIC_WING = { row: 4, col: 5, right: true }; // emplacement réservé : boss + 4 salles d'approche à venir
const wingCells = (w) => {
  const dir = w.right ? 1 : -1,
    cells = [];
  for (let k = 4; k >= 0; k--) cells.push([w.col - dir * k, w.row]);
  return cells; // du côté d'entrée vers le boss
};
export const ROOM_POSITIONS = [],
  FL = [],
  CELL = {};
{
  const put = (i, x, y, f) => {
    ROOM_POSITIONS[i] = [x, y];
    FL[i] = !!f && !NO_FLIP;
  };
  for (const [i, dx, dy, f] of START_PATH) put(i, HUB_CELL[0] + dx, HUB_CELL[1] + dy, f);
  for (const w of WING_LAYOUT)
    [...w.ap, w.b].forEach((room, k) => {
      const [x, y] = wingCells(w)[k];
      put(room, x, y, !w.right);
    });
}
ROOM_POSITIONS[HUB_ROOM] = HUB_CELL;
FL[HUB_ROOM] = false;
// cases libres = salles générées (l'ordre de lecture donne leur numéro et leur graine)
export const GENERATED_CELLS = [];
{
  const taken = new Set(ROOM_POSITIONS.filter(Boolean).map((p) => p + ''));
  for (let y = 0; y < GRID_SIZE; y++)
    for (let x = 0; x < GRID_SIZE; x++) if (!taken.has(x + ',' + y)) GENERATED_CELLS.push({ x, y });
  GENERATED_CELLS.forEach((o, k) => {
    o.k = k;
    o.i = HUB_ROOM + 1 + k;
  });
}
// salle de repos : au-dessus de chaque boss (l'échelle descend jusqu'à lui) ; case -> boss
export const REST_ROOM_AT = {};
for (const w of WING_LAYOUT) REST_ROOM_AT[w.col + ',' + (w.row - 1)] = w.b;
REST_ROOM_AT[ROOM_POSITIONS[5][0] + ',' + (ROOM_POSITIONS[5][1] - 1)] = 5;
export const TIER_AT_CELL = {};
GENERATED_CELLS.forEach((o) => {
  ROOM_POSITIONS[o.i] = [o.x, o.y];
  FL[o.i] = false;
});
for (let i = 0; i < ROOM_POSITIONS.length; i++) {
  if (!ROOM_POSITIONS[i]) continue;
  const k = ROOM_POSITIONS[i] + '';
  if (CELL[k] !== undefined) throw new Error('case ' + k + ' : ' + CELL[k] + ' / ' + i);
  CELL[k] = i;
}
for (let i = 0; i <= LAST_HANDMADE_ROOM; i++)
  if (!ROOM_POSITIONS[i]) throw new Error('salle sans case : ' + i);
export const roomAtCell = (x, y) => CELL[x + ',' + y];
/* liaisons entre cases libres (et le hall) : toutes les cases voisines d'une même ligne sont reliées ; des puits relient les lignes
   (un arbre couvrant, plus quelques liaisons supplémentaires). Les salles de repos au-dessus d'un boss ne sont reliées que par leur échelle. */
export const GENERATED_LINKS = { horizontal: [], vertical: [] };
{
  const free = (x, y) => {
    // l'arène du boss aquatique est un cul-de-sac : liée seulement à sa voisine de gauche (ajoutée plus bas)
    if (x === AQUATIC_WING.col && y === AQUATIC_WING.row) return false;
    const i = roomAtCell(x, y);
    return i !== undefined && (i === HUB_ROOM || i > HUB_ROOM);
  };
  const parent = new Map();
  const find = (a) => {
    while (parent.get(a) !== a) {
      parent.set(a, parent.get(parent.get(a)));
      a = parent.get(a);
    }
    return a;
  };
  const union = (a, b) => {
    const ra = find(a),
      rb = find(b);
    if (ra === rb) return false;
    parent.set(ra, rb);
    return true;
  };
  for (let y = 0; y < GRID_SIZE; y++)
    for (let x = 0; x < GRID_SIZE; x++) if (free(x, y)) parent.set(roomAtCell(x, y), roomAtCell(x, y));
  for (let y = 0; y < GRID_SIZE; y++)
    for (let x = 0; x < GRID_SIZE - 1; x++)
      if (free(x, y) && free(x + 1, y)) {
        GENERATED_LINKS.horizontal.push([roomAtCell(x, y), roomAtCell(x + 1, y)]);
        union(roomAtCell(x, y), roomAtCell(x + 1, y));
      }
  GENERATED_LINKS.horizontal.push([
    roomAtCell(AQUATIC_WING.col - 1, AQUATIC_WING.row),
    roomAtCell(AQUATIC_WING.col, AQUATIC_WING.row),
  ]);
  // puits : d'abord ceux qui relient des morceaux séparés, puis un sur trois pour mailler
  const kinds = ['stairs', 'ladder', 'stairs'];
  const candidates = [];
  for (let x = 0; x < GRID_SIZE; x++)
    for (let y = 0; y < GRID_SIZE - 1; y++) if (free(x, y) && free(x, y + 1)) candidates.push([x, y]);
  const chosen = new Set();
  for (const [x, y] of candidates) if (union(roomAtCell(x, y), roomAtCell(x, y + 1))) chosen.add(x + ',' + y);
  candidates.forEach(([x, y], n) => {
    if (n % 5 === 0) chosen.add(x + ',' + y);
  });
  for (const [x, y] of candidates)
    if (chosen.has(x + ',' + y))
      GENERATED_LINKS.vertical.push([
        roomAtCell(x, y),
        roomAtCell(x, y + 1),
        kinds[(x * 3 + y * 5) % kinds.length],
        y,
      ]);
}
export const ZONE_BY_BOSS = {
  t: 0,
  0: 1,
  2: 2,
  1: 3,
  3: 4,
  4: 5,
  6: 6,
  5: 7,
  7: 0,
}; // décor selon le boss de l'aile
export const WING_NAME_BY_BOSS = {
  t: 'du Gardien',
  0: 'des Reflets',
  2: 'des Jumeaux',
  1: 'de la Mémoire',
  3: 'du Colosse',
  4: "de l'Éclair",
  6: 'de la Sorcière',
  5: "de l'Envol",
  7: 'de la Pieuvre',
};
// les 7 ailes mobiles : salles d'approche, salle du boss, case d'où l'on y entre
export const WING_SLOTS = WING_LAYOUT.map((w) => {
  const dir = w.right ? 1 : -1;
  return {
    ap: w.ap,
    b: w.b,
    from: roomAtCell(w.col - dir * 5, w.row),
  };
});
// l'aile aquatique : salles d'approche générées, arène de la Pieuvre ; son rang est fixe (3e boss)
export const AQUATIC_SLOT = {
  ap: [1, 2, 3, 4].map((k) => roomAtCell(AQUATIC_WING.col - 5 + k, AQUATIC_WING.row)),
  b: roomAtCell(AQUATIC_WING.col, AQUATIC_WING.row),
  from: roomAtCell(AQUATIC_WING.col - 5, AQUATIC_WING.row),
  aquatic: true,
};
export const WORLD = {
  seed: 0,
  ranks: [],
  perm: [],
};
