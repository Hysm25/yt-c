"use client";

import React, { useState, useEffect, useRef } from "react";
import { Film, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmbedPlayerProps {
  videoId: string;
  title?: string;
  channelTitle?: string;
  autoplay?: boolean;
  initialProgressSeconds?: number;
  onEnded?: () => void;
  onNextVideo?: () => void;
  onSwitchToHtml5?: () => void;
}

export function EmbedPlayer({
  videoId,
  title,
  channelTitle,
  autoplay = true,
  initialProgressSeconds = 0,
  onEnded,
  onNextVideo,
  onSwitchToHtml5,
}: EmbedPlayerProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [isRestricted, setIsRestricted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const lastRecordedTimeRef = useRef<number>(0);

  const startTime = Math.floor(initialProgressSeconds);

  // Reset restriction state on video change
  useEffect(() => {
    setIsRestricted(false);
  }, [videoId]);

  // Build privacy-enhanced YouTube embed URL with JS API enabled
  const embedUrl = new URL(
    `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`
  );
  if (autoplay) embedUrl.searchParams.set("autoplay", "1");
  embedUrl.searchParams.set("rel", "0");
  embedUrl.searchParams.set("modestbranding", "1");
  embedUrl.searchParams.set("playsinline", "1");
  embedUrl.searchParams.set("enablejsapi", "1");
  embedUrl.searchParams.set(
    "origin",
    typeof window !== "undefined" ? window.location.origin : ""
  );
  if (startTime > 0) {
    embedUrl.searchParams.set("start", startTime.toString());
  }

  // Listen for YouTube IFrame postMessage events to track watch progress and video completion
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        !event.origin.includes("youtube.com") &&
        !event.origin.includes("youtube-nocookie.com")
      ) {
        return;
      }

      try {
        const data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;
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
          if (data.info === 0) {
            if (onEnded) onEnded();
            else if (onNextVideo) onNextVideo();
          }
        } else if (data.event === "onError") {
          // 101 or 150: video owner disabled embedding
          if (data.info === 101 || data.info === 150 || data.info === 100) {
            setIsRestricted(true);
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
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-xl">
      {/* Restricted Video Overlay */}
      {isRestricted && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-zinc-950 p-6 text-center text-white">
          <h3 className="text-base sm:text-lg font-bold mb-2">
            Playback Restricted by Creator
          </h3>
          <p className="max-w-md text-xs text-zinc-400 mb-5 leading-relaxed">
            The owner of this video does not allow playback on third-party websites. You can watch it directly on YouTube.
          </p>
          <a
            href={`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white transition-colors shadow-lg"
          >
            <span>Watch on YouTube</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      )}

      {/* Provider Switch Button */}
      {onSwitchToHtml5 && (
        <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onSwitchToHtml5}
            title="Switch to Browser Native HTML5 Player"
            className="bg-black/75 hover:bg-black/90 text-white text-xs border border-white/20 backdrop-blur-md gap-1.5 shadow"
          >
            <Film className="h-3.5 w-3.5 text-red-400" />
            <span className="hidden sm:inline">Native HTML5 Player</span>
            <span className="sm:hidden">HTML5</span>
          </Button>
        </div>
      )}

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
