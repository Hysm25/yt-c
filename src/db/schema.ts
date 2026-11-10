import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
} from "drizzle-orm/pg-core";

/**
 * Watch History Table
 * Stores playback position, completion status, and video metadata
 */
export const watchHistory = pgTable("watch_history", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  videoId: text("video_id").notNull(),
  title: text("title").notNull(),
  channelTitle: text("channel_title").notNull(),
  channelId: text("channel_id"),
  thumbnailUrl: text("thumbnail_url"),
  duration: integer("duration").default(0), // duration in seconds
  progressSeconds: integer("progress_seconds").default(0),
  totalSeconds: integer("total_seconds").default(0),
  completed: boolean("completed").default(false),
  lastWatchedAt: timestamp("last_watched_at").defaultNow().notNull(),
});

/**
 * Custom Playlists
 */
export const playlists = pgTable("playlists", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").default(""),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const playlistItems = pgTable("playlist_items", {
  id: text("id").primaryKey(),
  playlistId: text("playlist_id")
    .notNull()
    .references(() => playlists.id, { onDelete: "cascade" }),
  videoId: text("video_id").notNull(),
  title: text("title").notNull(),
  channelTitle: text("channel_title").notNull(),
  channelId: text("channel_id"),
  thumbnailUrl: text("thumbnail_url"),
  duration: integer("duration").default(0),
  position: integer("position").default(0),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

/**
 * Liked Videos
 */
export const likedVideos = pgTable("liked_videos", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  videoId: text("video_id").notNull(),
  title: text("title").notNull(),
  channelTitle: text("channel_title").notNull(),
  channelId: text("channel_id"),
  thumbnailUrl: text("thumbnail_url"),
  duration: integer("duration").default(0),
  likedAt: timestamp("liked_at").defaultNow().notNull(),
});

/**
 * Channel Subscriptions
 */
export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  channelId: text("channel_id").notNull(),
  channelTitle: text("channel_title").notNull(),
  avatarUrl: text("avatar_url"),
  subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
});

/**
 * User Settings & Preferences
 */
export const userSettings = pgTable("user_settings", {
  userId: text("user_id").primaryKey(),
  defaultPlaybackProvider: text("default_playback_provider").default("html5"), // "html5" | "embed"
  autoplay: boolean("autoplay").default(true),
  defaultQuality: text("default_quality").default("auto"), // "auto" | "1080p" | "720p" | "480p" | "360p"
  preferredSpeed: text("preferred_speed").default("1"),
  customApiKey: text("custom_api_key"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
