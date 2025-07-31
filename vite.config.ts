import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Configuração mínima para forçar rebuild
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    clearScreen: false,
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
  build: {
    target: "es2020",
    rollupOptions: {
      output: {
        format: 'es'
      }
    },
  },
}));