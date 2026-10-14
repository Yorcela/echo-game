export const WIDTH = 960,
  HEIGHT = 544,
  TILE = 32,
  MOVE_SPEED = 225,
  JUMP_SPEED = 640,
  GRAVITY = 1900,
  MAX_FALL_SPEED = 950,
  PLATE_HOLD_TIME = 3,
  PLAYER_W = 22,
  PLAYER_H = 28,
  GIANT_W = 36,
  GIANT_H = 46;
export const LETHAL_BOSS_STATES = {
  charge: 1,
  hop: 1,
  slam: 1,
  dash: 1,
  dive: 1,
};
export const FLOOR_Y = 14 * TILE;
// un bond sous une plateforme le sonnerait aussitôt : on simule la trajectoire
/* ---------- Dessin ---------- */
export const HERO_BASE_W = 22,
  HERO_BASE_H = 28;
