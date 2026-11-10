"use client";

import React, { useState, useEffect } from "react";
import { HTML5Player } from "./html5-player";
import { EmbedPlayer } from "./embed-player";
import { Film, MonitorPlay, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  videoId: string;
  title?: string;
  channelTitle?: string;
  thumbnailUrl?: string;
  initialProgressSeconds?: number;
  onEnded?: () => void;
  onNextVideo?: () => void;
}

export function VideoPlayer({
  videoId,
  title,
  channelTitle,
  thumbnailUrl,
  initialProgressSeconds = 0,
  onEnded,
  onNextVideo,
}: VideoPlayerProps) {
  const [provider, setProvider] = useState<"embed" | "html5">("embed");

  // Sync provider preference from localStorage & listen for changes
  useEffect(() => {
    const saved = localStorage.getItem("yt-playback-provider") as
      | "embed"
      | "html5"
      | null;
    if (saved === "embed" || saved === "html5") {
      setProvider(saved);
    }

    const handleProviderChange = (e: any) => {
      if (e.detail === "embed" || e.detail === "html5") {
        setProvider(e.detail);
      }
    };

    window.addEventListener("yt-playback-provider-changed", handleProviderChange);
    return () =>
      window.removeEventListener("yt-playback-provider-changed", handleProviderChange);
  }, []);

  const handleSwitchProvider = (newProvider: "embed" | "html5") => {
    setProvider(newProvider);
    localStorage.setItem("yt-playback-provider", newProvider);
    window.dispatchEvent(
      new CustomEvent("yt-playback-provider-changed", { detail: newProvider })
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto mb-4 flex flex-col gap-2">
      {/* Player Engine Mode Bar */}
      <div className="flex items-center justify-between text-xs px-1">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Info className="h-3.5 w-3.5 text-red-500" />
          <span>
            {provider === "embed"
              ? "Official YouTube Player (100% video playback support)"
              : "Native HTML5 <video controls> Player"}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-secondary/60 p-0.5 rounded-lg border border-border">
          <button
            type="button"
            onClick={() => handleSwitchProvider("embed")}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors text-[11px] font-medium",
              provider === "embed"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MonitorPlay className="h-3 w-3 text-red-500" />
            <span>YouTube Player</span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchProvider("html5")}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors text-[11px] font-medium",
              provider === "html5"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Film className="h-3 w-3 text-blue-500" />
            <span>Native &lt;video&gt;</span>
          </button>
        </div>
      </div>

      {/* Active Video Player */}
      {provider === "html5" ? (
        <HTML5Player
          videoId={videoId}
          title={title}
          channelTitle={channelTitle}
          thumbnailUrl={thumbnailUrl}
          initialProgressSeconds={initialProgressSeconds}
          onEnded={onEnded}
          onSwitchToEmbed={() => handleSwitchProvider("embed")}
        />
      ) : (
        <EmbedPlayer
          videoId={videoId}
          title={title}
          channelTitle={channelTitle}
          initialProgressSeconds={initialProgressSeconds}
          onEnded={onEnded}
          onNextVideo={onNextVideo}
          onSwitchToHtml5={() => handleSwitchProvider("html5")}
        />
      )}
    </div>
  );
}
