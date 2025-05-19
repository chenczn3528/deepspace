import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
      react(),
    VitePWA({
      filename: 'sw-beyond.js', // ✅ 与模拟器 A 区分
      scope: '/deepspace/',   // ✅ base 路径一致
      registerType: 'autoUpdate',
      manifest: {
        name: '恋与深空 抽卡模拟器',
        short_name: 'deepspace',
        start_url: '/deepspace/',
        display: 'standalone',
        background_color: '#ffffff',
        icons: [
          {
            src: 'images/icon.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      cleanupOutdatedCaches: true,
    })],
  base: '/',
  define: {
    'process.env': {},
  },
  resolve: {
    alias: {
      crypto: 'crypto-browserify',  // 配置为 crypto-browserify
    },
  },
})
