import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))

function copyMapLibreWorkers() {
  return {
    name: 'copy-maplibre-workers',
    buildStart() {
      const dist = join(root, 'node_modules/maplibre-gl/dist')
      const pub = join(root, 'public')
      mkdirSync(pub, { recursive: true })
      for (const f of ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']) {
        copyFileSync(join(dist, f), join(pub, f))
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copyMapLibreWorkers()],
  base: '/sitekick/',
})
