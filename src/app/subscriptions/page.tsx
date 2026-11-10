"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { YouTubeChannel, YouTubeVideo } from "@/services/youtube/types";
import { Avatar } from "@/components/ui/avatar";
import { VideoGrid } from "@/components/video/video-grid";
import { Skeleton } from "@/components/ui/skeleton";

export default function SubscriptionsPage() {
  const [channels, setChannels] = useState<YouTubeChannel[]>([]);
  const [feedVideos, setFeedVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    Promise.all([
      fetch("/api/youtube/subscriptions").then((r) => r.json()),
      fetch("/api/youtube/feed").then((r) => r.json()),
    ])
      .then(([subData, feedData]) => {
        if (subData.channels) setChannels(subData.channels);
        if (feedData.videos) setFeedVideos(feedData.videos);
      })
      .catch((err) => console.warn("Failed to load subscriptions:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto p-2 sm:p-4">
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Subscriptions</h1>

      {/* Subscribed Channels Bar */}
      <div className="flex items-center gap-4 overflow-x-auto pb-3 border-b scrollbar-none">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1 shrink-0">
                <Skeleton className="h-14 w-14 rounded-full" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))
          : channels.map((ch) => (
              <Link
                key={ch.id}
                href={`/channel/${ch.id}`}
                className="group flex flex-col items-center gap-1.5 shrink-0 p-1 hover:opacity-85 transition-opacity"
              >
                <Avatar
                  src={ch.avatarUrl}
                  alt={ch.title}
                  fallback={ch.title}
                  size="lg"
                  className="ring-2 ring-transparent group-hover:ring-red-500 transition-all"
                />
                <span className="text-[11px] font-medium truncate max-w-[72px] text-center">
                  {ch.title}
                </span>
              </Link>
            ))}
      </div>

      {/* Latest Uploads Feed */}
      <div>
        <h2 className="text-base font-semibold pb-4">Latest Uploads</h2>
        <VideoGrid videos={feedVideos} loading={loading} />
      </div>
    </div>
  );
}
