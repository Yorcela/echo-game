// Génère docs/salles.md à partir du registre des numéros de salles (src/data/room-numbers.js).
// Usage : npm run rooms:doc
import { writeFileSync } from 'node:fs';
import { ROOM_NUMBERS, ARENA_PREFIX, GENERATED_ROOM_BASE, MAP_COLUMNS } from '../src/data/room-numbers.js';

const families = [
  [0, 0, 'Hall'],
  [1, 9, 'Début de partie et ponts'],
  [10, 19, 'Jumeau'],
  [20, 29, 'Éclair (dash)'],
  [30, 39, 'Envol (double saut)'],
  [40, 49, 'Colosse'],
  [50, 59, 'Miroir'],
  [60, 69, 'Tir'],
  [70, 79, 'Rémanence'],
  [80, 89, 'Combinaisons'],
  [90, 98, 'Arènes des boss'],
  [100, 199, 'Alcôves'],
];
const entries = Object.entries(ROOM_NUMBERS).sort((a, b) => a[1] - b[1]);
let md = `# Numéros de salles\n\n`;
md += `Le numéro suit **la salle**, pas sa place sur la carte (qui change à chaque partie). Il apparaît sur la carte (touche M),\n`;
md += `en bas à gauche pendant la partie et dans l'en-tête de la carte (« tu es en salle n° … »).\n\n`;
md += `- **0** : Hall des Échos.\n- **1 – 99** : salles dessinées à la main, par famille de pouvoir (tableau ci-dessous).\n`;
md += `- **100 –** : alcôves.\n- **${GENERATED_ROOM_BASE} – ${GENERATED_ROOM_BASE + MAP_COLUMNS * 10 - 1}** : salles générées (couloirs, puits, repos), `;
md += `numérotées d'après leur case sur la carte : **${GENERATED_ROOM_BASE} + ${MAP_COLUMNS} × ligne + colonne** (ligne et colonne comptées à partir de 0 en haut à gauche).\n\n`;
for (const [lo, hi, label] of families) {
  const rows = entries.filter(([, n]) => n >= lo && n <= hi);
  if (!rows.length) continue;
  md += `## ${label} (${lo === hi ? lo : lo + '–' + hi})\n\n| N° | Salle |\n|---|---|\n`;
  for (const [name, n] of rows) md += `| ${n} | ${name.startsWith(ARENA_PREFIX) ? 'Arène : ' + name.slice(ARENA_PREFIX.length) : name} |\n`;
  md += '\n';
}
writeFileSync(new URL('../docs/salles.md', import.meta.url), md);
console.log('docs/salles.md généré :', entries.length, 'salles');
