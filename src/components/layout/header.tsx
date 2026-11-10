"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Menu,
  Search,
  X,
  Sun,
  Moon,
  Tv,
  Film,
  User,
  Sliders,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/providers/theme-provider";

interface HeaderProps {
  onToggleSidebar: () => void;
  playbackProvider: "html5" | "embed";
  onTogglePlaybackProvider: () => void;
}

export function Header({
  onToggleSidebar,
  playbackProvider,
  onTogglePlaybackProvider,
}: HeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const { resolvedTheme, setTheme } = useTheme();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b bg-background/95 px-4 backdrop-blur-md">
      {/* Left: Hamburger & Logo */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation drawer"
          className="text-foreground hover:bg-accent"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Link
          href="/"
          className="flex items-center gap-1.5 font-bold tracking-tight text-foreground transition-opacity hover:opacity-90"
        >
          <div className="flex h-7 w-9 items-center justify-center rounded-lg bg-[#FF0000] text-white shadow-sm">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 fill-current"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight">
            YouTube<span className="text-xs font-medium text-muted-foreground ml-1">Web</span>
          </span>
        </Link>
      </div>

      {/* Center: Search Box */}
      <form
        onSubmit={handleSearch}
        className="flex max-w-xl flex-1 items-center justify-center px-4"
      >
        <div className="relative flex w-full items-center">
          <Input
            type="text"
            placeholder="Search videos, channels, playlists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-l-full rounded-r-none border-r-0 pl-4 pr-9 focus-visible:ring-0 focus-visible:border-primary"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <Button
            type="submit"
            variant="secondary"
            className="h-10 rounded-l-none rounded-r-full border border-l-0 border-input px-5 hover:bg-accent"
          >
            <Search className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </form>

      {/* Right: Actions, Playback Mode Switch, Theme & Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Playback Mode Switcher */}
        <Button
          variant="outline"
          size="sm"
          onClick={onTogglePlaybackProvider}
          title={`Active Player: ${playbackProvider.toUpperCase()}. Click to switch between HTML5 Native and Official YouTube Embed.`}
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-normal border-border/80 hover:border-primary/50"
        >
          {playbackProvider === "html5" ? (
            <>
              <Film className="h-3.5 w-3.5 text-red-500" />
              <span>HTML5 Player</span>
            </>
          ) : (
            <>
              <Tv className="h-3.5 w-3.5 text-blue-500" />
              <span>Embed Player</span>
            </>
          )}
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
          className="text-foreground hover:bg-accent"
        >
          {resolvedTheme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        {/* Settings */}
        <Link href="/settings">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Settings"
            className="text-foreground hover:bg-accent"
          >
            <Sliders className="h-4 w-4" />
          </Button>
        </Link>

        {/* User Account / Profile */}
        <Link href="/history">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Account / History"
            className="text-foreground hover:bg-accent"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
              <User className="h-4 w-4" />
            </div>
          </Button>
        </Link>
      </div>
    </header>
  );
}
