import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    base: './',
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      minify: 'esbuild',
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Split node_modules into vendor chunk
            if (id.includes('node_modules')) {
              // Core dependencies
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              // UI/Animation libraries
              if (id.includes('lucide-react') || id.includes('motion')) {
                return 'vendor-ui';
              }
              // Web3 libraries
              if (id.includes('viem') || id.includes('wagmi')) {
                return 'vendor-web3';
              }
              // Utility libraries
              return 'vendor-common';
            }

            // Split pages into separate chunks
            if (id.includes('/pages/')) {
              const match = id.match(/\/pages\/([^/]+)\./);
              if (match) return `page-${match[1].toLowerCase()}`;
            }

            // Split tabs into separate chunks
            if (id.includes('/tabs/')) {
              const match = id.match(/\/tabs\/([^/]+)\./);
              if (match) return `tab-${match[1].toLowerCase()}`;
            }
          },
        },
      },
    },
    esbuild: {
      logLevel: 'warning',
      logLimit: 100,
      logOverride: {
        'unsupported-css-property': 'silent',
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        // Proxy PulseChain Blockscout API to bypass CORS in browser dev mode
        '/proxy/pulsechain': {
          target: 'https://api.scan.pulsechain.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/proxy\/pulsechain/, ''),
          timeout: 60000,
          proxyTimeout: 60000,
        },
      },
    },
  };
});
