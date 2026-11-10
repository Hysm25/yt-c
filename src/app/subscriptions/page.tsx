"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { YouTubeChannel, YouTubeVideo } from "@/services/youtube/types";
import { Avatar } from "@/components/ui/avatar";
import { VideoGrid } from "@/components/video/video-grid";
import { Skeleton } from "@/components/ui/skeleton";
import { Tv, Sparkles, Compass } from "lucide-react";

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
    <div className="flex flex-col gap-6 max-w-7xl mx-auto p-2 sm:p-4 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Subscriptions</h1>
      </div>

      {/* Subscribed Channels Bar */}
      {channels.length > 0 ? (
        <div className="flex items-center gap-4 overflow-x-auto pb-3 border-b scrollbar-none">
          {channels.map((ch) => (
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
      ) : !loading ? (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/10 text-red-500">
              <Tv className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Your Subscribed Channels</h3>
              <p className="text-xs text-muted-foreground pt-0.5">
                Subscribe to your favorite YouTube creators directly on their channel pages to keep track of them here.
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-xs font-medium hover:bg-secondary/80 text-foreground shrink-0 border border-border"
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Discover Channels</span>
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-4 overflow-x-auto pb-3 border-b scrollbar-none">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1 shrink-0">
              <Skeleton className="h-14 w-14 rounded-full" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      )}

      {/* Latest Uploads Feed */}
      <div>
        <div className="flex items-center gap-2 pb-4">
          <Sparkles className="h-4 w-4 text-red-500" />
          <h2 className="text-base font-semibold">Latest Uploads</h2>
        </div>
        <VideoGrid videos={feedVideos} loading={loading} />
      </div>
    </div>
  );
}
