// Numéros de salles STABLES (001 à 100), pour se repérer et préparer des plans de speedrun.
//
// Chaque case de la carte (10 × 10) a un numéro tiré au hasard UNE FOIS pour toutes (permutation figée ci-dessous) :
// la case garde son numéro à jamais, d'une partie à l'autre, et deux numéros voisins ne sont pas des salles voisines.
// Ne modifie jamais cette table : les plans de speedrun s'appuient dessus.
//
// Lecture : CELL_NUMBERS[ligne][colonne], la case (0,0) étant en haut à gauche.

export const MAP_COLUMNS = 10;

export const CELL_NUMBERS = [
  [9, 14, 4, 13, 33, 3, 18, 65, 52, 40],
  [37, 39, 62, 36, 84, 44, 51, 87, 95, 79],
  [78, 45, 2, 61, 21, 56, 99, 17, 31, 47],
  [29, 68, 90, 43, 57, 38, 7, 22, 15, 54],
  [24, 20, 69, 41, 25, 97, 55, 67, 32, 16],
  [98, 74, 66, 48, 50, 58, 49, 76, 10, 23],
  [35, 71, 42, 8, 63, 26, 11, 100, 73, 12],
  [60, 83, 27, 46, 53, 85, 82, 86, 81, 91],
  [94, 92, 77, 30, 59, 1, 34, 19, 70, 64],
  [5, 28, 88, 96, 6, 75, 93, 89, 72, 80],
];

/** Numéro de la case [colonne, ligne]. */
export const cellNumber = ([x, y]) => CELL_NUMBERS[y][x];

/** Numéro d'une salle : celui de sa case. `position` = [colonne, ligne]. */
export function roomNumberOf(level, position) {
  return position ? cellNumber(position) : undefined;
}

/** Affichage sur trois chiffres : 007, 042, 100. */
export const formatRoomNumber = (n) => String(n).padStart(3, '0');
