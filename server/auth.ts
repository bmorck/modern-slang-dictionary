import { type Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { db } from "@db";
import { moderators } from "@db/schema";
import { eq } from "drizzle-orm";

const SALT_ROUNDS = 10;

declare module "express-session" {
  interface SessionData {
    moderatorId?: number;
  }
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string) {
  return bcrypt.compare(password, hashedPassword);
}

// Test function to generate a hash for a known password
export async function generateTestHash() {
  const testPassword = "admin123";
  const hashedPassword = await hashPassword(testPassword);
  console.log(`Test hash generated for '${testPassword}':`, hashedPassword);
  return hashedPassword;
}

export function requireModerator(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.session.moderatorId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export async function authenticateModerator(
  username: string,
  password: string,
) {
  const moderator = await db.query.moderators.findFirst({
    where: eq(moderators.username, username),
  });

  if (!moderator) {
    return null;
  }

  const isValid = await verifyPassword(password, moderator.passwordHash);
  return isValid ? moderator : null;
}