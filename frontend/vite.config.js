import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",

      includeAssets: [
        "favicon.svg",
        "icons/**/*"
      ],

      manifest: {
        name: "UMADEB Jovens",
        short_name: "UMADEB",
        description: "Sistema de jovens da igreja — presenças e ranking",

        theme_color: "#071a35",
        background_color: "#071a35",

        display: "standalone",

        start_url: "/",

        orientation: "portrait",

        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      },

      workbox: {
        // Arquivos que ficam em cache para funcionar offline
        globPatterns: [
          "**/*.{js,css,html,svg,png,ico,woff,woff2}"
        ],

        // Estratégia: tenta rede primeiro, cai no cache se offline
        runtimeCaching: [
          {
            // Cache das chamadas da API
            urlPattern: /^http:\/\/localhost:3000\/api\/.*/i,

            handler: "NetworkFirst",

            options: {
              cacheName: "api-cache",

              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 1 dia
              },

              networkTimeoutSeconds: 5
            }
          },
          {
            // Cache das fotos dos jovens
            urlPattern: /^http:\/\/localhost:3000\/uploads\/.*/i,

            handler: "CacheFirst",

            options: {
              cacheName: "fotos-cache",

              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 dias
              }
            }
          }
        ]
      }
    })
  ]
});