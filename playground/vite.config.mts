import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

const here = fileURLToPath(new URL('.', import.meta.url))
const repoRoot = fileURLToPath(new URL('..', import.meta.url))

// `.mts`, not `.ts`, on purpose. This package is a React Native app: its
// metro.config.js and babel.config.js are CommonJS, so package.json must NOT
// declare `"type": "module"`. Naming the Vite config `.mts` makes it
// unambiguously ESM regardless, so the two toolchains coexist in one package
// without either having to compromise. (This is the merge that bead v5-5tx is
// about — one playground, Metro and Vite side by side, rather than two rigs
// that drift apart.)
export default defineConfig({
  root: here,
  plugins: [react()],
  resolve: {
    // `.web.*` must come first — that extension is the whole mechanism by which
    // the library swaps in its web transport (`CastTransport.web.ts`), the
    // `<google-cast-launcher>` CastButton (`CastButton.web.tsx`), and the
    // no-op debug seam (`fakeSession.web.ts`).
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
    alias: [
      // Deep imports first — the playground reaches past the barrel for the
      // debug-only seams (`src/debug/fakeSession`, `src/debug/storeDiagnostics`),
      // which a bare-specifier alias would not catch. Metro resolves these via
      // react-native-builder-bob's monorepo config; this is the Vite mirror of
      // that, and of the `paths` mapping in tsconfig.json.
      {
        find: /^react-native-google-cast\/src\/(.*)$/,
        replacement: `${repoRoot}src/$1`,
      },
      // Consume the library from source rather than from `lib/`: the playground
      // exists to exercise what is on this branch, not the last build output.
      {
        find: /^react-native-google-cast$/,
        replacement: `${repoRoot}src/index.ts`,
      },
      { find: /^react-native$/, replacement: 'react-native-web' },
    ],
  },
  // react-native-web still ships a few `__DEV__` / `process.env` references.
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
    global: 'globalThis',
  },
  optimizeDeps: {
    exclude: [
      // The library is TS source outside this package's root; let Vite
      // transform it rather than trying to pre-bundle it as a dependency.
      'react-native-google-cast',
      // MUST stay excluded. esbuild's dep pre-bundler does not honour
      // `resolve.extensions`, so it resolves this package's *native* entry and
      // then chokes on the Flow types it pulls in from react-native proper
      // (`codegenNativeComponent.js`: "Expected \"from\" but found \"{\"").
      // Excluded, it goes through Vite's normal resolve pipeline, which does
      // honour `.web.js` — and the package ships `.web.js` variants for exactly
      // the two files that touch native (NativeSafeAreaProvider, SafeAreaView).
      'react-native-safe-area-context',
    ],
  },
  server: {
    port: 5173,
    fs: { allow: [here, repoRoot] },
  },
})
