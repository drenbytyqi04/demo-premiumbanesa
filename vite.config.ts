import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base './' + HashRouter → the build works from any sub-path (GitHub Pages, Netlify, a plain folder…)
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
