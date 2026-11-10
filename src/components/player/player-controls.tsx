"use client";

import React, { useState, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  Tv,
  Film,
  Settings,
  Subtitles,
  PictureInPicture,
  SkipForward,
  Check,
} from "lucide-react";
import { usePlayer } from "./player-context";
import { formatDuration, cn } from "@/lib/utils";

interface PlayerControlsProps {
  onNextVideo?: () => void;
}

export function PlayerControls({ onNextVideo }: PlayerControlsProps) {
  const {
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
    showCaptions,
    autoplayNext,
    activeProvider,
    togglePlay,
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
  } = usePlayer();

  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsSubmenu, setSettingsSubmenu] = useState<"main" | "speed" | "quality">("main");
  const scrubberRef = useRef<HTMLDivElement | null>(null);

  const playedPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleScrubberMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubberRef.current || duration <= 0) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPosition(pos * 100);
    setHoverTime(pos * duration);
  };

  const handleScrubberMouseLeave = () => {
    setHoverTime(null);
  };

  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubberRef.current || duration <= 0) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(pos * duration);
  };

  const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  const qualities = ["auto", "1080p", "720p", "480p", "360p"];

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/20 to-transparent p-2 sm:p-4 text-white transition-opacity duration-300">
      {/* Timeline Scrubber Container */}
      <div
        ref={scrubberRef}
        onMouseMove={handleScrubberMouseMove}
        onMouseLeave={handleScrubberMouseLeave}
        onClick={handleScrubberClick}
        className="group relative flex h-6 w-full cursor-pointer items-center select-none"
      >
        {/* Scrubber Hover Tooltip */}
        {hoverTime !== null && (
          <div
            className="pointer-events-none absolute -top-7 -translate-x-1/2 rounded bg-black/90 px-1.5 py-0.5 text-xs font-mono text-white shadow"
            style={{ left: `${hoverPosition}%` }}
          >
            {formatDuration(hoverTime)}
          </div>
        )}

        {/* Track Background */}
        <div className="relative h-1 w-full rounded-full bg-white/20 transition-all group-hover:h-2">
          {/* Buffered Bar */}
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-white/40"
            style={{ width: `${bufferedPercent}%` }}
          />
          {/* Played Bar */}
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-[#FF0000]"
            style={{ width: `${playedPercent}%` }}
          />
          {/* Scrubber Thumb Knob */}
          <div
            className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-[#FF0000] shadow transition-transform scale-0 group-hover:scale-100"
            style={{ left: `${playedPercent}%` }}
          />
        </div>
      </div>

      {/* Control Buttons Bar */}
      <div className="flex items-center justify-between pt-1">
        {/* Left Controls: Play, Next, Volume, Timestamp */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            title={isPlaying ? "Pause (k)" : "Play (k)"}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 fill-current" />
            ) : currentTime >= duration && duration > 0 ? (
              <RotateCcw className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 fill-current" />
            )}
          </button>

          {/* Next Video */}
          {onNextVideo && (
            <button
              onClick={onNextVideo}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              title="Next video (Shift+N)"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          )}

          {/* Volume Group */}
          <div className="group/volume flex items-center gap-1.5">
            <button
              onClick={toggleMute}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              title={isMuted ? "Unmute (m)" : "Mute (m)"}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-5 w-5 text-red-400" />
              ) : volume < 0.5 ? (
                <Volume1 className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="h-1 w-0 group-hover/volume:w-16 sm:w-16 transition-all duration-200 accent-[#FF0000]"
              title="Volume"
            />
          </div>

          {/* Current / Duration Time */}
          <div className="font-mono text-xs select-none pl-1">
            <span>{formatDuration(currentTime)}</span>
            <span className="text-white/60 mx-1">/</span>
            <span className="text-white/80">{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Right Controls: Autoplay, CC, Settings, PiP, Theater, Fullscreen */}
        <div className="relative flex items-center gap-1 sm:gap-2">
          {/* Autoplay Next Toggle */}
          <button
            onClick={toggleAutoplayNext}
            className={cn(
              "flex h-8 px-2 items-center rounded-full text-xs font-medium transition-colors",
              autoplayNext
                ? "text-white bg-white/20"
                : "text-white/50 hover:bg-white/10"
            )}
            title={`Autoplay is ${autoplayNext ? "ON" : "OFF"}`}
          >
            <span className="hidden sm:inline mr-1 text-[11px]">Auto</span>
            <div
              className={cn(
                "h-2.5 w-2.5 rounded-full transition-colors",
                autoplayNext ? "bg-[#FF0000]" : "bg-white/40"
              )}
            />
          </button>

          {/* Subtitles / CC */}
          <button
            onClick={toggleCaptions}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
              showCaptions
                ? "text-[#FF0000] border-b-2 border-[#FF0000] bg-white/10"
                : "text-white hover:bg-white/20"
            )}
            title="Subtitles / Closed Captions (c)"
          >
            <Subtitles className="h-4 w-4" />
          </button>

          {/* Settings Menu Gear */}
          <div className="relative">
            <button
              onClick={() => {
                setIsSettingsOpen(!isSettingsOpen);
                setSettingsSubmenu("main");
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              title="Player Settings"
            >
              <Settings className="h-4 w-4" />
            </button>

            {/* Settings Popup Menu */}
            {isSettingsOpen && (
              <div className="absolute right-0 bottom-11 z-50 w-56 rounded-xl border border-white/10 bg-black/90 p-2 text-xs shadow-2xl backdrop-blur-md">
                {settingsSubmenu === "main" && (
                  <div className="flex flex-col gap-1">
                    <div className="px-2 py-1 font-semibold text-white/50 uppercase tracking-wider text-[10px]">
                      Playback Settings
                    </div>

                    {/* Speed row */}
                    <button
                      onClick={() => setSettingsSubmenu("speed")}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/15 transition-colors"
                    >
                      <span>Playback Speed</span>
                      <span className="text-white/70">{playbackRate}x</span>
                    </button>

                    {/* Quality row */}
                    <button
                      onClick={() => setSettingsSubmenu("quality")}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/15 transition-colors"
                    >
                      <span>Quality</span>
                      <span className="text-white/70 uppercase">{quality}</span>
                    </button>

                    {/* Provider Toggle row */}
                    <div className="my-1 border-t border-white/10" />
                    <button
                      onClick={() => {
                        const next = activeProvider === "html5" ? "embed" : "html5";
                        setActiveProvider(next);
                      }}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/15 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {activeProvider === "html5" ? (
                          <Film className="h-3.5 w-3.5 text-red-400" />
                        ) : (
                          <Tv className="h-3.5 w-3.5 text-blue-400" />
                        )}
                        <span>Active Engine</span>
                      </div>
                      <span className="text-[#FF0000] font-semibold uppercase">
                        {activeProvider}
                      </span>
                    </button>
                  </div>
                )}

                {settingsSubmenu === "speed" && (
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => setSettingsSubmenu("main")}
                      className="px-2.5 py-1 text-left font-semibold text-white/60 hover:text-white"
                    >
                      ← Back
                    </button>
                    {speeds.map((rate) => (
                      <button
                        key={rate}
                        onClick={() => {
                          setPlaybackRate(rate);
                          setIsSettingsOpen(false);
                        }}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/15 transition-colors"
                      >
                        <span>{rate === 1 ? "Normal (1x)" : `${rate}x`}</span>
                        {playbackRate === rate && (
                          <Check className="h-3.5 w-3.5 text-red-500" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {settingsSubmenu === "quality" && (
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => setSettingsSubmenu("main")}
                      className="px-2.5 py-1 text-left font-semibold text-white/60 hover:text-white"
                    >
                      ← Back
                    </button>
                    {qualities.map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setQuality(q);
                          setIsSettingsOpen(false);
                        }}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/15 transition-colors"
                      >
                        <span className="uppercase">{q}</span>
                        {quality === q && (
                          <Check className="h-3.5 w-3.5 text-red-500" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Picture-in-Picture */}
          <button
            onClick={togglePiP}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            title="Picture in Picture"
          >
            <PictureInPicture className="h-4 w-4" />
          </button>

          {/* Theater Mode */}
          <button
            onClick={toggleTheaterMode}
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            title="Theater mode (t)"
          >
            <div
              className={cn(
                "h-3.5 rounded-xs border border-current transition-all",
                isTheaterMode ? "w-5 border-red-500" : "w-4"
              )}
            />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            title="Fullscreen (f)"
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
