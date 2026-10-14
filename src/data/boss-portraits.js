// Portraits des boss affichés sous les boutons de l'écran titre, dans l'ordre de progression.
// `echo` : index de l'écho gagné en battant le boss ('time' pour l'écho du Temps, 'king' pour le Roi).
// `crop` : zone du sprite (x, y, largeur, hauteur, en px) qui contient la tête.
export const BOSS_PORTRAITS = [
  { echo: 'time', name: 'Le Gardien du Temps', sprite: 'time', crop: [95, 0, 145, 135] },
  { echo: 2, name: 'Les Jumeaux', sprite: 'twin-a', crop: [110, 0, 110, 110] },
  { echo: 5, name: "L'Envol", sprite: 'wing-body', crop: [200, 17, 90, 95] },
  { echo: 3, name: 'Le Colosse', sprite: 'giant-torso', crop: [200, 0, 120, 115] },
  { echo: 0, name: 'Les Reflets', sprite: 'sun-torso', crop: [0, 0, 122, 125] },
  { echo: 6, name: 'La Sorcière', sprite: 'witch-body', crop: [0, 0, 111, 100] },
  { echo: 1, name: 'La Mémoire', sprite: 'ghost', crop: [45, 0, 130, 130] },
  { echo: 4, name: "L'Éclair", sprite: 'bolt-torso', crop: [0, 0, 92, 100] },
  { echo: 'king', name: 'Le Roi des Échos', sprite: null, crop: null },
];
