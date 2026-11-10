"use client";

import React, { useState, useEffect } from "react";
import { YouTubeVideo } from "@/services/youtube/types";
import { VideoGrid } from "@/components/video/video-grid";
import { Button } from "@/components/ui/button";

const categories = [
  "All",
  "Music",
  "Gaming",
  "Podcasts",
  "Computer Programming",
  "Open Source",
  "Animation",
  "News",
  "Pop Culture",
];

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const categoryParam =
      activeCategory === "All" ? "" : `?category=${encodeURIComponent(activeCategory)}`;

    fetch(`/api/youtube/feed${categoryParam}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.videos) {
          setVideos(data.videos);
        }
      })
      .catch((err) => console.warn("Failed to load feed:", err))
      .finally(() => setLoading(false));
  }, [activeCategory]);

  return (
    <div className="flex flex-col gap-6">
      {/* Category Chips Scroller */}
      <div className="sticky top-14 z-30 flex items-center gap-2 overflow-x-auto bg-background/95 py-2 backdrop-blur-md scrollbar-none">
        {categories.map((category) => (
          <Button
            key={category}
            variant={activeCategory === category ? "chipActive" : "chip"}
            size="sm"
            onClick={() => setActiveCategory(category)}
            className="shrink-0 text-xs px-3.5 py-1.5 h-8 select-none"
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Video Grid */}
      <VideoGrid videos={videos} loading={loading} />
    </div>
  );
}
