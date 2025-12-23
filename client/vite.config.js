import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api/two-fa': {
        target: 'https://portal-stable.i2ncloud.com',
        changeOrigin: true,
        secure: false
      },
    },
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    }
  }
})
