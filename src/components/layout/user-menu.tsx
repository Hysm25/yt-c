"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  User,
  LogOut,
  Sliders,
  History,
  ListVideo,
  ThumbsUp,
  ShieldCheck,
  CheckCircle2,
  Tv,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

export function UserMenu() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [authStatus, setAuthStatus] = useState<{
    configured: boolean;
    missing?: string[];
  }>({ configured: false });
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Check auth configuration status
  useEffect(() => {
    fetch("/api/auth/status")
      .then((res) => res.json())
      .then((data) => {
        setAuthStatus({
          configured: Boolean(data.configured),
          missing: data.missing || [],
        });
      })
      .catch(() => {});

    // Allow other components (e.g., Sidebar, Subscriptions, Comments) to trigger Sign-In
    const handleOpenSignIn = () => {
      handleSignIn();
    };
    window.addEventListener("trigger-google-signin", handleOpenSignIn);
    return () => {
      window.removeEventListener("trigger-google-signin", handleOpenSignIn);
    };
  }, []);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignIn = async () => {
    if (!authStatus.configured) {
      // Show clear setup guidance modal if credentials are missing
      setIsSignInModalOpen(true);
      return;
    }
    try {
      await signIn("google");
    } catch (err) {
      console.warn("Google Sign-in error:", err);
    }
  };

  const handleSignOut = async () => {
    setIsOpen(false);
    try {
      await signOut();
    } catch (err) {
      console.warn("Sign-out error:", err);
    }
  };

  if (status === "loading") {
    return (
      <div className="h-8 w-8 rounded-full bg-secondary animate-pulse" />
    );
  }

  // Authenticated State
  if (session?.user) {
    return (
      <div ref={menuRef} className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center rounded-full ring-2 ring-transparent hover:ring-primary/40 focus:outline-none transition-all"
          title={session.user.name || "Your Account"}
        >
          <Avatar
            src={session.user.image || undefined}
            alt={session.user.name || "User"}
            fallback={session.user.name || "U"}
            size="sm"
          />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-11 z-50 w-64 rounded-2xl border border-border bg-popover/95 p-3 text-popover-foreground shadow-2xl backdrop-blur-md">
            {/* User Profile Header */}
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <Avatar
                src={session.user.image || undefined}
                alt={session.user.name || "User"}
                fallback={session.user.name || "U"}
                size="md"
              />
              <div className="flex flex-col overflow-hidden">
                <span className="font-semibold text-sm truncate">
                  {session.user.name || "YouTube User"}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {session.user.email}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-green-500 font-medium pt-0.5">
                  <ShieldCheck className="h-3 w-3" />
                  Google Connected
                </span>
              </div>
            </div>

            {/* Menu Links */}
            <div className="flex flex-col gap-1 py-2 border-b border-border text-xs font-medium">
              <Link
                href="/subscriptions"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-accent transition-colors"
              >
                <Tv className="h-4 w-4 text-muted-foreground" />
                <span>Subscriptions</span>
              </Link>
              <Link
                href="/history"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-accent transition-colors"
              >
                <History className="h-4 w-4 text-muted-foreground" />
                <span>Watch History</span>
              </Link>
              <Link
                href="/playlists"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-accent transition-colors"
              >
                <ListVideo className="h-4 w-4 text-muted-foreground" />
                <span>Your Playlists</span>
              </Link>
              <Link
                href="/liked"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-accent transition-colors"
              >
                <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                <span>Liked Videos</span>
              </Link>
              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-accent transition-colors"
              >
                <Sliders className="h-4 w-4 text-muted-foreground" />
                <span>Settings</span>
              </Link>
            </div>

            {/* Sign Out Button */}
            <div className="pt-2">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Unauthenticated / Guest State - Prominent YouTube-Style Sign In Button
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSignIn}
        className="rounded-full border-blue-500/80 text-blue-500 hover:bg-blue-500/10 hover:border-blue-500 font-semibold px-3 py-1 text-xs flex items-center gap-1.5 transition-all shrink-0"
      >
        <User className="h-3.5 w-3.5" />
        <span>Sign In</span>
      </Button>

      {/* Sign In & Account Dialog Modal (Setup Guidance if credentials missing) */}
      {isSignInModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF0000]/10 text-[#FF0000] mb-3">
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6 fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold">Sign In with Google</h3>
              <p className="text-xs text-muted-foreground pt-1.5 pb-5 leading-relaxed">
                Connect your real Google account to access your live YouTube subscriptions, playlists, and synced history.
              </p>

              {/* Google Sign In Button or Missing Config Notice */}
              {authStatus.configured ? (
                <Button
                  variant="default"
                  size="default"
                  onClick={handleSignIn}
                  className="w-full gap-2.5 font-medium mb-3"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </Button>
              ) : (
                <div className="w-full rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-left mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-500 pb-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Google OAuth Setup Required</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
                    Google OAuth credentials are not configured in your environment. Add these variables to enable Google sign-in:
                  </p>
                  <div className="rounded bg-black/40 p-2 font-mono text-[10px] text-zinc-300 space-y-1">
                    <div># Add to .env.local:</div>
                    <div className="text-amber-300">AUTH_GOOGLE_ID=your_client_id</div>
                    <div className="text-amber-300">AUTH_GOOGLE_SECRET=your_client_secret</div>
                  </div>
                  <div className="pt-2 text-[10px] text-muted-foreground">
                    Authorized redirect URI:
                    <span className="block font-mono text-foreground pt-0.5 select-all">
                      http://localhost:3000/api/auth/callback/google
                    </span>
                  </div>
                </div>
              )}

              {/* Guest Mode Explainer */}
              <div className="w-full rounded-xl bg-secondary/50 p-3 text-left border border-border/60 text-xs mb-4">
                <div className="flex items-center gap-1.5 font-semibold text-foreground pb-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  <span>Guest Mode is Active</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  Your watch history, custom playlists, and liked videos are saved locally in your embedded PostgreSQL database.
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSignInModalOpen(false)}
                className="w-full text-xs text-muted-foreground"
              >
                Continue as Guest
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
