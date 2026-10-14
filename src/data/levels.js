import { bossArenaRows, buildRoomRows } from './level-builders.js';
import { EMPTY_HINT, bossDefs } from './bosses.js';
export const handLevels = [
  {
    name: 'Premiers pas',
    hint: '',
    rows: buildRoomRows((s, h, v) => {
      s(13, 2, 'P');
      h(13, 10, 11, '^');
      h(13, 17, 19, '^');
      v(22, 12, 13);
      s(13, 26, 'E');
      h(9, 4, 8);
      h(7, 20, 25);
    }),
  },
  {
    name: 'La Cheminée',
    hint: '',
    rows: buildRoomRows((s, h, v) => {
      s(13, 2, 'P');
      h(13, 8, 9, '^');
      v(14, 5, 12);
      v(17, 5, 13);
      h(5, 17, 28);
      s(4, 26, 'E');
      h(9, 21, 24);
    }),
  },
  {
    name: 'Coup de tête',
    hint: '',
    rows: buildRoomRows((s, h, v) => {
      s(13, 2, 'P');
      v(9, 12, 13);
      v(17, 12, 13);
      s(13, 13, '*');
      v(22, 10, 13, '%');
      s(13, 26, 'E');
      h(8, 4, 8);
    }),
  },
  {
    name: bossDefs[0].n,
    boss: bossDefs[0],
    gain: 't',
    hint: EMPTY_HINT,
    rows: bossArenaRows((s, h, v) => {
      h(11, 1, 4);
      h(11, 25, 28);
    }),
  },
  {
    name: bossDefs[1].n,
    boss: bossDefs[1],
    gain: 0,
    hint: EMPTY_HINT,
    rows: bossArenaRows((s, h, v) => {
      s(13, 27, '$');
    }),
  },
  {
    name: 'Le Miroir aux Alouettes',
    hint: '',
    rows: buildRoomRows((s, h, v) => {
      s(13, 2, 'P');
      h(13, 6, 7, '^');
      h(13, 22, 23, '^');
      s(13, 20, 'a');
      v(12, 10, 13, 'A');
      s(13, 14, 'E');
      h(9, 3, 6);
      h(9, 23, 26);
    }),
  },
  {
    name: bossDefs[2].n,
    boss: bossDefs[2],
    gain: 2,
    hint: EMPTY_HINT,
    rows: bossArenaRows((s, h, v) => {
      h(11, 1, 3);
      h(11, 26, 28);
    }),
  },
  {
    name: "Deux pour le prix d'un",
    hint: '',
    rows: buildRoomRows((s, h, v) => {
      s(13, 2, 'P');
      s(13, 8, 'a');
      h(12, 10, 12);
      s(13, 10);
      s(13, 12);
      s(13, 11, 'a');
      v(21, 9, 13, 'A');
      s(13, 24, 'E');
      h(13, 16, 17, '^');
      h(9, 23, 27);
    }),
  },
  {
    name: bossDefs[3].n,
    boss: bossDefs[3],
    gain: 1,
    hint: EMPTY_HINT,
    rows: bossArenaRows((s, h, v) => {
      h(11, 1, 4);
      h(11, 25, 28);
    }),
  },
  {
    name: "L'Écho du Tic-Tac",
    hint: '',
    rows: buildRoomRows((s, h, v) => {
      s(13, 1, 'P');
      s(13, 3, 'a');
      h(13, 8, 9, '^');
      h(13, 14, 15, '^');
      h(13, 20, 21, '^');
      v(27, 10, 13, 'A');
      s(13, 28, 'E');
      h(9, 5, 8);
      h(8, 12, 17);
      h(9, 21, 25);
    }),
  },
  {
    name: bossDefs[4].n,
    boss: bossDefs[4],
    gain: 3,
    hint: EMPTY_HINT,
    rows: bossArenaRows((s, h, v) => {
      h(12, 1, 3);
      h(13, 1, 3);
      s(13, 5, 'P');
      h(9, 1, 8);
    }),
  },
  {
    name: 'Le poids du monde',
    hint: '',
    rows: buildRoomRows((s, h, v) => {
      s(13, 2, 'P');
      v(14, 10, 13, '&');
      s(13, 22, 'E');
      h(8, 4, 9);
      h(13, 7, 8, '^');
    }),
  },
  {
    name: bossDefs[5].n,
    boss: bossDefs[5],
    gain: 4,
    hint: EMPTY_HINT,
    rows: bossArenaRows((s, h, v) => {
      h(11, 1, 4);
      h(11, 25, 28);
    }),
  },
  {
    name: 'Le grand saut',
    hint: '',
    rows: buildRoomRows((s, h, v) => {
      s(13, 2, 'P');
      h(14, 12, 18, '.');
      h(15, 12, 18, '.');
      h(16, 12, 18, '.');
      s(13, 26, 'E');
      h(9, 4, 8);
    }),
  },
];
const mirrorRows = (rows) => rows.map((r) => r.split('').reverse().join(''));
const digPit = (h, a, b) => {
  for (const r of [14, 15, 16]) h(r, a, b, '.');
};
export const namedRooms = {
  bestioles: {
    name: 'Les petites bêtes',
    hint: '',
    rows: buildRoomRows((s, h, v) => {
      s(13, 2, 'P');
      s(13, 8, '*');
      h(13, 12, 13, '^');
      s(13, 17, '*');
      s(13, 22, '*');
      s(13, 27, 'E');
      h(9, 4, 8);
    }),
  },
  briques: {
    name: 'Mur de briques',
    hint: '',
    rows: buildRoomRows((s, h, v) => {
      s(13, 2, 'P');
      v(7, 9, 13, '%');
      h(13, 10, 12, '^');
      v(16, 9, 13, '%');
      s(13, 21, '*');
      s(13, 27, 'E');
      h(8, 19, 24);
    }),
  },
  pont1: {
    name: "Le pont qui s'effondre",
    hint: '',
    rows: buildRoomRows((s, h, v) => {
      v(3, 1, 13, 'X');
      s(13, 1, 'E');
      s(13, 8, 'P');
      digPit(h, 11, 20);
      for (const c of [20, 18, 16, 14, 12]) h(14, c, c, '~');
      s(13, 26, '1');
      h(13, 23, 24, '^');
      v(5, 10, 13, '%');
    }),
  },
  pont2: {
    name: 'Deux ponts',
    hint: '',
    rows: buildRoomRows((s, h, v) => {
      s(13, 1, 'E');
      s(13, 4, 'P');
      v(2, 1, 13, 'X');
      v(3, 1, 13, 'Y');
      digPit(h, 19, 25);
      for (const c of [24, 22, 20]) h(14, c, c, '~');
      s(13, 17, '1');
      h(13, 15, 16, '^');
      digPit(h, 5, 12);
      for (const c of [11, 9, 7]) h(14, c, c, '~');
      s(13, 28, '2');
      h(13, 26, 26, '^');
    }),
  },
  pont3: {
    name: 'Le long chemin',
    hint: '',
    rows: buildRoomRows((s, h, v) => {
      v(5, 1, 13, 'X');
      s(13, 2, 'E');
      s(13, 8, 'P');
      h(13, 11, 12, '^');
      v(15, 12, 13);
      digPit(h, 17, 25);
      h(14, 17, 25, '~');
      h(13, 21, 22, '^');
      s(13, 27, '1');
    }),
  },
  pont4: {
    name: 'Pont et gardien',
    hint: '',
    rows: buildRoomRows((s, h, v) => {
      v(5, 1, 13, 'X');
      s(13, 2, 'E');
      s(13, 8, 'P');
      v(12, 9, 13, '%');
      digPit(h, 16, 22);
      h(14, 16, 22, '~');
      s(13, 25, '*');
      s(13, 27, '1');
    }),
  },
  mir1: {
    name: 'Ouvre-moi',
    hint: '',
    rows: buildRoomRows((s, h, v) => {
      s(13, 2, 'P');
      s(13, 7, 'a');
      s(13, 22, 'a');
      v(12, 1, 13, 'A');
      s(13, 15, 'E');
      h(13, 9, 10, '^');
      h(13, 19, 20, '^');
    }),
  },
  mir2: {
    name: 'Deux balcons',
    hint: '',
    rows: buildRoomRows((s, h, v) => {
      s(13, 2, 'P');
      h(12, 4, 6);
      h(10, 8, 12);
      s(9, 10, 'a');
      h(12, 23, 25);
      h(10, 17, 21);
      s(9, 19, 'a');
      v(14, 1, 13, 'A');
      s(13, 16, 'E');
    }),
  },
  mir3: {
    name: 'Du haut de la falaise',
    hint: '',
    rows: buildRoomRows((s, h, v) => {
      s(13, 2, 'P');
      h(12, 5, 6);
      h(10, 8, 10);
      s(13, 20, 'a');
      v(14, 1, 13, 'A');
      s(13, 17, 'E');
      v(23, 1, 13, '%');
    }),
  },
  jum1: {
    name: 'Derrière la porte',
    hint: '',
    rows: buildRoomRows((s, h, v) => {
      s(13, 2, 'P');
      v(10, 1, 13, 'A');
      s(13, 13, 'a');
      s(13, 20, 'E');
    }),
  },
  jum2: {
    name: 'Deux portes',
    hint: '',
    rows: buildRoomRows((s, h, v) => {
      s(13, 2, 'P');
      v(8, 1, 13, 'A');
      s(13, 11, 'a');
      v(16, 1, 13, 'B');
      s(13, 19, 'b');
      s(13, 24, 'E');
    }),
  },
  jum3: {
    name: 'Le rempart',
    hint: '',
    rows: buildRoomRows((s, h, v) => {
      s(13, 2, 'P');
      for (const r of [9, 10, 11, 12]) h(r, 10, 12);
      s(13, 11, 'A');
      s(8, 12, 'a');
      s(13, 20, 'E');
    }),
  },
  rem1: {
    name: 'Marche arrière',
    hint: '',
    rows: mirrorRows(
      buildRoomRows((s, h, v) => {
        s(13, 1, 'P');
        s(13, 3, 'a');
        h(13, 8, 9, '^');
        h(13, 14, 15, '^');
        h(13, 20, 21, '^');
        v(27, 10, 13, 'A');
        s(13, 28, 'E');
        h(9, 5, 8);
        h(8, 12, 17);
        h(9, 21, 25);
      }),
    ),
  },
  rem2: {
    name: 'Le détour',
    hint: '',
    rows: buildRoomRows((s, h, v) => {
      s(13, 1, 'P');
      s(13, 3, 'a');
      h(10, 1, 14);
      h(12, 15, 16);
      v(17, 1, 13);
      v(5, 1, 9, 'A');
      s(9, 2, 'E');
    }),
  },
  rem3: {
    name: 'Double plaque',
    hint: '',
    rows: buildRoomRows((s, h, v) => {
      s(13, 1, 'P');
      s(13, 2, 'a');
      h(12, 8, 12);
      s(11, 10, 'a');
      h(13, 15, 16, '^');
      h(13, 20, 21, '^');
      v(27, 10, 13, 'A');
      s(13, 28, 'E');
    }),
  },
  col1: {
    name: 'Double mur',
    hint: '',
    rows: buildRoomRows((s, h, v) => {
      s(13, 2, 'P');
      v(9, 1, 13, '&');
      h(13, 13, 15, '^');
      v(20, 1, 13, '&');
      s(13, 26, 'E');
    }),
  },
  col2: {
    name: 'Passage étroit',
    hint: '',
    rows: buildRoomRows((s, h, v) => {
      s(13, 2, 'P');
      v(8, 1, 13, '&');
      h(12, 9, 17);
      s(13, 14, '*');
      s(13, 21, 'E');
    }),
  },
  col3: {
    name: 'Trois remparts',
    hint: '',
    rows: buildRoomRows((s, h, v) => {
      s(13, 2, 'P');
      v(7, 1, 13, '&');
      h(13, 10, 11, '^');
      v(14, 1, 13, '&');
      s(13, 17, '*');
      v(21, 1, 13, '&');
      h(13, 24, 25, '^');
      s(13, 28, 'E');
    }),
  },
  ecl1: {
    name: 'Pics en rafale',
    hint: '',
    rows: buildRoomRows((s, h, v) => {
      s(13, 2, 'P');
      h(13, 10, 15, '^');
      s(13, 26, 'E');
      h(9, 4, 7);
    }),
  },
  ecl2: {
    name: 'Deux sauts',
    hint: '',
    rows: buildRoomRows((s, h, v) => {
      s(13, 2, 'P');
      digPit(h, 8, 14);
      digPit(h, 20, 26);
      s(13, 28, 'E');
    }),
  },
  ecl3: {
    name: 'Le dernier effort',
    hint: '',
    rows: buildRoomRows((s, h, v) => {
      s(13, 2, 'P');
      v(6, 1, 13, '&');
      digPit(h, 9, 15);
      s(13, 20, '*');
      s(13, 27, 'E');
    }),
  },
};
const L = handLevels;
export const kingRoom = {
  name: 'Le Roi des Échos',
  hint: '',
  boss: bossDefs[8],
  king: 1,
  rows: buildRoomRows((s, h, v) => {
    s(13, 2, 'P');
    s(13, 15, '@');
    h(9, 3, 7);
    h(9, 22, 26);
    h(6, 12, 17);
    v(9, 11, 13);
    v(20, 11, 13);
  }),
};
namedRooms.arJ = {
  name: bossDefs[2].n,
  boss: bossDefs[2],
  gain: 2,
  rows: buildRoomRows((s, h, v) => {
    s(13, 14, 'P');
    s(13, 3, '@');
    s(13, 26, '$');
    s(13, 28, 'E');
    h(11, 3, 5);
    h(11, 13, 16);
    h(11, 24, 26);
    for (const c of [8, 9, 20, 21]) s(13, c, '^');
  }),
};
namedRooms.arT = {
  name: bossDefs[7].n,
  boss: bossDefs[7],
  gain: 6,
  rows: buildRoomRows((s, h, v) => {
    s(13, 2, 'P');
    s(13, 24, '@');
    s(13, 28, 'E');
    h(11, 1, 4);
    h(11, 25, 28);
  }),
};
namedRooms.arW = {
  name: bossDefs[6].n,
  boss: bossDefs[6],
  gain: 5,
  rows: buildRoomRows((s, h, v) => {
    s(13, 2, 'P');
    s(4, 24, '@');
    s(13, 28, 'E');
  }),
};
namedRooms.env1 = {
  name: 'Plus haut',
  hint: "Double saut : appuie sur Saut, puis encore une fois en l'air.",
  rows: buildRoomRows((s, h, v) => {
    s(13, 2, 'P');
    v(10, 10, 13);
    h(13, 16, 17, '^');
    s(13, 26, 'E');
    h(11, 4, 6);
    h(12, 22, 26, '#');
    s(13, 26, '#');
    h(13, 23, 24, '^');
    s(13, 25, 'a');
    v(28, 1, 13, 'A');
  }),
};
namedRooms.env2 = {
  name: 'Plus loin',
  hint: '',
  rows: buildRoomRows((s, h, v) => {
    s(13, 2, 'P');
    digPit(h, 8, 14);
    v(18, 1, 13, 'B');
    s(13, 21, 'b');
    v(24, 1, 13, '&');
    s(13, 27, 'E');
    h(9, 3, 6);
  }),
};

