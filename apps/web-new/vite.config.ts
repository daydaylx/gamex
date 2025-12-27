import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    preact(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Intimacy Tool',
        short_name: 'GameX',
        description: 'Ein lokales Tool zur Erkundung von Intimität und Kommunikation',
        theme_color: '#0f0a0f',
        background_color: '#0f0a0f',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Cache all static assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Cache JSON templates
        runtimeCaching: [
          {
            urlPattern: /\.json$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'json-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
        ],
      },
    })
  ],
  base: "./", // Important for Capacitor - relative paths
  build: {
    outDir: "dist",
    assetsDir: "assets",
    emptyOutDir: true,
    // Optimize for mobile
    target: "es2020",
    minify: "esbuild",
    sourcemap: false,
  },
  server: {
    port: 5173,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
  },
});

