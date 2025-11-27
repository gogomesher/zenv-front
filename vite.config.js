import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        receive: resolve(__dirname, 'receive.html') // 你的第二个页面
      }
    }
  }
})
