"use client";

import React, { useEffect, useState, useRef } from "react";
import { Film, RefreshCw, ExternalLink, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HTML5PlayerProps {
  videoId: string;
  title?: string;
  channelTitle?: string;
  thumbnailUrl?: string;
  initialProgressSeconds?: number;
  onEnded?: () => void;
  onSwitchToEmbed?: () => void;
}

export function HTML5Player({
  videoId,
  title,
  channelTitle,
  thumbnailUrl,
  initialProgressSeconds = 0,
  onEnded,
  onSwitchToEmbed,
}: HTML5PlayerProps) {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [streamError, setStreamError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastRecordedTimeRef = useRef<number>(0);

  // Load stream URL
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setStreamError(null);
    setStreamUrl(null);

    fetch(`/api/stream?id=${encodeURIComponent(videoId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (isCancelled) return;
        if (data.hasDirectStream && data.streamUrl) {
          setStreamUrl(data.streamUrl);
        } else {
          setStreamError(
            data.message ||
              "Direct stream is unavailable for this video due to YouTube cipher protection."
          );
        }
      })
      .catch(() => {
        if (isCancelled) return;
        setStreamError("Unable to load video stream in native player.");
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [videoId]);

  // Set initial progress timestamp if resuming
  useEffect(() => {
    if (videoRef.current && initialProgressSeconds > 0 && streamUrl) {
      videoRef.current.currentTime = initialProgressSeconds;
    }
  }, [streamUrl, initialProgressSeconds]);

  // Sync watch progress to history every 5 seconds
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    const curr = Math.floor(video.currentTime);
    if (curr > 0 && Math.abs(curr - lastRecordedTimeRef.current) >= 5) {
      lastRecordedTimeRef.current = curr;
      fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          title: title || "YouTube Video",
          channelTitle: channelTitle || "Creator",
          progressSeconds: curr,
          totalSeconds: Math.floor(video.duration || 0),
        }),
      }).catch(() => {});
    }
  };

  const handleVideoError = () => {
    setStreamError(
      "Playback failed in native player. This stream may require official player codecs or signature decryption."
    );
  };

  if (loading) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center rounded-2xl bg-black text-white gap-3 shadow-lg">
        <RefreshCw className="h-8 w-8 animate-spin text-red-500" />
        <span className="text-xs text-muted-foreground">
          Resolving video stream for native player...
        </span>
      </div>
    );
  }

  // Fallback notice if stream is unavailable or error in native mode
  if (!streamUrl || streamError) {
    return (
      <div className="relative flex aspect-video w-full flex-col items-center justify-center rounded-2xl bg-zinc-950 border border-zinc-800 p-6 text-center text-white shadow-xl overflow-hidden">
        {thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt={title || "Video thumbnail"}
            className="absolute inset-0 h-full w-full object-cover opacity-20 filter blur-xs"
          />
        )}
        <div className="relative z-10 flex flex-col items-center max-w-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600/10 text-red-500 mb-3">
            <Film className="h-6 w-6" />
          </div>
          <h3 className="text-base sm:text-lg font-bold mb-1.5">
            Playback Available in Official Player
          </h3>
          <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
            {streamError ||
              "Direct MP4 streaming is not provided by YouTube for this video. Switch to the Official YouTube Player for full video and audio playback."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {onSwitchToEmbed && (
              <Button
                variant="default"
                size="sm"
                onClick={onSwitchToEmbed}
                className="gap-2 bg-red-600 hover:bg-red-700 text-white font-medium text-xs"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Play in Official YouTube Player</span>
              </Button>
            )}
            <a
              href={`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-xs text-zinc-300 font-medium transition-colors"
            >
              <span>Open on YouTube</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Native HTML5 <video controls> Player - Default browser appearance and behavior
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-xl">
      <video
        ref={videoRef}
        src={streamUrl}
        poster={thumbnailUrl}
        controls
        autoPlay
        playsInline
        onError={handleVideoError}
        onEnded={onEnded}
        onTimeUpdate={handleTimeUpdate}
        className="h-full w-full object-contain"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
