import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format seconds to HH:MM:SS or MM:SS (e.g. 185 -> "3:05", 3665 -> "1:01:05")
 */
export function formatDuration(seconds: number | string | undefined | null): string {
  if (seconds === undefined || seconds === null) return "0:00";
  
  let sec = typeof seconds === "string" ? parseIsoDuration(seconds) : Math.floor(seconds);
  if (isNaN(sec) || sec < 0) return "0:00";

  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Parse ISO 8601 duration (e.g. "PT4M13S", "PT1H2M10S") into seconds
 */
export function parseIsoDuration(duration: string): number {
  if (!duration) return 0;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Format view count to human readable (e.g. 1200 -> "1.2K", 3400000 -> "3.4M")
 */
export function formatViewCount(views: number | string | undefined | null): string {
  if (views === undefined || views === null) return "0 views";
  const num = typeof views === "string" ? parseInt(views, 10) : views;
  if (isNaN(num)) return "0 views";

  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B views`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M views`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1).replace(/\.0$/, "")}K views`;
  }
  return `${num} ${num === 1 ? "view" : "views"}`;
}

/**
 * Format subscriber count to human readable (e.g. 1200000 -> "1.2M subscribers")
 */
export function formatSubscriberCount(count: number | string | undefined | null): string {
  if (count === undefined || count === null) return "0 subscribers";
  const num = typeof count === "string" ? parseInt(count, 10) : count;
  if (isNaN(num)) return "0 subscribers";

  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M subscribers`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1).replace(/\.0$/, "")}K subscribers`;
  }
  return `${num} subscribers`;
}

/**
 * Format relative time (e.g. "2 days ago", "3 months ago")
 */
export function formatRelativeTime(dateStringOrTimestamp: string | number | Date | undefined | null): string {
  if (!dateStringOrTimestamp) return "";
  const date = new Date(dateStringOrTimestamp);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) {
    const mins = Math.floor(diffInSeconds / 60);
    return `${mins} ${mins === 1 ? "minute" : "minutes"} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }
  if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  }
  if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} ${months === 1 ? "month" : "months"} ago`;
  }
  const years = Math.floor(diffInSeconds / 31536000);
  return `${years} ${years === 1 ? "year" : "years"} ago`;
}
