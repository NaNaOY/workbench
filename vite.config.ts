import { realpathSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Keep Vite and esbuild on the same physical path when using a directory junction.
const projectRoot = realpathSync(__dirname);
process.chdir(projectRoot);

export default defineConfig({
  root: projectRoot,
  base: process.env.GITHUB_ACTIONS === 'true' ? '/workbench/' : './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
