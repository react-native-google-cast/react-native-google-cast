import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    // `.web.*` must come first — that extension is the whole mechanism by
    // which the library swaps in its web transport and the
    // `<google-cast-launcher>` CastButton.
    extensions: [
      '.web.tsx',
      '.web.ts',
      '.web.jsx',
      '.web.js',
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
      '.json',
    ],
    alias: {
      'react-native': 'react-native-web',
      // Consume the library from source rather than from `lib/`: the harness
      // exists to test what is on this branch, not the last build output.
      'react-native-google-cast': fileURLToPath(
        new URL('../src/index.ts', import.meta.url)
      ),
    },
  },
  // react-native-web still ships a few `__DEV__` / `process.env` references.
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
    global: 'globalThis',
  },
  optimizeDeps: {
    // The library is TS source outside this package's root; let Vite transform
    // it rather than trying to pre-bundle it as a dependency.
    exclude: ['react-native-google-cast'],
  },
  server: {
    port: 5173,
    fs: { allow: [root, fileURLToPath(new URL('..', import.meta.url))] },
  },
})
