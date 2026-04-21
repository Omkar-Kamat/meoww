import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Return index.html for any unknown path in dev so React Router
    // can handle it client-side — fixes the reload 404 on /chat, /verify etc.
    historyApiFallback: true,
  }
});