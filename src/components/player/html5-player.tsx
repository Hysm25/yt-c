"use client";

import React, { useEffect, useState, useRef } from "react";
import { usePlayer } from "./player-context";
import { PlayerControls } from "./player-controls";
import { Play, Pause, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HTML5PlayerProps {
  videoId: string;
  title?: string;
  channelTitle?: string;
  thumbnailUrl?: string;
  initialProgressSeconds?: number;
  onEnded?: () => void;
  onNextVideo?: () => void;
}

export function HTML5Player({
  videoId,
  title,
  channelTitle,
  thumbnailUrl,
  initialProgressSeconds = 0,
  onEnded,
  onNextVideo,
}: HTML5PlayerProps) {
  const {
    isPlaying,
    showCaptions,
    togglePlay,
    setActiveProvider,
    registerVideoElement,
    registerContainerElement,
  } = usePlayer();

  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [showCenterIcon, setShowCenterIcon] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch direct stream URL
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setStreamError(null);

    fetch(`/api/stream?id=${encodeURIComponent(videoId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (isCancelled) return;
        if (data.hasDirectStream && data.streamUrl) {
          setStreamUrl(data.streamUrl);
        } else {
          // Direct stream not resolved for this video
          setStreamError(
            "Direct stream requires signature deciphering or bot challenge bypass. Switch to the embedded player for guaranteed playback."
          );
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        setStreamError(err.message || "Failed to load video stream.");
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [videoId]);

  // Register container and video refs
  useEffect(() => {
    registerContainerElement(containerRef.current);
  }, [registerContainerElement]);

  useEffect(() => {
    if (videoRef.current) {
      registerVideoElement(videoRef.current);
      if (initialProgressSeconds > 0) {
        videoRef.current.currentTime = initialProgressSeconds;
      }
    }
  }, [streamUrl, initialProgressSeconds, registerVideoElement]);

  // Handle controls auto-hide during playback
  const handleMouseMove = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);

    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 3000);
    }
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      setControlsVisible(false);
    }
  };

  const handleVideoClick = () => {
    togglePlay();
    setShowCenterIcon(true);
    setTimeout(() => setShowCenterIcon(false), 500);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative flex aspect-video w-full overflow-hidden rounded-2xl bg-black select-none"
    >
      {/* Direct Video Element */}
      {streamUrl && (
        <video
          ref={videoRef}
          src={streamUrl}
          poster={thumbnailUrl}
          onClick={handleVideoClick}
          onEnded={onEnded}
          playsInline
          className="h-full w-full object-contain cursor-pointer"
        />
      )}

      {/* Center Play/Pause Indicator Animation */}
      {showCenterIcon && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <div className="flex h-16 w-16 animate-ping items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-xs">
            {isPlaying ? (
              <Pause className="h-8 w-8 fill-current" />
            ) : (
              <Play className="h-8 w-8 fill-current" />
            )}
          </div>
        </div>
      )}

      {/* Loading Spinner */}
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-red-500" />
          <span className="text-sm font-medium text-white/80">
            Resolving video stream...
          </span>
        </div>
      )}

      {/* Fallback Error / Embed Switcher Notice */}
      {!loading && streamError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-t from-black via-zinc-900 to-black p-6 text-center">
          <AlertCircle className="h-10 w-10 text-amber-400 mb-3" />
          <h3 className="text-lg font-bold text-white mb-2">
            Signature Cipher / Bot Challenge Protected
          </h3>
          <p className="max-w-md text-xs text-white/70 mb-5 leading-relaxed">
            YouTube restricts direct MP4 access for this specific media asset.
            Switch to the Official YouTube Player to enjoy seamless, high-definition playback.
          </p>
          <Button
            variant="youtube"
            size="default"
            onClick={() => setActiveProvider("embed")}
            className="gap-2 font-medium"
          >
            Switch to Official Embed Player
          </Button>
        </div>
      )}

      {/* Closed Captions Overlay (Sample subtitle renderer) */}
      {showCaptions && isPlaying && (
        <div className="pointer-events-none absolute bottom-14 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded bg-black/80 text-white font-medium text-sm sm:text-base tracking-wide text-center max-w-xl">
          [Music playing: {title || "YouTube Stream"}]
        </div>
      )}

      {/* Player Controls Overlay */}
      {streamUrl && (
        <div
          className={`transition-opacity duration-300 ${
            controlsVisible || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <PlayerControls onNextVideo={onNextVideo} />
        </div>
      )}
    </div>
  );
}
