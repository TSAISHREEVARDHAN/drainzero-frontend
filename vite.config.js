import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    historyApiFallback: true,
  },
  preview: {
    historyApiFallback: true,
  },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks — split large deps from app code
          'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
          'vendor-antd':   ['antd', '@ant-design/icons'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
})
