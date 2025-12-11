import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Changed to '/' for standard web deployment on Vercel
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});