import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  const isReact = mode === "react";
  const isCore = mode === "core";

  const entry = isReact
    ? resolve(__dirname, "src/react/index.ts")
    : isCore
      ? resolve(__dirname, "src/core/index.ts")
      : resolve(__dirname, "src/wc/index.ts");

  const name = isReact ? "RayMenuReact" : isCore ? "RayMenuCore" : "RayMenu";

  const fileName = (format: string) => {
    const ext = format === "es" ? "mjs" : "cjs";
    if (isReact) return `ray-menu-react.${ext}`;
    if (isCore) return `ray-menu-core.${ext}`;
    return `ray-menu.${ext}`;
  };

  const outDir = isReact ? "dist/react" : isCore ? "dist/core" : "dist/wc";

  const dtsInclude = isReact
    ? ["src/react", "src/shared", "src/core", "src/wc/ray-menu-types.ts"]
    : isCore
      ? ["src/core"]
      : ["src/wc", "src/core"];

  const assetPrefix = isReact
    ? "ray-menu-react"
    : isCore
      ? "ray-menu-core"
      : "ray-menu";

  return {
    plugins: [
      dts({
        include: dtsInclude,
        exclude: ["src/**/*.test.ts", "playground"],
        rollupTypes: false,
        tsconfigPath: "./tsconfig.app.json",
      }),
    ],
    build: {
      lib: {
        entry,
        name,
        formats: ["es", "cjs"],
        fileName,
      },
      rollupOptions: {
        external: isReact ? ["react", "react/jsx-runtime"] : [],
        output: {
          assetFileNames: `${assetPrefix}.[ext]`,
        },
      },
      outDir,
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
