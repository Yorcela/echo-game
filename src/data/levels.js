import { arena, build } from './level-builders.js';
import { BH_, bossDefs } from './bosses.js';
export const handLevels = [
  {
    name: 'Premiers pas',
    hint: '',
    rows: build((s, h, v) => {
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
    rows: build((s, h, v) => {
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
    rows: build((s, h, v) => {
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
    hint: BH_,
    rows: arena((s, h, v) => {
      h(11, 1, 4);
      h(11, 25, 28);
    }),
  },
  {
    name: bossDefs[1].n,
    boss: bossDefs[1],
    gain: 0,
    hint: BH_,
    rows: arena((s, h, v) => {
      s(13, 27, '$');
    }),
  },
  {
    name: 'Le Miroir aux Alouettes',
    hint: '',
    rows: build((s, h, v) => {
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
    hint: BH_,
    rows: arena((s, h, v) => {
      h(11, 1, 3);
      h(11, 26, 28);
    }),
  },
  {
    name: "Deux pour le prix d'un",
    hint: '',
    rows: build((s, h, v) => {
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
    hint: BH_,
    rows: arena((s, h, v) => {
      h(11, 1, 4);
      h(11, 25, 28);
    }),
  },
  {
    name: "L'Écho du Tic-Tac",
    hint: '',
    rows: build((s, h, v) => {
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
    hint: BH_,
    rows: arena((s, h, v) => {
      h(12, 1, 3);
      h(13, 1, 3);
      s(13, 5, 'P');
      h(9, 1, 8);
    }),
  },
  {
    name: 'Le poids du monde',
    hint: '',
    rows: build((s, h, v) => {
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
    hint: BH_,
    rows: arena((s, h, v) => {
      h(11, 1, 4);
      h(11, 25, 28);
    }),
  },
  {
    name: 'Le grand saut',
    hint: '',
    rows: build((s, h, v) => {
      s(13, 2, 'P');
      h(14, 12, 18, '.');
      h(15, 12, 18, '.');
      h(16, 12, 18, '.');
      s(13, 26, 'E');
      h(9, 4, 8);
    }),
  },
];
const mir = (rows) => rows.map((r) => r.split('').reverse().join(''));
const pit = (h, a, b) => {
  for (const r of [14, 15, 16]) h(r, a, b, '.');
};
export const N = {
  bestioles: {
    name: 'Les petites bêtes',
    hint: '',
    rows: build((s, h, v) => {
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
    rows: build((s, h, v) => {
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
    rows: build((s, h, v) => {
      v(3, 1, 13, 'X');
      s(13, 1, 'E');
      s(13, 8, 'P');
      pit(h, 11, 20);
      for (const c of [20, 18, 16, 14, 12]) h(14, c, c, '~');
      s(13, 26, '1');
      h(13, 23, 24, '^');
      v(5, 10, 13, '%');
    }),
  },
  pont2: {
    name: 'Deux ponts',
    hint: '',
    rows: build((s, h, v) => {
      s(13, 1, 'E');
      s(13, 4, 'P');
      v(2, 1, 13, 'X');
      v(3, 1, 13, 'Y');
      pit(h, 19, 25);
      for (const c of [24, 22, 20]) h(14, c, c, '~');
      s(13, 17, '1');
      h(13, 15, 16, '^');
      pit(h, 5, 12);
      for (const c of [11, 9, 7]) h(14, c, c, '~');
      s(13, 28, '2');
      h(13, 26, 26, '^');
    }),
  },
  pont3: {
    name: 'Le long chemin',
    hint: '',
    rows: build((s, h, v) => {
      v(5, 1, 13, 'X');
      s(13, 2, 'E');
      s(13, 8, 'P');
      h(13, 11, 12, '^');
      v(15, 12, 13);
      pit(h, 17, 25);
      h(14, 17, 25, '~');
      h(13, 21, 22, '^');
      s(13, 27, '1');
    }),
  },
  pont4: {
    name: 'Pont et gardien',
    hint: '',
    rows: build((s, h, v) => {
      v(5, 1, 13, 'X');
      s(13, 2, 'E');
      s(13, 8, 'P');
      v(12, 9, 13, '%');
      pit(h, 16, 22);
      h(14, 16, 22, '~');
      s(13, 25, '*');
      s(13, 27, '1');
    }),
  },
  mir1: {
    name: 'Ouvre-moi',
    hint: '',
    rows: build((s, h, v) => {
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
    rows: build((s, h, v) => {
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
    rows: build((s, h, v) => {
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
    rows: build((s, h, v) => {
      s(13, 2, 'P');
      v(10, 1, 13, 'A');
      s(13, 13, 'a');
      s(13, 20, 'E');
    }),
  },
  jum2: {
    name: 'Deux portes',
    hint: '',
    rows: build((s, h, v) => {
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
    rows: build((s, h, v) => {
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
    rows: mir(
      build((s, h, v) => {
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
    rows: build((s, h, v) => {
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
    rows: build((s, h, v) => {
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
    rows: build((s, h, v) => {
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
    rows: build((s, h, v) => {
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
    rows: build((s, h, v) => {
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
    rows: build((s, h, v) => {
      s(13, 2, 'P');
      h(13, 10, 15, '^');
      s(13, 26, 'E');
      h(9, 4, 7);
    }),
  },
  ecl2: {
    name: 'Deux sauts',
    hint: '',
    rows: build((s, h, v) => {
      s(13, 2, 'P');
      pit(h, 8, 14);
      pit(h, 20, 26);
      s(13, 28, 'E');
    }),
  },
  ecl3: {
    name: 'Le dernier effort',
    hint: '',
    rows: build((s, h, v) => {
      s(13, 2, 'P');
      v(6, 1, 13, '&');
      pit(h, 9, 15);
      s(13, 20, '*');
      s(13, 27, 'E');
    }),
  },
};
const L = handLevels;
export const KING = {
  name: 'Le Roi des Échos',
  hint: '',
  boss: bossDefs[8],
  king: 1,
  rows: build((s, h, v) => {
    s(13, 2, 'P');
    s(13, 15, '@');
    h(9, 3, 7);
    h(9, 22, 26);
    h(6, 12, 17);
    v(9, 11, 13);
    v(20, 11, 13);
  }),
};
N.arJ = {
  name: bossDefs[2].n,
  boss: bossDefs[2],
  gain: 2,
  rows: build((s, h, v) => {
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
N.arT = {
  name: bossDefs[7].n,
  boss: bossDefs[7],
  gain: 6,
  rows: build((s, h, v) => {
    s(13, 2, 'P');
    s(13, 24, '@');
    s(13, 28, 'E');
    h(11, 1, 4);
    h(11, 25, 28);
  }),
};
N.arW = {
  name: bossDefs[6].n,
  boss: bossDefs[6],
  gain: 5,
  rows: build((s, h, v) => {
    s(13, 2, 'P');
    s(4, 24, '@');
    s(13, 28, 'E');
  }),
};
N.env1 = {
  name: 'Plus haut',
  hint: "Double saut : appuie sur Saut, puis encore une fois en l'air.",
  rows: build((s, h, v) => {
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
N.env2 = {
  name: 'Plus loin',
  hint: '',
  rows: build((s, h, v) => {
    s(13, 2, 'P');
    pit(h, 8, 14);
    v(18, 1, 13, 'B');
    s(13, 21, 'b');
    v(24, 1, 13, '&');
    s(13, 27, 'E');
    h(9, 3, 6);
  }),
};

/* ---------- Salles à plusieurs pouvoirs (1 à 3) ---------- */
// Miroir (plaques symétriques) : plaque a en col p, clone en col 29-p
N.mj1 = {
  name: 'Deux échos',
  hint: '',
  rows: build((s, h, v) => {
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
N.mj2 = {
  name: 'Rempart et miroir',
  hint: '',
  rows: build((s, h, v) => {
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
N.rj1 = {
  name: 'Le long couloir',
  hint: '',
  rows: build((s, h, v) => {
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
N.rj2 = {
  name: 'Double plaque et mur',
  hint: '',
  rows: build((s, h, v) => {
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
N.cm1 = {
  name: 'Géant et miroir',
  hint: '',
  rows: build((s, h, v) => {
    s(13, 2, 'P');
    s(13, 6, 'a');
    v(9, 1, 13, 'A');
    s(13, 23, 'a');
    v(14, 1, 13, '&');
    s(13, 18, '+');
  }),
};
N.cm2 = {
  name: 'Les trois pouvoirs',
  hint: '',
  rows: build((s, h, v) => {
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
N.em1 = {
  name: 'Éclair, géant, jumeau',
  hint: '',
  rows: build((s, h, v) => {
    s(13, 2, 'P');
    v(9, 1, 13, 'B');
    s(13, 12, 'b');
    pit(h, 15, 21);
    v(24, 1, 13, '&');
  }),
};
N.em2 = {
  name: 'Trois à la suite',
  hint: '',
  rows: build((s, h, v) => {
    s(13, 2, 'P');
    s(13, 6, 'a');
    v(9, 1, 13, 'A');
    s(13, 23, 'a');
    pit(h, 12, 18);
    v(26, 1, 13, '&');
  }),
};

/* ---------- Salles nouvelles : Tir (interrupteur au fond d'un tunnel, derrière un trou) et double saut + Jumeau ---------- */
// Un bloc plein avec, au ras du sol, une poche d'une case de haut : un trou, puis l'interrupteur violet. Seul le tir (5 blocs) l'atteint.
// La porte est sur le toit : on y monte par deux corniches. Le fond de la poche est muré (le clone-miroir ne peut pas y apparaître).
const tirRoom = (name, hint, o) => ({
  name,
  hint,
  need: [6],
  rows: build((s, h, v) => {
    const { m, pw, end, door, id } = o,
      dc = id === '1' ? 'X' : id === '2' ? 'Y' : 'Z';
    s(13, 2, 'P');
    for (const r of [9, 10, 11, 12]) h(r, m, end);
    h(13, m + pw + 1, end);
    pit(h, m, m + pw - 1);
    s(13, m + pw, id);
    h(12, 5, 7);
    h(10, 8, m - 1);
    v(door, 1, 8, dc);
    if (o.crab) s(13, o.crab, '+');
  }),
});
N.tir1 = tirRoom('Au bout du tunnel', 'Tir (touche X) : un projectile qui porte à 5 blocs.', {
  m: 11,
  pw: 4,
  end: 22,
  door: 20,
  id: '1',
});
N.tir2 = tirRoom('La meurtrière', '', {
  m: 12,
  pw: 3,
  end: 21,
  door: 19,
  id: '1',
  crab: 25,
});
N.tir3 = tirRoom('Tir de précision', '', {
  m: 10,
  pw: 4,
  end: 23,
  door: 21,
  id: '2',
});
// double saut + Jumeau : un mur de 4 cases, puis une porte avec sa plaque de l'autre côté
N.jd1 = {
  name: 'Haut et derrière',
  hint: '',
  need: [5, 2],
  rows: build((s, h, v) => {
    s(13, 2, 'P');
    v(6, 10, 13);
    v(14, 1, 13, 'A');
    s(13, 17, 'a');
  }),
};
// le clone apparaît DANS un mur : il est poussé vers le haut jusqu'à la première place libre, ici un caveau scellé où se cache une plaque.
// Toi, tu dois rester en bas sur l'autre plaque : la porte (sous le bloc) ne s'ouvre que si les deux sont pressées.
N.vau = {
  noExt: 1,
  name: 'Le caveau',
  need: [2],
  hint: '',
  rows: build((s, h, v) => {
    s(13, 2, 'P');
    s(13, 8, 'a');
    for (let r = 1; r <= 12; r++) if (r !== 8) h(r, 9, 13);
    s(8, 9);
    s(8, 13);
    h(13, 10, 12, 'A');
    s(8, 11, 'a');
  }),
};
N.mur = {
  noExt: 1,
  name: 'Le reflet muré',
  need: [0],
  hint: '',
  rows: build((s, h, v) => {
    s(13, 2, 'P');
    s(13, 8, 'a');
    for (let r = 1; r <= 12; r++) if (r !== 8) h(r, 19, 23);
    s(8, 19);
    s(8, 23);
    h(13, 20, 22, 'A');
    s(8, 21, 'a');
  }),
};
N.rev = [N.pont1, N.pont2, N.pont3, N.pont4, N.rem1];
for (const r of N.rev) r.rev = 1;

// ---- arènes des boss : on les place où on veut (l'ordre de progression est tiré à chaque partie)
N.arC = {
  name: bossDefs[4].n,
  boss: bossDefs[4],
  gain: 3,
  rows: build((s, h, v) => {
    s(13, 4, 'P');
    s(13, 24, '@');
    s(13, 28, 'E');
  }),
};
N.arR = {
  name: bossDefs[1].n,
  boss: bossDefs[1],
  gain: 0,
  sym: 1,
  rows: build((s, h, v) => {
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
export const ARENA = {
  t: L[3],
  0: N.arR,
  2: N.arJ,
  1: L[8],
  3: N.arC,
  4: L[12],
  6: N.arT,
  5: N.arW,
};
for (const g in ARENA) {
  const l = ARENA[g];
  l.hint = l.boss.hint;
  l.gain = g === 't' ? 't' : +g;
}
// ordre de progression (imposé) : Temps, Jumeau, Envol (double saut), Colosse, Miroir, Tir, Rémanence, Éclair
export const ORDER = ['t', 2, 5, 3, 0, 6, 1, 4];
// salles d'approche : besoin = échos qu'elles obligent à utiliser (0 Miroir, 1 Rémanence, 2 Jumeau, 3 Colosse, 4 Éclair, 5 Envol, 6 Tir) ; d = difficulté
export const POOL = [
  {
    r: N.jum1,
    need: [2],
    d: 1,
  },
  {
    r: L[7],
    need: [2],
    d: 2,
  },
  {
    r: N.jum2,
    need: [2],
    d: 3,
  },
  {
    r: N.jum3,
    need: [2],
    d: 3,
  },
  {
    r: N.jd1,
    need: [5, 2],
    d: 3,
  },
  {
    r: N.vau,
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
    r: N.col1,
    need: [3],
    d: 1,
  },
  {
    r: L[11],
    need: [3],
    d: 1,
  },
  {
    r: N.col2,
    need: [3],
    d: 2,
  },
  {
    r: N.col3,
    need: [3],
    d: 3,
  },
  {
    r: N.env2,
    need: [5, 2, 3],
    d: 3,
  },
  {
    r: L[5],
    need: [0],
    d: 1,
  },
  {
    r: N.mir1,
    need: [0],
    d: 1,
  },
  {
    r: N.mir2,
    need: [0],
    d: 2,
  },
  {
    r: N.mir3,
    need: [0],
    d: 2,
  },
  {
    r: N.mj1,
    need: [0, 2],
    d: 3,
  },
  {
    r: N.mj2,
    need: [0, 2],
    d: 3,
  },
  {
    r: N.cm1,
    need: [0, 3],
    d: 3,
  },
  {
    r: N.mur,
    need: [0],
    d: 3,
  },
  {
    r: N.tir1,
    need: [6],
    d: 1,
  },
  {
    r: N.tir2,
    need: [6],
    d: 2,
  },
  {
    r: N.tir3,
    need: [6],
    d: 2,
  },
  {
    r: L[9],
    need: [1],
    d: 1,
  },
  {
    r: N.rem1,
    need: [1],
    d: 1,
  },
  {
    r: N.rem3,
    need: [1],
    d: 2,
  },
  {
    r: N.rj2,
    need: [1],
    d: 3,
  },
  {
    r: N.rj1,
    need: [2, 1],
    d: 3,
  },
  {
    r: N.cm2,
    need: [2, 3, 1],
    d: 3,
  },
];
export const levels = [];
/* ---------- Générateur de salles (fonctions pures, aussi chargées par les tests) ---------- */
