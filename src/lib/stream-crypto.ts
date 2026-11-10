import crypto from "crypto";

// Ephemeral server secret generated on boot if not explicitly configured in environment
const PROXY_SECRET =
  process.env.STREAM_PROXY_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  crypto.randomBytes(32).toString("hex");

// Approved domain patterns for media streaming proxy
const ALLOWED_HOST_PATTERNS = [
  /^([a-z0-9\-]+\.)*googlevideo\.com$/i,
  /^([a-z0-9\-]+\.)*archive\.org$/i,
  /^([a-z0-9\-]+\.)*w3schools\.com$/i,
  /^([a-z0-9\-]+\.)*mozilla\.net$/i,
  /^([a-z0-9\-]+\.)*wikimedia\.org$/i,
];

/**
 * Validate that an upstream media URL belongs to an approved media host
 * and does not point to internal, private, or loopback network addresses.
 */
export function isAllowedMediaHost(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);

    // Only allow http/https protocols
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block localhost, loopbacks, and private IP ranges
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("169.254.") || // Cloud metadata IP
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
    ) {
      return false;
    }

    // Check against allowed host patterns
    return ALLOWED_HOST_PATTERNS.some((pattern) => pattern.test(hostname));
  } catch {
    return false;
  }
}

/**
 * Generate a signed proxy URL with expiration
 */
export function signProxyUrl(upstreamUrl: string, expiresInSeconds = 7200): string {
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const hmac = crypto.createHmac("sha256", PROXY_SECRET);
  hmac.update(`${upstreamUrl}:${exp}`);
  const sig = hmac.digest("hex");

  return `/api/stream/proxy?url=${encodeURIComponent(
    upstreamUrl
  )}&exp=${exp}&sig=${sig}`;
}

/**
 * Verify a signed proxy URL and its expiration
 */
export function verifyProxyUrl(
  upstreamUrl: string,
  expStr: string | null,
  sig: string | null
): boolean {
  if (!upstreamUrl || !expStr || !sig) return false;

  const exp = parseInt(expStr, 10);
  if (isNaN(exp) || exp < Math.floor(Date.now() / 1000)) {
    return false; // Expired
  }

  if (!isAllowedMediaHost(upstreamUrl)) {
    return false; // Disallowed host
  }

  const hmac = crypto.createHmac("sha256", PROXY_SECRET);
  hmac.update(`${upstreamUrl}:${exp}`);
  const expectedSig = hmac.digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(sig, "hex"),
      Buffer.from(expectedSig, "hex")
    );
  } catch {
    return false;
  }
}
