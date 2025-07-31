import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Force complete cache invalidation
const timestamp = Date.now();

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    force: true,
    hmr: {
      port: 8081,
    },
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  
  // Aggressive cache busting
  optimizeDeps: {
    force: true,
    exclude: ['react', 'react-dom', '@emotion/react'],
    include: [],
  },
  
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `[name]-${timestamp}.[hash].js`,
        chunkFileNames: `[name]-${timestamp}.[hash].js`,
        assetFileNames: `[name]-${timestamp}.[hash].[ext]`,
      },
    },
    target: 'esnext',
    minify: false,
  },
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react": path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
    },
  },
  
  define: {
    __DEV__: mode === 'development',
    __TIMESTAMP__: timestamp,
  },
  
  clearScreen: false,
}));