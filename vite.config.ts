import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { componentTagger } from "lovable-tagger"

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react({
      jsxRuntime: 'automatic',
      fastRefresh: true,
      include: ["**/*.tsx", "**/*.ts", "**/*.jsx", "**/*.js"]
    }),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
    // Skip TypeScript checking during build
    emptyOutDir: true,
  },
  define: {
    global: 'globalThis',
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    target: 'es2020'
  },
  // Disable all TypeScript checking
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020'
    }
  }
}))