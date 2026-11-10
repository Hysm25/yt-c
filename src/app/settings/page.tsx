"use client";

import React, { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  Sliders,
  Film,
  Tv,
  Key,
  Palette,
  Trash2,
  Check,
  Download,
  User,
  ShieldCheck,
  LogOut,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useTheme } from "@/components/providers/theme-provider";

export default function SettingsPage() {
  const { data: session, status: authStatus } = useSession();
  const { theme, setTheme } = useTheme();

  const [provider, setProvider] = useState<"html5" | "embed">("html5");
  const [apiKey, setApiKey] = useState("");
  const [autoplay, setAutoplay] = useState(true);
  const [quality, setQuality] = useState("auto");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setProvider(data.settings.defaultPlaybackProvider || "html5");
          setAutoplay(data.settings.autoplay !== false);
          setQuality(data.settings.defaultQuality || "auto");
          setApiKey(data.settings.customApiKey || "");
        }
      })
      .catch((err) => console.warn("Failed to load settings:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem("yt-playback-provider", provider);
      window.dispatchEvent(
        new CustomEvent("yt-playback-provider-changed", { detail: provider })
      );

      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultPlaybackProvider: provider,
          autoplay,
          defaultQuality: quality,
          customApiKey: apiKey.trim() || null,
        }),
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.warn("Failed to save settings:", err);
    }
  };

  const handleClearHistory = async () => {
    if (confirm("Are you sure you want to clear your local watch history?")) {
      await fetch("/api/history", { method: "DELETE" });
      alert("Watch history cleared successfully!");
    }
  };

  const handleExportData = async () => {
    try {
      const [histRes, plRes, likedRes] = await Promise.all([
        fetch("/api/history").then((r) => r.json()),
        fetch("/api/playlists").then((r) => r.json()),
        fetch("/api/liked").then((r) => r.json()),
      ]);

      const backup = {
        exportedAt: new Date().toISOString(),
        history: histRes.history || [],
        playlists: plRes.playlists || [],
        liked: likedRes.liked || [],
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `youtube-client-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn("Export failed:", err);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto p-2 sm:p-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 border-b pb-4">
        <Sliders className="h-6 w-6 text-red-500" />
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          Settings & Preferences
        </h1>
      </div>

      {/* Account & Authentication Card */}
      <div className="flex flex-col gap-3 rounded-2xl border bg-secondary/30 p-5">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-red-500" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Account & Authentication
          </h2>
        </div>

        {session?.user ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-3">
              <Avatar
                src={session.user.image || undefined}
                alt={session.user.name || "User"}
                fallback={session.user.name || "U"}
                size="lg"
              />
              <div className="flex flex-col">
                <span className="font-semibold text-sm">
                  {session.user.name || "Connected User"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {session.user.email}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-green-500 font-medium pt-0.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Google OAuth Active (YouTube Scopes Granted)
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => signOut()}
              className="gap-1.5 text-xs text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-foreground">
                Guest Mode (Local Persistence)
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
                You are currently browsing as a Guest. Your watch history, playlists, and liked videos are saved to your local PostgreSQL database. Connect your Google account to sync live YouTube subscriptions and playlists.
              </p>
            </div>

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => signIn("google")}
              className="gap-2 text-xs font-semibold shrink-0"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign in with Google</span>
            </Button>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Playback Provider Section */}
        <div className="flex flex-col gap-3 rounded-2xl border bg-secondary/30 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Default Playback Engine
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Choose your preferred video player. The HTML5 engine uses native custom player controls,
            while the YouTube Embed engine guarantees 100% video compatibility with no signature cipher restrictions.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* HTML5 Option */}
            <div
              onClick={() => setProvider("html5")}
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                provider === "html5"
                  ? "border-red-500 bg-red-500/10"
                  : "border-border hover:bg-secondary/60"
              }`}
            >
              <Film className="h-5 w-5 text-red-500 mt-0.5" />
              <div className="flex flex-col">
                <span className="font-semibold text-sm">HTML5 Video Player</span>
                <span className="text-xs text-muted-foreground pt-0.5">
                  Custom timeline scrubber, speed controls, hotkeys & picture-in-picture.
                </span>
              </div>
            </div>

            {/* Embed Option */}
            <div
              onClick={() => setProvider("embed")}
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                provider === "embed"
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-border hover:bg-secondary/60"
              }`}
            >
              <Tv className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="flex flex-col">
                <span className="font-semibold text-sm">Official YouTube Embed</span>
                <span className="text-xs text-muted-foreground pt-0.5">
                  Official player embed with 100% playback fidelity for all video types.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* API Key Configuration */}
        <div className="flex flex-col gap-3 rounded-2xl border bg-secondary/30 p-5">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Google Cloud API Key (Optional)
            </h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Provide your personal YouTube Data API v3 key to query live data directly from Google Cloud.
            If left blank or if quota is depleted, the client runs on its built-in offline/demo provider.
          </p>

          <input
            type="text"
            placeholder="AIzaSy..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="rounded-lg border bg-secondary/50 px-3.5 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Appearance & Themes */}
        <div className="flex flex-col gap-3 rounded-2xl border bg-secondary/30 p-5">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-purple-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Appearance
            </h2>
          </div>

          <div className="flex items-center gap-2 pt-1">
            {(["dark", "light", "system"] as const).map((t) => (
              <Button
                key={t}
                type="button"
                variant={theme === t ? "default" : "secondary"}
                size="sm"
                onClick={() => setTheme(t)}
                className="capitalize text-xs font-medium"
              >
                {t}
              </Button>
            ))}
          </div>
        </div>

        {/* Data Management & Export */}
        <div className="flex flex-col gap-3 rounded-2xl border bg-secondary/30 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Data Management
          </h2>
          <p className="text-xs text-muted-foreground">
            Manage your local watch history, custom playlists, and liked videos database.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportData}
              className="gap-1.5 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Client Backup</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearHistory}
              className="gap-1.5 text-xs text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Local History</span>
            </Button>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-between border-t pt-4">
          {savedSuccess ? (
            <div className="flex items-center gap-1.5 text-xs font-medium text-green-500">
              <Check className="h-4 w-4" />
              <span>Preferences saved successfully!</span>
            </div>
          ) : (
            <div />
          )}

          <Button type="submit" variant="youtube" size="default" className="font-semibold">
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
