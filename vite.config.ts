import { defineConfig } from "vitest/config";

const isExternal = (id: string): boolean =>
  !id.startsWith(".") && !id.startsWith("/");

export default defineConfig({
  build: {
    outDir: "lib",
    emptyOutDir: true,
    target: "es2020",
    minify: false,
    sourcemap: false,
    lib: {
      entry: "src/index.ts",
    },
    rollupOptions: {
      external: isExternal,
      output: [
        {
          dir: "lib/esm",
          format: "es",
          preserveModules: true,
          preserveModulesRoot: "src",
          entryFileNames: "[name].js",
          exports: "named",
        },
        {
          dir: "lib/cjs",
          format: "cjs",
          preserveModules: true,
          preserveModulesRoot: "src",
          entryFileNames: "[name].js",
          exports: "named",
        },
      ],
    },
  },
  test: {
    globals: true,
    environment: "node",
    fileParallelism: false,
    include: ["test/*.test.ts"],
    setupFiles: ["test/utils/polyfills.ts"],
    testTimeout: 30000,
    coverage: {
      provider: "v8",
      reportsDirectory: "coverage",
    },
  },
});
