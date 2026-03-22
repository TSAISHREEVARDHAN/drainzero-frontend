import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // This fixes page refresh and back/forward navigation in dev
    historyApiFallback: true,
  },
  preview: {
    historyApiFallback: true,
  }
})
