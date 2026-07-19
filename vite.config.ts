import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Il SW viene iniettato automaticamente in index.html
      injectRegister: 'auto',
      workbox: {
        // Precacha tutta l'app-shell: JS, CSS, HTML, font, icone
        globPatterns: ['**/*.{js,css,html,ico,svg,png,woff,woff2}'],
        // SPA fallback: qualunque rotta viene servita con index.html
        navigateFallback: 'index.html',
        // Non toccare le rotte interne di Vite/Firebase
        navigateFallbackDenylist: [/^\/__/],
        // Firestore gestisce da sé la propria cache offline (IndexedDB):
        // NON aggiungere runtime caching per le sue API
        runtimeCaching: [],
      },
      manifest: {
        name: 'PMApp',
        short_name: 'PMApp',
        description: 'Gestione Posto Medico Avanzato',
        theme_color: '#145da0',
        background_color: '#eef2f7',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: 'icons/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})
