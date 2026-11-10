"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import Link from "next/link";
import { Home, Tv, History, ListVideo, Sliders } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  const pathname = usePathname();
  const isWatchPage = pathname.startsWith("/watch");

  // In watch page, default to collapsed sidebar for theater immersion
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isWatchPage);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [playbackProvider, setPlaybackProvider] = useState<"html5" | "embed">("html5");

  // Close mobile drawer on route navigation
  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    const savedProvider = localStorage.getItem("yt-playback-provider") as "html5" | "embed" | null;
    if (savedProvider === "html5" || savedProvider === "embed") {
      setPlaybackProvider(savedProvider);
    }
  }, []);

  const togglePlaybackProvider = () => {
    const nextProvider = playbackProvider === "html5" ? "embed" : "html5";
    setPlaybackProvider(nextProvider);
    localStorage.setItem("yt-playback-provider", nextProvider);
    // Dispatch a custom event so the player can switch dynamically without page reload
    window.dispatchEvent(new CustomEvent("yt-playback-provider-changed", { detail: nextProvider }));
  };

  const toggleSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsMobileDrawerOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => !prev);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Top Navigation */}
      <Header
        onToggleSidebar={toggleSidebar}
        playbackProvider={playbackProvider}
        onTogglePlaybackProvider={togglePlaybackProvider}
      />

      {/* Main Container */}
      <div className="flex flex-1">
        {/* Persistent Desktop Sidebar */}
        {!isWatchPage && <Sidebar collapsed={sidebarCollapsed} />}

        {/* Slide-out Mobile Navigation Drawer */}
        {isMobileDrawerOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileDrawerOpen(false)}
            />
            {/* Drawer */}
            <div className="relative z-10 h-full shadow-2xl transition-transform">
              <Sidebar isMobile onCloseMobile={() => setIsMobileDrawerOpen(false)} />
            </div>
          </div>
        )}

        {/* Page Content */}
        <main
          className={cn(
            "flex-1 overflow-y-auto pb-16 sm:pb-4",
            isWatchPage ? "px-0 sm:px-4 py-0 sm:py-2" : "p-3 sm:p-6"
          )}
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 z-30 flex h-14 w-full items-center justify-around border-t bg-background/95 px-2 backdrop-blur-md sm:hidden">
        <Link
          href="/"
          className={cn(
            "flex flex-col items-center justify-center text-[10px]",
            pathname === "/" ? "text-red-500 font-semibold" : "text-muted-foreground"
          )}
        >
          <Home className="h-5 w-5 mb-0.5" />
          <span>Home</span>
        </Link>
        <Link
          href="/subscriptions"
          className={cn(
            "flex flex-col items-center justify-center text-[10px]",
            pathname === "/subscriptions" ? "text-red-500 font-semibold" : "text-muted-foreground"
          )}
        >
          <Tv className="h-5 w-5 mb-0.5" />
          <span>Subscriptions</span>
        </Link>
        <Link
          href="/history"
          className={cn(
            "flex flex-col items-center justify-center text-[10px]",
            pathname === "/history" ? "text-red-500 font-semibold" : "text-muted-foreground"
          )}
        >
          <History className="h-5 w-5 mb-0.5" />
          <span>History</span>
        </Link>
        <Link
          href="/playlists"
          className={cn(
            "flex flex-col items-center justify-center text-[10px]",
            pathname === "/playlists" ? "text-red-500 font-semibold" : "text-muted-foreground"
          )}
        >
          <ListVideo className="h-5 w-5 mb-0.5" />
          <span>Library</span>
        </Link>
        <Link
          href="/settings"
          className={cn(
            "flex flex-col items-center justify-center text-[10px]",
            pathname === "/settings" ? "text-red-500 font-semibold" : "text-muted-foreground"
          )}
        >
          <Sliders className="h-5 w-5 mb-0.5" />
          <span>Settings</span>
        </Link>
      </nav>
    </div>
  );
}
