"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Play, Trash2, X, ListVideo, Pencil, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/utils";

export default function PlaylistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const playlistId = params?.id as string;

  const [playlist, setPlaylist] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!playlistId) return;
    fetchPlaylist();
  }, [playlistId]);

  const fetchPlaylist = () => {
    setLoading(true);
    fetch(`/api/playlists/${encodeURIComponent(playlistId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.playlist) {
          setPlaylist(data.playlist);
          setEditTitle(data.playlist.title || "");
          setEditDescription(data.playlist.description || "");
        }
      })
      .catch((err) => console.warn("Failed to load playlist:", err))
      .finally(() => setLoading(false));
  };

  const handleRenamePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/playlists/${encodeURIComponent(playlistId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
        }),
      });
      const data = await res.json();
      if (data.playlist) {
        setPlaylist((prev: any) => ({
          ...prev,
          title: data.playlist.title,
          description: data.playlist.description,
        }));
        setIsEditOpen(false);
      }
    } catch (err) {
      console.warn("Failed to update playlist:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveItem = async (videoId: string) => {
    await fetch(`/api/playlists/${playlistId}?videoId=${encodeURIComponent(videoId)}`, {
      method: "DELETE",
    });
    setPlaylist((prev: any) => ({
      ...prev,
      items: prev.items.filter((i: any) => i.videoId !== videoId),
    }));
  };

  const handleDeletePlaylist = async () => {
    if (confirm("Are you sure you want to delete this playlist?")) {
      await fetch(`/api/playlists/${playlistId}`, { method: "DELETE" });
      router.push("/playlists");
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-muted-foreground">Loading playlist...</div>;
  }

  if (!playlist) {
    return <div className="p-12 text-center text-muted-foreground">Playlist not found.</div>;
  }

  const items = playlist.items || [];
  const firstVideoId = items[0]?.videoId;

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto p-2 sm:p-4">
      {/* Left Sidebar: Playlist Info Card */}
      <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4 rounded-2xl bg-secondary/40 p-6 border h-fit">
        <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-secondary shadow-inner overflow-hidden">
          {items[0]?.thumbnailUrl ? (
            <img
              src={items[0].thumbnailUrl}
              alt={playlist.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <ListVideo className="h-14 w-14 text-red-500" />
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            {playlist.isYouTube ? (
              <Badge variant="secondary" className="gap-1 text-[10px] bg-red-500/10 text-red-500 border-red-500/20">
                <ShieldCheck className="h-3 w-3" />
                <span>YouTube Synced</span>
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px]">
                <span>Local Playlist</span>
              </Badge>
            )}
          </div>

          <h1 className="text-xl font-bold leading-tight">{playlist.title}</h1>
          <p className="text-xs text-muted-foreground pt-1">
            {items.length} {items.length === 1 ? "video" : "videos"}
          </p>
          {playlist.description && (
            <p className="text-xs text-muted-foreground pt-3 whitespace-pre-line leading-relaxed">
              {playlist.description}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-2">
          {firstVideoId && (
            <Link
              href={`/watch?v=${firstVideoId}&list=${encodeURIComponent(playlistId)}&index=0`}
              className="w-full"
            >
              <Button variant="default" size="default" className="w-full gap-2 font-medium bg-red-600 hover:bg-red-700 text-white">
                <Play className="h-4 w-4 fill-current" />
                <span>Play All</span>
              </Button>
            </Link>
          )}

          {!playlist.isYouTube && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditOpen(true)}
                className="w-full gap-1.5 text-xs"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Rename / Edit</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDeletePlaylist}
                className="w-full gap-1.5 text-xs text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Playlist</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Right Column: Playlist Items */}
      <div className="flex-1 flex flex-col gap-3">
        {items.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground border rounded-2xl bg-secondary/20">
            No videos in this playlist yet. Add videos by clicking "Save" on any video watch page!
          </div>
        ) : (
          items.map((item: any, index: number) => {
            const thumbnail =
              item.thumbnailUrl || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`;

            return (
              <div
                key={item.id || item.videoId}
                className="group flex items-center gap-3 p-2 rounded-xl hover:bg-accent/40 transition-colors"
              >
                <span className="text-xs font-mono text-muted-foreground w-6 text-center shrink-0">
                  {index + 1}
                </span>

                <Link
                  href={`/watch?v=${item.videoId}&list=${encodeURIComponent(playlistId)}&index=${index}`}
                  className="relative aspect-video w-36 sm:w-44 shrink-0 overflow-hidden rounded-lg bg-muted"
                >
                  <img src={thumbnail} alt={item.title} className="h-full w-full object-cover" />
                  {item.duration > 0 && (
                    <div className="absolute bottom-1 right-1">
                      <Badge variant="duration">{formatDuration(item.duration)}</Badge>
                    </div>
                  )}
                </Link>

                <div className="flex-1 flex flex-col justify-start overflow-hidden">
                  <Link href={`/watch?v=${item.videoId}&list=${encodeURIComponent(playlistId)}&index=${index}`}>
                    <h3 className="line-clamp-2 text-xs sm:text-sm font-semibold hover:text-red-500 transition-colors">
                      {item.title}
                    </h3>
                  </Link>
                  <span className="text-xs text-muted-foreground pt-1 truncate">
                    {item.channelTitle}
                  </span>
                </div>

                {!playlist.isYouTube && (
                  <button
                    onClick={() => handleRemoveItem(item.videoId)}
                    className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-2 hover:text-red-500 transition-all shrink-0"
                    title="Remove from playlist"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Edit / Rename Playlist Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-2xl">
            <h3 className="font-bold text-base pb-3 border-b">Edit Playlist</h3>
            <form onSubmit={handleRenamePlaylist} className="flex flex-col gap-4 pt-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Title</label>
                <input
                  type="text"
                  placeholder="Playlist Title..."
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="rounded-lg border bg-secondary/40 px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Description (optional)</label>
                <textarea
                  placeholder="Playlist description..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="rounded-lg border bg-secondary/40 px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="default" size="sm" disabled={isUpdating}>
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
