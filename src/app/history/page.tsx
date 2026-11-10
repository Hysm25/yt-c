"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Trash2, History as HistoryIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDuration, formatRelativeTime } from "@/lib/utils";

interface HistoryItem {
  id: string;
  videoId: string;
  title: string;
  channelTitle: string;
  channelId?: string;
  thumbnailUrl?: string;
  duration: number;
  progressSeconds: number;
  totalSeconds: number;
  completed: boolean;
  lastWatchedAt: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = () => {
    setLoading(true);
    fetch("/api/history")
      .then((res) => res.json())
      .then((data) => {
        if (data.history) setHistory(data.history);
      })
      .catch((err) => console.warn("Failed to load history:", err))
      .finally(() => setLoading(false));
  };

  const clearAllHistory = async () => {
    if (confirm("Are you sure you want to clear your entire watch history?")) {
      await fetch("/api/history", { method: "DELETE" });
      setHistory([]);
    }
  };

  const removeHistoryItem = async (videoId: string) => {
    await fetch(`/api/history?videoId=${encodeURIComponent(videoId)}`, {
      method: "DELETE",
    });
    setHistory((prev) => prev.filter((item) => item.videoId !== videoId));
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto p-2 sm:p-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          <HistoryIcon className="h-6 w-6 text-red-500" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Watch History
          </h1>
        </div>

        {history.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllHistory}
            className="gap-1.5 text-xs text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear All History</span>
          </Button>
        )}
      </div>

      {/* History Items List */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground">
          Loading history...
        </div>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <HistoryIcon className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="text-base font-semibold">No watch history yet</h3>
          <p className="text-xs text-muted-foreground pt-1">
            Videos you watch will appear here so you can easily resume them later.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {history.map((item) => {
            const percent =
              item.totalSeconds > 0
                ? (item.progressSeconds / item.totalSeconds) * 100
                : 0;

            const thumbnail =
              item.thumbnailUrl ||
              `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`;

            return (
              <div
                key={item.id}
                className="group relative flex flex-col sm:flex-row gap-4 p-2.5 rounded-xl hover:bg-accent/40 transition-colors"
              >
                {/* Thumbnail with progress bar */}
                <Link
                  href={`/watch?v=${item.videoId}`}
                  className="relative aspect-video w-full sm:w-56 shrink-0 overflow-hidden rounded-xl bg-muted"
                >
                  <img
                    src={thumbnail}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                  {item.duration > 0 && (
                    <div className="absolute bottom-2 right-2">
                      <Badge variant="duration">
                        {formatDuration(item.duration)}
                      </Badge>
                    </div>
                  )}
                  {/* Progress Bar */}
                  {percent > 0 && (
                    <div className="absolute bottom-0 left-0 h-1 w-full bg-white/30">
                      <div
                        className="h-full bg-red-600"
                        style={{ width: `${Math.min(100, percent)}%` }}
                      />
                    </div>
                  )}
                </Link>

                {/* Details */}
                <div className="flex flex-1 flex-col justify-start">
                  <div className="flex items-start justify-between">
                    <Link href={`/watch?v=${item.videoId}`}>
                      <h3 className="line-clamp-2 font-semibold text-sm sm:text-base hover:text-red-500 transition-colors">
                        {item.title}
                      </h3>
                    </Link>

                    {/* Delete Item Button */}
                    <button
                      onClick={() => removeHistoryItem(item.videoId)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all"
                      title="Remove from history"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="text-xs text-muted-foreground pt-1">
                    {item.channelTitle}
                  </div>

                  <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                    <span>Watched {formatRelativeTime(item.lastWatchedAt)}</span>
                    {item.progressSeconds > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-red-400 font-medium">
                          Resume at {formatDuration(item.progressSeconds)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
