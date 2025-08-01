import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    force: true, // Force dependency pre-bundling
  },
  plugins: [
    react({
      // Add SWC configuration for better stability
      plugins: [],
    }),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    // Force pre-bundling of these dependencies
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
    ],
    force: true, // Force dependency optimization
  },
  build: {
    // Clear the dist folder before building
    emptyOutDir: true,
    sourcemap: mode === 'development',
  },
  // Clear cache on startup
  cacheDir: 'node_modules/.vite',
}));
