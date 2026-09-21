import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: resolve(__dirname, "index.html"),
        vip: resolve(__dirname, "vip.html"),
        auth: resolve(__dirname, "vip-auth.html"),
        panel: resolve(__dirname, "vip-panel.html"),
        admin: resolve(__dirname, "vip-admin.html"),
        verificar: resolve(__dirname, "verificar.html")
      }
    }
  }
});

