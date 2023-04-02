import { ConfigEnv, UserConfigExport } from 'vite'
import react from '@vitejs/plugin-react'
import { viteMockServe } from 'vite-plugin-mock'

import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

// https://vitejs.dev/config/
export default ({ command }: ConfigEnv): UserConfigExport => {
  return {
    // base: '/mia/',
    plugins: [
      react(),
      wasm(),
      topLevelAwait(),
      viteMockServe({ mockPath: 'mock', localEnabled: command === 'serve' }),
    ],
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
