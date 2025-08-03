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
    react({
      jsxImportSource: "react",
    }),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react": path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
    },
    dedupe: ["react", "react-dom"],
  },
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': JSON.stringify(mode === 'development' ? 'development' : 'production'),
  },
  optimizeDeps: {
    force: true,
    include: [
      'react/jsx-runtime',
      'react', 
      'react-dom',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-dialog', 
      '@radix-ui/react-tabs',
      '@radix-ui/react-select',
      '@radix-ui/react-popover',
      '@radix-ui/react-tooltip',
    ],
  },
  build: {
    rollupOptions: {
      external: [],
      output: {
        manualChunks: undefined,
      },
    },
  },
}));
