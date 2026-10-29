import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "model_studio_session";
export const SESSION_SECONDS = 8 * 60 * 60;

function sign(expiry, secret) {
  return createHmac("sha256", secret).update(expiry).digest("base64url");
}

export function createSession(secret, now = Date.now()) {
  const expiry = String(Math.floor(now / 1000) + SESSION_SECONDS);
  return `${expiry}.${sign(expiry, secret)}`;
}

export async function verifySession(token, secret, now = Date.now()) {
  if (typeof token !== "string" || !secret || secret.length < 32) return false;
  const [expiry, signature, extra] = token.split(".");
  if (!expiry || !signature || extra || !/^\d{10,12}$/.test(expiry)) return false;
  if (Number(expiry) <= Math.floor(now / 1000)) return false;

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const normalized = signature.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
    return await crypto.subtle.verify("HMAC", key, bytes, new TextEncoder().encode(expiry));
  } catch {
    return false;
  }
}

function sameSecret(received, expected) {
  if (typeof received !== "string" || !expected) return false;
  const receivedBytes = Buffer.from(received);
  const expectedBytes = Buffer.from(expected);
  return receivedBytes.length === expectedBytes.length && timingSafeEqual(receivedBytes, expectedBytes);
}

function isSameOrigin(request) {
  const origin = request.headers.origin;
  const forwardedHost = request.headers["x-forwarded-host"];
  const host = (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost) || request.headers.host;
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === String(host).split(",")[0].trim();
  } catch {
    return false;
  }
}

export default async function authHandler(request, response) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Pragma", "no-cache");

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({ error: "Method not allowed." });
    return;
  }
  if (!isSameOrigin(request)) {
    response.status(403).json({ error: "This request is not allowed." });
    return;
  }

  const action = request.body?.action;
  if (action === "logout") {
    response.setHeader("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
    response.status(200).json({ ok: true });
    return;
  }

  const secret = process.env.MODEL_STUDIO_SESSION_SECRET;
  const password = process.env.MODEL_STUDIO_PASSWORD;
  if (!secret || secret.length < 32 || !password || password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    response.status(503).json({ error: "Model Studio login is not configured. Set its Vercel environment variables and use a password of at least 8 characters with at least one letter and one number." });
    return;
  }

  if (action !== "login" || !sameSecret(request.body?.password, password)) {
    response.status(401).json({ error: "The password is incorrect." });
    return;
  }

  const token = createSession(secret);
  response.setHeader("Set-Cookie", `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}`);
  response.status(200).json({ ok: true });
}
