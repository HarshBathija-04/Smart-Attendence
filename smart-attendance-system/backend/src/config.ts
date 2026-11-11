import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5128),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DB_SCHEMA: z
    .string()
    .regex(/^[a-z_][a-z0-9_]{0,62}$/, "DB_SCHEMA must be a lowercase SQL identifier")
    .default("smart_attendance"),
  JWT_SECRET: z.string().optional(),
  FRONTEND_URL: z.string().default("http://localhost:5214"),
  FACE_SERVICE_URL: z.string().default("http://localhost:5129"),
  FACE_SERVICE_TOKEN: z.string().default(""),
  FACE_MATCH_THRESHOLD: z.coerce.number().min(0).max(1).default(0.363),
  APP_TIMEZONE: z.string().default("Asia/Kolkata"),
  GROQ_API_KEY: z.string().default(""),
  GROQ_MODEL: z.string().default("openai/gpt-oss-120b"),
  SEED_DEMO_DATA: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  DEMO_PASSWORD: z.string().min(8).default("demo1234"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment:", z.flattenError(parsed.error).fieldErrors);
  process.exit(1);
}
const env = parsed.data;

if (!env.JWT_SECRET && env.NODE_ENV === "production") {
  console.error("JWT_SECRET is required in production");
  process.exit(1);
}

export const config = {
  ...env,
  isProd: env.NODE_ENV === "production",
  JWT_SECRET: env.JWT_SECRET ?? "dev-only-insecure-secret",
  allowedOrigins: env.FRONTEND_URL.split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean),
};
