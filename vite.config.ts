import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    dts({
      include: ['src/wc', 'src/core'],
      exclude: ['src/**/*.test.ts', 'playground'],
      rollupTypes: false,
      tsconfigPath: './tsconfig.app.json',
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/wc/index.ts'),
      name: 'RayMenu',
      formats: ['es', 'cjs'],
      fileName: (format) => `ray-menu.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    rollupOptions: {
      output: {
        assetFileNames: 'ray-menu.[ext]',
      },
    },
    outDir: 'dist/wc',
    sourcemap: true,
    minify: 'esbuild',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@core': resolve(__dirname, 'src/core'),
    },
  },
})
