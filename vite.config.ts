import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'react-dom/client': path.resolve(__dirname, './node_modules/react-dom/client.js'),
    },
    conditions: ['browser', 'module', 'import', 'default'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime'],
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rolldownOptions: {
      resolve: {
        conditionNames: ['browser', 'module', 'import', 'default'],
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
