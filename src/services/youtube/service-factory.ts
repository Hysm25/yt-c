import { IYouTubeDataProvider } from "./provider-interface";
import { OfficialYouTubeApiProvider } from "./official-api-provider";
import { PublicYouTubeDataProvider } from "./public-youtube-provider";
import { MockYouTubeDataProvider } from "./mock-provider";
import { apiCache } from "./cache";

class YouTubeService {
  private primaryProvider: IYouTubeDataProvider;
  private publicProvider: PublicYouTubeDataProvider;
  private mockProvider: MockYouTubeDataProvider;

  constructor() {
    const apiKey = process.env.YOUTUBE_API_KEY;
    this.publicProvider = new PublicYouTubeDataProvider();
    this.mockProvider = new MockYouTubeDataProvider();

    if (apiKey && apiKey.trim() !== "") {
      this.primaryProvider = new OfficialYouTubeApiProvider(apiKey.trim());
    } else {
      this.primaryProvider = this.publicProvider;
    }
  }

  private async executeWithFallback<T>(
    cacheKey: string,
    ttlSeconds: number,
    operation: (provider: IYouTubeDataProvider) => Promise<T>
  ): Promise<T> {
    // Check Cache
    const cached = apiCache.get<T>(cacheKey);
    if (cached) return cached;

    try {
      const data = await operation(this.primaryProvider);
      const hasContent = (obj: any) => {
        if (!obj || typeof obj !== "object") return true;
        if ("videos" in obj) return (obj as any).videos?.length > 0;
        if ("items" in obj) return (obj as any).items?.length > 0;
        return true;
      };

      if (data && hasContent(data)) {
        apiCache.set(cacheKey, data, ttlSeconds);
        return data;
      }
      if (this.primaryProvider !== this.publicProvider) {
        // If official returned empty or failed, try public provider
        const publicData = await operation(this.publicProvider);
        if (publicData && hasContent(publicData)) {
          apiCache.set(cacheKey, publicData, ttlSeconds);
          return publicData;
        }
      }
      return data;
    } catch (err: any) {
      console.warn(
        `YouTube API provider failed (${err.message}). Trying public/fallback provider.`
      );

      // If primary wasn't public provider, try public provider first
      if (this.primaryProvider !== this.publicProvider) {
        try {
          const publicData = await operation(this.publicProvider);
          apiCache.set(cacheKey, publicData, ttlSeconds);
          return publicData;
        } catch (pubErr: any) {
          console.warn("Public YouTube provider failed:", pubErr.message);
        }
      }

      // Final fallback to mock provider (offline resilience)
      const fallbackData = await operation(this.mockProvider);
      return fallbackData;
    }
  }

  async getTrendingFeed(category?: string, pageToken?: string) {
    const key = `feed:${category || "all"}:${pageToken || "first"}`;
    return this.executeWithFallback(key, 900, (p) =>
      p.getTrendingFeed(category, pageToken)
    );
  }

  async search(query: string, options?: any) {
    const key = `search:${query}:${options?.type || "all"}:${options?.order || "rel"}:${options?.pageToken || "first"}`;
    return this.executeWithFallback(key, 600, (p) => p.search(query, options));
  }

  async getVideoDetails(videoId: string) {
    const key = `video:${videoId}`;
    return this.executeWithFallback(key, 3600, (p) =>
      p.getVideoDetails(videoId)
    );
  }

  async getRelatedVideos(videoId: string) {
    const key = `related:${videoId}`;
    return this.executeWithFallback(key, 3600, (p) =>
      p.getRelatedVideos(videoId)
    );
  }

  async getChannelDetails(channelId: string) {
    const key = `channel:${channelId}`;
    return this.executeWithFallback(key, 3600, (p) =>
      p.getChannelDetails(channelId)
    );
  }

  async getChannelVideos(channelId: string, pageToken?: string) {
    const key = `channel_videos:${channelId}:${pageToken || "first"}`;
    return this.executeWithFallback(key, 900, (p) =>
      p.getChannelVideos(channelId, pageToken)
    );
  }

  async getVideoComments(videoId: string, pageToken?: string) {
    const key = `comments:${videoId}:${pageToken || "first"}`;
    return this.executeWithFallback(key, 600, (p) =>
      p.getVideoComments(videoId, pageToken)
    );
  }

  async getCommentReplies(replyToken: string) {
    return await this.publicProvider.getCommentReplies(replyToken);
  }

  async getUserSubscriptions(accessToken?: string, pageToken?: string) {
    if (accessToken) {
      try {
        const provider = new OfficialYouTubeApiProvider("");
        return await provider.getUserSubscriptions(accessToken, pageToken);
      } catch (err) {
        console.warn("Failed to fetch user subscriptions with token, falling back.");
      }
    }
    return await this.mockProvider.getUserSubscriptions();
  }

  async getUserPlaylists(accessToken?: string, pageToken?: string) {
    if (accessToken) {
      try {
        const provider = new OfficialYouTubeApiProvider("");
        return await provider.getUserPlaylists(accessToken, pageToken);
      } catch (err) {
        console.warn("Failed to fetch user playlists with token, falling back.");
      }
    }
    return await this.mockProvider.getUserPlaylists();
  }

  async getPlaylistItems(playlistId: string, accessToken?: string) {
    try {
      const apiKey = process.env.YOUTUBE_API_KEY || "";
      const provider = new OfficialYouTubeApiProvider(apiKey);
      return await provider.getPlaylistItems(playlistId, accessToken);
    } catch (err: any) {
      console.warn("Failed to fetch playlist items from YouTube:", err.message);
    }
    return { items: [] };
  }
}

export const youtubeService = new YouTubeService();
