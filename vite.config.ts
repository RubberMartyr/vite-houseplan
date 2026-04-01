import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          debug: [
            './src/engine/debug/EngineDebugLayer.tsx',
            './src/engine/debug/DebugWireframe.tsx',
            './src/engine/debug/RoofPlaneVisualizer.tsx',
            './src/engine/debug/DerivedGraphOverlay.tsx',
            './src/engine/debug/OpeningDebugOverlay.tsx',
          ],
          editor: [
            './src/engine/debug/ui/DebugDashboard.tsx',
            './src/engine/debug/ui/tabs/JsonEditorTab.tsx',
            './src/ui/RoofJsonEditorPanel.tsx',
          ],
        },
      },
    },
  },
});
