import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Le jeu est livré en un seul fichier HTML autonome (sprites et JS inlinés).
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  build: { target: 'es2020', assetsInlineLimit: 100_000_000 },
  test: { environment: 'node', include: ['tests/**/*.test.js'] },
});
