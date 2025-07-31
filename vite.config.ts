import { defineConfig } from "vite";
import path from "path";

// Configuração EXTREMA para eliminar todo cache e forçar rebuild completo
export default defineConfig(({ mode }) => ({
  
  // Server com configurações para força limpeza
  server: {
    host: "::",
    port: 8080,
    clearScreen: true,
    hmr: {
      overlay: false
    }
  },
  
  // Plugins desabilitados temporariamente para evitar conflitos React
  plugins: [],
  
  // Otimização de deps forçada
  optimizeDeps: {
    force: true,
    esbuildOptions: {
      target: 'es2020'
    }
  },
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  
  // Build com timestamp único e sem cache
  build: {
    target: "es2020",
    minify: false,
    rollupOptions: {
      output: {
        format: 'es',
        entryFileNames: `[name]-${Date.now()}.js`,
        chunkFileNames: `[name]-${Date.now()}.js`,
        assetFileNames: `[name]-${Date.now()}.[ext]`
      },
      cache: false
    },
  },
  
  // Configurações adicionais para força rebuild
  define: {
    __REBUILD_TIMESTAMP__: Date.now(),
  }
}));