import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Force reload and clear cache
    force: true,
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
    // Force fresh dependency resolution
    force: true,
    // Clear all previous optimizations
    include: [],
    exclude: [],
  },
  // Use a different cache directory to force fresh start
  cacheDir: `node_modules/.vite-fresh-${Date.now()}`,
}));
