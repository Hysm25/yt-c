import { db } from "@/db";
import {
  watchHistory,
  playlists,
  playlistItems,
  likedVideos,
  subscriptions,
  userSettings,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import crypto from "crypto";

export interface WatchProgressInput {
  userId: string;
  videoId: string;
  title: string;
  channelTitle: string;
  channelId?: string;
  thumbnailUrl?: string;
  duration?: number;
  progressSeconds: number;
  totalSeconds: number;
}

export interface PlaylistItemInput {
  videoId: string;
  title: string;
  channelTitle: string;
  channelId?: string;
  thumbnailUrl?: string;
  duration?: number;
}

export const repository = {
  // --- Watch History ---
  async getWatchHistory(userId: string, limit = 50) {
    return await db
      .select()
      .from(watchHistory)
      .where(eq(watchHistory.userId, userId))
      .orderBy(desc(watchHistory.lastWatchedAt))
      .limit(limit);
  },

  async getWatchProgress(userId: string, videoId: string) {
    const records = await db
      .select()
      .from(watchHistory)
      .where(and(eq(watchHistory.userId, userId), eq(watchHistory.videoId, videoId)))
      .limit(1);
    return records[0] || null;
  },

  async upsertWatchProgress(data: WatchProgressInput) {
    const existing = await this.getWatchProgress(data.userId, data.videoId);
    const completed =
      data.totalSeconds > 0 &&
      data.progressSeconds / data.totalSeconds >= 0.9; // 90%+ is completed

    if (existing) {
      await db
        .update(watchHistory)
        .set({
          title: data.title,
          channelTitle: data.channelTitle,
          channelId: data.channelId || existing.channelId,
          thumbnailUrl: data.thumbnailUrl || existing.thumbnailUrl,
          duration: data.duration ?? existing.duration,
          progressSeconds: Math.floor(data.progressSeconds),
          totalSeconds: Math.floor(data.totalSeconds),
          completed,
          lastWatchedAt: new Date(),
        })
        .where(eq(watchHistory.id, existing.id));
      return { ...existing, progressSeconds: data.progressSeconds, completed };
    }

    const id = crypto.randomUUID();
    const newRecord = {
      id,
      userId: data.userId,
      videoId: data.videoId,
      title: data.title,
      channelTitle: data.channelTitle,
      channelId: data.channelId || "",
      thumbnailUrl: data.thumbnailUrl || "",
      duration: data.duration || Math.floor(data.totalSeconds),
      progressSeconds: Math.floor(data.progressSeconds),
      totalSeconds: Math.floor(data.totalSeconds),
      completed,
      lastWatchedAt: new Date(),
    };

    await db.insert(watchHistory).values(newRecord);
    return newRecord;
  },

  async clearWatchHistory(userId: string) {
    return await db
      .delete(watchHistory)
      .where(eq(watchHistory.userId, userId));
  },

  async deleteWatchHistoryItem(userId: string, videoId: string) {
    return await db
      .delete(watchHistory)
      .where(and(eq(watchHistory.userId, userId), eq(watchHistory.videoId, videoId)));
  },

  // --- Playlists ---
  async getUserPlaylists(userId: string) {
    return await db
      .select()
      .from(playlists)
      .where(eq(playlists.userId, userId))
      .orderBy(desc(playlists.updatedAt));
  },

  async getPlaylistWithItems(playlistId: string) {
    const list = await db
      .select()
      .from(playlists)
      .where(eq(playlists.id, playlistId))
      .limit(1);

    if (!list[0]) return null;

    const items = await db
      .select()
      .from(playlistItems)
      .where(eq(playlistItems.playlistId, playlistId))
      .orderBy(playlistItems.position);

    return {
      ...list[0],
      items,
    };
  },

  async createPlaylist(userId: string, title: string, description = "") {
    const id = crypto.randomUUID();
    const newPlaylist = {
      id,
      userId,
      title,
      description,
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.insert(playlists).values(newPlaylist);
    return newPlaylist;
  },

  async updatePlaylist(
    userId: string,
    playlistId: string,
    data: { title?: string; description?: string }
  ) {
    const updateData: any = { updatedAt: new Date() };
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;

    await db
      .update(playlists)
      .set(updateData)
      .where(and(eq(playlists.userId, userId), eq(playlists.id, playlistId)));

    return await this.getPlaylistWithItems(playlistId);
  },

  async deletePlaylist(userId: string, playlistId: string) {
    // Delete playlist items first to ensure cleanliness
    await db
      .delete(playlistItems)
      .where(eq(playlistItems.playlistId, playlistId));

    return await db
      .delete(playlists)
      .where(and(eq(playlists.userId, userId), eq(playlists.id, playlistId)));
  },

  async addPlaylistItem(playlistId: string, item: PlaylistItemInput) {
    const existing = await db
      .select()
      .from(playlistItems)
      .where(
        and(
          eq(playlistItems.playlistId, playlistId),
          eq(playlistItems.videoId, item.videoId)
        )
      )
      .limit(1);

    if (existing[0]) return existing[0];

    const currentItems = await db
      .select()
      .from(playlistItems)
      .where(eq(playlistItems.playlistId, playlistId));

    const id = crypto.randomUUID();
    const newItem = {
      id,
      playlistId,
      videoId: item.videoId,
      title: item.title,
      channelTitle: item.channelTitle,
      channelId: item.channelId || "",
      thumbnailUrl: item.thumbnailUrl || "",
      duration: item.duration || 0,
      position: currentItems.length,
      addedAt: new Date(),
    };

    await db.insert(playlistItems).values(newItem);
    await db
      .update(playlists)
      .set({ updatedAt: new Date() })
      .where(eq(playlists.id, playlistId));

    return newItem;
  },

  async removePlaylistItem(playlistId: string, videoId: string) {
    return await db
      .delete(playlistItems)
      .where(
        and(
          eq(playlistItems.playlistId, playlistId),
          eq(playlistItems.videoId, videoId)
        )
      );
  },

  // --- Liked Videos ---
  async getLikedVideos(userId: string, limit = 50) {
    return await db
      .select()
      .from(likedVideos)
      .where(eq(likedVideos.userId, userId))
      .orderBy(desc(likedVideos.likedAt))
      .limit(limit);
  },

  async isLikedVideo(userId: string, videoId: string): Promise<boolean> {
    const record = await db
      .select()
      .from(likedVideos)
      .where(and(eq(likedVideos.userId, userId), eq(likedVideos.videoId, videoId)))
      .limit(1);
    return !!record[0];
  },

  async toggleLikeVideo(userId: string, item: PlaylistItemInput) {
    const isLiked = await this.isLikedVideo(userId, item.videoId);
    if (isLiked) {
      await db
        .delete(likedVideos)
        .where(
          and(eq(likedVideos.userId, userId), eq(likedVideos.videoId, item.videoId))
        );
      return { liked: false };
    } else {
      const id = crypto.randomUUID();
      await db.insert(likedVideos).values({
        id,
        userId,
        videoId: item.videoId,
        title: item.title,
        channelTitle: item.channelTitle,
        channelId: item.channelId || "",
        thumbnailUrl: item.thumbnailUrl || "",
        duration: item.duration || 0,
        likedAt: new Date(),
      });
      return { liked: true };
    }
  },

  // --- Subscriptions ---
  async getSubscriptions(userId: string) {
    return await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.subscribedAt));
  },

  async isSubscribed(userId: string, channelId: string) {
    const records = await db
      .select()
      .from(subscriptions)
      .where(
        and(eq(subscriptions.userId, userId), eq(subscriptions.channelId, channelId))
      )
      .limit(1);
    return !!records[0];
  },

  async toggleSubscription(
    userId: string,
    channel: {
      channelId: string;
      channelTitle: string;
      avatarUrl?: string;
    }
  ) {
    const isSub = await this.isSubscribed(userId, channel.channelId);
    if (isSub) {
      await db
        .delete(subscriptions)
        .where(
          and(
            eq(subscriptions.userId, userId),
            eq(subscriptions.channelId, channel.channelId)
          )
        );
      return { subscribed: false };
    } else {
      const id = crypto.randomUUID();
      await db.insert(subscriptions).values({
        id,
        userId,
        channelId: channel.channelId,
        channelTitle: channel.channelTitle,
        avatarUrl: channel.avatarUrl || "",
        subscribedAt: new Date(),
      });
      return { subscribed: true };
    }
  },

  // --- User Settings ---
  async getUserSettings(userId: string) {
    const record = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    if (record[0]) return record[0];

    const defaultSettings = {
      userId,
      defaultPlaybackProvider: "html5",
      autoplay: true,
      defaultQuality: "auto",
      preferredSpeed: "1",
      customApiKey: null,
      updatedAt: new Date(),
    };

    await db.insert(userSettings).values(defaultSettings);
    return defaultSettings;
  },

  async updateUserSettings(
    userId: string,
    settings: Partial<{
      defaultPlaybackProvider: string;
      autoplay: boolean;
      defaultQuality: string;
      preferredSpeed: string;
      customApiKey: string | null;
    }>
  ) {
    await this.getUserSettings(userId);
    await db
      .update(userSettings)
      .set({
        ...settings,
        updatedAt: new Date(),
      })
      .where(eq(userSettings.userId, userId));

    return await this.getUserSettings(userId);
  },
};
