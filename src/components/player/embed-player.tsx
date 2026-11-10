"use client";

import React, { useState } from "react";
import { Film, Check } from "lucide-react";
import { usePlayer } from "./player-context";
import { Button } from "@/components/ui/button";

interface EmbedPlayerProps {
  videoId: string;
  autoplay?: boolean;
  initialProgressSeconds?: number;
}

export function EmbedPlayer({
  videoId,
  autoplay = true,
  initialProgressSeconds = 0,
}: EmbedPlayerProps) {
  const { setActiveProvider } = usePlayer();
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Build privacy-enhanced YouTube embed URL
  const embedUrl = new URL(
    `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`
  );
  if (autoplay) embedUrl.searchParams.set("autoplay", "1");
  embedUrl.searchParams.set("rel", "0");
  embedUrl.searchParams.set("modestbranding", "1");
  embedUrl.searchParams.set("playsinline", "1");
  if (initialProgressSeconds > 0) {
    embedUrl.searchParams.set("start", Math.floor(initialProgressSeconds).toString());
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-lg">
      {/* Switcher Badge Overlay */}
      <div className="absolute top-3 right-3 z-30">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setActiveProvider("html5")}
          title="Switch to HTML5 Video Player"
          className="bg-black/70 hover:bg-black/90 text-white text-xs border border-white/20 backdrop-blur-md gap-1.5 shadow"
        >
          <Film className="h-3.5 w-3.5 text-red-400" />
          <span>Switch to HTML5</span>
        </Button>
      </div>

      {/* Official YouTube Embed IFrame */}
      <iframe
        src={embedUrl.toString()}
        title="YouTube Video Player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        onLoad={() => setIframeLoaded(true)}
        className="h-full w-full border-0"
      />
    </div>
  );
}
