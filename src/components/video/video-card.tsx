"use client";

import React from "react";
import Link from "next/link";
import { YouTubeVideo } from "@/services/youtube/types";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/utils";

interface VideoCardProps {
  video: YouTubeVideo;
  progressPercent?: number;
  layout?: "grid" | "list";
}

export function VideoCard({
  video,
  progressPercent,
  layout = "grid",
}: VideoCardProps) {
  const thumbnail =
    video.thumbnails.maxres?.url ||
    video.thumbnails.high?.url ||
    video.thumbnails.medium?.url ||
    video.thumbnails.default?.url ||
    `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;

  if (layout === "list") {
    return (
      <div className="group flex flex-col sm:flex-row gap-3 w-full hover:bg-accent/40 p-2 rounded-xl transition-colors">
        {/* Thumbnail Container */}
        <Link
          href={`/watch?v=${video.id}`}
          className="relative aspect-video w-full sm:w-64 shrink-0 overflow-hidden rounded-xl bg-muted"
        >
          <img
            src={thumbnail}
            alt={video.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {video.durationFormatted && (
            <div className="absolute bottom-2 right-2">
              <Badge variant="duration">{video.durationFormatted}</Badge>
            </div>
          )}
          {progressPercent !== undefined && progressPercent > 0 && (
            <div className="absolute bottom-0 left-0 h-1 w-full bg-white/30">
              <div
                className="h-full bg-red-600"
                style={{ width: `${Math.min(100, progressPercent)}%` }}
              />
            </div>
          )}
        </Link>

        {/* Video Info */}
        <div className="flex flex-1 flex-col justify-start py-0.5">
          <Link href={`/watch?v=${video.id}`}>
            <h3 className="line-clamp-2 text-sm sm:text-base font-semibold leading-snug hover:text-red-500 transition-colors">
              {video.title}
            </h3>
          </Link>

          <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
            <Link
              href={`/channel/${video.channelId}`}
              className="hover:text-foreground transition-colors font-medium"
            >
              {video.channelTitle}
            </Link>
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground pt-0.5">
            <span>{video.viewCountFormatted}</span>
            <span>•</span>
            <span>{formatRelativeTime(video.publishedAt)}</span>
          </div>

          {video.description && (
            <p className="line-clamp-2 text-xs text-muted-foreground/80 pt-2 hidden sm:block">
              {video.description}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Default Grid Layout
  return (
    <div className="group flex flex-col gap-2 w-full">
      {/* Thumbnail */}
      <Link
        href={`/watch?v=${video.id}`}
        className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted shadow-xs"
      >
        <img
          src={thumbnail}
          alt={video.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {video.durationFormatted && (
          <div className="absolute bottom-2 right-2">
            <Badge variant="duration">{video.durationFormatted}</Badge>
          </div>
        )}
        {progressPercent !== undefined && progressPercent > 0 && (
          <div className="absolute bottom-0 left-0 h-1 w-full bg-white/30">
            <div
              className="h-full bg-red-600"
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
          </div>
        )}
      </Link>

      {/* Details Row: Avatar + Title & Metadata */}
      <div className="flex items-start gap-3 pt-1">
        <Link href={`/channel/${video.channelId}`} className="shrink-0 pt-0.5">
          <Avatar
            src={video.channelThumbnailUrl}
            alt={video.channelTitle}
            fallback={video.channelTitle}
            size="md"
          />
        </Link>

        <div className="flex flex-1 flex-col overflow-hidden">
          <Link href={`/watch?v=${video.id}`}>
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug hover:text-red-500 transition-colors">
              {video.title}
            </h3>
          </Link>

          <Link
            href={`/channel/${video.channelId}`}
            className="truncate text-xs font-medium text-muted-foreground hover:text-foreground transition-colors pt-1"
          >
            {video.channelTitle}
          </Link>

          <div className="flex items-center gap-1 text-xs text-muted-foreground pt-0.5">
            <span>{video.viewCountFormatted}</span>
            <span>•</span>
            <span>{formatRelativeTime(video.publishedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
