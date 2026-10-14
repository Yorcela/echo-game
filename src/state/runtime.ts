import type { Runtime } from '../types.ts';

// Variables d'état partagées, réassignées depuis plusieurs modules
// (un `let` exporté ne peut pas être réassigné par l'importeur).
// Initialisées par state.ts, rooms.ts… au chargement de la partie.
export const runtime = {} as Runtime;
