"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, RefreshCw, AlertCircle } from "lucide-react";
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
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [commentsDisabled, setCommentsDisabled] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [isInputActive, setIsInputActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "error" | "info" | "success";
    text: string;
  } | null>(null);

  // Load initial comments & local guest comments
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setCommentsDisabled(false);
    setFeedbackMessage(null);

    // Get any locally stored guest comments for this video
    let localComments: YouTubeComment[] = [];
    try {
      const stored = localStorage.getItem(`yt_local_comments_${videoId}`);
      if (stored) {
        localComments = JSON.parse(stored);
      }
    } catch {
      localComments = [];
    }

    fetch(`/api/youtube/comments?videoId=${encodeURIComponent(videoId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (isCancelled) return;
        if (data.commentsDisabled) {
          setCommentsDisabled(true);
          setComments(localComments);
        } else if (data.comments) {
          // Merge local guest comments at the top, then remote comments
          setComments([...localComments, ...data.comments]);
          setNextPageToken(data.nextPageToken);
        } else {
          setComments(localComments);
        }
      })
      .catch((err) => {
        console.warn("Failed to load comments:", err);
        if (!isCancelled) setComments(localComments);
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [videoId]);

  // Load more comments pagination
  const handleLoadMore = async () => {
    if (!nextPageToken || loadingMore) return;
    setLoadingMore(true);

    try {
      const res = await fetch(
        `/api/youtube/comments?videoId=${encodeURIComponent(
          videoId
        )}&pageToken=${encodeURIComponent(nextPageToken)}`
      );
      const data = await res.json();
      if (data.comments && data.comments.length > 0) {
        setComments((prev) => [...prev, ...data.comments]);
        setNextPageToken(data.nextPageToken);
      } else {
        setNextPageToken(undefined);
      }
    } catch (err) {
      console.warn("Failed to load more comments:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || submitting) return;

    setFeedbackMessage(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/youtube/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          text: newCommentText.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setFeedbackMessage({
          type: "error",
          text: data.error || "Failed to post comment.",
        });
        return;
      }

      const postedComment: YouTubeComment = data.comment || {
        id: `guest_${Date.now()}`,
        authorDisplayName: "You (Guest)",
        authorProfileImageUrl:
          "https://yt3.ggpht.com/default=s88-c-k-c0x00ffffff-no-rj",
        textDisplay: newCommentText.trim(),
        likeCount: 0,
        publishedAt: "Just now",
        replyCount: 0,
      };

      // Update state
      setComments((prev) => [postedComment, ...prev]);

      // Save to localStorage
      try {
        const stored = localStorage.getItem(`yt_local_comments_${videoId}`);
        const list = stored ? JSON.parse(stored) : [];
        list.unshift(postedComment);
        localStorage.setItem(`yt_local_comments_${videoId}`, JSON.stringify(list));
      } catch {
        // ignore localStorage quota errors
      }

      setNewCommentText("");
      setIsInputActive(false);
      setFeedbackMessage({
        type: "success",
        text: "Your comment was posted!",
      });
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      setFeedbackMessage({
        type: "error",
        text: err.message || "Failed to post comment.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pt-4 border-t">
      {/* Comments Header */}
      <div className="flex items-center gap-3">
        <MessageSquare className="h-5 w-5 text-red-500" />
        <h2 className="text-base sm:text-lg font-bold">
          {comments.length > 0
            ? `${comments.length.toLocaleString()} Comments`
            : initialCommentsCount > 0
            ? `${initialCommentsCount.toLocaleString()} Comments`
            : "Comments"}
        </h2>
      </div>

      {/* Post Comment Input */}
      {!commentsDisabled && (
        <form onSubmit={handlePostComment} className="flex gap-3 items-start">
          <Avatar fallback="G" size="md" className="shrink-0 mt-0.5" />
          <div className="flex-1 flex flex-col gap-2">
            <textarea
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              onFocus={() => setIsInputActive(true)}
              placeholder="Add a comment..."
              rows={isInputActive ? 3 : 1}
              className="w-full resize-none rounded-xl border bg-transparent p-3 text-xs sm:text-sm placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-red-500 transition-all leading-relaxed"
            />

            {feedbackMessage && (
              <div
                className={`text-xs p-2 rounded-lg ${
                  feedbackMessage.type === "error"
                    ? "bg-destructive/10 text-destructive border border-destructive/20"
                    : feedbackMessage.type === "success"
                    ? "bg-green-500/10 text-green-500 border border-green-500/20"
                    : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                }`}
              >
                {feedbackMessage.text}
              </div>
            )}

            {isInputActive && (
              <div className="flex items-center justify-end gap-2 pt-1 animate-in fade-in duration-100">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsInputActive(false);
                    setNewCommentText("");
                    setFeedbackMessage(null);
                  }}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newCommentText.trim() || submitting}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-medium"
                >
                  {submitting ? "Posting..." : "Comment"}
                </Button>
              </div>
            )}
          </div>
        </form>
      )}

      {/* Comments Disabled Notice */}
      {commentsDisabled && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-secondary/30 text-xs text-muted-foreground border">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
          <span>Comments are turned off for this video.</span>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-9 w-9 rounded-full shrink-0" />
              <div className="flex flex-col gap-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comments List */}
      {!loading && (
        <div className="flex flex-col gap-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              videoId={videoId}
            />
          ))}

          {comments.length === 0 && !commentsDisabled && (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No comments yet. Be the first to comment!
            </div>
          )}

          {/* Load More Button */}
          {nextPageToken && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="gap-2 text-xs rounded-full px-6 font-medium"
              >
                {loadingMore && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                <span>{loadingMore ? "Loading..." : "Load More Comments"}</span>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
