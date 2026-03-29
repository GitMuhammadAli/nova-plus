import { cookies } from "next/headers";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";

const COOKIE_NAME = "novapulse-admin-session";
const SESSION_TTL = 8 * 60 * 60 * 1000; // 8 hours

function getSecret(): string {
  return process.env.ADMIN_SECRET || process.env.JWT_SECRET || "novapulse-admin-fallback-secret-key-32ch";
}

// ---- Password hashing with scrypt ----

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const derived = scryptSync(password, salt, 64);
  const hashBuffer = Buffer.from(hash, "hex");
  return timingSafeEqual(derived, hashBuffer);
}

// ---- HMAC-SHA256 session tokens ----

function createSessionToken(username: string): string {
  const payload = JSON.stringify({
    sub: username,
    iat: Date.now(),
    exp: Date.now() + SESSION_TTL,
    jti: randomBytes(8).toString("hex"),
  });
  const encoded = Buffer.from(payload).toString("base64url");
  const signature = createHmac("sha256", getSecret()).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

function verifySessionToken(token: string): { sub: string; exp: number } | null {
  try {
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature) return null;

    const expectedSig = createHmac("sha256", getSecret()).update(encoded).digest("base64url");
    if (signature !== expectedSig) return null;

    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString());
    if (payload.exp < Date.now()) return null;

    return payload;
  } catch {
    return null;
  }
}

// ---- Credential validation ----

export function validateCredentials(username: string, password: string): boolean {
  const adminUsername = process.env.ADMIN_USERNAME;
  if (username !== adminUsername) return false;

  // Try hashed password first
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (passwordHash) {
    return verifyPassword(password, passwordHash);
  }

  // Fall back to plain-text comparison
  const adminPassword = process.env.ADMIN_PASSWORD;
  return password === adminPassword;
}

// ---- Session management ----

export async function createAdminSession(username: string): Promise<string> {
  const token = createSessionToken(username);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL / 1000,
  });
  return token;
}

export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function hasValidAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const payload = verifySessionToken(token);
  return payload !== null;
}

export async function getAdminSessionUser(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifySessionToken(token);
  return payload?.sub ?? null;
}
