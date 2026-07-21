import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'vertex-kill-switch',
      configureServer(server) {
        server.middlewares.use('/api/kill', (req, res) => {
          res.statusCode = 200;
          res.end('Machina Terminated');
          console.log('[VERTEX] Kill switch engaged. Terminating process...');
          setTimeout(() => process.exit(0), 500);
        });
      }
    }
  ],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
})
