import { IYouTubeDataProvider } from "./provider-interface";
import { OfficialYouTubeApiProvider } from "./official-api-provider";
import { MockYouTubeDataProvider } from "./mock-provider";
import { apiCache } from "./cache";

class YouTubeService {
  private primaryProvider: IYouTubeDataProvider;
  private fallbackProvider: MockYouTubeDataProvider;

  constructor() {
    const apiKey = process.env.YOUTUBE_API_KEY;
    this.fallbackProvider = new MockYouTubeDataProvider();

    if (apiKey && apiKey.trim() !== "") {
      this.primaryProvider = new OfficialYouTubeApiProvider(apiKey.trim());
    } else {
      this.primaryProvider = this.fallbackProvider;
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
      apiCache.set(cacheKey, data, ttlSeconds);
      return data;
    } catch (err: any) {
      console.warn(
        `YouTube API primary provider failed (${err.message}). Using fallback provider.`
      );
      // Fallback to mock provider
      const fallbackData = await operation(this.fallbackProvider);
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

  async getUserSubscriptions(accessToken?: string, pageToken?: string) {
    if (accessToken) {
      try {
        const provider = new OfficialYouTubeApiProvider("");
        return await provider.getUserSubscriptions(accessToken, pageToken);
      } catch (err) {
        console.warn("Failed to fetch user subscriptions with token, falling back.");
      }
    }
    return await this.fallbackProvider.getUserSubscriptions();
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
    return await this.fallbackProvider.getUserPlaylists();
  }
}

export const youtubeService = new YouTubeService();
