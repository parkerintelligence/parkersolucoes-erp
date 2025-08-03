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
      // Force single React instance
      "react": path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
    },
  },
  optimizeDeps: {
    // Exclude React from optimization to prevent null reference issues
    exclude: ['react', 'react-dom'],
    // Force include critical dependencies
    include: ['@supabase/supabase-js', '@tanstack/react-query'],
    // Aggressive cache busting
    force: true,
  },
  build: {
    // Ensure consistent chunking
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          // Keep React in vendor chunk
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
  // Clear cache on startup
  cacheDir: 'node_modules/.vite',
}));
