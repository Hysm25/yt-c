import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";

declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken?: string;
    error?: string;
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

const GOOGLE_CLIENT_ID =
  process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET =
  process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || "";

export const isGoogleAuthConfigured = Boolean(
  GOOGLE_CLIENT_ID.trim() && GOOGLE_CLIENT_SECRET.trim()
);

const GOOGLE_AUTH_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/youtube.force-ssl",
].join(" ");

async function refreshAccessToken(token: Record<string, any>) {
  try {
    if (!isGoogleAuthConfigured) {
      throw new Error("Google OAuth credentials are not configured.");
    }

    const url = "https://oauth2.googleapis.com/token";
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken as string,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error("Error refreshing Google OAuth access token:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: isGoogleAuthConfigured
    ? [
        Google({
          clientId: GOOGLE_CLIENT_ID,
          clientSecret: GOOGLE_CLIENT_SECRET,
          authorization: {
            params: {
              scope: GOOGLE_AUTH_SCOPES,
              access_type: "offline",
              prompt: "consent",
              response_type: "code",
            },
          },
        }),
      ]
    : [],
  callbacks: {
    async jwt({ token, account, user }) {
      // Initial sign-in
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : Date.now() + 3600 * 1000,
          user,
        };
      }

      // If token is still valid (with 5-minute safety buffer)
      if (token.accessTokenExpires && Date.now() < (token.accessTokenExpires as number) - 300000) {
        return token;
      }

      // Access token has expired, refresh it
      if (token.refreshToken) {
        return refreshAccessToken(token);
      }

      return token;
    },
    async session({ session, token }) {
      if (token.user) {
        session.user = token.user as any;
      }
      session.accessToken = token.accessToken as string | undefined;
      session.error = token.error as string | undefined;
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET || "fallback-secret-for-development-mode-only-minimum-32-chars",
});
