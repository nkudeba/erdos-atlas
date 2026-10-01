// The encrypted static build (GitHub Pages): one ES module and one stylesheet, which scripts/publish-static.mjs
// encrypts together. No Sites, vinext or Workers plugin, and no public/ copy: the publish step adds the fonts.
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/postcss';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root,
  publicDir: false,
  plugins: [react()],
  css: { postcss: { plugins: [tailwindcss()] } },
  resolve: { alias: { '@': root } },
  build: {
    outDir: 'dist-static',
    emptyOutDir: true,
    cssCodeSplit: false,
    sourcemap: false,
    target: 'es2022',
    rollupOptions: {
      input: 'static/app.tsx',
      output: { format: 'es', entryFileNames: 'app.js', assetFileNames: 'app[extname]', inlineDynamicImports: true },
    },
  },
});
