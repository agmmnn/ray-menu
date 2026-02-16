import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: resolve(__dirname),
  resolve: {
    alias: {
      "@core": resolve(__dirname, "../src/core"),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
