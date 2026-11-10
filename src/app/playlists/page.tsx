"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ListVideo, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlaylistMeta {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<PlaylistMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = () => {
    setLoading(true);
    fetch("/api/playlists")
      .then((res) => res.json())
      .then((data) => {
        if (data.playlists) setPlaylists(data.playlists);
      })
      .catch((err) => console.warn("Failed to load playlists:", err))
      .finally(() => setLoading(false));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim() }),
      });
      const data = await res.json();
      if (data.playlist) {
        setPlaylists((prev) => [data.playlist, ...prev]);
        setTitle("");
        setDescription("");
        setIsCreateOpen(false);
      }
    } catch (err) {
      console.warn("Failed to create playlist:", err);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto p-2 sm:p-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          <ListVideo className="h-6 w-6 text-red-500" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Playlists</h1>
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          className="gap-1.5 text-xs font-semibold"
        >
          <Plus className="h-4 w-4" />
          <span>New Playlist</span>
        </Button>
      </div>

      {/* Playlists Grid */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground">
          Loading playlists...
        </div>
      ) : playlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <ListVideo className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="text-base font-semibold">No playlists yet</h3>
          <p className="text-xs text-muted-foreground pt-1 mb-4">
            Create playlists to organize your favorite music, tutorials, and videos.
          </p>
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Create First Playlist</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {playlists.map((pl) => (
            <Link
              key={pl.id}
              href={`/playlist/${pl.id}`}
              className="group flex flex-col rounded-2xl border bg-secondary/30 p-4 hover:bg-secondary/60 transition-all shadow-xs"
            >
              <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-secondary mb-3 group-hover:scale-102 transition-transform">
                <ListVideo className="h-10 w-10 text-muted-foreground group-hover:text-red-500 transition-colors" />
              </div>
              <h3 className="font-semibold text-sm truncate group-hover:text-red-500 transition-colors">
                {pl.title}
              </h3>
              <p className="text-xs text-muted-foreground pt-0.5 line-clamp-1">
                {pl.description || "Custom playlist"}
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-2xl">
            <h3 className="font-bold text-base pb-3 border-b">Create New Playlist</h3>
            <form onSubmit={handleCreate} className="flex flex-col gap-4 pt-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Title</label>
                <input
                  type="text"
                  placeholder="My favorite videos..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="rounded-lg border bg-secondary/40 px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Description (optional)</label>
                <textarea
                  placeholder="Playlist description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="rounded-lg border bg-secondary/40 px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="default" size="sm">
                  Create Playlist
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
