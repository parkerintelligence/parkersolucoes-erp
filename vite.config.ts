import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    // COMPLETELY exclude React from optimization - this is the key fix
    exclude: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
    // Disable dependency scanning that can cause issues
    disabled: false,
    // Force rebuild
    force: true,
  },
  build: {
    // Ensure React stays external in development
    rollupOptions: {
      external: mode === 'development' ? ['react', 'react-dom'] : [],
    },
  },
}));
