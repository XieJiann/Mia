import { ConfigEnv, UserConfigExport } from 'vite'
import react from '@vitejs/plugin-react'
import { comlink } from 'vite-plugin-comlink'
import { viteMockServe } from 'vite-plugin-mock'

// https://vitejs.dev/config/
export default ({ command }: ConfigEnv): UserConfigExport => {
  return {
    // base: '/mia/',
    plugins: [
      react(),
      comlink(),
      viteMockServe({ mockPath: 'mock', localEnabled: command === 'serve' }),
    ],
    worker: {
      plugins: [comlink()],
    },
    server: {
      proxy: {
        '/mia_proxy': {
          // target: 'http://localhost:8787',
          target: 'https://mia.brody715.com',
          changeOrigin: true,
        },
      },
    },
  }
}
