// Types du domaine. Les modules JavaScript non encore migrés ne sont pas vérifiés (checkJs désactivé) ;
// ces types servent de contrat pour les modules TypeScript et de documentation pour les autres.

/** Corps physique : le héros, son clone ou un ennemi. Les champs optionnels dépendent du pouvoir ou du boss. */
export interface Body {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  /** au sol ? */
  g?: boolean | number;
  face?: number;
  hit?: number;
  dash?: number;
  lad?: number;
  big?: boolean;
  spd?: number;
  [champ: string]: any;
}

/** Entité de salle (ennemi, boss, projectile…). `k` : 'b' boss, 'c' crabe, 'r' rebelle, 'g' marcheur… */
export interface Entity extends Body {
  k: string;
  hp: number;
  alive?: boolean;
  st?: string;
}

/** Salle : plan en 17 lignes de 30 caractères et métadonnées. */
export interface Level {
  name: string;
  /** numéro stable de la salle (voir src/data/room-numbers.js) */
  number?: number;
  hint: string;
  rows: string[];
  boss?: BossDefinition;
  bench?: boolean;
  king?: number;
  gen?: boolean;
  flip?: boolean;
  [champ: string]: any;
}

export interface BossDefinition {
  n: string;
  hp: number;
  kind: string;
  spd: number;
  w: number;
  h: number;
  c: string;
  hint: string;
  [champ: string]: any;
}

export type GameMode =
  'title' | 'play' | 'rewind' | 'gain' | 'map' | 'pause' | 'scores' | 'over' | 'sleep' | 'trial';

/** État persistant de la partie et de l'interface. */
export interface GameState {
  mode: GameMode | string;
  time: number;
  seed: number;
  name: string;
  /** salle en cours (sauvegardée) / salle chargée */
  currentRoom: number;
  loadedRoom: number;
  checkpointRoom?: number;
  wonRoom: number;
  hp: number;
  hpMax: number;
  shieldHearts: number;
  invulnerableTimer: number;
  gauge: number;
  /** échos possédés (index 0..6) et écho du Temps */
  echoesOwned: number[];
  hasTimeEcho: number;
  selectedEcho: number;
  echoCooldown: number;
  history: any[];
  rewindTargetFrame: number;
  rewindStartTime?: number;
  rewindExtended?: number;
  freeRewind?: number;
  visitedRooms: Record<number, number>;
  clearedBossRooms: Record<number, number>;
  solvedRooms: Record<number, number>;
  usedBeds: Record<number, number>;
  collectedHearts: Record<string, number>;
  anchorsByRoom: Record<number, Record<string, boolean>>;
  roomAnchors: Record<string, boolean>;
  blueHeartSpots: Record<number, [number, number]>;
  entry: string;
  entryRoom: number;
  entryRow: number;
  slideTimer: number;
  slideDirX: number;
  slideDirY: number;
  roomTime: number;
  runTime: number;
  idleTime: number;
  hintTimer: number;
  message: string;
  messageTimer: number;
  gainedEcho: [string, string] | null;
  gainTimer: number;
  bedFadeTimer: number;
  deaths?: number;
  trial?: number;
  victory: number;
  [champ: string]: any;
}

/** Variables partagées réassignées depuis plusieurs modules (voir src/state/runtime.ts). */
export interface Runtime {
  level: Level;
  grid: string[][];
  plates: Array<{ c: number; r: number; t: number; was?: number }>;
  anchors: Array<{ [champ: string]: any }>;
  player: Body;
  echoClone: Body | null;
  entities: Entity[];
  shots: Array<{ [champ: string]: any }>;
  hearts: Array<{ x: number; y: number; t: string; id: string; got: boolean }>;
  statue: { x: number; y: number } | null;
  bed: { x: number; y: number } | null;
  spawnPoint: { x: number; y: number };
  openDoors: Record<string, boolean>;
  crumbleTiles: Array<[number, number]>;
  crumbleTimer: number;
  crumbleTileTimers: Record<number, number>;
  brokenTilesLog: Array<[number, number, string]>;
  sealedTiles: Array<[number, number]>;
  colossusFloor: {
    steps?: number;
    fx?: any[];
    rise: number[];
    cnt?: number[];
    last?: number;
    [champ: string]: any;
  };
  kingAiActive: number;
  bossCollisionMode: number;
  knockbackTimer: number;
  nukeCount: number;
  mute: boolean;
}
