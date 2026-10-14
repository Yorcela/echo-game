import { kingRoom, levels } from '../data/levels.js';
import { HUB_ROOM, gameState } from '../state/state.js';
export const isKingReady = () =>
  !!gameState.hasTimeEcho &&
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
  };
};

/* ---------- LE MONDE : une grille de 13 x 10 cases, ~100 salles ----------
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

// salles écrites à la main : [salle, x, y, entrée à droite ?]
const HANDMADE_PLACEMENTS = [
  [0, 5, 5, 1],
  [1, 4, 5, 1],
  [2, 3, 5, 1],
  [40, 2, 5, 1],
  [3, 3, 6, 0],
  [39, 4, 6, 0],
  [4, 3, 7, 1],
  [5, 2, 7, 1],
  [6, 7, 5, 0],
  [7, 8, 5, 0],
  [8, 9, 5, 0],
  [9, 10, 5, 0],
  [10, 11, 5, 0],
  [11, 5, 3, 1],
  [12, 4, 3, 1],
  [13, 3, 3, 1],
  [14, 2, 3, 1],
  [15, 1, 3, 1],
  [16, 7, 7, 0],
  [17, 8, 7, 0],
  [18, 9, 7, 0],
  [19, 10, 7, 0],
  [20, 11, 7, 0],
  [21, 7, 3, 0],
  [22, 8, 3, 0],
  [23, 9, 3, 0],
  [24, 10, 3, 0],
  [25, 11, 3, 0],
  [26, 5, 1, 1],
  [27, 4, 1, 1],
  [28, 3, 1, 1],
  [29, 2, 1, 1],
  [30, 1, 1, 1],
  [31, 7, 1, 0],
  [32, 8, 1, 0],
  [33, 9, 1, 0],
  [34, 10, 1, 0],
  [35, 11, 1, 0],
  [37, 5, 9, 1],
  [38, 4, 9, 1],
  [41, 3, 9, 1],
  [42, 2, 9, 1],
  [36, 1, 9, 1],
];
export const ROOM_POSITIONS = [],
  FL = [],
  CELL = {};
for (const [i, x, y, f] of HANDMADE_PLACEMENTS) {
  ROOM_POSITIONS[i] = [x, y];
  FL[i] = !!f && !NO_FLIP;
}
ROOM_POSITIONS[HUB_ROOM] = [6, 5];
FL[HUB_ROOM] = false;
// salles générées : cases libres (l'ordre d'origine est gardé pour que chaque graine de salle reste celle qui a été vérifiée)
export const GENERATED_CELLS = [];
{
  const add = (x, y, o = {}) =>
    GENERATED_CELLS.push({
      x,
      y,
      ...o,
    });
  for (const y of [1, 2, 3, 4, 6, 7, 9]) add(6, y);
  for (let x = 0; x <= 12; x++) {
    add(x, 0);
    add(x, 8);
  }
  for (let y = 1; y <= 7; y++) {
    add(0, y);
    add(12, y);
  }
  for (const [x, y] of [
    [1, 2],
    [11, 2],
    [11, 4],
    [11, 6],
    [2, 6],
    [1, 6],
    [5, 9],
    [4, 9],
    [3, 9],
    [2, 9],
    [5, 7],
  ])
    add(
      x,
      y,
      y === 9 && x <= 5
        ? {
            skip: 1,
          }
        : {},
    );
  add(7, 9, {
    fresh: 1,
  });
  add(8, 9, {
    fresh: 1,
  });
  let n = 0;
  GENERATED_CELLS.forEach((o, k) => {
    o.k = k;
    if (!o.skip) {
      o.i = HUB_ROOM + 1 + n++;
    }
  });
}
export const REST_ROOM_AT = {
  '1,0': 30,
  '11,0': 35,
  '1,2': 15,
  '11,2': 25,
  '11,4': 10,
  '11,6': 20,
  '2,6': 5,
  '1,8': 36,
  '5,7': -1,
}; // case -> boss dont l'échelle y arrive
export const TIER_AT_CELL = {
  '2,0': 'E',
  '3,0': 'F',
  '4,0': 'D',
  '5,0': 'F',
  '7,0': 'F',
  '8,0': 'J',
  '9,0': 'F',
  '10,0': 'E',
  '2,8': 'F',
  '3,8': 'F',
  '4,8': 'E',
  '5,8': 'F',
  '7,8': 'F',
  '8,8': 'D',
  '9,8': 'F',
  '10,8': 'J',
  '1,6': 'F',
  '7,9': 'F',
  '8,9': 'J',
};
GENERATED_CELLS.forEach((o) => {
  if (o.skip) return;
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
export const ZONE_BY_BOSS = {
  t: 0,
  0: 1,
  2: 2,
  1: 3,
  3: 4,
  4: 5,
  6: 6,
  5: 7,
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
};
// les 7 ailes mobiles : salles d'approche, salle du boss, case d'où l'on y entre
export const WING_SLOTS = [
  {
    ap: [6, 7, 8, 9],
    b: 10,
    from: HUB_ROOM,
  },
  {
    ap: [11, 12, 13, 14],
    b: 15,
    from: roomAtCell(6, 3),
  },
  {
    ap: [16, 17, 18, 19],
    b: 20,
    from: roomAtCell(6, 7),
  },
  {
    ap: [21, 22, 23, 24],
    b: 25,
    from: roomAtCell(6, 3),
  },
  {
    ap: [26, 27, 28, 29],
    b: 30,
    from: roomAtCell(6, 1),
  },
  {
    ap: [31, 32, 33, 34],
    b: 35,
    from: roomAtCell(6, 1),
  },
  {
    ap: [37, 38, 41, 42],
    b: 36,
    from: roomAtCell(6, 9),
  },
];
export const WORLD = {
  seed: 0,
  ranks: [],
  perm: [],
};
