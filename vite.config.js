import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'
import { execSync } from 'child_process'

// Read git info at build time
function getGitInfo() {
  try {
    const hash = execSync('git rev-parse --short HEAD').toString().trim()
    const dateIso = execSync('git log -1 --format=%cI').toString().trim()
    const message = execSync('git log -1 --pretty=%s').toString().trim()
    return { hash, dateIso, message }
  } catch (e) {
    return { hash: null, dateIso: null, message: null }
  }
}

const git = getGitInfo()

// https://vite.dev/config/
export default defineConfig({
  plugins: [
      react(),
    VitePWA({
      filename: 'ds-beyond.js', // ✅ 与模拟器 A 区分
      scope: '/',   // ✅ base 路径一致
      registerType: 'autoUpdate',
      manifest: {
        name: '恋与深空 抽卡模拟器',
        short_name: '深空抽卡',
        start_url: '/',
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
    __BUILD_GIT_HASH__: JSON.stringify(git.hash),
    __BUILD_GIT_DATE_ISO__: JSON.stringify(git.dateIso),
    __BUILD_GIT_MESSAGE__: JSON.stringify(git.message),
  },
  resolve: {
    alias: {
      crypto: 'crypto-browserify',  // 配置为 crypto-browserify
    },
  },
  server: {
    host: '0.0.0.0', // 允许局域网访问
    port: 5173,
  }
})
