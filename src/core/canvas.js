import { H, W } from './config.js';
export const canvas = document.getElementById('c'),
  ctx = canvas.getContext('2d');
canvas.width = W;
canvas.height = H;
