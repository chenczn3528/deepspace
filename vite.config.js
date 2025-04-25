// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
//
// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   base: '/deepspace/',
// })

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/deepspace/',  // 保持路径前缀为 /deepspace/
  build: {
    outDir: 'dist', // 输出目录为 dist
  },
})
