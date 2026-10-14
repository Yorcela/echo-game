import { HEIGHT, WIDTH } from './config.js';
export const canvas = document.getElementById('c'),
  ctx = canvas.getContext('2d');
canvas.width = WIDTH;
canvas.height = HEIGHT;
