import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",

    include: ["src/**/*.integration.test.ts"],

    exclude: ["dist/**", "node_modules/**"],

    setupFiles: ["./src/test/integration.setup.ts"],

    clearMocks: true,
  },
});
