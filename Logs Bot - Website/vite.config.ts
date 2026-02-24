import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';

const sensitiveFilesPlugin = (): Plugin => {
  const sensitivePaths = [
    '/.env',
    '/env',
    '/.env.local',
    '/.env.development',
    '/.env.production',
    '/.env.test',
    '/package.json',
    '/package-lock.json',
    '/tsconfig.json',
    '/vite.config.ts',
    '/vite.config.js',
    '/.git',
    '/.gitignore',
    '/node_modules',
    '/dist',
    '/build',
  ];

  return {
    name: 'block-sensitive-files',
    configureServer(server) {
      return () => {
        server.middlewares.use((req, _, next) => {
          const url = req.url || '';
          const pathname = url.split('?')[0];

          if (pathname.startsWith('/error/')) {
            next();
            return;
          }

          for (const sensitivePath of sensitivePaths) {
            if (pathname === sensitivePath || pathname.startsWith(sensitivePath + '/')) {
              req.url = '/error/403' + (url.includes('?') ? '?' + url.split('?')[1] : '');
              next();
              return;
            }
          }

          if (pathname.startsWith('/src/')) {
            req.url = '/error/404' + (url.includes('?') ? '?' + url.split('?')[1] : '');
            next();
            return;
          }

          next();
        });
      };
    },
  };
};

export default defineConfig({
  plugins: [react(), sensitiveFilesPlugin()],
  server: {
    allowedHosts: ['logsbot.com', "api.logsbot.com"],
    port: 3000,
    middlewareMode: false,
    fs: {
      strict: true,
      allow: ['.']
    }
  },
  publicDir: 'public',
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
});
