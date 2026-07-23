import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// En build (GitHub Pages) la app se sirve bajo /modelo-financiero-centrales/.
// En desarrollo se mantiene en la raíz.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/modelo-financiero-centrales/' : '/',
  plugins: [react()],
  server: { port: 5173, open: true },
}))
