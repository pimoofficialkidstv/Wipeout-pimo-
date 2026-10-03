import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      build: {
        rollupOptions: {
          input: {
            main: path.resolve(__dirname, 'index.html'),
          },
        },
      },
      plugins: [react(), tailwindcss()],
      optimizeDeps: {
        include: [
          'react', 
          'react-dom', 
          'motion', 
          'motion/react',
          'lucide-react', 
          '@google/genai', 
          'firebase/app', 
          'firebase/database', 
          'firebase/auth', 
          'firebase/firestore',
          'canvas-confetti'
        ],
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
