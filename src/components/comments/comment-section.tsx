"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { MessageSquare, RefreshCw, AlertCircle, LogIn } from "lucide-react";
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
  const { data: session } = useSession();
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

  // Load initial comments
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setCommentsDisabled(false);
    setFeedbackMessage(null);

    fetch(`/api/youtube/comments?videoId=${encodeURIComponent(videoId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (isCancelled) return;
        if (data.commentsDisabled) {
          setCommentsDisabled(true);
          setComments([]);
        } else if (data.comments) {
          setComments(data.comments);
          setNextPageToken(data.nextPageToken);
        }
      })
      .catch((err) => console.warn("Failed to load comments:", err))
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

    // If unauthenticated, guide the user to sign in
    if (!session?.user) {
      setFeedbackMessage({
        type: "info",
        text: "Google sign-in is required to post comments to real YouTube videos. Click Sign In above to connect.",
      });
      window.dispatchEvent(new CustomEvent("trigger-google-signin"));
      return;
    }

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
          text:
            data.error ||
            "Failed to post comment. Ensure your Google account has YouTube channel write permissions.",
        });
        return;
      }

      // Optimistically add posted comment to top of comments list
      const newComment: YouTubeComment = {
        id: `posted_${Date.now()}`,
        authorDisplayName: session.user.name || "You",
        authorProfileImageUrl:
          session.user.image || "https://yt3.ggpht.com/default=s88-c-k-c0x00ffffff-no-rj",
        textDisplay: newCommentText.trim(),
        likeCount: 0,
        publishedAt: "Just now",
        replyCount: 0,
      };

      setComments((prev) => [newComment, ...prev]);
      setNewCommentText("");
      setIsInputActive(false);
      setFeedbackMessage({
        type: "success",
        text: "Your comment was posted successfully!",
      });
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      setFeedbackMessage({
        type: "error",
        text: err.message || "Failed to post comment due to network error.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full pt-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-red-500" />
          <span>
            {commentsDisabled
              ? "Comments Turned Off"
              : `${(comments.length || initialCommentsCount).toLocaleString()} Comments`}
          </span>
        </h2>
      </div>

      {/* Feedback banner (if any) */}
      {feedbackMessage && (
        <div
          className={`flex items-start gap-2 p-3 rounded-xl text-xs border ${
            feedbackMessage.type === "error"
              ? "bg-destructive/10 text-destructive border-destructive/20"
              : feedbackMessage.type === "success"
              ? "bg-green-500/10 text-green-500 border-green-500/20"
              : "bg-blue-500/10 text-blue-500 border-blue-500/20"
          }`}
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{feedbackMessage.text}</span>
        </div>
      )}

      {/* Comment Input Box */}
      {!commentsDisabled ? (
        <form onSubmit={handlePostComment} className="flex gap-3 items-start">
          <Avatar
            src={session?.user?.image || undefined}
            fallback={session?.user?.name || "U"}
            size="md"
            className="shrink-0 mt-0.5"
          />
          <div className="flex flex-1 flex-col gap-2">
            <input
              type="text"
              placeholder={
                session?.user
                  ? "Add a public comment..."
                  : "Add a comment (Google Sign-In required)..."
              }
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
                    setFeedbackMessage(null);
                  }}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  variant="default"
                  disabled={!newCommentText.trim() || submitting}
                  className="text-xs gap-1.5"
                >
                  {submitting && <RefreshCw className="h-3 w-3 animate-spin" />}
                  <span>{session?.user ? "Comment" : "Sign In to Comment"}</span>
                </Button>
              </div>
            )}
          </div>
        </form>
      ) : (
        <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 text-xs text-muted-foreground text-center">
          Comments are disabled for this video by the creator.
        </div>
      )}

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
        ) : comments.length === 0 && !commentsDisabled ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            No comments available for this video yet.
          </p>
        ) : (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} videoId={videoId} />
          ))
        )}
      </div>

      {/* Load More Comments Pagination Button */}
      {nextPageToken && !loading && (
        <div className="flex justify-center pt-2 pb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="gap-2 text-xs font-medium"
          >
            {loadingMore ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Loading more comments...</span>
              </>
            ) : (
              <span>Load More Comments</span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
