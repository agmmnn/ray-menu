import { defineConfig } from "vite";
import { resolve } from "path";
// import react from "@vitejs/plugin-react";     // NOT SUPPORTED BY VITE 7
// WAITING FOR UPGRADE
// When @vitejs/plugin-react upgrades to vite 7:
// Drop the react and react-dom dev deps from the package.json
// They were used as a bandaid

export default defineConfig({
  root: resolve(__dirname),
  // plugins: [react()],     // NOT SUPPORTED BY VITE 7, WAITING FOR UPGRADE
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
