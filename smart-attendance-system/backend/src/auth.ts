import bcrypt from "bcryptjs";
import { Router, type RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { config } from "./config";
import { query } from "./db";
import { AppError } from "./errors";

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const [scheme, token] = (req.headers.authorization ?? "").split(" ");
  if (scheme !== "Bearer" || !token) throw new AppError(401, "Authentication required");
  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as jwt.JwtPayload & AuthUser;
    req.user = { id: payload.sub!, username: payload.username, fullName: payload.fullName };
  } catch {
    throw new AppError(401, "Session expired, please sign in again");
  }
  next();
};

const loginSchema = z.object({
  username: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(128),
});

const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const { username, password } = loginSchema.parse(req.body);
  const [user] = await query<{ id: string; username: string; full_name: string; password_hash: string }>(
    "SELECT id, username, full_name, password_hash FROM users WHERE username = $1",
    [username.toLowerCase()],
  );
  // Compare against a dummy hash when the user is missing to keep timing uniform.
  const ok = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !ok) throw new AppError(401, "Invalid username or password");

  const profile: AuthUser = { id: user.id, username: user.username, fullName: user.full_name };
  const token = jwt.sign({ username: profile.username, fullName: profile.fullName }, config.JWT_SECRET, {
    subject: profile.id,
    expiresIn: "12h",
  });
  res.json({ token, user: profile });
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});
