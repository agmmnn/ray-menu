import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: resolve(__dirname),
  resolve: {
    alias: {
      '@': resolve(__dirname, '../src'),
      '@core': resolve(__dirname, '../src/core'),
      '@components': resolve(__dirname, '../src/components'),
      '@hooks': resolve(__dirname, '../src/hooks'),
      'radial-menu': resolve(__dirname, '../src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
})
