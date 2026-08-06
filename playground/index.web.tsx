/**
 * Web entry point — the Vite counterpart of `index.js` (Metro/AppRegistry).
 *
 * Both mount the SAME `App`. That is the point of bead v5-5tx: the playground
 * exists to verify cross-platform parity, so a second, separate web rig would
 * drift and quietly undermine the thing it is there to check. What differs
 * between platforms lives in the library's `.web.*` files and in a handful of
 * `Platform.OS` checks inside `App.tsx` — not in a fork of the harness.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

const root = document.getElementById('root')
if (root == null) throw new Error('#root missing from index.html')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
)
