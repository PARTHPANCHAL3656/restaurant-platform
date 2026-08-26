import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    watch: {
      ignored: ['**/assets/**', '**/scratch/**', '**/docs/**']
    }
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router-dom') || id.includes('/react/') || id.includes('/react-dom/')) {
              return 'vendor-react';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-motion';
            }
            // No catch-all here — let Rollup's default splitting handle
            // everything else. This is what lets dynamically-imported
            // packages (like `lenis` in App.jsx) actually split into
            // their own async chunk instead of being forced into one
            // eager bundle regardless of import style.
          }
        }
      }
    }
  }
})
