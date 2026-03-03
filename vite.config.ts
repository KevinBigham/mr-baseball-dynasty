import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/mr-baseball-dynasty/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
      },
      manifest: {
        name: 'Mr. Baseball Dynasty',
        short_name: 'MRBD',
        description: 'A deep baseball franchise management simulation',
        theme_color: '#0a0a0f',
        background_color: '#0a0a0f',
        display: 'standalone',
        orientation: 'any',
        categories: ['games', 'sports'],
        icons: [
          { src: 'icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: 'icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-charts': ['recharts'],
          'vendor-state': ['zustand'],
          'vendor-db': ['dexie', 'pako'],
          'game-engine': ['comlink'],
        },
      },
    },
  },
  test: {
    environment: 'node',
    globals: true,
  },
  worker: {
    format: 'es',
  },
});
