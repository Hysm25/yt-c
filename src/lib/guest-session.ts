import crypto from "crypto";

export const GUEST_COOKIE_NAME = "yt_guest_id";

/**
 * Resolves or generates an isolated visitor/guest ID.
 * When a visitor has a 'yt_guest_id' cookie, their data (history, playlists,
 * likes, settings, subscriptions) is isolated to their specific browser session.
 */
export function getGuestUserId(request?: Request): string {
  if (request) {
    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = cookieHeader.split(";").map((c) => c.trim());
    for (const cookie of cookies) {
      if (cookie.startsWith(`${GUEST_COOKIE_NAME}=`)) {
        const val = cookie.substring(GUEST_COOKIE_NAME.length + 1);
        if (val && /^[a-zA-Z0-9_\-]+$/.test(val)) {
          return val;
        }
      }
    }
  }

  // Fallback guest identifier for requests without cookie
  return "guest_default";
}

/**
 * Generate a new random guest user ID
 */
export function generateGuestUserId(): string {
  return `guest_${crypto.randomUUID().replace(/-/g, "")}`;
}

/**
 * Helper to ensure a response includes the guest cookie if missing
 */
export function attachGuestCookieIfMissing(
  response: Response,
  existingUserId?: string
): Response {
  if (!existingUserId || existingUserId === "guest_default") {
    const newId = generateGuestUserId();
    response.headers.append(
      "Set-Cookie",
      `${GUEST_COOKIE_NAME}=${newId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 365}`
    );
  }
  return response;
}
