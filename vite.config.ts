import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "icons/*.svg"],
      manifest: {
        name: "سندة | منصة الوظائف بارت-تايم",
        short_name: "سندة",
        description: "منصة وظائف بارت-تايم موثوقة تربط أصحاب العمل بالعمال",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#F97316",
        orientation: "portrait-primary",
        lang: "ar",
        dir: "rtl",
        icons: [
          { src: "/icons/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any maskable" },
          { src: "/icons/icon-512x512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: "NetworkOnly",
            method: "GET",
          },
          {
            urlPattern: /^https?:\/\/(?!.*\/api\/).*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "external-assets",
              expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
