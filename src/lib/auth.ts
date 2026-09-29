// Admin Authentication Helper
// Works in both Node.js and Edge Runtime (Next.js Middleware)

const ADMIN_SECRET =
  process.env.ADMIN_SECRET ||
  (process.env.NODE_ENV === "production"
    ? (() => {
        console.warn("⚠️ CẢNH BÁO BẢO MẬT: ADMIN_SECRET chưa được cấu hình trong .env!");
        return "tiemchena_prod_secret_fallback_key_2026";
      })()
    : "tiemchena_dev_secret_key");

export const COOKIE_NAME = "tiemchena_admin_token";
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

// Helper to convert string to BufferSource for Web Crypto API
function textToBuffer(str: string): BufferSource {
  return new TextEncoder().encode(str) as unknown as BufferSource;
}

// Helper to convert ArrayBuffer to Hex string
function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

// Generate HMAC signature using Web Crypto API
async function signMessage(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    textToBuffer(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, textToBuffer(message));
  return bufferToHex(signature);
}

/**
 * Verify username and password strictly from environment variables
 * No credentials are hardcoded in the codebase
 */
export function verifyCredentials(username?: string, password?: string): boolean {
  if (!username || !password) return false;

  const configuredUsername = process.env.ADMIN_USERNAME;
  const configuredPassword = process.env.ADMIN_PASSWORD;

  if (!configuredUsername || !configuredPassword) {
    console.error("ADMIN_USERNAME hoặc ADMIN_PASSWORD chưa được cấu hình trong biến môi trường (.env)");
    return false;
  }

  const userMatch = username.trim().toLowerCase() === configuredUsername.trim().toLowerCase();
  const passMatch = password.trim() === configuredPassword.trim();

  return userMatch && passMatch;
}

/**
 * Create a signed admin session token: `${timestamp}.${username}.${signature}`
 */
export async function createSessionToken(username: string): Promise<string> {
  const timestamp = Date.now().toString();
  const payload = `${timestamp}:${username}`;
  const signature = await signMessage(payload, ADMIN_SECRET);
  return `${timestamp}.${username}.${signature}`;
}

/**
 * Verify admin session token
 */
export async function verifySessionToken(token?: string | null): Promise<boolean> {
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [timestampStr, username, providedSignature] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  // Check expiration (7 days)
  const now = Date.now();
  const maxAgeMs = SESSION_MAX_AGE * 1000;
  if (now - timestamp > maxAgeMs || timestamp > now + 60000) {
    return false; // Expired or future timestamp
  }

  // Verify signature
  const payload = `${timestampStr}:${username}`;
  const expectedSignature = await signMessage(payload, ADMIN_SECRET);

  return expectedSignature === providedSignature;
}
