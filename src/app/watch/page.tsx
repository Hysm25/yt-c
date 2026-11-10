"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { YouTubeVideo, YouTubeChannel } from "@/services/youtube/types";
import { VideoPlayer } from "@/components/player/video-player";
import { VideoInfo } from "@/components/video/video-info";
import { CommentSection } from "@/components/comments/comment-section";
import { VideoCard } from "@/components/video/video-card";
import { Skeleton } from "@/components/ui/skeleton";

function WatchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoId = searchParams.get("v") || "dQw4w9WgXcQ";

  const [video, setVideo] = useState<YouTubeVideo | null>(null);
  const [channel, setChannel] = useState<YouTubeChannel | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<YouTubeVideo[]>([]);
  const [initialProgress, setInitialProgress] = useState(0);
  const [loading, setLoading] = useState(true);

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

  const handleNextVideo = () => {
    if (relatedVideos.length > 0) {
      router.push(`/watch?v=${relatedVideos[0].id}`);
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto p-0 sm:p-4">
      {/* Main Watch Column: Video Player, Video Metadata, Comments */}
      <div className="lg:col-span-2 flex flex-col gap-4 px-2 sm:px-0">
        {/* Player Container */}
        <VideoPlayer
          videoId={videoId}
          title={video?.title}
          channelTitle={video?.channelTitle}
          thumbnailUrl={video?.thumbnails.maxres?.url || video?.thumbnails.high?.url}
          initialProgressSeconds={initialProgress}
          onEnded={handleNextVideo}
          onNextVideo={handleNextVideo}
        />

        {/* Video Info: Title, Actions, Channel, Description */}
        {video && <VideoInfo video={video} channel={channel} />}

        {/* Comments Section */}
        <CommentSection
          videoId={videoId}
          initialCommentsCount={video?.commentCount || 0}
        />
      </div>

      {/* Right Column: Up Next / Related Videos */}
      <div className="flex flex-col gap-3 px-3 sm:px-0 pb-12 sm:pb-0">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-1 pb-1">
          Related Videos
        </h3>
        <div className="flex flex-col gap-3">
          {relatedVideos.map((rel) => (
            <VideoCard key={rel.id} video={rel} layout="list" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading player...</div>}>
      <WatchPageContent />
    </Suspense>
  );
}
