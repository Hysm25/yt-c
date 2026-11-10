"use client";

import React, { useState, useEffect } from "react";
import { YouTubeComment } from "@/services/youtube/types";
import { CommentItem } from "./comment-item";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface CommentSectionProps {
  videoId: string;
  initialCommentsCount?: number;
}

export function CommentSection({
  videoId,
  initialCommentsCount = 0,
}: CommentSectionProps) {
  const [comments, setComments] = useState<YouTubeComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCommentText, setNewCommentText] = useState("");
  const [isInputActive, setIsInputActive] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/youtube/comments?videoId=${encodeURIComponent(videoId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.comments) setComments(data.comments);
      })
      .catch((err) => console.warn("Failed to load comments:", err))
      .finally(() => setLoading(false));
  }, [videoId]);

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment: YouTubeComment = {
      id: `local_${Date.now()}`,
      authorDisplayName: "You",
      authorProfileImageUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
      textDisplay: newCommentText.trim(),
      likeCount: 0,
      publishedAt: new Date().toISOString(),
    };

    setComments((prev) => [newComment, ...prev]);
    setNewCommentText("");
    setIsInputActive(false);
  };

  return (
    <div className="flex flex-col gap-4 w-full pt-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h2 className="text-base sm:text-lg font-bold">
          {comments.length || initialCommentsCount} Comments
        </h2>
      </div>

      {/* Comment Input */}
      <form onSubmit={handlePostComment} className="flex gap-3 items-start">
        <Avatar fallback="ME" size="md" className="shrink-0 mt-0.5" />
        <div className="flex flex-1 flex-col gap-2">
          <input
            type="text"
            placeholder="Add a comment..."
            value={newCommentText}
            onFocus={() => setIsInputActive(true)}
            onChange={(e) => setNewCommentText(e.target.value)}
            className="w-full border-b border-border bg-transparent pb-1.5 text-xs sm:text-sm focus:border-foreground focus:outline-none transition-colors"
          />
          {isInputActive && (
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsInputActive(false);
                  setNewCommentText("");
                }}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                variant="default"
                disabled={!newCommentText.trim()}
                className="text-xs"
              >
                Comment
              </Button>
            </div>
          )}
        </div>
      </form>

      {/* Comments List */}
      <div className="flex flex-col gap-2 divide-y divide-border/40">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3 py-3">
              <Skeleton className="h-9 w-9 rounded-full shrink-0" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-3 w-1/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
          ))
        ) : comments.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  );
}
