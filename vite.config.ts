import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react-swc';
import mkcert from 'vite-plugin-mkcert';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load environment variables based on mode
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: '/TeleMiniApp-MTYB-Store/',
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern',
        },
      },
    },
    plugins: [
      // Allows using React dev server along with building a React application with Vite.
      // https://npmjs.com/package/@vitejs/plugin-react-swc
      react(),
      // Allows using the compilerOptions.paths property in tsconfig.json.
      // https://www.npmjs.com/package/vite-tsconfig-paths
      tsconfigPaths(),
      // Creates a custom SSL certificate valid for the local machine.
      // Using this plugin requires admin rights on the first dev-mode launch.
      // https://www.npmjs.com/package/vite-plugin-mkcert
      (process.env.HTTPS || env.HTTPS) && mkcert(),
    ].filter(Boolean),
    build: {
      target: 'esnext',
      outDir: 'dist',
      assetsDir: 'assets',
      minify: 'terser',
      sourcemap: mode === 'development',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            telegram: ['@telegram-apps/sdk-react', '@telegram-apps/telegram-ui'],
            ton: ['@tonconnect/ui-react'],
          },
        },
      },
    },
    publicDir: './public',
    server: {
      // Exposes your dev server and makes it accessible for the devices in the same network.
      host: true,
      port: parseInt(env.VITE_DEV_SERVER_PORT) || 5173,
      strictPort: false,
      open: false,
    },
    preview: {
      host: true,
      port: 4173,
      strictPort: false,
    },
    define: {
      // Expose environment variables
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
  };
});