/* ---------- Salles à plusieurs pouvoirs (1 à 3) ---------- */
// Miroir (plaques symétriques) : plaque a en col p, clone en col 29-p
namedRooms.mj1 = {
  name: 'Deux échos',
  hint: '',
  rows: buildRoomRows((s, h, v) => {
    s(13, 2, 'P');
    s(13, 6, 'a');
    v(9, 1, 13, 'A');
    s(13, 23, 'a');
    h(13, 11, 12, '^');
    v(15, 1, 13, 'B');
    s(13, 18, 'b');
    h(13, 26, 27, '^');
  }),
};
namedRooms.mj2 = {
  name: 'Rempart et miroir',
  hint: '',
  rows: buildRoomRows((s, h, v) => {
    s(13, 2, 'P');
    s(13, 6, 'a');
    v(9, 1, 13, 'A');
    s(13, 23, 'a');
    for (const r of [9, 10, 11, 12]) h(r, 13, 15);
    s(13, 14, 'B');
    s(8, 15, 'b');
    v(19, 1, 13, '%');
    h(13, 25, 25, '^');
  }),
};
// Rémanence : plaque a en col 4, porte au bout (≥ 24 cases : plus de 3 s de marche)
namedRooms.rj1 = {
  name: 'Le long couloir',
  hint: '',
  rows: buildRoomRows((s, h, v) => {
    s(13, 1, 'P');
    v(2, 1, 13, 'B');
    s(13, 5, 'b');
    s(13, 4, 'a');
    h(13, 9, 10, '^');
    h(13, 15, 16, '^');
    h(13, 21, 22, '^');
    v(28, 1, 13, 'A');
  }),
};
namedRooms.rj2 = {
  name: 'Double plaque et mur',
  hint: '',
  rows: buildRoomRows((s, h, v) => {
    s(13, 1, 'P');
    s(13, 2, 'a');
    h(12, 8, 12);
    s(11, 10, 'a');
    h(13, 14, 15, '^');
    v(20, 1, 13, '%');
    h(13, 22, 23, '^');
    v(25, 1, 13, 'A');
    s(13, 17, '+');
  }),
};
namedRooms.cm1 = {
  name: 'Géant et miroir',
  hint: '',
  rows: buildRoomRows((s, h, v) => {
    s(13, 2, 'P');
    s(13, 6, 'a');
    v(9, 1, 13, 'A');
    s(13, 23, 'a');
    v(14, 1, 13, '&');
    s(13, 18, '+');
  }),
};
namedRooms.cm2 = {
  name: 'Les trois pouvoirs',
  hint: '',
  rows: buildRoomRows((s, h, v) => {
    s(13, 1, 'P');
    v(2, 1, 13, 'B');
    s(13, 5, 'b');
    s(13, 4, 'a');
    h(13, 9, 10, '^');
    v(15, 1, 13, '&');
    h(13, 20, 21, '^');
    v(27, 1, 13, 'A');
  }),
};
namedRooms.em1 = {
  name: 'Éclair, géant, jumeau',
  hint: '',
  rows: buildRoomRows((s, h, v) => {
    s(13, 2, 'P');
    v(9, 1, 13, 'B');
    s(13, 12, 'b');
    digPit(h, 15, 21);
    v(24, 1, 13, '&');
  }),
};
namedRooms.em2 = {
  name: 'Trois à la suite',
  hint: '',
  rows: buildRoomRows((s, h, v) => {
    s(13, 2, 'P');
    s(13, 6, 'a');
    v(9, 1, 13, 'A');
    s(13, 23, 'a');
    digPit(h, 12, 18);
    v(26, 1, 13, '&');
  }),
};

