"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ThumbsUp,
  ThumbsDown,
  Share2,
  ListPlus,
  Check,
  Bell,
  CheckCheck,
} from "lucide-react";
import { YouTubeVideo, YouTubeChannel } from "@/services/youtube/types";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/utils";

interface VideoInfoProps {
  video: YouTubeVideo;
  channel?: YouTubeChannel | null;
}

export function VideoInfo({ video, channel }: VideoInfoProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(video.likeCount || 0);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState("");
  const [addedPlaylists, setAddedPlaylists] = useState<Set<string>>(new Set());

  // Check initial like status
  useEffect(() => {
    fetch(`/api/liked?videoId=${encodeURIComponent(video.id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.isLiked) setIsLiked(true);
      })
      .catch(() => {});
  }, [video.id]);

  const handleLikeToggle = async () => {
    try {
      const nextLiked = !isLiked;
      setIsLiked(nextLiked);
      setLikeCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));
      if (nextLiked && isDisliked) setIsDisliked(false);

      await fetch("/api/liked", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: video.id,
          title: video.title,
          channelTitle: video.channelTitle,
          channelId: video.channelId,
          thumbnailUrl: video.thumbnails.high?.url || video.thumbnails.default?.url,
          duration: video.duration,
        }),
      });
    } catch (err) {
      console.warn("Failed to toggle like:", err);
    }
  };

  const handleDislikeToggle = () => {
    setIsDisliked(!isDisliked);
    if (!isDisliked && isLiked) {
      setIsLiked(false);
      setLikeCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openPlaylistModal = async () => {
    setIsPlaylistModalOpen(true);
    try {
      const res = await fetch("/api/playlists");
      const data = await res.json();
      if (data.playlists) setPlaylists(data.playlists);
    } catch (err) {
      console.warn("Failed to fetch playlists:", err);
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    try {
      await fetch(`/api/playlists/${playlistId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: video.id,
          title: video.title,
          channelTitle: video.channelTitle,
          channelId: video.channelId,
          thumbnailUrl: video.thumbnails.high?.url,
          duration: video.duration,
        }),
      });
      setAddedPlaylists((prev) => new Set(prev).add(playlistId));
    } catch (err) {
      console.warn("Failed to add to playlist:", err);
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistTitle.trim()) return;

    try {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newPlaylistTitle.trim() }),
      });
      const data = await res.json();
      if (data.playlist) {
        setPlaylists((prev) => [data.playlist, ...prev]);
        await handleAddToPlaylist(data.playlist.id);
        setNewPlaylistTitle("");
      }
    } catch (err) {
      console.warn("Failed to create playlist:", err);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Title */}
      <h1 className="text-lg sm:text-xl font-bold leading-tight tracking-tight">
        {video.title}
      </h1>

      {/* Channel Row & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        {/* Channel Info + Subscribe */}
        <div className="flex items-center gap-3">
          <Link href={`/channel/${video.channelId}`}>
            <Avatar
              src={channel?.avatarUrl || video.channelThumbnailUrl}
              alt={video.channelTitle}
              fallback={video.channelTitle}
              size="lg"
            />
          </Link>
          <div className="flex flex-col">
            <Link
              href={`/channel/${video.channelId}`}
              className="font-semibold text-sm hover:underline"
            >
              {video.channelTitle}
            </Link>
            <span className="text-xs text-muted-foreground">
              {channel?.subscriberCountFormatted || "1M subscribers"}
            </span>
          </div>

          <Button
            variant={isSubscribed ? "secondary" : "default"}
            size="sm"
            onClick={() => setIsSubscribed(!isSubscribed)}
            className={`ml-2 gap-1.5 font-medium ${
              isSubscribed
                ? "bg-secondary text-foreground hover:bg-secondary/80"
                : "bg-foreground text-background hover:bg-foreground/90"
            }`}
          >
            {isSubscribed ? (
              <>
                <Bell className="h-3.5 w-3.5 fill-current" />
                <span>Subscribed</span>
              </>
            ) : (
              <span>Subscribe</span>
            )}
          </Button>
        </div>

        {/* Action Buttons: Like / Dislike, Share, Save */}
        <div className="flex items-center gap-2">
          {/* Like / Dislike Pill */}
          <div className="flex items-center rounded-full bg-secondary p-0.5">
            <button
              onClick={handleLikeToggle}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-l-full hover:bg-accent transition-colors ${
                isLiked ? "text-red-500" : "text-foreground"
              }`}
            >
              <ThumbsUp
                className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`}
              />
              <span>{likeCount.toLocaleString()}</span>
            </button>
            <div className="h-4 w-px bg-border" />
            <button
              onClick={handleDislikeToggle}
              className={`px-3 py-1.5 text-xs rounded-r-full hover:bg-accent transition-colors ${
                isDisliked ? "text-red-500" : "text-foreground"
              }`}
            >
              <ThumbsDown
                className={`h-4 w-4 ${isDisliked ? "fill-current" : ""}`}
              />
            </button>
          </div>

          {/* Share Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleShare}
            className="gap-1.5 text-xs font-medium"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-green-500" />
                <span className="text-green-500">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5" />
                <span>Share</span>
              </>
            )}
          </Button>

          {/* Save to Playlist Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={openPlaylistModal}
            className="gap-1.5 text-xs font-medium"
          >
            <ListPlus className="h-3.5 w-3.5" />
            <span>Save</span>
          </Button>
        </div>
      </div>

      {/* Expandable Description Box */}
      <div
        onClick={() => !isExpanded && setIsExpanded(true)}
        className="cursor-pointer rounded-2xl bg-secondary/50 hover:bg-secondary/70 p-3.5 sm:p-4 text-xs sm:text-sm transition-colors"
      >
        <div className="flex items-center gap-2 font-semibold pb-1.5 text-xs text-foreground">
          <span>{video.viewCountFormatted}</span>
          <span>•</span>
          <span>{formatRelativeTime(video.publishedAt)}</span>
        </div>

        <div
          className={`whitespace-pre-wrap break-words text-muted-foreground leading-relaxed text-xs sm:text-sm ${
            isExpanded ? "" : "line-clamp-3"
          }`}
        >
          {video.description ? (
            video.description.split(/(https?:\/\/[^\s]+)/g).map((part, idx) => {
              if (part.match(/^https?:\/\//)) {
                return (
                  <a
                    key={idx}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline font-medium break-all"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {part}
                  </a>
                );
              }
              return <React.Fragment key={idx}>{part}</React.Fragment>;
            })
          ) : (
            "No description provided."
          )}
        </div>

        {video.description && video.description.length > 120 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="pt-2 font-semibold text-foreground hover:underline block"
          >
            {isExpanded ? "Show less" : "...more"}
          </button>
        )}
      </div>

      {/* Playlist Modal Dialog */}
      {isPlaylistModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border bg-background p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-semibold text-sm">Save video to playlist</h3>
              <button
                onClick={() => setIsPlaylistModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            {/* List of playlists */}
            <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto py-3">
              {playlists.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2 text-center">
                  No playlists yet. Create one below!
                </p>
              ) : (
                playlists.map((pl) => {
                  const isAdded = addedPlaylists.has(pl.id);
                  return (
                    <button
                      key={pl.id}
                      onClick={() => handleAddToPlaylist(pl.id)}
                      className="flex items-center justify-between rounded-lg p-2 text-xs hover:bg-secondary transition-colors text-left"
                    >
                      <span className="font-medium truncate">{pl.title}</span>
                      {isAdded ? (
                        <CheckCheck className="h-4 w-4 text-green-500" />
                      ) : (
                        <span className="text-muted-foreground text-[10px]">
                          + Add
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* New Playlist Form */}
            <form
              onSubmit={handleCreatePlaylist}
              className="flex items-center gap-2 pt-3 border-t"
            >
              <input
                type="text"
                placeholder="New playlist title..."
                value={newPlaylistTitle}
                onChange={(e) => setNewPlaylistTitle(e.target.value)}
                className="flex-1 rounded-lg border bg-secondary/50 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Button type="submit" size="sm" variant="default" className="text-xs">
                Create
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
