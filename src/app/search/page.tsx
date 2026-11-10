"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { VideoCard } from "@/components/video/video-card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [filterType, setFilterType] = useState<"all" | "video" | "channel" | "playlist">("all");
  const [order, setOrder] = useState<"relevance" | "date" | "viewCount">("relevance");
  const [showFilters, setShowFilters] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (filterType) params.set("type", filterType);
    if (order) params.set("order", order);

    fetch(`/api/youtube/search?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.items) setItems(data.items);
      })
      .catch((err) => console.warn("Search error:", err))
      .finally(() => setLoading(false));
  }, [query, filterType, order]);

  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto px-2 sm:px-4">
      {/* Header & Filter Toggle */}
      <div className="flex items-center justify-between border-b pb-3">
        <div className="text-sm font-semibold">
          Results for <span className="text-red-500">"{query}"</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-1.5 text-xs"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Filters</span>
        </Button>
      </div>

      {/* Filter Options Drawer */}
      {showFilters && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-secondary/50 text-xs border">
          <div>
            <div className="font-bold pb-2 uppercase tracking-wider text-[10px] text-muted-foreground">
              Type
            </div>
            <div className="flex flex-col gap-1.5">
              {(["all", "video", "channel", "playlist"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`text-left capitalize hover:underline ${
                    filterType === t ? "text-red-500 font-bold" : "text-muted-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="font-bold pb-2 uppercase tracking-wider text-[10px] text-muted-foreground">
              Sort By
            </div>
            <div className="flex flex-col gap-1.5">
              {(["relevance", "date", "viewCount"] as const).map((o) => (
                <button
                  key={o}
                  onClick={() => setOrder(o)}
                  className={`text-left capitalize hover:underline ${
                    order === o ? "text-red-500 font-bold" : "text-muted-foreground"
                  }`}
                >
                  {o === "date" ? "Upload Date" : o === "viewCount" ? "View Count" : "Relevance"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results List */}
      <div className="flex flex-col gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-2">
              <Skeleton className="aspect-video w-60 rounded-xl shrink-0" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            No matching results found.
          </div>
        ) : (
          items.map((item, index) => {
            if (item.type === "video" && item.video) {
              return <VideoCard key={item.video.id || index} video={item.video} layout="list" />;
            }
            if (item.type === "channel" && item.channel) {
              return (
                <Link
                  key={item.channel.id || index}
                  href={`/channel/${item.channel.id}`}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-accent/40 transition-colors"
                >
                  <Avatar
                    src={item.channel.avatarUrl}
                    alt={item.channel.title}
                    fallback={item.channel.title}
                    size="xl"
                  />
                  <div className="flex flex-col">
                    <h3 className="font-bold text-base hover:underline">
                      {item.channel.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {item.channel.customUrl} • {item.channel.subscriberCountFormatted}
                    </p>
                    <p className="line-clamp-2 text-xs text-muted-foreground pt-1 max-w-lg">
                      {item.channel.description}
                    </p>
                  </div>
                </Link>
              );
            }
            return null;
          })
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading search results...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
