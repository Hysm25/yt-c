"use client";

import React, { useState, useEffect } from "react";
import {
  Sliders,
  Film,
  Tv,
  Key,
  Palette,
  Trash2,
  Check,
  User,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useTheme } from "@/components/providers/theme-provider";

export default function SettingsPage() {
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

      localStorage.setItem("yt-playback-provider", provider);
      window.dispatchEvent(
        new CustomEvent("yt-playback-provider-changed", { detail: provider })
      );

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Save settings error:", err);
    }
  };

  const handleClearHistory = async () => {
    if (confirm("Are you sure you want to clear your entire watch history?")) {
      await fetch("/api/history", { method: "DELETE" });
      alert("Watch history cleared.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-sm text-muted-foreground animate-pulse">
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto p-4 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          Settings & Preferences
        </h1>
      </div>

      {/* Guest Mode Profile Card */}
      <div className="flex flex-col gap-3 rounded-2xl border bg-secondary/30 p-5">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-red-500" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Guest Profile & Data Isolation
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-3">
            <Avatar fallback="G" size="lg" />
            <div className="flex flex-col">
              <span className="font-semibold text-sm">Guest Account</span>
              <span className="text-xs text-muted-foreground">
                Standalone / No Account Required
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-green-500 font-medium pt-0.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Local Persistence Active (History, Playlists, Liked Videos, Subscriptions)
              </span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Playback Provider Section */}
        <div className="flex flex-col gap-3 rounded-2xl border bg-secondary/30 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Default Playback Engine
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Choose your preferred video player. The Native HTML5 engine uses the browser&apos;s standard player controls,
            while the YouTube Embed engine provides an official fallback for cipher-restricted streams.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* HTML5 Option */}
            <div
              onClick={() => setProvider("html5")}
              className={`cursor-pointer rounded-xl border p-4 flex flex-col gap-2 transition-all ${
                provider === "html5"
                  ? "border-red-500 bg-red-500/10 shadow-xs"
                  : "hover:bg-secondary/50 border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <Film className="h-4 w-4 text-blue-500" />
                  <span>Native HTML5 Player (Default)</span>
                </div>
                {provider === "html5" && (
                  <Check className="h-4 w-4 text-red-500" />
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Uses the browser&apos;s native &lt;video controls&gt; element for direct media playback.
              </p>
            </div>

            {/* Embed Option */}
            <div
              onClick={() => setProvider("embed")}
              className={`cursor-pointer rounded-xl border p-4 flex flex-col gap-2 transition-all ${
                provider === "embed"
                  ? "border-red-500 bg-red-500/10 shadow-xs"
                  : "hover:bg-secondary/50 border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <Tv className="h-4 w-4 text-red-500" />
                  <span>Official YouTube Player</span>
                </div>
                {provider === "embed" && (
                  <Check className="h-4 w-4 text-red-500" />
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Official YouTube player iframe ensuring 100% video and audio compatibility.
              </p>
            </div>
          </div>
        </div>

        {/* Playback Preferences */}
        <div className="flex flex-col gap-4 rounded-2xl border bg-secondary/30 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Playback Preferences
          </h2>

          <div className="flex items-center justify-between py-2 border-b">
            <div>
              <div className="text-xs font-semibold">Autoplay Next Video</div>
              <div className="text-[11px] text-muted-foreground">
                Automatically play the next video in search results or playlists
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoplay}
              onChange={(e) => setAutoplay(e.target.checked)}
              className="h-4 w-4 rounded accent-red-600 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-xs font-semibold">Preferred Quality</div>
              <div className="text-[11px] text-muted-foreground">
                Select your preferred initial resolution
              </div>
            </div>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              className="rounded-lg border bg-background px-3 py-1.5 text-xs text-foreground cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-red-500"
            >
              <option value="auto">Auto (Recommended)</option>
              <option value="1080p">1080p (Full HD)</option>
              <option value="720p">720p (HD)</option>
              <option value="480p">480p</option>
              <option value="360p">360p</option>
            </select>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="flex flex-col gap-3 rounded-2xl border bg-secondary/30 p-5">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-red-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Theme & Appearance
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2">
            {(["light", "dark", "system"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={`flex items-center justify-center py-2 px-3 rounded-xl border text-xs font-medium capitalize transition-all ${
                  theme === t
                    ? "border-red-500 bg-red-500/10 text-foreground font-semibold"
                    : "hover:bg-secondary border-border text-muted-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* YouTube API Key (Optional) */}
        <div className="flex flex-col gap-3 rounded-2xl border bg-secondary/30 p-5">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-red-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Custom YouTube Data API Key (Optional)
            </h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            By default, YouTube Web Client uses direct public YouTube web extraction. You can optionally supply your own Google Cloud API Key for fallback official quota.
          </p>
          <input
            type="password"
            placeholder="AIzaSy..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full rounded-xl border bg-background px-3 py-2 text-xs font-mono placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-red-500"
          />
        </div>

        {/* Data Management */}
        <div className="flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-destructive">
            Data Management
          </h2>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Clear your local watch history records
            </span>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleClearHistory}
              className="gap-1.5 text-xs font-medium"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear History</span>
            </Button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {savedSuccess && (
            <span className="flex items-center gap-1 text-xs text-green-500 font-medium">
              <Check className="h-3.5 w-3.5" />
              <span>Settings saved!</span>
            </span>
          )}
          <Button
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-white font-medium text-xs px-6"
          >
            Save Preferences
          </Button>
        </div>
      </form>
    </div>
  );
}
