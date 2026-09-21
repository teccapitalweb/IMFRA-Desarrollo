import { defineConfig } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDirectory = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: resolve(rootDirectory, "index.html"),
        vip: resolve(rootDirectory, "vip.html"),
        auth: resolve(rootDirectory, "vip-auth.html"),
        panel: resolve(rootDirectory, "vip-panel.html"),
        admin: resolve(rootDirectory, "vip-admin.html"),
        verificar: resolve(rootDirectory, "verificar.html")
      }
    }
  }
});
