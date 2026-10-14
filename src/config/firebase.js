// Configuration Firebase du classement mondial.
// Ces valeurs sont publiques par conception (elles figurent dans tout site utilisant Firebase) :
// la sécurité repose sur les règles Firestore (voir /firestore.rules), pas sur le secret de la clé.
// Laisser `apiKey` ou `projectId` vide désactive le classement mondial (le jeu reste 100 % local).
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyD3Yipt6E9C7_KZHZ6V6WK4duwUAnwieqI',
  projectId: 'echo-game-3fd9a',
};
