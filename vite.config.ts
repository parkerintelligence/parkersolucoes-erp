import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  
  optimizeDeps: {
    include: ['react', 'react-dom'],
    force: true
  },
  
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
  
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  
  clearScreen: false,
}));