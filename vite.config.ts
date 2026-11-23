/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Relativne putanje: aplikacija radi i kad nije u korijenu domene (npr. GitHub Pages).
  base: './',
  plugins: [
    react(),
    VitePWA({
      // Nova verzija se ne instalira sama usred igre — korisnik dobije obavijest.
      registerType: 'prompt',
      includeAssets: ['icon.svg', 'favicon-32.png', 'apple-touch-icon.png'],
      manifest: {
        id: './',
        name: 'Fedoku — učenje sudokua',
        short_name: 'Fedoku',
        description: 'Sudoku za učenje tehnika rješavanja: savjeti u tri razine, ručni unos i generator po težini.',
        lang: 'hr',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f6f5f2',
        theme_color: '#2b62d9',
        categories: ['games', 'education', 'puzzle'],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Sve (uključujući Web Worker generatora) ide u predmemoriju → radi bez interneta.
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
