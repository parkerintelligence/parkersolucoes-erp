import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// SOLUÇÃO FINAL: Configuração que FORÇA reconstrução completa
export default defineConfig(({ mode }) => ({
  // Forçar sempre desenvolvimento para evitar cache de produção
  mode: 'development',
  server: {
    host: "::",
    port: 8080,
    // Forçar recarga completa
    force: true,
    // Desabilitar cache completamente
    hmr: {
      overlay: false
    }
  },
  plugins: [
    react({
      jsxImportSource: "react",
    }),
    componentTagger(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': '"development"',
  },
  // CONFIGURAÇÃO CRÍTICA: Sem otimização nem cache
  optimizeDeps: {
    disabled: true,
    force: true,
    include: [],
    exclude: ['react', 'react-dom']
  },
  // Cache desabilitado
  cacheDir: '.vite-temp',
  build: {
    // Sem minificação para debug
    minify: false,
    rollupOptions: {
      external: [],
      // Arquivos únicos sempre
      output: {
        entryFileNames: `assets/[name]-${Date.now()}.js`,
        chunkFileNames: `assets/[name]-${Date.now()}.js`,
        assetFileNames: `assets/[name]-${Date.now()}.[ext]`,
        // Evitar chunks
        manualChunks: undefined,
      }
    },
    // Forçar reconstrução
    emptyOutDir: true,
  },
  // Evitar qualquer cache
  clearScreen: false,
}));