import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react({ include: /\.(jsx|js|tsx|ts)$/ })],
  esbuild: {
    loader: 'jsx',
    include: [/src\/.*\.jsx?$/],
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
  server: {
    host: process.env.HOST || '127.0.0.1',
    port: Number(process.env.FRONTEND_PORT || 3000),
    strictPort: true,
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${process.env.PORT || process.env.BACKEND_PORT || 5001}`,
        changeOrigin: true
      },
      '/uploads': {
        target: `http://127.0.0.1:${process.env.PORT || process.env.BACKEND_PORT || 5001}`,
        changeOrigin: true
      }
    }
  }
})
