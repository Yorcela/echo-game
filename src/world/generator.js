/* ---------- Générateur de salles (fonctions pures, aussi chargées par les tests) ---------- */
export function seededRandom(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function blankGrid() {
  const g = [];
  for (let r = 0; r < 17; r++) {
    g.push([]);
    for (let c = 0; c < 30; c++) g[r].push(r === 0 || r >= 14 || c === 0 || c === 29 ? '#' : '.');
  }
  return g;
}
function placePlatform(grid, r, a, b, ch = '#') {
  for (let c = Math.max(1, a); c <= Math.min(28, b); c++) grid[r][c] = ch;
}
function placeColumn(grid, c, r0, r1, ch = '#') {
  for (let r = r0; r <= r1; r++) grid[r][c] = ch;
}
function placePit(grid, a, b) {
  for (let c = a; c <= b; c++) for (let r = 14; r <= 16; r++) grid[r][c] = '.';
}
// paliers : F libre · E dash ou double saut · J double saut · D dash · B les deux

// ----- montées (salle du bas, trou de plafond c0..c1). renvoie {zone,hs}
function placeClimb(grid, k, rnd) {
  const c0 = k.c0,
    c1 = k.c1;
  if (k.kind === 'ladder') {
    placeColumn(grid, c0, 0, 13, '|');
    return {
      zone: [c0 - 2, c1 + 2],
      hs: [],
    };
  }
  const roomR = 28 - c1,
    roomL = c0 - 1;
  let s = roomR >= roomL ? 1 : -1;
  const nr = s > 0 ? [c1 + 1, c1 + 3] : [c0 - 3, c0 - 1],
    fr = s > 0 ? [c1 + 4, c1 + 6] : [c0 - 6, c0 - 4],
    tp = s > 0 ? [c0, c1 + 3] : [c0 - 3, c1];
  let list;
  if (k.kind === 'dj')
    list = [
      [9, fr],
      [4, nr],
    ];
  else if (k.kind === 'gap') {
    const f2 = s > 0 ? [c1 + 11, c1 + 13] : [c0 - 13, c0 - 11];
    list = [
      [12, nr],
      [10, f2],
      [8, nr],
      [6, f2],
      [4, nr],
      [2, tp],
    ];
  } else
    list = [
      [12, fr],
      [10, nr],
      [8, fr],
      [6, nr],
      [4, fr],
      [2, tp],
    ];
  for (const [r, [a, b]] of list) placePlatform(grid, r, a, b);
  const xs = list.flatMap(([r, [a, b]]) => [a, b]);
  return {
    zone: [Math.min(c0, ...xs) - 1, Math.max(c1, ...xs) + 1],
    hs: k.kind === 'dj' ? [[(nr[0] + nr[1]) >> 1, 3]] : [[(fr[0] + fr[1]) >> 1, 7]],
  };
}
// ----- obstacle de palier dans la plage libre [a,b] ; renvoie la zone occupée
function placeTier(grid, t, a, b, rnd) {
  const span = b - a + 1;
  if (t === 'F') {
    const v = Math.floor(rnd() * 6);
    const m = a + Math.floor(span / 2);
    if (v === 0) {
      placePit(grid, m - 1, m + 1);
      return {
        zone: [m - 5, m + 5],
        hs: [],
      };
    }
    if (v === 1) {
      for (let c = m - 1; c <= m + 1; c++) grid[13][c] = '^';
      return {
        zone: [m - 5, m + 5],
        hs: [],
      };
    }
    if (v === 2) {
      placeColumn(grid, m, 11, 13);
      return {
        zone: [m - 5, m + 5],
        hs: [],
      };
    }
    if (v === 3) {
      placePit(grid, m - 2, m + 1);
      return {
        zone: [m - 6, m + 5],
        hs: [],
      };
    }
    if (v === 4) {
      grid[13][m - 3] = '^';
      grid[13][m - 2] = '^';
      grid[13][m + 3] = '^';
      grid[13][m + 4] = '^';
      placeColumn(grid, m, 12, 13);
      return {
        zone: [m - 6, m + 7],
        hs: [],
      };
    }
    placePlatform(grid, 12, m - 2, m + 2);
    for (let c = m - 1; c <= m + 1; c++) grid[13][c] = '^';
    return {
      zone: [m - 5, m + 5],
      hs: [],
    };
  }
  if (t === 'E') {
    const w = 6 + (rnd() < 0.5 ? 1 : 0),
      m = a + Math.floor((span - w) / 2);
    placePit(grid, m, m + w - 1);
    return {
      zone: [m - 6, m + w + 5],
      hs: [],
      pit: [m, m + w - 1],
    };
  }
  if (t === 'B') {
    const w = 10 + (rnd() < 0.5 ? 1 : 0),
      m = a + Math.floor((span - w) / 2);
    placePit(grid, m, m + w - 1);
    return {
      zone: [m - 6, m + w + 5],
      hs: [],
      pit: [m, m + w - 1],
    };
  }
  if (t === 'J') {
    const m = a + Math.floor(span / 2),
      wide = rnd() < 0.5;
    placeColumn(grid, m, 10, 13);
    if (wide) {
      placeColumn(grid, m + 1, 10, 13);
      placeColumn(grid, m + 2, 10, 13);
    }
    return {
      zone: [m - 6, m + (wide ? 8 : 6)],
      hs: [],
    };
  }
  if (t === 'D') {
    const w = 7,
      m = a + Math.floor((span - w) / 2);
    placePit(grid, m, m + w - 1);
    for (let c = m - 2; c <= m + w + 1; c++) for (let r = 1; r <= 10; r++) grid[r][c] = '#';
    return {
      zone: [m - 8, m + w + 7],
      hs: [],
      pit: [m, m + w - 1],
    };
  }
  return {
    zone: [a, b],
    hs: [],
  };
}
/* sp = {links:[{s:'l'|'r'|'t'|'b',c0,c1,r0,r1,kind,lad}], tier, rest, seed}
   renvoie {rows, hs:[[c,r]...]} ; les trous t/b restent ouverts dans la grille de base (le moteur les referme si le lien est scellé) */
export function generateRoom(sp) {
  const rnd = seededRandom(sp.seed | 0),
    g = blankGrid(),
    zones = [];
  let hs = [];
  for (const k of sp.links) {
    if (k.s === 'l' || k.s === 'r') {
      placeColumn(g, k.s === 'l' ? 0 : 29, k.r0, k.r1, '.');
    } else if (k.s === 'b') {
      for (let c = k.c0; c <= k.c1; c++) for (let r = 14; r <= 16; r++) g[r][c] = '.';
      zones.push([k.c0 - 3, k.c1 + 3]);
      if (k.kind === 'ladder' || k.lad) {
        for (let r = 12; r <= 16; r++) g[r][k.c0] = '|';
      }
    } else {
      for (let c = k.c0; c <= k.c1; c++) g[0][c] = '.';
      const z = placeClimb(g, k, rnd);
      zones.push(z.zone);
      hs = hs.concat(z.hs);
    }
  }
  const nh = sp.links.filter((k) => k.s === 'l' || k.s === 'r').length,
    nv = sp.links.length - nh;
  let used = zones.slice();
  if (!sp.rest && nv === 0 && nh >= 1) {
    const ob = placeTier(g, sp.tier || 'F', 6, 23, rnd);
    used.push(ob.zone);
    if (ob.pit) hs.push([ob.pit[1] + 3, 13]);
    else if (!hs.length) hs.push([ob.zone[1] + 1, 13]);
  }
  // décor sans danger : stalactites de plafond, petites bêtes aux extrémités
  const free = (c) => !used.some(([a, b]) => c >= a && c <= b);
  for (let i = 0, n = 2 + Math.floor(rnd() * 3); i < n; i++) {
    const c = 2 + Math.floor(rnd() * 26);
    if (free(c) && free(c - 1) && free(c + 1)) {
      const h = 1 + Math.floor(rnd() * 3);
      placeColumn(g, c, 1, h);
      if (rnd() < 0.5) placeColumn(g, c + 1, 1, Math.max(1, h - 1));
    }
  }
  if (sp.rest) {
    g[13][17] = '=';
    g[13][12] = 'P';
    if (!hs.length) hs.push([21, 10]);
    placePlatform(g, 11, 20, 22);
  } else if (sp.crabs) {
    for (let i = 0; i < sp.crabs; i++) {
      const c = 3 + Math.floor(rnd() * 24);
      if (free(c) && g[13][c] === '.' && g[14][c] === '#' && g[14][c - 1] === '#' && g[14][c + 1] === '#')
        g[13][c] = '+';
    }
  }
  if (!hs.length) {
    let tries = 0;
    while (tries++ < 40) {
      const c = 4 + Math.floor(rnd() * 22);
      if (free(c - 2) && free(c + 2)) {
        placePlatform(g, 11, c - 1, c + 1);
        hs.push([c, 10]);
        break;
      }
    }
  }
  // départ (apparition sur statue / rechargement)
  if (!g.some((r) => r.includes('P'))) {
    for (const c of [3, 4, 5, 26, 25]) {
      if (g[13][c] === '.' && g[14][c] === '#') {
        g[13][c] = 'P';
        break;
      }
    }
  }
  return {
    rows: g.map((r) => r.join('')),
    hs,
  };
}
