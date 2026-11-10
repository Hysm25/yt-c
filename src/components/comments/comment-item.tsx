"use client";

import React, { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { YouTubeComment } from "@/services/youtube/types";
import { Avatar } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/utils";

interface CommentItemProps {
  comment: YouTubeComment;
}

export function CommentItem({ comment }: CommentItemProps) {
  const [likes, setLikes] = useState(comment.likeCount || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);

  const toggleLike = () => {
    setIsLiked(!isLiked);
    setLikes((prev) => (isLiked ? Math.max(0, prev - 1) : prev + 1));
    if (isDisliked) setIsDisliked(false);
  };

  const toggleDislike = () => {
    setIsDisliked(!isDisliked);
    if (!isDisliked && isLiked) {
      setIsLiked(false);
      setLikes((prev) => Math.max(0, prev - 1));
    }
  };

  return (
    <div className="flex gap-3 items-start py-2 group">
      <Avatar
        src={comment.authorProfileImageUrl}
        alt={comment.authorDisplayName}
        fallback={comment.authorDisplayName}
        size="md"
        className="shrink-0"
      />
      <div className="flex flex-col flex-1 text-xs sm:text-sm">
        {/* Author & Timestamp */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs text-foreground">
            {comment.authorDisplayName}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {formatRelativeTime(comment.publishedAt)}
          </span>
        </div>

        {/* Comment Text */}
        <p className="whitespace-pre-line text-foreground/90 pt-1 leading-relaxed">
          {comment.textDisplay}
        </p>

        {/* Likes / Reply Actions */}
        <div className="flex items-center gap-3 pt-2 text-xs text-muted-foreground">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-1 hover:text-foreground transition-colors ${
              isLiked ? "text-red-500 font-semibold" : ""
            }`}
          >
            <ThumbsUp className={`h-3.5 w-3.5 ${isLiked ? "fill-current" : ""}`} />
            {likes > 0 && <span>{likes.toLocaleString()}</span>}
          </button>

          <button
            onClick={toggleDislike}
            className={`hover:text-foreground transition-colors ${
              isDisliked ? "text-red-500" : ""
            }`}
          >
            <ThumbsDown className={`h-3.5 w-3.5 ${isDisliked ? "fill-current" : ""}`} />
          </button>

          <button className="font-semibold text-[11px] hover:text-foreground transition-colors">
            Reply
          </button>
        </div>
      </div>
    </div>
  );
}
