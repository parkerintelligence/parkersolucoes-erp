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
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      '@supabase/postgrest-js',
      '@supabase/storage-js',
      '@supabase/realtime-js',
      '@supabase/gotrue-js',
      'recharts',
      'lodash',
      'lodash/isString',
      'lodash/isNaN',
      'lodash/get',
      'prop-types',
      'react-smooth',
      'fast-equals',
      'eventemitter3',
      '@aws-sdk/client-s3',
      'fast-xml-parser',
      'canvg',
      'rgbcolor',
      'raf',
    ],
    exclude: ['lovable-tagger'],
    force: true,
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  build: {
    emptyOutDir: true,
    sourcemap: false,
    commonjsOptions: {
      include: [/react/, /react-dom/, /supabase/, /lodash/, /recharts/, /prop-types/, /react-smooth/, /fast-equals/, /eventemitter3/, /@aws-sdk/, /fast-xml-parser/, /canvg/, /rgbcolor/, /raf/],
      transformMixedEsModules: true,
      defaultIsModuleExports: 'auto',
      esmExternals: true,
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Force React and React-DOM into a single chunk
          if (id.includes('react') || id.includes('React')) {
            return 'react-single';
          }
          // Keep other vendor dependencies separate
          if (id.includes('@supabase')) return 'supabase';
          if (id.includes('recharts')) return 'charts';
          if (id.includes('lodash')) return 'lodash';
          if (id.includes('@aws-sdk')) return 'aws';
          if (id.includes('canvg') || id.includes('rgbcolor')) return 'canvas';
        },
        format: 'es',
        interop: 'auto',
      },
    },
  },
  // Force clear cache with unique directory
  cacheDir: 'node_modules/.vite-react-fix',
}));
