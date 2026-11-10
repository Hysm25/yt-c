"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { usePlayer } from "./player-context";
import { PlayerControls } from "./player-controls";
import { Play, Pause, AlertCircle, RefreshCw, FastForward, Rewind } from "lucide-react";
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
    currentTime,
    duration,
    showCaptions,
    togglePlay,
    seek,
    toggleFullscreen,
    setActiveProvider,
    registerVideoElement,
    registerContainerElement,
  } = usePlayer();

  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [showCenterIcon, setShowCenterIcon] = useState(false);
  const [seekAnimation, setSeekAnimation] = useState<"+10s" | "-10s" | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });

  // Fetch direct stream URL with smart auto-switch for cipher-protected videos
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
          // Direct stream cipher protected: auto-switch to embed player for guaranteed playback
          setActiveProvider("embed");
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
  }, [videoId, setActiveProvider]);

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
  const showControlsTemporarily = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);

    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 3500);
    }
  }, [isPlaying]);

  const handleMouseMove = () => {
    showControlsTemporarily();
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      setControlsVisible(false);
    }
  };

  // Video click/tap handling with double-tap seek detection
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If clicking on controls, don't toggle play
    const target = e.target as HTMLElement;
    if (target.closest("[data-controls]")) return;

    const now = Date.now();
    const rect = containerRef.current?.getBoundingClientRect();
    const clickX = e.clientX;

    if (now - lastTapRef.current.time < 300 && rect) {
      // Double click detected!
      const isRightSide = clickX - rect.left > rect.width / 2;
      if (isRightSide) {
        seek(Math.min(duration, currentTime + 10));
        setSeekAnimation("+10s");
      } else {
        seek(Math.max(0, currentTime - 10));
        setSeekAnimation("-10s");
      }
      setTimeout(() => setSeekAnimation(null), 600);
      lastTapRef.current = { time: 0, x: 0 };
      return;
    }

    lastTapRef.current = { time: now, x: clickX };

    // Single click toggles play/pause
    togglePlay();
    setShowCenterIcon(true);
    showControlsTemporarily();
    setTimeout(() => setShowCenterIcon(false), 500);
  };

  // Double click on desktop toggles fullscreen
  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-controls]")) return;
    toggleFullscreen();
  };

  // Touch handling for mobile/tablet screens
  const handleTouchStart = () => {
    showControlsTemporarily();
  };

  // Listen to buffering events
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => setIsBuffering(false);
    const onCanPlay = () => setIsBuffering(false);

    v.addEventListener("waiting", onWaiting);
    v.addEventListener("playing", onPlaying);
    v.addEventListener("canplay", onCanPlay);

    return () => {
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("canplay", onCanPlay);
    };
  }, [streamUrl]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleContainerClick}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
      className="group relative flex aspect-video w-full overflow-hidden rounded-2xl bg-black select-none shadow-xl"
    >
      {/* Direct Video Element */}
      {streamUrl && (
        <video
          ref={videoRef}
          src={streamUrl}
          poster={thumbnailUrl}
          onEnded={onEnded}
          playsInline
          className="h-full w-full object-contain cursor-pointer"
        />
      )}

      {/* Double-tap Seek Animation Overlays */}
      {seekAnimation === "+10s" && (
        <div className="pointer-events-none absolute right-12 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center justify-center rounded-full bg-black/60 p-4 text-white animate-pulse">
          <FastForward className="h-8 w-8 fill-current" />
          <span className="text-xs font-bold mt-1">+10s</span>
        </div>
      )}
      {seekAnimation === "-10s" && (
        <div className="pointer-events-none absolute left-12 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center justify-center rounded-full bg-black/60 p-4 text-white animate-pulse">
          <Rewind className="h-8 w-8 fill-current" />
          <span className="text-xs font-bold mt-1">-10s</span>
        </div>
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

      {/* Loading & Buffering Spinner */}
      {(loading || isBuffering) && (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 gap-3">
          <RefreshCw className="h-9 w-9 animate-spin text-[#FF0000]" />
          <span className="text-xs font-medium text-white/90">
            {loading ? "Resolving video stream..." : "Buffering..."}
          </span>
        </div>
      )}

      {/* Fallback Error / Switcher Notice */}
      {!loading && streamError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-t from-black via-zinc-900 to-black p-6 text-center">
          <AlertCircle className="h-10 w-10 text-amber-400 mb-3" />
          <h3 className="text-base sm:text-lg font-bold text-white mb-2">
            Protected Media Stream
          </h3>
          <p className="max-w-md text-xs text-white/70 mb-5 leading-relaxed">
            Direct MP4 stream is cipher-protected for this video. Switch to the Official YouTube Player for guaranteed, high-definition playback.
          </p>
          <Button
            variant="youtube"
            size="default"
            onClick={(e) => {
              e.stopPropagation();
              setActiveProvider("embed");
            }}
            className="gap-2 font-medium"
          >
            Switch to Official Player
          </Button>
        </div>
      )}

      {/* Closed Captions Overlay */}
      {showCaptions && isPlaying && (
        <div className="pointer-events-none absolute bottom-14 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-md bg-black/85 text-white font-medium text-xs sm:text-sm tracking-wide text-center max-w-xl shadow">
          [Audio: {title || "YouTube Stream"}]
        </div>
      )}

      {/* Player Controls Overlay */}
      {streamUrl && (
        <div
          data-controls="true"
          onClick={(e) => e.stopPropagation()}
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
