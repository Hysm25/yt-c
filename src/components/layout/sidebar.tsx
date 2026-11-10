"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Tv,
  History,
  ListVideo,
  ThumbsUp,
  Sliders,
  Flame,
  Music2,
  Gamepad2,
  Newspaper,
  Radio,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  collapsed?: boolean;
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

const mainNavItems = [
  { title: "Home", href: "/", icon: Home },
  { title: "Subscriptions", href: "/subscriptions", icon: Tv },
  { title: "Trending", href: "/search?q=trending", icon: Flame },
];

const libraryNavItems = [
  { title: "History", href: "/history", icon: History },
  { title: "Playlists", href: "/playlists", icon: ListVideo },
  { title: "Liked Videos", href: "/liked", icon: ThumbsUp },
];

const exploreNavItems = [
  { title: "Music", href: "/search?q=music", icon: Music2 },
  { title: "Gaming", href: "/search?q=gaming", icon: Gamepad2 },
  { title: "News", href: "/search?q=news", icon: Newspaper },
  { title: "Live", href: "/search?q=live", icon: Radio },
];

export function Sidebar({ collapsed, isMobile, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  // Mobile Drawer Mode
  if (isMobile) {
    return (
      <aside className="flex h-full w-64 flex-col bg-background p-4 overflow-y-auto">
        {/* Header with Logo & Close */}
        <div className="flex items-center justify-between pb-4 border-b">
          <Link
            href="/"
            onClick={onCloseMobile}
            className="flex items-center gap-1.5 font-bold tracking-tight text-foreground"
          >
            <div className="flex h-7 w-9 items-center justify-center rounded-lg bg-[#FF0000] text-white shadow-sm">
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span className="text-lg font-bold">
              YouTube<span className="text-xs font-medium text-muted-foreground ml-1">Web</span>
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCloseMobile}
            className="h-8 w-8"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation Content */}
        <div className="flex flex-col gap-1 py-3 border-b">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  "flex items-center gap-4 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-foreground font-semibold"
                    : "text-foreground/80 hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "text-red-500")} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex flex-col gap-1 py-3 border-b">
          <div className="px-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            You
          </div>
          {libraryNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  "flex items-center gap-4 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-foreground font-semibold"
                    : "text-foreground/80 hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "text-red-500")} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex flex-col gap-1 py-3 border-b">
          <div className="px-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Explore
          </div>
          {exploreNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  "flex items-center gap-4 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-foreground font-semibold"
                    : "text-foreground/80 hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "text-red-500")} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex flex-col gap-1 pt-3">
          <Link
            href="/settings"
            onClick={onCloseMobile}
            className={cn(
              "flex items-center gap-4 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              pathname === "/settings"
                ? "bg-secondary text-foreground font-semibold"
                : "text-foreground/80 hover:bg-accent hover:text-foreground"
            )}
          >
            <Sliders className="h-5 w-5" />
            <span>Settings</span>
          </Link>
        </div>
      </aside>
    );
  }

  // Desktop Collapsed Mode
  if (collapsed) {
    return (
      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-18 flex-col items-center border-r bg-background py-2 sm:flex">
        <div className="flex flex-col gap-1 w-full px-1">
          {[...mainNavItems, ...libraryNavItems].slice(0, 5).map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center py-3 px-1 rounded-xl text-[10px] transition-colors",
                  isActive
                    ? "bg-secondary text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
                title={item.title}
              >
                <Icon className={cn("h-5 w-5 mb-1", isActive && "text-red-500")} />
                <span className="truncate max-w-[60px] text-center">{item.title}</span>
              </Link>
            );
          })}
        </div>
      </aside>
    );
  }

  // Desktop Expanded Mode
  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r bg-background p-3 md:block">
      {/* Main Nav */}
      <div className="flex flex-col gap-1 pb-3 border-b">
        {mainNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-secondary text-foreground font-semibold"
                  : "text-foreground/80 hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-red-500")} />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </div>

      {/* Library & You */}
      <div className="flex flex-col gap-1 py-3 border-b">
        <div className="px-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          You
        </div>
        {libraryNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-secondary text-foreground font-semibold"
                  : "text-foreground/80 hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-red-500")} />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </div>

      {/* Explore */}
      <div className="flex flex-col gap-1 py-3 border-b">
        <div className="px-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Explore
        </div>
        {exploreNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-secondary text-foreground font-semibold"
                  : "text-foreground/80 hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-red-500")} />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </div>

      {/* Settings */}
      <div className="flex flex-col gap-1 pt-3">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-4 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
            pathname === "/settings"
              ? "bg-secondary text-foreground font-semibold"
              : "text-foreground/80 hover:bg-accent hover:text-foreground"
          )}
        >
          <Sliders className="h-5 w-5" />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
