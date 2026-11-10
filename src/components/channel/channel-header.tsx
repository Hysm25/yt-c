"use client";

import React, { useState } from "react";
import { YouTubeChannel } from "@/services/youtube/types";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

interface ChannelHeaderProps {
  channel: YouTubeChannel;
}

export function ChannelHeader({ channel }: ChannelHeaderProps) {
  const [isSubscribed, setIsSubscribed] = useState(false);

  return (
    <div className="flex flex-col w-full pb-6 border-b">
      {/* Banner */}
      {channel.bannerUrl ? (
        <div className="relative h-32 sm:h-48 md:h-64 w-full overflow-hidden rounded-2xl bg-muted mb-4">
          <img
            src={channel.bannerUrl}
            alt={channel.title}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="h-24 sm:h-36 w-full rounded-2xl bg-gradient-to-r from-red-600/30 via-zinc-800 to-zinc-900 mb-4" />
      )}

      {/* Info Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-4">
          <Avatar
            src={channel.avatarUrl}
            alt={channel.title}
            fallback={channel.title}
            size="xl"
            className="border-2 border-background"
          />
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl font-bold">{channel.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-0.5">
              {channel.customUrl && <span>{channel.customUrl}</span>}
              <span>•</span>
              <span>{channel.subscriberCountFormatted}</span>
              <span>•</span>
              <span>{channel.videoCount} videos</span>
            </div>
            {channel.description && (
              <p className="line-clamp-2 text-xs text-muted-foreground pt-2 max-w-xl">
                {channel.description}
              </p>
            )}
          </div>
        </div>

        {/* Subscribe Button */}
        <Button
          variant={isSubscribed ? "secondary" : "default"}
          size="default"
          onClick={() => setIsSubscribed(!isSubscribed)}
          className={`gap-1.5 font-medium ${
            isSubscribed
              ? "bg-secondary text-foreground hover:bg-secondary/80"
              : "bg-foreground text-background hover:bg-foreground/90"
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
  );
}
