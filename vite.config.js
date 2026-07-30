import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
// loadEnv is required: Vite does NOT put .env into process.env for this file.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.IP_BACKEND || 'http://localhost:8000'

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
    ],
    server: {
      // Keep FE calls as same-origin /api (VITE_API_URL=/api) so httpOnly
      // cookies work. Proxy forwards to Django (local or Tailscale).
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  }
})