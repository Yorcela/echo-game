// Numéros de salles STABLES, pour se repérer et préparer des plans de speedrun.
//
// Règle : un numéro suit la salle elle-même, pas sa place sur la carte (qui change à chaque partie).
//   0        Hall des Échos
//   1 – 99   salles dessinées à la main, par famille de pouvoir (voir ci-dessous)
//   100 –    alcôves
//   200 – 329 salles générées (couloirs, puits, repos) : 200 + 13 × ligne + colonne de leur case sur la carte,
//            car ces salles sont liées à leur case et pas à une identité
//
// N'ajoute jamais de numéro entre deux existants et ne change jamais un numéro déjà attribué :
// ajoute les nouvelles salles à la suite de leur famille (ou à la fin de la liste).
// Les arènes de boss sont préfixées par « Arène · » car elles portent le nom du boss.

export const ARENA_PREFIX = 'Arène · ';
export const GENERATED_ROOM_BASE = 200;
export const MAP_COLUMNS = 13;

export const ROOM_NUMBERS = {
  'Hall des Échos': 0,

  // 1-9 : début de partie et ponts de la première aile
  'Premiers pas': 1,
  'La Cheminée': 2,
  'Coup de tête': 3,
  'Les petites bêtes': 4,
  'Mur de briques': 5,
  "Le pont qui s'effondre": 6,
  'Deux ponts': 7,
  'Le long chemin': 8,
  'Pont et gardien': 9,

  // 10-19 : Jumeau
  'Derrière la porte': 10,
  'Deux portes': 11,
  'Le rempart': 12,
  'Le caveau': 13,
  "Deux pour le prix d'un": 14,
  'Haut et derrière': 15,

  // 20-29 : Éclair (dash)
  'Le fossé': 20,
  'Le long saut': 21,
  'Pics en rafale': 22,
  'Deux sauts': 23,
  'Le dernier effort': 24,

  // 30-39 : Envol (double saut)
  'Plus haut': 30,
  'Plus loin': 31,
  'Le grand saut': 32,

  // 40-49 : Colosse
  'Double mur': 40,
  'Passage étroit': 41,
  'Trois remparts': 42,
  'Le poids du monde': 43,

  // 50-59 : Miroir
  'Ouvre-moi': 50,
  'Deux balcons': 51,
  'Du haut de la falaise': 52,
  'Le Miroir aux Alouettes': 53,
  'Le reflet muré': 54,
  'Deux échos': 55,
  'Rempart et miroir': 56,

  // 60-69 : Tir
  'Au bout du tunnel': 60,
  'La meurtrière': 61,
  'Tir de précision': 62,

  // 70-79 : Rémanence
  "L'Écho du Tic-Tac": 70,
  'Marche arrière': 71,
  'Le détour': 72,
  'Double plaque': 73,
  'Le long couloir': 74,
  'Double plaque et mur': 75,

  // 80-89 : combinaisons de pouvoirs
  'Géant et miroir': 80,
  'Les trois pouvoirs': 81,
  'Éclair, géant, jumeau': 82,
  'Trois à la suite': 83,

  // 90-98 : arènes des boss (dans l'ordre de progression)
  [ARENA_PREFIX + 'Le Gardien du Temps']: 90,
  [ARENA_PREFIX + 'Les Jumeaux']: 91,
  [ARENA_PREFIX + "L'Éclair"]: 92,
  [ARENA_PREFIX + "L'Envol"]: 93,
  [ARENA_PREFIX + 'Le Colosse']: 94,
  [ARENA_PREFIX + 'Les Reflets']: 95,
  [ARENA_PREFIX + 'La Sorcière']: 96,
  [ARENA_PREFIX + 'La Mémoire']: 97,
  [ARENA_PREFIX + 'Le Roi des Échos']: 98,

  // 100- : alcôves
  'Alcôve du Colosse': 100,
  "Alcôve de l'Éclair": 101,
};

/** Clé du registre pour une salle dessinée à la main. */
export const roomKey = (level) => (level.boss ? ARENA_PREFIX : '') + level.name;

/**
 * Numéro stable d'une salle. `position` = [colonne, ligne] de sa case sur la carte.
 * Renvoie `undefined` pour une salle dessinée à la main absente du registre (le test de design le signale).
 */
export function roomNumberOf(level, position) {
  if (level.gen) return GENERATED_ROOM_BASE + position[1] * MAP_COLUMNS + position[0];
  return ROOM_NUMBERS[roomKey(level)];
}
