import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    force: true,
  },
  plugins: [
    react({
      tsDecorators: true,
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
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
    ],
    exclude: ['lovable-tagger'],
    force: true,
  },
  build: {
    emptyOutDir: true,
    sourcemap: mode === 'development',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  // Force clear cache
  cacheDir: 'node_modules/.vite-temp',
}));
