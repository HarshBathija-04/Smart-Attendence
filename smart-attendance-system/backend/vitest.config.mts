import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: { NODE_ENV: "test", DB_SCHEMA: "smart_attendance_test", SEED_DEMO_DATA: "true" },
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
