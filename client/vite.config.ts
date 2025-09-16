import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import autoprefixer from "autoprefixer"

export default defineConfig({
  plugins: [react()],
  css: {
    // Inline PostCSS config to avoid picking up root Tailwind plugin in this client build
    postcss: {
      plugins: [autoprefixer()],
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
  target: "http://localhost:9001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
