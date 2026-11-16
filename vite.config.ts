import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Base relativa './' para compatibilidad 100% con GitHub Pages en cualquier subpath o dominio.
export default defineConfig({
  base: './',
  plugins: [react()],
});
