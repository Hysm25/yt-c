"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";

export type PlaybackProviderType = "html5" | "embed";

export interface PlayerContextType {
  // Playback state
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  bufferedPercent: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  quality: string;
  isTheaterMode: boolean;
  isFullscreen: boolean;
  isPiP: boolean;
  showCaptions: boolean;
  autoplayNext: boolean;
  activeProvider: PlaybackProviderType;
  showControls: boolean;

  // Actions
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
  setQuality: (quality: string) => void;
  toggleTheaterMode: () => void;
  toggleFullscreen: () => void;
  togglePiP: () => void;
  toggleCaptions: () => void;
  toggleAutoplayNext: () => void;
  setActiveProvider: (provider: PlaybackProviderType) => void;
  setShowControls: (show: boolean) => void;

  // Internal video element ref registration
  registerVideoElement: (el: HTMLVideoElement | null) => void;
  registerContainerElement: (el: HTMLDivElement | null) => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({
  children,
  initialVideoId,
  initialTitle,
  initialChannelTitle,
}: {
  children: React.ReactNode;
  initialVideoId?: string;
  initialTitle?: string;
  initialChannelTitle?: string;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [quality, setQuality] = useState("auto");
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [showCaptions, setShowCaptions] = useState(false);
  const [autoplayNext, setAutoplayNext] = useState(true);
  const [activeProvider, setActiveProviderState] = useState<PlaybackProviderType>("html5");
  const [showControls, setShowControls] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize preferences from localStorage
  useEffect(() => {
    const savedProvider = localStorage.getItem("yt-playback-provider") as PlaybackProviderType | null;
    if (savedProvider === "html5" || savedProvider === "embed") {
      setActiveProviderState(savedProvider);
    }

    const savedVolume = localStorage.getItem("yt-player-volume");
    if (savedVolume) {
      const v = parseFloat(savedVolume);
      if (!isNaN(v) && v >= 0 && v <= 1) {
        setVolumeState(v);
        if (videoRef.current) videoRef.current.volume = v;
      }
    }

    const savedSpeed = localStorage.getItem("yt-player-speed");
    if (savedSpeed) {
      const s = parseFloat(savedSpeed);
      if (!isNaN(s) && s > 0) {
        setPlaybackRateState(s);
        if (videoRef.current) videoRef.current.playbackRate = s;
      }
    }

    // Listen for provider toggle from header
    const handleProviderChanged = (e: any) => {
      if (e.detail === "html5" || e.detail === "embed") {
        setActiveProviderState(e.detail);
      }
    };
    window.addEventListener("yt-playback-provider-changed", handleProviderChanged);

    return () => {
      window.removeEventListener("yt-playback-provider-changed", handleProviderChanged);
    };
  }, []);

  const registerVideoElement = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el) {
      el.volume = isMuted ? 0 : volume;
      el.playbackRate = playbackRate;
    }
  }, [isMuted, volume, playbackRate]);

  const registerContainerElement = useCallback((el: HTMLDivElement | null) => {
    containerRef.current = el;
  }, []);

  const play = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const seek = useCallback((seconds: number) => {
    if (videoRef.current) {
      const clamped = Math.max(0, Math.min(seconds, videoRef.current.duration || seconds));
      videoRef.current.currentTime = clamped;
      setCurrentTime(clamped);
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    localStorage.setItem("yt-player-volume", clamped.toString());
    if (videoRef.current) {
      videoRef.current.volume = clamped;
      if (clamped > 0 && isMuted) {
        setIsMuted(false);
        videoRef.current.muted = false;
      }
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (videoRef.current) {
        videoRef.current.muted = next;
      }
      return next;
    });
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    setPlaybackRateState(rate);
    localStorage.setItem("yt-player-speed", rate.toString());
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  }, []);

  const toggleTheaterMode = useCallback(() => {
    setIsTheaterMode((prev) => !prev);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  const togglePiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiP(false);
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
        setIsPiP(true);
      }
    } catch (err) {
      console.warn("Picture-in-Picture error:", err);
    }
  }, []);

  const toggleCaptions = useCallback(() => {
    setShowCaptions((prev) => !prev);
  }, []);

  const toggleAutoplayNext = useCallback(() => {
    setAutoplayNext((prev) => !prev);
  }, []);

  const setActiveProvider = useCallback((provider: PlaybackProviderType) => {
    setActiveProviderState(provider);
    localStorage.setItem("yt-playback-provider", provider);
  }, []);

  // Sync fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Listen for video element events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDurationChange = () => setDuration(video.duration || 0);
    const onProgress = () => {
      if (video.buffered.length > 0 && video.duration > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBufferedPercent(Math.min(100, (bufferedEnd / video.duration) * 100));
      }
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("progress", onProgress);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("progress", onProgress);
    };
  }, [registerVideoElement]);

  // Periodic watch progress recording (every 5s when playing)
  useEffect(() => {
    if (!isPlaying || !initialVideoId || currentTime <= 0) return;

    const interval = setInterval(() => {
      fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: initialVideoId,
          title: initialTitle || "YouTube Video",
          channelTitle: initialChannelTitle || "YouTube Creator",
          progressSeconds: Math.floor(currentTime),
          totalSeconds: Math.floor(duration || 0),
        }),
      }).catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, initialVideoId, initialTitle, initialChannelTitle, currentTime, duration]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger hotkeys if user is focused inside an input or textarea
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "j":
          e.preventDefault();
          seek(currentTime - 10);
          break;
        case "l":
          e.preventDefault();
          seek(currentTime + 10);
          break;
        case "arrowleft":
          e.preventDefault();
          seek(currentTime - 5);
          break;
        case "arrowright":
          e.preventDefault();
          seek(currentTime + 5);
          break;
        case "arrowup":
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.05));
          break;
        case "arrowdown":
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.05));
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
          toggleTheaterMode();
          break;
        case "c":
          e.preventDefault();
          toggleCaptions();
          break;
        default:
          if (e.key >= "0" && e.key <= "9" && duration > 0) {
            e.preventDefault();
            const pct = parseInt(e.key, 10) / 10;
            seek(duration * pct);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    togglePlay,
    seek,
    currentTime,
    duration,
    volume,
    setVolume,
    toggleMute,
    toggleFullscreen,
    toggleTheaterMode,
    toggleCaptions,
  ]);

  return (
    <PlayerContext.Provider
      value={{
        isPlaying,
        currentTime,
        duration,
        bufferedPercent,
        volume,
        isMuted,
        playbackRate,
        quality,
        isTheaterMode,
        isFullscreen,
        isPiP,
        showCaptions,
        autoplayNext,
        activeProvider,
        showControls,
        togglePlay,
        play,
        pause,
        seek,
        setVolume,
        toggleMute,
        setPlaybackRate,
        setQuality,
        toggleTheaterMode,
        toggleFullscreen,
        togglePiP,
        toggleCaptions,
        toggleAutoplayNext,
        setActiveProvider,
        setShowControls,
        registerVideoElement,
        registerContainerElement,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}