/* ---------- Salles nouvelles : Tir (interrupteur au fond d'un tunnel, derrière un trou) et double saut + Jumeau ---------- */
// Un bloc plein avec, au ras du sol, une poche d'une case de haut : un trou, puis l'interrupteur violet. Seul le tir (5 blocs) l'atteint.
// La porte est sur le toit : on y monte par deux corniches. Le fond de la poche est muré (le clone-miroir ne peut pas y apparaître).
const shootingRoom = (name, hint, o) => ({
  name,
  hint,
  need: [6],
  rows: buildRoomRows((s, h, v) => {
    const { m, pw, end, door, id } = o,
      dc = id === '1' ? 'X' : id === '2' ? 'Y' : 'Z';
    s(13, 2, 'P');
    for (const r of [9, 10, 11, 12]) h(r, m, end);
    h(13, m + pw + 1, end);
    digPit(h, m, m + pw - 1);
    s(13, m + pw, id);
    h(12, 5, 7);
    h(10, 8, m - 1);
    v(door, 1, 8, dc);
    if (o.crab) s(13, o.crab, '+');
  }),
});
namedRooms.tir1 = shootingRoom('Au bout du tunnel', 'Tir (touche X) : un projectile qui porte à 5 blocs.', {
  m: 11,
  pw: 4,
  end: 22,
  door: 20,
  id: '1',
});
namedRooms.tir2 = shootingRoom('La meurtrière', '', {
  m: 12,
  pw: 3,
  end: 21,
  door: 19,
  id: '1',
  crab: 25,
});
namedRooms.tir3 = shootingRoom('Tir de précision', '', {
  m: 10,
  pw: 4,
  end: 23,
  door: 21,
  id: '2',
});
// double saut + Jumeau : un mur de 4 cases, puis une porte avec sa plaque de l'autre côté
namedRooms.jd1 = {
  name: 'Haut et derrière',
  hint: '',
  need: [5, 2],
  rows: buildRoomRows((s, h, v) => {
    s(13, 2, 'P');
    v(6, 10, 13);
    v(14, 1, 13, 'A');
    s(13, 17, 'a');
  }),
};
// le clone apparaît DANS un mur : il est poussé vers le haut jusqu'à la première place libre, ici un caveau scellé où se cache une plaque.
// Toi, tu dois rester en bas sur l'autre plaque : la porte (sous le bloc) ne s'ouvre que si les deux sont pressées.
namedRooms.vau = {
  noExt: 1,
  name: 'Le caveau',
  need: [2],
  hint: '',
  rows: buildRoomRows((s, h, v) => {
    s(13, 2, 'P');
    s(13, 8, 'a');
    for (let r = 1; r <= 12; r++) if (r !== 8) h(r, 9, 13);
    s(8, 9);
    s(8, 13);
    h(13, 10, 12, 'A');
    s(8, 11, 'a');
  }),
};
namedRooms.mur = {
  noExt: 1,
  name: 'Le reflet muré',
  need: [0],
  hint: '',
  rows: buildRoomRows((s, h, v) => {
    s(13, 2, 'P');
    s(13, 8, 'a');
    for (let r = 1; r <= 12; r++) if (r !== 8) h(r, 19, 23);
    s(8, 19);
    s(8, 23);
    h(13, 20, 22, 'A');
    s(8, 21, 'a');
  }),
};
namedRooms.rev = [namedRooms.pont1, namedRooms.pont2, namedRooms.pont3, namedRooms.pont4, namedRooms.rem1];
for (const r of namedRooms.rev) r.rev = 1;

