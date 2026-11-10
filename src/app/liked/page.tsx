"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ThumbsUp, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/utils";

interface LikedVideoItem {
  id: string;
  videoId: string;
  title: string;
  channelTitle: string;
  channelId?: string;
  thumbnailUrl?: string;
  duration: number;
  likedAt: string;
}

export default function LikedVideosPage() {
  const [liked, setLiked] = useState<LikedVideoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/liked")
      .then((res) => res.json())
      .then((data) => {
        if (data.liked) setLiked(data.liked);
      })
      .catch((err) => console.warn("Failed to load liked videos:", err))
      .finally(() => setLoading(false));
  }, []);

  const firstVideoId = liked[0]?.videoId;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto p-2 sm:p-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600/10 text-red-500">
            <ThumbsUp className="h-6 w-6 fill-current" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Liked Videos</h1>
            <p className="text-xs text-muted-foreground pt-0.5">
              {liked.length} {liked.length === 1 ? "video" : "videos"}
            </p>
          </div>
        </div>

        {firstVideoId && (
          <Link href={`/watch?v=${firstVideoId}`}>
            <Button variant="youtube" size="default" className="gap-2 font-medium">
              <Play className="h-4 w-4 fill-current" />
              <span>Play All</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Videos List */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground">Loading liked videos...</div>
      ) : liked.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <ThumbsUp className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="text-base font-semibold">No liked videos yet</h3>
          <p className="text-xs text-muted-foreground pt-1">
            Hit like on videos you enjoy to save them here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {liked.map((item) => {
            const thumbnail =
              item.thumbnailUrl || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`;
            return (
              <div key={item.id} className="group flex flex-col gap-2">
                <Link
                  href={`/watch?v=${item.videoId}`}
                  className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted"
                >
                  <img
                    src={thumbnail}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {item.duration > 0 && (
                    <div className="absolute bottom-2 right-2">
                      <Badge variant="duration">{formatDuration(item.duration)}</Badge>
                    </div>
                  )}
                </Link>

                <div className="flex flex-col pt-1">
                  <Link href={`/watch?v=${item.videoId}`}>
                    <h3 className="line-clamp-2 text-sm font-semibold hover:text-red-500 transition-colors">
                      {item.title}
                    </h3>
                  </Link>
                  <span className="text-xs text-muted-foreground pt-1">
                    {item.channelTitle}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
