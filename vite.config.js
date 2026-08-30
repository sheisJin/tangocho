import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 새 버전을 배포하면 다음 실행 때 알아서 교체됩니다.
      // 지인들이 각자 폰에서 쓰는 앱이라, 갱신을 눌러달라고 할 수가 없습니다.
      registerType: "autoUpdate",

      // 매니페스트는 public/manifest.json 을 그대로 씁니다
      manifest: false,

      workbox: {
        globPatterns: ["**/*.{js,css,html,png,json,woff2}"],

        // 홈 화면에서 연 주소가 무엇이든 앱 껍데기를 돌려줍니다
        navigateFallback: "/index.html",
        // 단, /api/extract 는 서버리스 함수이므로 가로채면 안 됩니다
        navigateFallbackDenylist: [/^\/api\//],

        cleanupOutdatedCaches: true,

        runtimeCaching: [
          {
            // 폰트 파일 — 한 번 받으면 바뀌지 않습니다
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "google-fonts-stylesheets",
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Pretendard (jsdelivr)
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "jsdelivr-fonts",
              expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
