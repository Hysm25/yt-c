"use client";

import React, { useState, useEffect, useRef } from "react";
import { Film, AlertCircle } from "lucide-react";
import { usePlayer } from "./player-context";
import { Button } from "@/components/ui/button";

interface EmbedPlayerProps {
  videoId: string;
  title?: string;
  channelTitle?: string;
  autoplay?: boolean;
  initialProgressSeconds?: number;
  onEnded?: () => void;
  onNextVideo?: () => void;
}

export function EmbedPlayer({
  videoId,
  title,
  channelTitle,
  autoplay = true,
  initialProgressSeconds = 0,
  onEnded,
  onNextVideo,
}: EmbedPlayerProps) {
  const { setActiveProvider, currentTime: contextTime } = usePlayer();
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const lastRecordedTimeRef = useRef<number>(0);

  // Resume from contextTime if available, else initialProgressSeconds
  const startTime = Math.floor(contextTime > 0 ? contextTime : initialProgressSeconds);

  // Build privacy-enhanced YouTube embed URL with JS API enabled
  const embedUrl = new URL(
    `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`
  );
  if (autoplay) embedUrl.searchParams.set("autoplay", "1");
  embedUrl.searchParams.set("rel", "0");
  embedUrl.searchParams.set("modestbranding", "1");
  embedUrl.searchParams.set("playsinline", "1");
  embedUrl.searchParams.set("enablejsapi", "1");
  embedUrl.searchParams.set("origin", typeof window !== "undefined" ? window.location.origin : "");
  if (startTime > 0) {
    embedUrl.searchParams.set("start", startTime.toString());
  }

  // Listen for YouTube IFrame postMessage events to track watch progress and video completion
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin if possible
      if (!event.origin.includes("youtube.com") && !event.origin.includes("youtube-nocookie.com")) {
        return;
      }

      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (!data) return;

        // infoDelivery event contains real-time currentTime and playerState
        if (data.event === "infoDelivery" && data.info) {
          const { currentTime, duration, playerState } = data.info;

          // 0 = ENDED, 1 = PLAYING, 2 = PAUSED
          if (playerState === 0) {
            if (onEnded) onEnded();
            else if (onNextVideo) onNextVideo();
          }

          if (typeof currentTime === "number" && currentTime > 0) {
            // Record progress every 5 seconds
            if (Math.abs(currentTime - lastRecordedTimeRef.current) >= 5) {
              lastRecordedTimeRef.current = currentTime;
              fetch("/api/history", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  videoId,
                  title: title || "YouTube Video",
                  channelTitle: channelTitle || "YouTube Creator",
                  progressSeconds: Math.floor(currentTime),
                  totalSeconds: Math.floor(duration || 0),
                }),
              }).catch(() => {});
            }
          }
        } else if (data.event === "onStateChange") {
          // 0 is ended in standard API
          if (data.info === 0) {
            if (onEnded) onEnded();
            else if (onNextVideo) onNextVideo();
          }
        }
      } catch (_) {
        // Ignore unparseable postMessages
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [videoId, title, channelTitle, onEnded, onNextVideo]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-lg">
      {/* Switcher Badge Overlay */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setActiveProvider("html5")}
          title="Switch to Native HTML5 Video Player"
          className="bg-black/70 hover:bg-black/90 text-white text-xs border border-white/20 backdrop-blur-md gap-1.5 shadow"
        >
          <Film className="h-3.5 w-3.5 text-red-400" />
          <span className="hidden sm:inline">Switch to HTML5</span>
          <span className="sm:hidden">HTML5</span>
        </Button>
      </div>

      {/* Official YouTube Embed IFrame */}
      <iframe
        ref={iframeRef}
        src={embedUrl.toString()}
        title={title || "YouTube Video Player"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        onLoad={() => setIframeLoaded(true)}
        className="h-full w-full border-0"
      />
    </div>
  );
}
