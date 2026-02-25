// ============================================================
// 셈마루(SemMaru) - Edge 호환 Firebase JWT 검증
// firebase-admin 대신 Web Crypto API 사용
// ============================================================

interface DecodedToken {
  uid: string;
  email?: string;
  name?: string;
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  sub: string;
}

interface GooglePublicKey {
  keys: {
    kid: string;
    n: string;
    e: string;
    kty: string;
    alg: string;
    use: string;
  }[];
}

// 공개키 캐시 (5분)
let cachedKeys: GooglePublicKey | null = null;
let cacheExpiry = 0;

const GOOGLE_CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/jwk/securetoken@system.gserviceaccount.com";

async function getGooglePublicKeys(): Promise<GooglePublicKey> {
  const now = Date.now();
  if (cachedKeys && now < cacheExpiry) {
    return cachedKeys;
  }

  const response = await fetch(GOOGLE_CERTS_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch Google public keys: ${response.status}`);
  }

  cachedKeys = (await response.json()) as GooglePublicKey;
  // Cache for 5 minutes
  cacheExpiry = now + 5 * 60 * 1000;
  return cachedKeys;
}

function base64UrlDecode(str: string): Uint8Array {
  // Replace URL-safe chars
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  // Pad with '='
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function decodeJwtPayload(token: string): DecodedToken {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }
  const payload = JSON.parse(
    new TextDecoder().decode(base64UrlDecode(parts[1])),
  );
  return payload;
}

function getJwtHeader(token: string): { kid: string; alg: string } {
  const parts = token.split(".");
  return JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[0])));
}

export async function verifyFirebaseToken(
  token: string,
  projectId?: string,
): Promise<DecodedToken> {
  const firebaseProjectId =
    projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!firebaseProjectId) {
    throw new Error("Firebase project ID not configured");
  }

  // 1. Decode header to get kid
  const header = getJwtHeader(token);
  if (header.alg !== "RS256") {
    throw new Error(`Unsupported algorithm: ${header.alg}`);
  }

  // 2. Fetch Google public keys
  const publicKeys = await getGooglePublicKeys();
  const keyData = publicKeys.keys.find((k) => k.kid === header.kid);
  if (!keyData) {
    // Clear cache and retry once
    cachedKeys = null;
    const freshKeys = await getGooglePublicKeys();
    const freshKeyData = freshKeys.keys.find((k) => k.kid === header.kid);
    if (!freshKeyData) {
      throw new Error("No matching public key found for kid: " + header.kid);
    }
    return verifyWithKey(token, freshKeyData, firebaseProjectId);
  }

  return verifyWithKey(token, keyData, firebaseProjectId);
}

async function verifyWithKey(
  token: string,
  keyData: GooglePublicKey["keys"][0],
  projectId: string,
): Promise<DecodedToken> {
  // 3. Import the public key
  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    {
      kty: keyData.kty,
      n: keyData.n,
      e: keyData.e,
      alg: "RS256",
      ext: true,
    },
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );

  // 4. Verify signature
  const parts = token.split(".");
  const signatureInput = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const signature = base64UrlDecode(parts[2]);

  const isValid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    signature.buffer as ArrayBuffer,
    signatureInput,
  );

  if (!isValid) {
    throw new Error("Invalid token signature");
  }

  // 5. Decode and validate claims
  const payload = decodeJwtPayload(token);
  const now = Math.floor(Date.now() / 1000);

  // Check expiration
  if (payload.exp < now) {
    throw new Error("Token expired");
  }

  // Check issued at
  if (payload.iat > now + 300) {
    // 5 minute clock skew tolerance
    throw new Error("Token issued in the future");
  }

  // Check issuer
  const expectedIssuer = `https://securetoken.google.com/${projectId}`;
  if (payload.iss !== expectedIssuer) {
    throw new Error(
      `Invalid issuer: expected ${expectedIssuer}, got ${payload.iss}`,
    );
  }

  // Check audience
  if (payload.aud !== projectId) {
    throw new Error(
      `Invalid audience: expected ${projectId}, got ${payload.aud}`,
    );
  }

  // Check sub (must be non-empty and match uid)
  if (!payload.sub || typeof payload.sub !== "string") {
    throw new Error("Invalid sub claim");
  }

  payload.uid = payload.sub;

  return payload;
}

// Helper: extract token from Authorization header
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}
