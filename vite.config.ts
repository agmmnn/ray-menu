import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import dts from 'vite-plugin-dts'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

const isWcBuild = process.env.BUILD_TARGET === 'wc'

export default defineConfig({
  plugins: [
    !isWcBuild && react(),
    tailwindcss(),
    dts({
      include: isWcBuild
        ? ['src/wc', 'src/core']
        : ['src/index.ts', 'src/core', 'src/components', 'src/hooks'],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'playground'],
      rollupTypes: false,
      tsconfigPath: './tsconfig.app.json',
    }),
  ].filter(Boolean),
  build: {
    lib: {
      entry: isWcBuild
        ? resolve(__dirname, 'src/wc/index.ts')
        : resolve(__dirname, 'src/index.ts'),
      name: isWcBuild ? 'RayMenu' : 'RayMenuReact',
      formats: ['es', 'cjs'],
      fileName: (format) =>
        isWcBuild
          ? `ray-menu.${format === 'es' ? 'mjs' : 'cjs'}`
          : `ray-menu-react.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    rollupOptions: {
      external: isWcBuild ? [] : ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: isWcBuild
          ? {}
          : {
              react: 'React',
              'react-dom': 'ReactDOM',
              'react/jsx-runtime': 'jsxRuntime',
            },
        assetFileNames: 'ray-menu.[ext]',
      },
    },
    outDir: isWcBuild ? 'dist/wc' : 'dist/react',
    sourcemap: true,
    minify: 'esbuild',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@core': resolve(__dirname, 'src/core'),
      '@components': resolve(__dirname, 'src/components'),
      '@hooks': resolve(__dirname, 'src/hooks'),
    },
  },
})
