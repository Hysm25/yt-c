"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { YouTubeChannel, YouTubeVideo } from "@/services/youtube/types";
import { ChannelHeader } from "@/components/channel/channel-header";
import { VideoGrid } from "@/components/video/video-grid";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw, Video as VideoIcon, Info, ExternalLink } from "lucide-react";

export default function ChannelPage() {
  const params = useParams();
  const channelId = params?.id as string;

  const [channel, setChannel] = useState<YouTubeChannel | null>(null);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<"videos" | "about">("videos");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Initial load
  useEffect(() => {
    if (!channelId) return;
    setLoading(true);

    fetch(`/api/youtube/channel/${encodeURIComponent(channelId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.channel) setChannel(data.channel);
        if (data.videos?.videos) {
          setVideos(data.videos.videos);
          setNextPageToken(data.videos.nextPageToken);
        }
      })
      .catch((err) => console.warn("Failed to load channel:", err))
      .finally(() => setLoading(false));
  }, [channelId]);

  // Load more videos pagination
  const handleLoadMore = async () => {
    if (!nextPageToken || loadingMore) return;
    setLoadingMore(true);

    try {
      const res = await fetch(
        `/api/youtube/channel/${encodeURIComponent(channelId)}?pageToken=${encodeURIComponent(
          nextPageToken
        )}`
      );
      const data = await res.json();
      if (data.videos?.videos) {
        setVideos((prev) => [...prev, ...data.videos.videos]);
        setNextPageToken(data.videos.nextPageToken);
      }
    } catch (err) {
      console.warn("Failed to load more channel videos:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 max-w-6xl mx-auto p-4">
        <Skeleton className="h-44 sm:h-56 w-full rounded-2xl" />
        <div className="flex gap-4 items-center">
          <Skeleton className="h-20 w-20 rounded-full shrink-0" />
          <div className="flex flex-col gap-2 flex-1">
            <Skeleton className="h-7 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-video w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="p-16 text-center text-muted-foreground flex flex-col items-center gap-3">
        <Info className="h-8 w-8 text-muted-foreground/60" />
        <span className="text-base font-semibold">Channel not found</span>
        <span className="text-xs text-muted-foreground">
          Unable to retrieve metadata for channel ID: {channelId}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto p-2 sm:p-4 pb-20">
      {/* Channel Header (Banner, Avatar, Subs, Video count) */}
      <ChannelHeader channel={channel} />

      {/* Navigation Tabs */}
      <div className="flex items-center gap-6 border-b text-sm font-semibold">
        <button
          onClick={() => setActiveTab("videos")}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
            activeTab === "videos"
              ? "border-red-500 text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <VideoIcon className="h-4 w-4" />
          <span>Videos ({videos.length}{channel.videoCount > videos.length ? ` of ${channel.videoCount.toLocaleString()}` : ""})</span>
        </button>
        <button
          onClick={() => setActiveTab("about")}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
            activeTab === "about"
              ? "border-red-500 text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Info className="h-4 w-4" />
          <span>About</span>
        </button>
      </div>

      {/* Tab Content: Videos Grid with Pagination */}
      {activeTab === "videos" ? (
        <div className="flex flex-col gap-8">
          <VideoGrid videos={videos} />

          {/* Load More Pagination */}
          {nextPageToken && (
            <div className="flex justify-center pt-2 pb-6">
              <Button
                variant="outline"
                size="default"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="gap-2 px-6 font-medium text-xs border-border bg-card hover:bg-secondary"
              >
                {loadingMore ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-red-500" />
                    <span>Loading more videos...</span>
                  </>
                ) : (
                  <span>Load More Videos</span>
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Tab Content: About Card */
        <div className="flex flex-col gap-6 max-w-3xl bg-secondary/30 p-6 rounded-2xl border text-sm">
          <div>
            <h3 className="font-bold text-base mb-2">Description</h3>
            <p className="whitespace-pre-line text-muted-foreground leading-relaxed text-xs sm:text-sm">
              {channel.description || "No description provided."}
            </p>
          </div>

          <div className="border-t pt-4 flex flex-col gap-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="font-medium text-foreground">Channel Handle</span>
              <span>{channel.customUrl || `@${channel.title.toLowerCase().replace(/\s+/g, "")}`}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="font-medium text-foreground">Subscribers</span>
              <span>{channel.subscriberCountFormatted || "Hidden"}</span>
            </div>
            {channel.videoCount > 0 && (
              <div className="flex items-center justify-between py-1 border-b border-border/50">
                <span className="font-medium text-foreground">Total Uploads</span>
                <span>{channel.videoCount.toLocaleString()} videos</span>
              </div>
            )}
            <div className="flex items-center justify-between py-1">
              <span className="font-medium text-foreground">Channel ID</span>
              <span className="font-mono text-[11px]">{channel.id}</span>
            </div>
          </div>

          <div className="pt-2">
            <a
              href={`https://www.youtube.com/channel/${channel.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-red-500 hover:text-red-400 font-medium"
            >
              <span>View Channel on YouTube</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
