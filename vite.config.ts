import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  build: {
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'HouseViewer',
      fileName: 'houseviewer',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react-dom/client'],
    },
  },
});
