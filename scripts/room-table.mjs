// Génère docs/salles.md : la grille des numéros de salles (src/data/room-numbers.js).
// Usage : npm run rooms:doc
import { writeFileSync } from 'node:fs';
import { CELL_NUMBERS, formatRoomNumber } from '../src/data/room-numbers.js';

let md = `# Numéros de salles\n\n`;
md += `La carte compte **10 × 10 = 100 salles**, numérotées de **001 à 100**. Chaque case tire son numéro au hasard une fois pour toutes\n`;
md += `(table figée dans \`src/data/room-numbers.js\`) : il ne change jamais d'une partie à l'autre, et deux numéros voisins ne sont pas des\n`;
md += `salles voisines. Il apparaît sur la carte (touche M), en bas à gauche pendant la partie et dans l'en-tête de la carte.\n\n`;
md += `Le contenu d'une case (quelle salle d'approche, quel boss d'aile) dépend de la graine ; le numéro suit la case.\n\n`;
md += `| ligne \\ colonne | ${CELL_NUMBERS[0].map((_, c) => c).join(' | ')} |\n|${'---|'.repeat(11)}\n`;
CELL_NUMBERS.forEach((row, y) => {
  md += `| ${y} | ${row.map(formatRoomNumber).join(' | ')} |\n`;
});
md += `\nLigne 0, colonne 4 : le Hall des Échos (arène du Roi). Ligne 4, colonne 5 : l'aile aquatique.\n`;
writeFileSync(new URL('../docs/salles.md', import.meta.url), md);
console.log('docs/salles.md généré :', CELL_NUMBERS.flat().length, 'salles');
