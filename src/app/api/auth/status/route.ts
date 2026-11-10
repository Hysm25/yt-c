import { NextResponse } from "next/server";
import { isGoogleAuthConfigured } from "@/lib/auth";

export async function GET() {
  const missing: string[] = [];

  const clientId =
    process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret =
    process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || clientId.trim() === "") {
    missing.push("AUTH_GOOGLE_ID (or GOOGLE_CLIENT_ID)");
  }
  if (!clientSecret || clientSecret.trim() === "") {
    missing.push("AUTH_GOOGLE_SECRET (or GOOGLE_CLIENT_SECRET)");
  }

  return NextResponse.json({
    configured: isGoogleAuthConfigured,
    provider: "google",
    missing,
    instructions: {
      step1: "Create a project in Google Cloud Console (https://console.cloud.google.com).",
      step2: "Enable 'YouTube Data API v3' in APIs & Services.",
      step3: "Configure OAuth Consent Screen with scopes: openid, email, profile, youtube.readonly, youtube.force-ssl.",
      step4: "Create Credentials -> OAuth 2.0 Client ID (Web Application).",
      step5: "Set Authorized Redirect URI to: http://localhost:3000/api/auth/callback/google",
      step6: "Set AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET in your .env.local file.",
    },
  });
}
