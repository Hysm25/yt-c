"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { YouTubeChannel, YouTubeVideo } from "@/services/youtube/types";
import { ChannelHeader } from "@/components/channel/channel-header";
import { VideoGrid } from "@/components/video/video-grid";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChannelPage() {
  const params = useParams();
  const channelId = params?.id as string;

  const [channel, setChannel] = useState<YouTubeChannel | null>(null);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [activeTab, setActiveTab] = useState<"videos" | "about">("videos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!channelId) return;
    setLoading(true);

    fetch(`/api/youtube/channel/${encodeURIComponent(channelId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.channel) setChannel(data.channel);
        if (data.videos?.videos) setVideos(data.videos.videos);
      })
      .catch((err) => console.warn("Failed to load channel:", err))
      .finally(() => setLoading(false));
  }, [channelId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 max-w-6xl mx-auto p-4">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="flex gap-4 items-center">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex flex-col gap-2 flex-1">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        Channel not found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto p-2 sm:p-4">
      <ChannelHeader channel={channel} />

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b text-sm font-semibold">
        <button
          onClick={() => setActiveTab("videos")}
          className={`pb-2 border-b-2 transition-colors ${
            activeTab === "videos"
              ? "border-red-500 text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Videos
        </button>
        <button
          onClick={() => setActiveTab("about")}
          className={`pb-2 border-b-2 transition-colors ${
            activeTab === "about"
              ? "border-red-500 text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          About
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "videos" ? (
        <VideoGrid videos={videos} />
      ) : (
        <div className="flex flex-col gap-4 max-w-2xl bg-secondary/30 p-6 rounded-2xl border text-sm">
          <h3 className="font-bold text-base">Description</h3>
          <p className="whitespace-pre-line text-muted-foreground leading-relaxed">
            {channel.description || "No description provided."}
          </p>
          <div className="border-t pt-4 flex flex-col gap-1 text-xs text-muted-foreground">
            <div>Joined: {new Date(channel.publishedAt).toLocaleDateString()}</div>
            <div>Total views: {channel.viewCount?.toLocaleString()}</div>
            <div>Subscribers: {channel.subscriberCountFormatted}</div>
          </div>
        </div>
      )}
    </div>
  );
}
