import { config } from "./config";
import { migrate, pool } from "./db";

migrate()
  .then((applied) => {
    console.log(
      applied.length ? `Applied ${applied.join(", ")} to schema ${config.DB_SCHEMA}` : "Database is up to date",
    );
  })
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
