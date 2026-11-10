"use client";

import React from "react";
import { PlayerProvider, usePlayer } from "./player-context";
import { HTML5Player } from "./html5-player";
import { EmbedPlayer } from "./embed-player";
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

function VideoPlayerInner({
  videoId,
  title,
  channelTitle,
  thumbnailUrl,
  initialProgressSeconds,
  onEnded,
  onNextVideo,
}: VideoPlayerProps) {
  const { activeProvider, isTheaterMode } = usePlayer();

  return (
    <div
      className={cn(
        "w-full transition-all duration-300 ease-in-out",
        isTheaterMode
          ? "max-w-none col-span-full mb-4"
          : "max-w-5xl mx-auto mb-3"
      )}
    >
      {activeProvider === "html5" ? (
        <HTML5Player
          videoId={videoId}
          title={title}
          channelTitle={channelTitle}
          thumbnailUrl={thumbnailUrl}
          initialProgressSeconds={initialProgressSeconds}
          onEnded={onEnded}
          onNextVideo={onNextVideo}
        />
      ) : (
        <EmbedPlayer
          videoId={videoId}
          initialProgressSeconds={initialProgressSeconds}
        />
      )}
    </div>
  );
}

export function VideoPlayer(props: VideoPlayerProps) {
  return (
    <PlayerProvider
      initialVideoId={props.videoId}
      initialTitle={props.title}
      initialChannelTitle={props.channelTitle}
    >
      <VideoPlayerInner {...props} />
    </PlayerProvider>
  );
}
