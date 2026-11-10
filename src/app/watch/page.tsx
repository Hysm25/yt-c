"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ListVideo,
  ChevronLeft,
  ChevronRight,
  Play,
  RotateCcw,
} from "lucide-react";
import { YouTubeVideo, YouTubeChannel } from "@/services/youtube/types";
import { VideoPlayer } from "@/components/player/video-player";
import { VideoInfo } from "@/components/video/video-info";
import { VideoCard } from "@/components/video/video-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/utils";

function WatchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoId = searchParams.get("v") || "dQw4w9WgXcQ";
  const listId = searchParams.get("list");
  const rawIndex = parseInt(searchParams.get("index") || "0", 10);
  const currentIndex = isNaN(rawIndex) ? 0 : rawIndex;

  const [video, setVideo] = useState<YouTubeVideo | null>(null);
  const [channel, setChannel] = useState<YouTubeChannel | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<YouTubeVideo[]>([]);
  const [initialProgress, setInitialProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isTheaterMode, setIsTheaterMode] = useState(false);

  // Load theater mode preference on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("yt-theater-mode");
      if (saved === "true") setIsTheaterMode(true);
    } catch {}
  }, []);

  const handleToggleTheaterMode = () => {
    setIsTheaterMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("yt-theater-mode", next ? "true" : "false");
      } catch {}
      return next;
    });
  };

  // Playlist State
  const [playlist, setPlaylist] = useState<any | null>(null);

  // Load playlist if list parameter exists
  useEffect(() => {
    if (!listId) {
      setPlaylist(null);
      return;
    }

    fetch(`/api/playlists/${encodeURIComponent(listId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.playlist) setPlaylist(data.playlist);
      })
      .catch((err) => console.warn("Failed to load playlist queue:", err));
  }, [listId]);

  // Load video details, related videos, and saved watch progress
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setInitialProgress(0);

    // Fetch video details & related
    fetch(`/api/youtube/video/${encodeURIComponent(videoId)}`)
      .then((res) => res.json())
      .then(async (data) => {
        if (isCancelled) return;
        if (data.video) {
          setVideo(data.video);
          if (data.related) setRelatedVideos(data.related);

          // Fetch channel info
          if (data.video.channelId) {
            const chRes = await fetch(
              `/api/youtube/channel/${encodeURIComponent(data.video.channelId)}`
            );
            const chData = await chRes.json();
            if (!isCancelled && chData.channel) setChannel(chData.channel);
          }
        }
      })
      .catch((err) => console.warn("Failed to load video details:", err))
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    // Check saved progress from local history
    fetch(`/api/history?videoId=${encodeURIComponent(videoId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled && data.progress?.progressSeconds) {
          setInitialProgress(data.progress.progressSeconds);
        }
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, [videoId]);

  // Automated progression to next video (playlist or related)
  const handleNextVideo = () => {
    if (playlist?.items && playlist.items.length > 0) {
      const nextIdx = currentIndex + 1;
      if (nextIdx < playlist.items.length) {
        const nextItem = playlist.items[nextIdx];
        router.push(
          `/watch?v=${encodeURIComponent(nextItem.videoId)}&list=${encodeURIComponent(
            listId!
          )}&index=${nextIdx}`
        );
        return;
      }
    }

    if (relatedVideos.length > 0) {
      router.push(`/watch?v=${relatedVideos[0].id}`);
    }
  };

  const handlePrevVideo = () => {
    if (playlist?.items && currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      const prevItem = playlist.items[prevIdx];
      router.push(
        `/watch?v=${encodeURIComponent(prevItem.videoId)}&list=${encodeURIComponent(
          listId!
        )}&index=${prevIdx}`
      );
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto p-2 sm:p-4">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Skeleton className="aspect-video w-full rounded-2xl" />
          <Skeleton className="h-6 w-3/4" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex flex-col gap-2 flex-1">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-3 w-1/6" />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      {/* Theater Mode: Full-Width Player Header */}
      {isTheaterMode && (
        <div className="w-full max-w-[1700px] mx-auto mb-4 px-0 sm:px-4">
          <VideoPlayer
            videoId={videoId}
            title={video?.title}
            channelTitle={video?.channelTitle}
            thumbnailUrl={video?.thumbnails.maxres?.url || video?.thumbnails.high?.url}
            initialProgressSeconds={initialProgress}
            isTheaterMode={true}
            onToggleTheaterMode={handleToggleTheaterMode}
            onEnded={handleNextVideo}
            onNextVideo={handleNextVideo}
          />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto w-full p-0 sm:p-4">
        {/* Main Watch Column: Video Player (if not theater), Video Metadata */}
        <div className="lg:col-span-2 flex flex-col gap-4 px-2 sm:px-0">
          {!isTheaterMode && (
            <VideoPlayer
              videoId={videoId}
              title={video?.title}
              channelTitle={video?.channelTitle}
              thumbnailUrl={video?.thumbnails.maxres?.url || video?.thumbnails.high?.url}
              initialProgressSeconds={initialProgress}
              isTheaterMode={false}
              onToggleTheaterMode={handleToggleTheaterMode}
              onEnded={handleNextVideo}
              onNextVideo={handleNextVideo}
            />
          )}

          {/* Video Info: Title, Actions, Channel, Description */}
          {video && <VideoInfo video={video} channel={channel} />}
        </div>

      {/* Right Column: Playlist Queue (if active) & Related Videos */}
      <div className="flex flex-col gap-4 px-3 sm:px-0 pb-12 sm:pb-0">
        {/* Active Playlist Queue Box */}
        {playlist && playlist.items && playlist.items.length > 0 && (
          <div className="flex flex-col rounded-2xl border border-border bg-card/80 overflow-hidden shadow-sm">
            {/* Playlist Header */}
            <div className="flex items-center justify-between p-3.5 bg-secondary/50 border-b">
              <div className="flex flex-col overflow-hidden">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground truncate">
                  <ListVideo className="h-4 w-4 text-red-500 shrink-0" />
                  <span className="truncate">{playlist.title}</span>
                </div>
                <span className="text-[11px] text-muted-foreground pt-0.5">
                  {currentIndex + 1} / {playlist.items.length} videos
                </span>
              </div>

              {/* Prev / Next controls */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevVideo}
                  disabled={currentIndex === 0}
                  className="p-1 rounded-md hover:bg-accent disabled:opacity-40 transition-colors text-foreground"
                  title="Previous video in playlist"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextVideo}
                  disabled={currentIndex >= playlist.items.length - 1}
                  className="p-1 rounded-md hover:bg-accent disabled:opacity-40 transition-colors text-foreground"
                  title="Next video in playlist"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Tracklist */}
            <div className="flex flex-col max-h-80 overflow-y-auto divide-y divide-border/30 p-1">
              {playlist.items.map((item: any, idx: number) => {
                const isActive = item.videoId === videoId || idx === currentIndex;
                const thumb =
                  item.thumbnailUrl ||
                  `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`;

                return (
                  <Link
                    key={item.id || item.videoId || idx}
                    href={`/watch?v=${encodeURIComponent(
                      item.videoId
                    )}&list=${encodeURIComponent(listId!)}&index=${idx}`}
                    className={`flex items-center gap-2.5 p-2 rounded-xl transition-colors ${
                      isActive
                        ? "bg-secondary/90 font-medium border-l-3 border-red-500"
                        : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="text-[11px] font-mono w-4 text-center shrink-0">
                      {isActive ? <Play className="h-3 w-3 fill-red-500 text-red-500" /> : idx + 1}
                    </span>

                    <div className="relative aspect-video w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                      <img
                        src={thumb}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                      {item.duration > 0 && (
                        <div className="absolute bottom-0.5 right-0.5">
                          <span className="rounded bg-black/80 px-1 py-0.2 text-[9px] text-white">
                            {formatDuration(item.duration)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col overflow-hidden text-xs">
                      <span className={`line-clamp-1 ${isActive ? "text-foreground font-semibold" : ""}`}>
                        {item.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate pt-0.5">
                        {item.channelTitle}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Related Videos */}
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-1">
          Related Videos
        </h3>
        <div className="flex flex-col gap-3">
          {relatedVideos.map((rel) => (
            <VideoCard key={rel.id} video={rel} layout="list" />
          ))}
        </div>
      </div>
    </div>
  </div>
);
}

export default function WatchPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-muted-foreground">
          Loading player...
        </div>
      }
    >
      <WatchPageContent />
    </Suspense>
  );
}
