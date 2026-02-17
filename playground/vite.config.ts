import { defineConfig } from "vite";
import { resolve } from "path";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: resolve(__dirname),
  plugins: [react()],
  resolve: {
    alias: {
      "@core": resolve(__dirname, "../src/core"),
      "ray-menu/react": resolve(__dirname, "../src/react"),
    },
  },
  server: {
    port: 3000,
    open: "/react-test.html",
  },
});
