import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import mdx from "fumadocs-mdx/vite";
import { nitro } from "nitro/vite";
import path from "path";

export default defineConfig({
  server: {
    port: 3001,
  },
  resolve: {
    alias: {
      "ray-menu/react": path.resolve(
        __dirname,
        "../dist/react/ray-menu-react.mjs",
      ),
      "ray-menu/core": path.resolve(__dirname, "../dist/wc/ray-menu.mjs"),
      "ray-menu": path.resolve(__dirname, "../dist/wc/ray-menu.mjs"),
    },
  },
  plugins: [
    mdx(await import("./source.config")),
    tailwindcss(),
    tsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tanstackStart({
      prerender: {
        enabled: true,
      },
    }),
    react(),
    // please see https://tanstack.com/start/latest/docs/framework/react/guide/hosting#nitro for guides on hosting
    nitro({
      preset: process.env.VERCEL ? "vercel" : "node-server",
      vercel: {
        entryFormat: "node",
      },
    }),
  ],
});
