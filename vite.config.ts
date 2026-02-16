import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  const isReact = mode === "react";

  return {
    plugins: [
      dts({
        include: isReact
          ? ["src/react", "src/shared", "src/core", "src/wc/ray-menu-types.ts"]
          : ["src/wc", "src/core"],
        exclude: ["src/**/*.test.ts", "playground"],
        rollupTypes: false,
        tsconfigPath: "./tsconfig.app.json",
      }),
    ],
    build: {
      lib: {
        entry: isReact
          ? resolve(__dirname, "src/react/index.ts")
          : resolve(__dirname, "src/wc/index.ts"),
        name: isReact ? "RayMenuReact" : "RayMenu",
        formats: ["es", "cjs"],
        fileName: (format) =>
          isReact
            ? `ray-menu-react.${format === "es" ? "mjs" : "cjs"}`
            : `ray-menu.${format === "es" ? "mjs" : "cjs"}`,
      },
      rollupOptions: {
        external: isReact ? ["react", "react/jsx-runtime"] : [],
        output: {
          assetFileNames: isReact ? "ray-menu-react.[ext]" : "ray-menu.[ext]",
        },
      },
      outDir: isReact ? "dist/react" : "dist/wc",
      sourcemap: true,
      minify: "esbuild",
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
        "@core": resolve(__dirname, "src/core"),
      },
    },
  };
});
