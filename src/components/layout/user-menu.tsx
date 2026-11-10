"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  User,
  Sliders,
  History,
  ListVideo,
  ThumbsUp,
  Tv,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full h-9 w-9 p-0 hover:bg-secondary/80 focus-visible:ring-1 focus-visible:ring-ring"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User preferences menu"
      >
        <Avatar
          fallback="G"
          size="sm"
          className="border border-border/80 text-xs font-semibold"
        />
      </Button>

      {/* Preferences Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 top-11 w-64 rounded-xl border border-border bg-popover text-popover-foreground shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          {/* Guest User Header */}
          <div className="flex items-center gap-3 p-2.5 border-b border-border/60 mb-1">
            <Avatar fallback="G" size="sm" />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold truncate">Guest Account</span>
              <span className="text-[11px] text-muted-foreground truncate">
                Local Storage & Database
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col gap-0.5 py-1 text-xs">
            <Link
              href="/history"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-secondary/70 transition-colors"
            >
              <History className="h-4 w-4 text-muted-foreground" />
              <span>Watch History</span>
            </Link>

            <Link
              href="/liked"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-secondary/70 transition-colors"
            >
              <ThumbsUp className="h-4 w-4 text-muted-foreground" />
              <span>Liked Videos</span>
            </Link>

            <Link
              href="/playlists"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-secondary/70 transition-colors"
            >
              <ListVideo className="h-4 w-4 text-muted-foreground" />
              <span>Playlists</span>
            </Link>

            <Link
              href="/subscriptions"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-secondary/70 transition-colors"
            >
              <Tv className="h-4 w-4 text-muted-foreground" />
              <span>Subscriptions</span>
            </Link>

            <div className="h-px bg-border/60 my-1" />

            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-secondary/70 transition-colors"
            >
              <Sliders className="h-4 w-4 text-muted-foreground" />
              <span>Settings & Preferences</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
