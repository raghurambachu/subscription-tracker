import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Run `npm run build:portable` to produce a single self-contained dist/index.html
// that opens directly via file:// with no server needed.
const isPortable = process.env.BUILD_TARGET === 'portable'

export default defineConfig({
  plugins: [react(), tailwindcss(), ...(isPortable ? [viteSingleFile()] : [])],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: './',
})
