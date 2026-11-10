import React from "react";
import { YouTubeVideo } from "@/services/youtube/types";
import { VideoCard } from "./video-card";
import { Skeleton } from "@/components/ui/skeleton";

interface VideoGridProps {
  videos: YouTubeVideo[];
  loading?: boolean;
}

export function VideoGrid({ videos, loading = false }: VideoGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="aspect-video w-full rounded-xl" />
            <div className="flex gap-3 pt-1">
              <Skeleton className="h-9 w-9 rounded-full shrink-0" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h3 className="text-base font-semibold">No videos found</h3>
        <p className="text-xs text-muted-foreground pt-1">
          Try a different search query or filter category.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}
