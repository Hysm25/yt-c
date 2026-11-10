import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  primaryKey,
} from "drizzle-orm/pg-core";

/**
 * NextAuth / Auth.js standard tables for Google OAuth
 */
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

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
