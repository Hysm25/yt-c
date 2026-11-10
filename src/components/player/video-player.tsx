"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import videojs from "video.js";
import type Player from "video.js/dist/types/player";
import {
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Subtitles,
  Check,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  SkipForward,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Square,
  Maximize2,
} from "lucide-react";
import { formatDuration } from "@/lib/utils";

export interface StreamQuality {
  label: string;
  height: number;
  itag: number;
  streamUrl: string;
}

export interface CaptionTrack {
  languageCode: string;
  name: string;
  isDefault: boolean;
  url: string;
}

interface VideoPlayerProps {
  videoId: string;
  title?: string;
  channelTitle?: string;
  thumbnailUrl?: string;
  initialProgressSeconds?: number;
  isTheaterMode?: boolean;
  onToggleTheaterMode?: () => void;
  onEnded?: () => void;
  onNextVideo?: () => void;
}

export function VideoPlayer({
  videoId,
  title,
  channelTitle,
  thumbnailUrl,
  initialProgressSeconds = 0,
  isTheaterMode = false,
  onToggleTheaterMode,
  onEnded,
  onNextVideo,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoNodeRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playerRef = useRef<Player | null>(null);
  const lastRecordedTimeRef = useRef<number>(0);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Stream & Metadata State
  const [loading, setLoading] = useState(true);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [qualities, setQualities] = useState<StreamQuality[]>([]);
  const [captions, setCaptions] = useState<CaptionTrack[]>([]);
  const [currentQuality, setCurrentQuality] = useState<string>("Auto");
  const [currentCaption, setCurrentCaption] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Menu State: "none" | "main" | "quality" | "speed" | "captions"
  const [activeMenu, setActiveMenu] = useState<
    "none" | "main" | "quality" | "speed" | "captions"
  >("none");

  // Visual Overlay Feedback Indicator (e.g. "+10s", "Volume 80%", etc.)
  const [feedback, setFeedback] = useState<{
    text: string;
    icon?: string;
  } | null>(null);

  const showFeedback = useCallback((text: string, icon?: string) => {
    setFeedback({ text, icon });
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback(null);
    }, 900);
  }, []);

  // Controls Auto-hide Management
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying && activeMenu === "none") {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2600);
    }
  }, [isPlaying, activeMenu]);

  // Load saved volume preferences on mount
  useEffect(() => {
    try {
      const savedVol = localStorage.getItem("yt-player-volume");
      const savedMute = localStorage.getItem("yt-player-muted");
      if (savedVol !== null) {
        const v = parseFloat(savedVol);
        if (!isNaN(v)) setVolume(v);
      }
      if (savedMute !== null) {
        setIsMuted(savedMute === "true");
      }
    } catch {}
  }, []);

  // Fetch Stream & Caption Data for Video ID
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setStreamError(null);
    setActiveMenu("none");

    fetch(`/api/stream?id=${encodeURIComponent(videoId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (isCancelled) return;
        if (data.hasDirectStream && data.streamUrl) {
          setAudioUrl(data.audioUrl || null);
          const availableQualities: StreamQuality[] = data.qualities || [];
          setQualities(availableQualities);
          setCaptions(data.captions || []);
          setCurrentQuality(data.quality || "Auto");

          // Initialize or update Video.js player source
          setupVideoPlayer(data.streamUrl, data.audioUrl, data.captions);
        } else {
          setStreamError(
            data.message ||
              "Direct stream is unavailable for this video. It may be restricted by YouTube DRM, age-rating, or private access."
          );
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        console.error("Stream resolution error:", err);
        setStreamError("Unable to load video stream in Video.js player.");
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [videoId]);

  // Video.js Initialization & Lifecycle Setup
  const setupVideoPlayer = (
    videoUrl: string,
    initialAudioUrl?: string | null,
    captionTracksList?: CaptionTrack[]
  ) => {
    if (!videoNodeRef.current) return;

    if (!playerRef.current) {
      // Instantiate Video.js
      const player = videojs(
        videoNodeRef.current,
        {
          autoplay: true,
          controls: false, // Custom YouTube overlay UI controls
          fluid: true,
          playsinline: true,
          preload: "auto",
          sources: [{ src: videoUrl, type: "video/mp4" }],
        },
        () => {
          playerRef.current = player;

          // Set initial timestamp if resuming
          if (initialProgressSeconds > 0) {
            player.currentTime(initialProgressSeconds);
            if (audioRef.current) audioRef.current.currentTime = initialProgressSeconds;
          }

          // Load Subtitle Tracks into Video.js
          if (captionTracksList && captionTracksList.length > 0) {
            captionTracksList.forEach((track) => {
              player.addRemoteTextTrack(
                {
                  kind: "subtitles",
                  srclang: track.languageCode,
                  label: track.name,
                  src: track.url,
                  default: track.isDefault,
                },
                false
              );
            });
            const defaultTrack = captionTracksList.find((t) => t.isDefault);
            if (defaultTrack) {
              setCurrentCaption(defaultTrack.languageCode);
            }
          }
        }
      );

      // Event Listeners: Sync State & Audio Track
      player.on("play", () => {
        setIsPlaying(true);
        if (audioRef.current && audioRef.current.paused) {
          audioRef.current.play().catch(() => {});
        }
      });

      player.on("pause", () => {
        setIsPlaying(false);
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause();
        }
      });

      player.on("timeupdate", () => {
        const time = player.currentTime() || 0;
        setCurrentTime(time);

        // Drift correction: keep dual-track audio synchronized within 150ms
        if (audioRef.current && !player.paused()) {
          const drift = Math.abs(audioRef.current.currentTime - time);
          if (drift > 0.18) {
            audioRef.current.currentTime = time;
          }
        }

        // Save progress to watch history every 5 seconds
        const curr = Math.floor(time);
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
              totalSeconds: Math.floor(player.duration() || 0),
            }),
          }).catch(() => {});
        }
      });

      player.on("durationchange", () => {
        setDuration(player.duration() || 0);
      });

      player.on("progress", () => {
        const buf = player.buffered();
        const dur = player.duration() || 0;
        if (buf && buf.length > 0 && dur > 0) {
          const end = buf.end(buf.length - 1);
          setBufferedPercent(Math.min(100, Math.round((end / dur) * 100)));
        }
      });

      player.on("seeking", () => {
        if (audioRef.current) {
          audioRef.current.currentTime = player.currentTime() || 0;
        }
      });

      player.on("seeked", () => {
        if (audioRef.current) {
          audioRef.current.currentTime = player.currentTime() || 0;
        }
      });

      player.on("waiting", () => {
        setIsBuffering(true);
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause();
        }
      });

      player.on("playing", () => {
        setIsBuffering(false);
        if (audioRef.current && !player.paused()) {
          if (Math.abs(audioRef.current.currentTime - (player.currentTime() || 0)) > 0.15) {
            audioRef.current.currentTime = player.currentTime() || 0;
          }
          audioRef.current.play().catch(() => {});
        }
      });

      player.on("ratechange", () => {
        const rate = player.playbackRate() || 1;
        setPlaybackSpeed(rate);
        if (audioRef.current) audioRef.current.playbackRate = rate;
      });

      player.on("volumechange", () => {
        const v = player.volume() ?? 1;
        const m = player.muted() ?? false;
        setVolume(v);
        setIsMuted(m);
        if (audioRef.current) {
          audioRef.current.volume = v;
          audioRef.current.muted = m;
        }
      });

      player.on("ended", () => {
        setIsPlaying(false);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        onEnded?.();
      });

      player.on("error", () => {
        console.warn("Video.js playback error:", player.error());
        setIsBuffering(false);
      });
    } else {
      // Update existing player source
      const player = playerRef.current;
      player.src({ src: videoUrl, type: "video/mp4" });
      if (initialProgressSeconds > 0) {
        player.currentTime(initialProgressSeconds);
        if (audioRef.current) audioRef.current.currentTime = initialProgressSeconds;
      }
      player.play()?.catch(() => {});
    }
  };

  // Fullscreen Change Listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Cleanup Video.js Player on Unmount
  useEffect(() => {
    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);

  // Play / Pause Toggle
  const togglePlay = () => {
    if (!playerRef.current) return;
    if (playerRef.current.paused()) {
      playerRef.current.play()?.catch(() => {});
      showFeedback("Play");
    } else {
      playerRef.current.pause();
      showFeedback("Pause");
    }
    resetControlsTimeout();
  };

  // Seeking
  const handleSeek = (newTime: number) => {
    if (!playerRef.current) return;
    const clamped = Math.max(0, Math.min(newTime, duration || 0));
    playerRef.current.currentTime(clamped);
    if (audioRef.current) audioRef.current.currentTime = clamped;
    setCurrentTime(clamped);
    resetControlsTimeout();
  };

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    handleSeek(val);
  };

  const seekRelative = (seconds: number) => {
    if (!playerRef.current) return;
    const target = (playerRef.current.currentTime() || 0) + seconds;
    handleSeek(target);
    showFeedback(seconds > 0 ? `+${seconds}s` : `${seconds}s`);
  };

  // Volume & Mute
  const handleVolumeChange = (newVol: number) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    setVolume(clamped);
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
      if (playerRef.current) playerRef.current.muted(false);
      if (audioRef.current) audioRef.current.muted = false;
    }
    if (playerRef.current) playerRef.current.volume(clamped);
    if (audioRef.current) audioRef.current.volume = clamped;
    try {
      localStorage.setItem("yt-player-volume", clamped.toString());
    } catch {}
    resetControlsTimeout();
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (playerRef.current) playerRef.current.muted(nextMute);
    if (audioRef.current) audioRef.current.muted = nextMute;
    try {
      localStorage.setItem("yt-player-muted", nextMute.toString());
    } catch {}
    showFeedback(nextMute ? "Muted" : `Volume ${Math.round(volume * 100)}%`);
    resetControlsTimeout();
  };

  // Quality Selection
  const changeQuality = (quality: StreamQuality) => {
    if (!playerRef.current) return;
    const player = playerRef.current;
    const cur = player.currentTime() || 0;
    const wasPlaying = !player.paused();

    setCurrentQuality(quality.label);
    setActiveMenu("none");

    player.src({ src: quality.streamUrl, type: "video/mp4" });
    player.currentTime(cur);
    if (audioRef.current) audioRef.current.currentTime = cur;

    if (wasPlaying) {
      player.play()?.catch(() => {});
    }

    showFeedback(`Quality: ${quality.label}`);
    resetControlsTimeout();
  };

  // Subtitles / Captions Toggle & Language Switch
  const toggleCaptions = () => {
    if (!playerRef.current || captions.length === 0) return;
    const player = playerRef.current;
    const tracks = player.textTracks() as any;

    if (currentCaption) {
      // Turn Off
      for (let i = 0; i < tracks.length; i++) {
        if (tracks[i]) tracks[i].mode = "disabled";
      }
      setCurrentCaption(null);
      showFeedback("Subtitles Off");
    } else {
      // Turn On (Default or First track)
      const target = captions.find((c) => c.isDefault) || captions[0];
      for (let i = 0; i < tracks.length; i++) {
        if (tracks[i]) {
          if (tracks[i].language === target.languageCode) {
            tracks[i].mode = "showing";
          } else {
            tracks[i].mode = "disabled";
          }
        }
      }
      setCurrentCaption(target.languageCode);
      showFeedback(`Subtitles: ${target.name}`);
    }
    resetControlsTimeout();
  };

  const selectCaptionTrack = (langCode: string | null) => {
    if (!playerRef.current) return;
    const tracks = playerRef.current.textTracks() as any;

    if (!langCode) {
      for (let i = 0; i < tracks.length; i++) {
        if (tracks[i]) tracks[i].mode = "disabled";
      }
      setCurrentCaption(null);
      showFeedback("Subtitles Off");
    } else {
      for (let i = 0; i < tracks.length; i++) {
        if (tracks[i]) {
          if (tracks[i].language === langCode) {
            tracks[i].mode = "showing";
          } else {
            tracks[i].mode = "disabled";
          }
        }
      }
      const match = captions.find((c) => c.languageCode === langCode);
      setCurrentCaption(langCode);
      showFeedback(match ? `Subtitles: ${match.name}` : "Subtitles On");
    }
    setActiveMenu("none");
    resetControlsTimeout();
  };

  // Playback Speed
  const changeSpeed = (speed: number) => {
    if (!playerRef.current) return;
    playerRef.current.playbackRate(speed);
    if (audioRef.current) audioRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
    setActiveMenu("none");
    showFeedback(`${speed}x Speed`);
    resetControlsTimeout();
  };

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
    resetControlsTimeout();
  };

  // YouTube Standard Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keystrokes when typing in text inputs or textareas
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "arrowleft":
          e.preventDefault();
          seekRelative(-5);
          break;
        case "arrowright":
          e.preventDefault();
          seekRelative(5);
          break;
        case "j":
          e.preventDefault();
          seekRelative(-10);
          break;
        case "l":
          e.preventDefault();
          seekRelative(10);
          break;
        case "arrowup":
          e.preventDefault();
          handleVolumeChange(volume + 0.05);
          showFeedback(`Volume ${Math.round(Math.min(1, volume + 0.05) * 100)}%`);
          break;
        case "arrowdown":
          e.preventDefault();
          handleVolumeChange(volume - 0.05);
          showFeedback(`Volume ${Math.round(Math.max(0, volume - 0.05) * 100)}%`);
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "t":
          e.preventDefault();
          onToggleTheaterMode?.();
          showFeedback(isTheaterMode ? "Default View" : "Theater Mode");
          break;
        case "c":
          e.preventDefault();
          toggleCaptions();
          break;
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          e.preventDefault();
          if (duration > 0) {
            const frac = parseInt(e.key, 10) / 10;
            handleSeek(duration * frac);
            showFeedback(`${frac * 100}%`);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    duration,
    volume,
    isMuted,
    isTheaterMode,
    onToggleTheaterMode,
    togglePlay,
    seekRelative,
    showFeedback,
  ]);

  // Double-click to seek -10s on left side, +10s on right side
  const handleContainerDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    if (clickX < rect.width / 2) {
      seekRelative(-10);
    } else {
      seekRelative(10);
    }
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center rounded-2xl bg-black text-white gap-3 shadow-xl">
        <RefreshCw className="h-9 w-9 animate-spin text-red-500" />
        <span className="text-xs font-medium text-zinc-400">
          Loading video player & resolving streams...
        </span>
      </div>
    );
  }

  // Error Card if stream is unavailable
  if (streamError) {
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
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-base sm:text-lg font-bold mb-1.5">
            Playback Unavailable
          </h3>
          <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
            {streamError}
          </p>
          <a
            href={`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs text-white font-medium shadow-md transition-colors"
          >
            <span>Open on YouTube</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    );
  }

  // Render Full Video.js Player with YouTube Controls
  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimeout}
      onTouchStart={resetControlsTimeout}
      onDoubleClick={handleContainerDoubleClick}
      className={`group relative aspect-video w-full overflow-hidden select-none bg-black transition-all shadow-2xl ${
        isTheaterMode ? "rounded-none sm:rounded-2xl" : "rounded-2xl"
      }`}
    >
      {/* Video.js HTML5 Video Element */}
      <div data-vjs-player className="h-full w-full">
        <video
          ref={videoNodeRef}
          playsInline
          className="video-js vjs-default-skin h-full w-full object-contain"
        />
      </div>

      {/* Synchronized Adaptive Audio Element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="auto"
          className="hidden"
          onError={() => console.warn("Adaptive audio stream error")}
        />
      )}

      {/* Center Big Play Button (when paused) */}
      {!isPlaying && !isBuffering && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="Play video"
          className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-600/90 text-white shadow-2xl transition-transform hover:scale-110 active:scale-95"
        >
          <Play className="h-8 w-8 fill-current translate-x-0.5" />
        </button>
      )}

      {/* Center Buffering Spinner */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
          <RefreshCw className="h-10 w-10 animate-spin text-red-500 drop-shadow-md" />
        </div>
      )}

      {/* Center Visual Feedback Pill */}
      {feedback && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-2 rounded-2xl bg-black/80 px-4 py-2 text-sm font-semibold text-white shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
            <span>{feedback.text}</span>
          </div>
        </div>
      )}

      {/* Top Title Bar (Visible on Hover / Inactivity) */}
      <div
        className={`absolute top-0 inset-x-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 via-black/30 to-transparent transition-opacity duration-300 pointer-events-none ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex flex-col truncate pr-4">
          <span className="text-sm sm:text-base font-semibold text-white truncate drop-shadow-md">
            {title || "YouTube Video"}
          </span>
          {channelTitle && (
            <span className="text-xs text-zinc-300 truncate drop-shadow-xs">
              {channelTitle}
            </span>
          )}
        </div>
      </div>

      {/* Settings Popover Menu */}
      {activeMenu !== "none" && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-14 right-4 z-40 w-60 rounded-2xl bg-zinc-950/95 border border-zinc-800 text-white p-2 shadow-2xl backdrop-blur-md text-xs animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Main Settings Menu */}
          {activeMenu === "main" && (
            <div className="flex flex-col gap-0.5">
              <div className="px-3 py-1.5 font-semibold text-zinc-400 border-b border-zinc-800/80 mb-1">
                Playback Settings
              </div>

              {/* Quality Submenu Item */}
              <button
                type="button"
                onClick={() => setActiveMenu("quality")}
                className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-zinc-800 transition-colors"
              >
                <span className="font-medium">Quality</span>
                <div className="flex items-center gap-1 text-zinc-400 text-[11px]">
                  <span>{currentQuality}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </button>

              {/* Playback Speed Submenu Item */}
              <button
                type="button"
                onClick={() => setActiveMenu("speed")}
                className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-zinc-800 transition-colors"
              >
                <span className="font-medium">Playback Speed</span>
                <div className="flex items-center gap-1 text-zinc-400 text-[11px]">
                  <span>{playbackSpeed === 1 ? "Normal" : `${playbackSpeed}x`}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </button>

              {/* Subtitles Submenu Item */}
              <button
                type="button"
                onClick={() => setActiveMenu("captions")}
                className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-zinc-800 transition-colors"
              >
                <span className="font-medium">Subtitles / CC</span>
                <div className="flex items-center gap-1 text-zinc-400 text-[11px]">
                  <span>
                    {currentCaption
                      ? captions.find((c) => c.languageCode === currentCaption)?.name ||
                        currentCaption
                      : "Off"}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </button>
            </div>
          )}

          {/* Quality Submenu */}
          {activeMenu === "quality" && (
            <div className="flex flex-col gap-0.5 max-h-56 overflow-y-auto">
              <button
                type="button"
                onClick={() => setActiveMenu("main")}
                className="flex items-center gap-1 px-2 py-1.5 text-zinc-400 hover:text-white font-medium border-b border-zinc-800 mb-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Quality</span>
              </button>
              {qualities.length === 0 ? (
                <div className="p-2 text-zinc-400">Default Quality</div>
              ) : (
                qualities.map((q) => (
                  <button
                    key={q.itag || q.label}
                    type="button"
                    onClick={() => changeQuality(q)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-zinc-800 transition-colors"
                  >
                    <span className="font-medium">{q.label}</span>
                    {currentQuality === q.label && (
                      <Check className="h-4 w-4 text-red-500" />
                    )}
                  </button>
                ))
              )}
            </div>
          )}

          {/* Speed Submenu */}
          {activeMenu === "speed" && (
            <div className="flex flex-col gap-0.5 max-h-56 overflow-y-auto">
              <button
                type="button"
                onClick={() => setActiveMenu("main")}
                className="flex items-center gap-1 px-2 py-1.5 text-zinc-400 hover:text-white font-medium border-b border-zinc-800 mb-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Playback Speed</span>
              </button>
              {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => changeSpeed(spd)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-zinc-800 transition-colors"
                >
                  <span className="font-medium">
                    {spd === 1 ? "Normal (1x)" : `${spd}x`}
                  </span>
                  {playbackSpeed === spd && (
                    <Check className="h-4 w-4 text-red-500" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Captions Submenu */}
          {activeMenu === "captions" && (
            <div className="flex flex-col gap-0.5 max-h-56 overflow-y-auto">
              <button
                type="button"
                onClick={() => setActiveMenu("main")}
                className="flex items-center gap-1 px-2 py-1.5 text-zinc-400 hover:text-white font-medium border-b border-zinc-800 mb-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Subtitles / CC</span>
              </button>
              <button
                type="button"
                onClick={() => selectCaptionTrack(null)}
                className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-zinc-800 transition-colors"
              >
                <span className="font-medium">Off</span>
                {!currentCaption && <Check className="h-4 w-4 text-red-500" />}
              </button>
              {captions.map((cap) => (
                <button
                  key={cap.languageCode}
                  type="button"
                  onClick={() => selectCaptionTrack(cap.languageCode)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-zinc-800 transition-colors"
                >
                  <span className="font-medium">{cap.name}</span>
                  {currentCaption === cap.languageCode && (
                    <Check className="h-4 w-4 text-red-500" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bottom Controls Bar Container */}
      <div
        className={`absolute bottom-0 inset-x-0 flex flex-col justify-end px-3 sm:px-4 pb-2 pt-8 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-opacity duration-300 ${
          showControls || activeMenu !== "none" ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Progress Bar & Scrubber */}
        <div className="relative flex items-center w-full h-4 group/progress cursor-pointer mb-1.5">
          {/* Background Track */}
          <div className="absolute inset-x-0 h-1 group-hover/progress:h-2 rounded-full bg-white/20 transition-all">
            {/* Buffered Track */}
            <div
              style={{ width: `${bufferedPercent}%` }}
              className="absolute left-0 top-0 h-full rounded-full bg-white/35 transition-all"
            />
            {/* Played Progress Track */}
            <div
              style={{
                width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
              }}
              className="absolute left-0 top-0 h-full rounded-full bg-red-600 transition-all"
            />
          </div>

          {/* Invisible HTML range input for touch & accessibility */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleScrubberChange}
            aria-label="Seek video position"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between text-white text-xs">
          {/* Left Controls: Play/Pause, Next, Volume, Time */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Play/Pause */}
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 fill-current" />
              ) : (
                <Play className="h-5 w-5 fill-current" />
              )}
            </button>

            {/* Next Video Button */}
            {onNextVideo && (
              <button
                type="button"
                onClick={onNextVideo}
                aria-label="Next video"
                title="Next video (Shift+N)"
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <SkipForward className="h-5 w-5" />
              </button>
            )}

            {/* Volume Control with Hover Slider */}
            <div className="group/vol flex items-center">
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute" : "Mute"}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-5 w-5" />
                ) : volume < 0.5 ? (
                  <Volume1 className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </button>

              <div className="w-0 group-hover/vol:w-16 sm:group-hover/vol:w-20 overflow-hidden transition-all duration-200 flex items-center pr-1">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.02}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  aria-label="Volume slider"
                  className="w-full h-1 bg-white/30 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Time Display */}
            <div className="text-[11px] font-medium text-zinc-300 ml-1">
              <span>{formatDuration(Math.floor(currentTime))}</span>
              <span className="mx-1 text-zinc-500">/</span>
              <span>{formatDuration(Math.floor(duration))}</span>
            </div>
          </div>

          {/* Right Controls: CC, Settings, Theater Mode, Fullscreen */}
          <div className="flex items-center gap-0.5 sm:gap-1.5">
            {/* Subtitles (CC) Toggle */}
            {captions.length > 0 && (
              <button
                type="button"
                onClick={toggleCaptions}
                aria-label="Toggle subtitles"
                title="Subtitles / Closed Captions (c)"
                className={`p-1.5 rounded-lg transition-colors relative ${
                  currentCaption
                    ? "text-red-500 hover:bg-white/10 font-bold"
                    : "text-white/80 hover:bg-white/10"
                }`}
              >
                <Subtitles className="h-5 w-5" />
                {currentCaption && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-red-500 rounded-full" />
                )}
              </button>
            )}

            {/* Settings Menu Button */}
            <button
              type="button"
              onClick={() =>
                setActiveMenu(activeMenu === "none" ? "main" : "none")
              }
              aria-label="Settings"
              title="Settings"
              className={`p-1.5 rounded-lg transition-colors ${
                activeMenu !== "none"
                  ? "bg-white/20 text-white"
                  : "hover:bg-white/10 text-white/90"
              }`}
            >
              <Settings className="h-5 w-5" />
            </button>

            {/* Theater Mode Toggle */}
            {onToggleTheaterMode && (
              <button
                type="button"
                onClick={onToggleTheaterMode}
                aria-label="Toggle theater mode"
                title="Theater mode (t)"
                className="hidden sm:inline-flex p-1.5 rounded-lg hover:bg-white/10 text-white/90 transition-colors"
              >
                {isTheaterMode ? (
                  <Square className="h-5 w-5" />
                ) : (
                  <Maximize2 className="h-5 w-5" />
                )}
              </button>
            )}

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label="Toggle fullscreen"
              title="Fullscreen (f)"
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/90 transition-colors"
            >
              {isFullscreen ? (
                <Minimize className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
