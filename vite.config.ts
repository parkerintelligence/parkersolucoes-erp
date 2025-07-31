import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    clearScreen: false,
  },
  plugins: [
    react({
      jsxImportSource: 'react',
    }),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react": path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
    },
    dedupe: ["react", "react-dom"],
    conditions: ['development', 'browser'],
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
    force: true,
    exclude: [],
    esbuildOptions: {
      target: "es2020"
    }
  },
  esbuild: {
    target: "es2020",
    logOverride: { "this-is-undefined-in-esm": "silent" },
  },
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': JSON.stringify(mode)
  },
  build: {
    target: "es2020",
    commonjsOptions: {
      include: [/node_modules/],
    },
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
        }
      },
    },
  },
}));
