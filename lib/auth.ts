import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { timingSafeEqual } from "crypto";

export const COOKIE = "sa_admin";
const MAX_AGE = 60 * 60 * 24 * 7;

function secret() {
  const s = process.env.AUTH_SECRET || "";
  if (s.length < 16) throw new Error("AUTH_SECRET must be set (16+ characters)");
  return new TextEncoder().encode(s);
}

function safeEqual(a: string, b: string) {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  if (A.length !== B.length) {
    timingSafeEqual(A, A);
    return false;
  }
  return timingSafeEqual(A, B);
}

export function checkCredentials(email: string, password: string): boolean {
  const e = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const p = process.env.ADMIN_PASSWORD || "";
  if (!e || !p) return false;
  const okE = safeEqual(email.trim().toLowerCase(), e);
  const okP = safeEqual(password, p);
  return okE && okP;
}

// Best-effort login throttle (in-memory: per server instance, not global)
const attempts = new Map<string, { n: number; t: number }>();
export function loginAllowed(key: string) {
  const now = Date.now();
  const a = attempts.get(key);
  if (!a || now - a.t > 15 * 60 * 1000) return true;
  return a.n < 8;
}
export function loginFailed(key: string) {
  const now = Date.now();
  const a = attempts.get(key);
  if (!a || now - a.t > 15 * 60 * 1000) attempts.set(key, { n: 1, t: now });
  else a.n += 1;
}
export function loginOk(key: string) {
  attempts.delete(key);
}

export async function createSession(email: string) {
  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE
  });
}

export function destroySession() {
  cookies().delete(COOKIE);
}

export async function getSession(): Promise<{ email: string } | null> {
  const t = cookies().get(COOKIE)?.value;
  if (!t) return null;
  try {
    const { payload } = await jwtVerify(t, secret());
    return { email: String(payload.email || "") };
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const s = await getSession();
  if (!s) throw new Error("UNAUTHORIZED");
  return s;
}
