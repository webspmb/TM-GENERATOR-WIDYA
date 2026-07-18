import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
      'process.env.GEMINI_API_KEY_2': JSON.stringify(env.GEMINI_API_KEY_2 || ''),
      'process.env.GEMINI_API_KEY_FALLBACK': JSON.stringify(env.GEMINI_API_KEY_FALLBACK || ''),
      'process.env.GEMINI_API_KEY_SECONDARY': JSON.stringify(env.GEMINI_API_KEY_SECONDARY || ''),
      'process.env.SECONDARY_GEMINI_API_KEY': JSON.stringify(env.SECONDARY_GEMINI_API_KEY || ''),
      'process.env.GROQ_API_KEY': JSON.stringify(env.GROQ_API_KEY || ''),
      'process.env.GROQ_API_KEY_1': JSON.stringify(env.GROQ_API_KEY_1 || ''),
      'process.env.GROQ_API_KEY_2': JSON.stringify(env.GROQ_API_KEY_2 || ''),
      'process.env.GROQ_API_KEY_3': JSON.stringify(env.GROQ_API_KEY_3 || ''),
      'process.env.GROQ_API_KEY_SECONDARY': JSON.stringify(env.GROQ_API_KEY_SECONDARY || ''),
      'process.env.SECONDARY_GROQ_API_KEY': JSON.stringify(env.SECONDARY_GROQ_API_KEY || ''),
      'process.env.GROQ_API_KEY_TERTIARY': JSON.stringify(env.GROQ_API_KEY_TERTIARY || ''),
      'process.env.TERTIARY_GROQ_API_KEY': JSON.stringify(env.TERTIARY_GROQ_API_KEY || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      // Opsi 1: Menaikkan batas peringatan ke 1000kb
      chunkSizeWarningLimit: 1000,
      // Opsi 2: Memecah library otomatis agar loading lebih ringan
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return id.toString().split('node_modules/')[1].split('/')[0].toString();
            }
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
