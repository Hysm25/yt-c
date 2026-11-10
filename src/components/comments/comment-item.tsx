"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
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
  const { data: session } = useSession();
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
        const res = await fetch(
          `/api/youtube/comments?replyToken=${encodeURIComponent(comment.id)}`
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

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || submittingReply) return;

    if (!session?.user) {
      window.dispatchEvent(new CustomEvent("trigger-google-signin"));
      return;
    }

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
        setReplyError(
          data.error || "Failed to post reply. Check your YouTube permissions."
        );
        return;
      }

      // Optimistically add reply
      const newReply: YouTubeComment = {
        id: `reply_${Date.now()}`,
        authorDisplayName: session.user.name || "You",
        authorProfileImageUrl:
          session.user.image ||
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
    <div className="flex gap-3 items-start py-3 group">
      <Avatar
        src={comment.authorProfileImageUrl}
        alt={comment.authorDisplayName}
        fallback={comment.authorDisplayName}
        size="md"
        className="shrink-0 mt-0.5"
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

        {/* Likes / Dislikes / Reply Button */}
        <div className="flex items-center gap-3 pt-2 text-xs text-muted-foreground">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-1 hover:text-foreground transition-colors ${
              isLiked ? "text-red-500 font-semibold" : ""
            }`}
          >
            <ThumbsUp
              className={`h-3.5 w-3.5 ${isLiked ? "fill-current" : ""}`}
            />
            {likes > 0 && <span>{likes.toLocaleString()}</span>}
          </button>

          <button
            onClick={toggleDislike}
            className={`hover:text-foreground transition-colors ${
              isDisliked ? "text-red-500" : ""
            }`}
          >
            <ThumbsDown
              className={`h-3.5 w-3.5 ${isDisliked ? "fill-current" : ""}`}
            />
          </button>

          <button
            onClick={() => setIsReplying(!isReplying)}
            className="font-semibold text-[11px] hover:text-foreground transition-colors"
          >
            Reply
          </button>
        </div>

        {/* Inline Reply Input Form */}
        {isReplying && (
          <form onSubmit={handleSubmitReply} className="flex gap-2.5 items-start pt-3">
            <Avatar
              src={session?.user?.image || undefined}
              fallback={session?.user?.name || "U"}
              size="sm"
              className="shrink-0 mt-1"
            />
            <div className="flex flex-1 flex-col gap-1.5">
              <input
                type="text"
                placeholder={
                  session?.user
                    ? `Reply to ${comment.authorDisplayName}...`
                    : "Sign in to post a reply..."
                }
                value={replyText}
                autoFocus
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full border-b border-border bg-transparent pb-1 text-xs focus:border-foreground focus:outline-none transition-colors"
              />
              {replyError && (
                <span className="text-[10px] text-destructive pt-0.5">
                  {replyError}
                </span>
              )}
              <div className="flex items-center justify-end gap-1.5 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsReplying(false);
                    setReplyText("");
                    setReplyError(null);
                  }}
                  className="h-7 px-2 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  variant="default"
                  disabled={!replyText.trim() || submittingReply}
                  className="h-7 px-3 text-xs"
                >
                  {submittingReply && (
                    <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                  )}
                  <span>Reply</span>
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Replies Toggle */}
        {((comment.replyCount && comment.replyCount > 0) || replies.length > 0) && (
          <div className="pt-2">
            <button
              onClick={handleToggleReplies}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-500 hover:text-blue-400 transition-colors"
            >
              {showReplies ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  <span>Hide {replies.length || comment.replyCount} replies</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  <span>
                    View {replies.length || comment.replyCount}{" "}
                    {(replies.length || comment.replyCount) === 1 ? "reply" : "replies"}
                  </span>
                </>
              )}
            </button>

            {/* Replies List */}
            {showReplies && (
              <div className="flex flex-col gap-2.5 pt-2 pl-4 border-l-2 border-border/60 mt-1">
                {loadingReplies ? (
                  <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>Loading replies...</span>
                  </div>
                ) : replies.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-1">
                    No replies loaded.
                  </p>
                ) : (
                  replies.map((rep) => (
                    <div key={rep.id} className="flex gap-2.5 items-start text-xs">
                      <Avatar
                        src={rep.authorProfileImageUrl}
                        alt={rep.authorDisplayName}
                        fallback={rep.authorDisplayName}
                        size="sm"
                        className="shrink-0 mt-0.5"
                      />
                      <div className="flex flex-col flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-foreground">
                            {rep.authorDisplayName}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatRelativeTime(rep.publishedAt)}
                          </span>
                        </div>
                        <p className="whitespace-pre-line text-foreground/90 pt-0.5 leading-relaxed">
                          {rep.textDisplay}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
