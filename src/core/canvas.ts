import { HEIGHT, WIDTH } from './config.ts';

export const canvas = document.getElementById('c') as HTMLCanvasElement;
export const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
canvas.width = WIDTH;
canvas.height = HEIGHT;