// ---- arènes des boss : on les place où on veut (l'ordre de progression est tiré à chaque partie)
namedRooms.arC = {
  name: bossDefs[4].n,
  boss: bossDefs[4],
  gain: 3,
  rows: buildRoomRows((s, h, v) => {
    s(13, 4, 'P');
    s(13, 24, '@');
    s(13, 28, 'E');
  }),
};
namedRooms.arR = {
  name: bossDefs[1].n,
  boss: bossDefs[1],
  gain: 0,
  sym: 1,
  rows: buildRoomRows((s, h, v) => {
    s(13, 12, 'P');
    s(5, 8, '@');
    s(5, 21, '$');
    s(13, 28, 'E');
    for (const c of [14, 15]) v(c, 14, 15, '.');
    h(15, 1, 28, '.');
    for (const c of [1, 2, 27, 28]) s(14, c, '.');
    for (const c of [3, 4, 25, 26]) s(13, c);
    for (const r of [6, 7]) {
      h(r, 6, 12);
      h(r, 17, 23);
    }
  }),
};
export const BOSS_ARENAS = {
  t: L[3],
  0: namedRooms.arR,
  2: namedRooms.arJ,
  1: L[8],
  3: namedRooms.arC,
  4: L[12],
  6: namedRooms.arT,
  5: namedRooms.arW,
};
for (const g in BOSS_ARENAS) {
  const l = BOSS_ARENAS[g];
  l.hint = l.boss.hint;
  l.gain = g === 't' ? 't' : +g;
}
// ordre de progression (imposé) : Temps, Jumeau, Envol (double saut), Colosse, Miroir, Tir, Rémanence, Éclair
export const BOSS_ORDER = ['t', 2, 5, 3, 0, 6, 1, 4];
// salles d'approche : besoin = échos qu'elles obligent à utiliser (0 Miroir, 1 Rémanence, 2 Jumeau, 3 Colosse, 4 Éclair, 5 Envol, 6 Tir) ; d = difficulté
export const APPROACH_ROOM_POOL = [
  {
    r: namedRooms.jum1,
    need: [2],
    d: 1,
  },
  {
    r: L[7],
    need: [2],
    d: 2,
  },
  {
    r: namedRooms.jum2,
    need: [2],
    d: 3,
  },
  {
    r: namedRooms.jum3,
    need: [2],
    d: 3,
  },
  {
    r: namedRooms.jd1,
    need: [5, 2],
    d: 3,
  },
  {
    r: namedRooms.vau,
    need: [2],
    d: 3,
  },
  {
    gen: 'J',
    need: [5],
    d: 1,
    multi: 1,
  },
  {
    gen: 'E',
    need: [5],
    d: 2,
    multi: 1,
  },
  {
    gen: 'J',
    need: [5],
    d: 2,
    multi: 1,
  },
  {
    r: namedRooms.col1,
    need: [3],
    d: 1,
  },
  {
    r: L[11],
    need: [3],
    d: 1,
  },
  {
    r: namedRooms.col2,
    need: [3],
    d: 2,
  },
  {
    r: namedRooms.col3,
    need: [3],
    d: 3,
  },
  {
    r: namedRooms.env2,
    need: [5, 2, 3],
    d: 3,
  },
  {
    r: L[5],
    need: [0],
    d: 1,
  },
  {
    r: namedRooms.mir1,
    need: [0],
    d: 1,
  },
  {
    r: namedRooms.mir2,
    need: [0],
    d: 2,
  },
  {
    r: namedRooms.mir3,
    need: [0],
    d: 2,
  },
  {
    r: namedRooms.mj1,
    need: [0, 2],
    d: 3,
  },
  {
    r: namedRooms.mj2,
    need: [0, 2],
    d: 3,
  },
  {
    r: namedRooms.cm1,
    need: [0, 3],
    d: 3,
  },
  {
    r: namedRooms.mur,
    need: [0],
    d: 3,
  },
  {
    r: namedRooms.tir1,
    need: [6],
    d: 1,
  },
  {
    r: namedRooms.tir2,
    need: [6],
    d: 2,
  },
  {
    r: namedRooms.tir3,
    need: [6],
    d: 2,
  },
  {
    r: L[9],
    need: [1],
    d: 1,
  },
  {
    r: namedRooms.rem1,
    need: [1],
    d: 1,
  },
  {
    r: namedRooms.rem3,
    need: [1],
    d: 2,
  },
  {
    r: namedRooms.rj2,
    need: [1],
    d: 3,
  },
  {
    r: namedRooms.rj1,
    need: [2, 1],
    d: 3,
  },
  {
    r: namedRooms.cm2,
    need: [2, 3, 1],
    d: 3,
  },
];
export const levels = [];
/* ---------- Générateur de salles (fonctions pures, aussi chargées par les tests) ---------- */
