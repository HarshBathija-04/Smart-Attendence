import { createApp } from "./app";
import { config } from "./config";
import { pool } from "./db";

const server = createApp().listen(config.PORT, () => {
  console.log(`Smart Attendance API listening on port ${config.PORT} (${config.NODE_ENV})`);
});

function shutdown(signal: string) {
  console.log(`${signal} received, shutting down`);
  server.close(() => void pool.end().then(() => process.exit(0)));
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
