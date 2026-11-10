"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, Settings, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const isConfigurationError =
    error === "Configuration" ||
    error === "OAuthNotConfigured" ||
    error === "MissingSecret";

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mb-4">
            <ShieldAlert className="h-7 w-7" />
          </div>

          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {isConfigurationError
              ? "Google OAuth Configuration Notice"
              : "Authentication Error"}
          </h1>

          <p className="text-xs text-muted-foreground pt-2 pb-4 leading-relaxed">
            {isConfigurationError
              ? "Google OAuth credentials (AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET) are not configured in your environment. To authenticate with Google, configure your environment variables."
              : `An authentication error occurred: ${error || "Unknown error"}`}
          </p>

          {isConfigurationError && (
            <div className="w-full rounded-xl bg-secondary/50 p-3.5 text-left text-xs border border-border mb-4 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Guest Mode is Active</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-normal">
                You can browse videos, search, and save watch history and playlists locally without Google OAuth.
              </p>
              <div className="rounded bg-black/40 p-2 font-mono text-[10px] text-zinc-300 space-y-0.5">
                <div># Required in .env.local to enable Google login:</div>
                <div className="text-amber-300">AUTH_GOOGLE_ID=your_client_id</div>
                <div className="text-amber-300">AUTH_GOOGLE_SECRET=your_client_secret</div>
              </div>
            </div>
          )}

          <div className="flex w-full flex-col sm:flex-row gap-2 pt-2">
            <Button asChild variant="default" size="sm" className="flex-1 gap-1.5">
              <Link href="/settings">
                <Settings className="h-3.5 w-3.5" />
                <span>Configure in Settings</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="flex-1 gap-1.5">
              <Link href="/">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Continue as Guest</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-muted-foreground">
          Loading authentication status...
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}
