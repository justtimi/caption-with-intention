import { defineConfig } from "vite";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import dts from "vite-plugin-dts";

// Explicitly lock down the absolute directory name of this specific configuration file
const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    dts({
      bundleTypes: true,
      tsconfigPath: "./tsconfig.json",
    }),
  ],
  build: {
    lib: {
      // We pass the absolute path directly to the Rolldown engine
      entry: resolve(__dirname, "src/index.ts"),
      name: "CaptionsCueEngine",
      fileName: (format) => `cue-engine.${format === "es" ? "js" : "umd.cjs"}`,
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
      },
    },
  },
});
