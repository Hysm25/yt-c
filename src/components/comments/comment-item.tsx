"use client";

import React, { useState } from "react";
import {
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronUp,
  CornerDownRight,
  RefreshCw,
} from "lucide-react";
import { YouTubeComment } from "@/services/youtube/types";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils";

interface CommentItemProps {
  comment: YouTubeComment;
  videoId?: string;
}

export function CommentItem({ comment, videoId }: CommentItemProps) {
  const [likes, setLikes] = useState(comment.likeCount || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);

  // Replies state
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<YouTubeComment[]>(comment.replies || []);
  const [loadingReplies, setLoadingReplies] = useState(false);

  // Reply Input state
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

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

  const handleToggleReplies = async () => {
    const nextShow = !showReplies;
    setShowReplies(nextShow);

    // If opening replies and not loaded yet, fetch from API
    if (nextShow && replies.length === 0 && comment.replyCount && comment.replyCount > 0) {
      setLoadingReplies(true);
      try {
        const token = comment.replyContinuationToken || comment.id;
        const res = await fetch(
          `/api/youtube/comments?replyToken=${encodeURIComponent(token)}`
        );
        const data = await res.json();
        if (data.replies && data.replies.length > 0) {
          setReplies(data.replies);
        }
      } catch (err) {
        console.warn("Failed to load comment replies:", err);
      } finally {
        setLoadingReplies(false);
      }
    }
  };

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || submittingReply) return;

    setSubmittingReply(true);
    setReplyError(null);

    try {
      const res = await fetch("/api/youtube/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          parentId: comment.id,
          text: replyText.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setReplyError(data.error || "Failed to post reply.");
        return;
      }

      const newReply: YouTubeComment = data.comment || {
        id: `reply_${Date.now()}`,
        authorDisplayName: "You (Guest)",
        authorProfileImageUrl:
          "https://yt3.ggpht.com/default=s88-c-k-c0x00ffffff-no-rj",
        textDisplay: replyText.trim(),
        likeCount: 0,
        publishedAt: "Just now",
      };

      setReplies((prev) => [newReply, ...prev]);
      setShowReplies(true);
      setReplyText("");
      setIsReplying(false);
    } catch (err: any) {
      setReplyError(err.message || "Network error while submitting reply.");
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <div className="flex gap-3 text-xs leading-relaxed group">
      {/* Author Avatar */}
      <Avatar
        src={comment.authorProfileImageUrl}
        alt={comment.authorDisplayName}
        fallback={comment.authorDisplayName}
        size="sm"
        className="shrink-0 mt-0.5"
      />

      <div className="flex flex-col gap-1 flex-1 min-w-0">
        {/* Author Header */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground truncate max-w-xs">
            {comment.authorDisplayName}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {formatRelativeTime(comment.publishedAt)}
          </span>
        </div>

        {/* Comment Text */}
        <p className="text-foreground/90 whitespace-pre-wrap break-words leading-relaxed text-xs sm:text-sm">
          {comment.textDisplay}
        </p>

        {/* Action Toolbar */}
        <div className="flex items-center gap-3 pt-1 text-muted-foreground">
          {/* Like */}
          <button
            type="button"
            onClick={toggleLike}
            className={`inline-flex items-center gap-1 hover:text-foreground transition-colors ${
              isLiked ? "text-red-500 font-semibold" : ""
            }`}
            aria-label="Like comment"
          >
            <ThumbsUp className={`h-3.5 w-3.5 ${isLiked ? "fill-current" : ""}`} />
            {likes > 0 && <span className="text-[11px]">{likes}</span>}
          </button>

          {/* Dislike */}
          <button
            type="button"
            onClick={toggleDislike}
            className={`inline-flex items-center hover:text-foreground transition-colors ${
              isDisliked ? "text-foreground font-semibold" : ""
            }`}
            aria-label="Dislike comment"
          >
            <ThumbsDown className={`h-3.5 w-3.5 ${isDisliked ? "fill-current" : ""}`} />
          </button>

          {/* Reply Button */}
          <button
            type="button"
            onClick={() => setIsReplying(!isReplying)}
            className="hover:text-foreground font-medium text-[11px] transition-colors"
          >
            Reply
          </button>
        </div>

        {/* Reply Input Form */}
        {isReplying && (
          <form onSubmit={handlePostReply} className="flex flex-col gap-2 pt-2 animate-in fade-in duration-100">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to ${comment.authorDisplayName}...`}
              rows={2}
              className="w-full resize-none rounded-xl border bg-transparent p-2.5 text-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-red-500 leading-relaxed"
            />

            {replyError && (
              <div className="text-[11px] text-destructive bg-destructive/10 p-1.5 rounded-lg border border-destructive/20">
                {replyError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsReplying(false);
                  setReplyText("");
                  setReplyError(null);
                }}
                className="h-7 text-xs px-2.5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!replyText.trim() || submittingReply}
                className="h-7 text-xs px-3 bg-red-600 hover:bg-red-700 text-white font-medium"
              >
                {submittingReply ? "Replying..." : "Reply"}
              </Button>
            </div>
          </form>
        )}

        {/* Replies Toggle (if replies exist or count > 0) */}
        {((comment.replyCount && comment.replyCount > 0) || replies.length > 0) && (
          <div className="pt-1">
            <button
              type="button"
              onClick={handleToggleReplies}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-500 hover:text-blue-400 py-1 transition-colors"
            >
              {showReplies ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              <span>
                {showReplies
                  ? "Hide replies"
                  : `${Math.max(comment.replyCount || 0, replies.length)} replies`}
              </span>
            </button>

            {/* Replies List */}
            {showReplies && (
              <div className="flex flex-col gap-3 pl-4 border-l-2 border-border/60 mt-2">
                {loadingReplies && (
                  <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                    <RefreshCw className="h-3 w-3 animate-spin text-red-500" />
                    <span>Loading replies...</span>
                  </div>
                )}

                {replies.map((reply) => (
                  <div key={reply.id} className="flex gap-2.5 text-xs">
                    <Avatar
                      src={reply.authorProfileImageUrl}
                      alt={reply.authorDisplayName}
                      fallback={reply.authorDisplayName}
                      size="sm"
                      className="shrink-0 h-6 w-6 mt-0.5"
                    />
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground truncate max-w-xs text-[11px]">
                          {reply.authorDisplayName}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatRelativeTime(reply.publishedAt)}
                        </span>
                      </div>
                      <p className="text-foreground/90 whitespace-pre-wrap break-words leading-relaxed text-xs">
                        {reply.textDisplay}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
