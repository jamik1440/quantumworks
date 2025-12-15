import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
  ],

  server: {
    port: 5173,
    strictPort: false,
    host: '0.0.0.0',
    hmr: {
      overlay: true,
    },
  },

  preview: {
    port: 4173,
    strictPort: true,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './components'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/hooks': path.resolve(__dirname, './hooks'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/services': path.resolve(__dirname, './services'),
      '@/store': path.resolve(__dirname, './src/store'),
      '@/config': path.resolve(__dirname, './src/config'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/pages': path.resolve(__dirname, './pages'),
      '@/contexts': path.resolve(__dirname, './contexts'),
    },
  },

  build: {
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: true,
        pure_funcs: mode === 'production' ? ['console.log', 'console.info'] : [],
      },
    },

    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-three': ['three'],
          'vendor-r3f': ['@react-three/fiber', '@react-three/drei'],
          'vendor-state': ['zustand', '@tanstack/react-query'],
          'vendor-ui': ['framer-motion', 'lucide-react'],
        },

        // Optimize chunk names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },

    // Chunk size warnings
    chunkSizeWarningLimit: 1000,

    // Source maps for production debugging
    sourcemap: mode === 'production' ? 'hidden' : true,
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'three', '@react-three/fiber'],
    exclude: ['@react-three/test-renderer'],
  },

  // Asset handling
  assetsInlineLimit: 4096, // Inline assets < 4kb

  define: {
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || ''),
  },
}));
