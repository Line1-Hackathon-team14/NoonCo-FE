import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import { VitePWA } from 'vite-plugin-pwa'
import svgr from 'vite-plugin-svgr'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr(),
    VitePWA({
      registerType: 'autoUpdate',

      manifest: {
        name: 'NoonCo',
        short_name: 'NoonCo',
        description: '눈치코치(NoonCo) AI 기반 시각장애인 학습 보조 서비스',

        start_url: '/',
        display: 'standalone',

        background_color: '#ffffff',
        theme_color: '#0B1F66',

        icons: [
          {
            src: '/pwa-180x180.png',
            sizes: '180x180',
            type: 'image/png',
          },
          {
            src: '/pwa-180x180.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})
