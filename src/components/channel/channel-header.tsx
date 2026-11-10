"use client";

import React, { useState, useEffect } from "react";
import { YouTubeChannel } from "@/services/youtube/types";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bell, ExternalLink } from "lucide-react";

interface ChannelHeaderProps {
  channel: YouTubeChannel;
}

export function ChannelHeader({ channel }: ChannelHeaderProps) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [bannerError, setBannerError] = useState(false);

  useEffect(() => {
    if (!channel?.id) return;
    fetch(`/api/youtube/subscriptions?channelId=${encodeURIComponent(channel.id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.isSubscribed !== undefined) {
          setIsSubscribed(Boolean(data.isSubscribed));
        }
      })
      .catch(() => {});
  }, [channel?.id]);

  const handleToggleSubscribe = async () => {
    if (subscribing || !channel?.id) return;
    setSubscribing(true);
    try {
      const res = await fetch("/api/youtube/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: channel.id,
          channelTitle: channel.title,
          avatarUrl: channel.avatarUrl,
        }),
      });
      const data = await res.json();
      if (data.success && data.subscribed !== undefined) {
        setIsSubscribed(data.subscribed);
      }
    } catch (err) {
      console.warn("Toggle subscription error:", err);
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="flex flex-col w-full pb-6 border-b">
      {/* Banner */}
      {channel.bannerUrl && !bannerError ? (
        <div className="relative h-32 sm:h-48 md:h-64 w-full overflow-hidden rounded-2xl bg-zinc-900 mb-4">
          <img
            src={channel.bannerUrl}
            alt={channel.title}
            onError={() => setBannerError(true)}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="h-28 sm:h-40 w-full rounded-2xl bg-gradient-to-r from-red-600/30 via-zinc-800 to-zinc-900 mb-4 flex items-end p-4">
          <div className="text-xs font-medium text-white/50 tracking-wide uppercase">
            {channel.title}
          </div>
        </div>
      )}

      {/* Info Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-2">
        <div className="flex items-start sm:items-center gap-4">
          <Avatar
            src={channel.avatarUrl}
            alt={channel.title}
            fallback={channel.title}
            size="xl"
            className="border-2 border-background shadow-md shrink-0 h-16 w-16 sm:h-20 sm:w-20"
          />
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl font-bold">{channel.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-0.5">
              {channel.customUrl && (
                <span className="font-medium text-foreground">
                  {channel.customUrl.startsWith("@")
                    ? channel.customUrl
                    : `@${channel.customUrl}`}
                </span>
              )}
              {channel.subscriberCountFormatted && (
                <>
                  <span>•</span>
                  <span>{channel.subscriberCountFormatted}</span>
                </>
              )}
              {channel.videoCount > 0 && (
                <>
                  <span>•</span>
                  <span>{channel.videoCount.toLocaleString()} videos</span>
                </>
              )}
            </div>
            {channel.description && (
              <p className="line-clamp-2 text-xs text-muted-foreground pt-2 max-w-xl leading-relaxed">
                {channel.description}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <a
            href={
              channel.customUrl
                ? `https://www.youtube.com/${channel.customUrl.startsWith("@") ? channel.customUrl : "@" + channel.customUrl}`
                : `https://www.youtube.com/channel/${channel.id}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-xs font-medium transition-colors"
            title="Open Channel on YouTube"
          >
            <span>YouTube</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <Button
            variant={isSubscribed ? "secondary" : "default"}
            size="default"
            disabled={subscribing}
            onClick={handleToggleSubscribe}
            className={`gap-1.5 font-medium ${
              isSubscribed
                ? "bg-secondary text-foreground hover:bg-secondary/80"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
          >
            {isSubscribed ? (
              <>
                <Bell className="h-4 w-4 fill-current" />
                <span>Subscribed</span>
              </>
            ) : (
              <span>Subscribe</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
