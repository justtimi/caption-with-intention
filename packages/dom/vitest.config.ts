import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    environment: "jsdom",
    setupFiles: ['./vitest.setup.ts']
  },
});