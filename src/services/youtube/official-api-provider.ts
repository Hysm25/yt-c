import {
  IYouTubeDataProvider,
  SearchOptions,
} from "./provider-interface";
import {
  YouTubeVideo,
  YouTubeChannel,
  YouTubeComment,
  YouTubePlaylistMeta,
  YouTubeFeedResponse,
  YouTubeSearchResponse,
} from "./types";
import {
  parseIsoDuration,
  formatDuration,
  formatViewCount,
  formatSubscriberCount,
} from "@/lib/utils";

const BASE_URL = "https://www.googleapis.com/youtube/v3";

export class OfficialYouTubeApiProvider implements IYouTubeDataProvider {
  readonly name = "Official YouTube Data API v3";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetchApi(
    endpoint: string,
    params: Record<string, string>,
    accessToken?: string
  ) {
    const url = new URL(`${BASE_URL}/${endpoint}`);
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null && val !== "") {
        url.searchParams.set(key, val);
      }
    }

    if (!accessToken && this.apiKey) {
      url.searchParams.set("key", this.apiKey);
    }

    const headers: Record<string, string> = {};
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const res = await fetch(url.toString(), {
      headers,
      next: { revalidate: 600 }, // 10 minutes Next.js data cache
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const reason = errBody?.error?.errors?.[0]?.reason || res.statusText;
      const error = new Error(`YouTube API Error (${res.status}): ${reason}`);
      (error as any).status = res.status;
      (error as any).reason = reason;
      throw error;
    }

    return await res.json();
  }

  private transformVideoItem(item: any): YouTubeVideo {
    const durationSeconds = parseIsoDuration(item.contentDetails?.duration || "");
    const viewCount = parseInt(item.statistics?.viewCount || "0", 10);
    const likeCount = parseInt(item.statistics?.likeCount || "0", 10);
    const commentCount = parseInt(item.statistics?.commentCount || "0", 10);

    return {
      id: typeof item.id === "string" ? item.id : item.id?.videoId || "",
      title: item.snippet?.title || "Untitled",
      description: item.snippet?.description || "",
      publishedAt: item.snippet?.publishedAt || "",
      channelId: item.snippet?.channelId || "",
      channelTitle: item.snippet?.channelTitle || "",
      thumbnails: item.snippet?.thumbnails || {},
      duration: durationSeconds,
      durationFormatted: formatDuration(durationSeconds),
      viewCount,
      viewCountFormatted: formatViewCount(viewCount),
      likeCount,
      likeCountFormatted: formatViewCount(likeCount).replace(" views", ""),
      commentCount,
      isLive: item.snippet?.liveBroadcastContent === "live",
      tags: item.snippet?.tags || [],
    };
  }

  async getTrendingFeed(
    category?: string,
    pageToken?: string
  ): Promise<YouTubeFeedResponse> {
    const params: Record<string, string> = {
      part: "snippet,contentDetails,statistics",
      chart: "mostPopular",
      maxResults: "24",
      regionCode: "US",
    };

    if (pageToken) params.pageToken = pageToken;

    const data = await this.fetchApi("videos", params);
    const videos = (data.items || []).map((item: any) =>
      this.transformVideoItem(item)
    );

    return {
      videos,
      nextPageToken: data.nextPageToken,
    };
  }

  async search(
    query: string,
    options?: SearchOptions
  ): Promise<YouTubeSearchResponse> {
    const params: Record<string, string> = {
      part: "snippet",
      q: query,
      maxResults: "20",
      type: options?.type === "all" ? "video,channel,playlist" : options?.type || "video",
      order: options?.order || "relevance",
    };

    if (options?.pageToken) params.pageToken = options.pageToken;

    const searchData = await this.fetchApi("search", params);
    const videoIds = (searchData.items || [])
      .filter((item: any) => item.id?.kind === "youtube#video")
      .map((item: any) => item.id.videoId)
      .join(",");

    let videoDetailsMap = new Map<string, any>();
    if (videoIds) {
      const detailsData = await this.fetchApi("videos", {
        part: "contentDetails,statistics,snippet",
        id: videoIds,
      });
      for (const item of detailsData.items || []) {
        videoDetailsMap.set(item.id, item);
      }
    }

    const items = (searchData.items || []).map((item: any) => {
      const kind = item.id?.kind;
      if (kind === "youtube#video") {
        const fullItem = videoDetailsMap.get(item.id.videoId) || item;
        return {
          type: "video" as const,
          video: this.transformVideoItem(fullItem),
        };
      }
      if (kind === "youtube#channel") {
        return {
          type: "channel" as const,
          channel: {
            id: item.id.channelId,
            title: item.snippet.title,
            description: item.snippet.description,
            publishedAt: item.snippet.publishedAt,
            avatarUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || "",
            subscriberCount: 0,
            subscriberCountFormatted: "",
            videoCount: 0,
            viewCount: 0,
          },
        };
      }
      return {
        type: "playlist" as const,
        playlist: {
          id: item.id.playlistId,
          title: item.snippet.title,
          description: item.snippet.description,
          publishedAt: item.snippet.publishedAt,
          channelId: item.snippet.channelId,
          channelTitle: item.snippet.channelTitle,
          thumbnailUrl: item.snippet.thumbnails?.high?.url || "",
          itemCount: 0,
        },
      };
    });

    return {
      items,
      nextPageToken: searchData.nextPageToken,
      totalResults: searchData.pageInfo?.totalResults || items.length,
    };
  }

  async getVideoDetails(videoId: string): Promise<YouTubeVideo | null> {
    const data = await this.fetchApi("videos", {
      part: "snippet,contentDetails,statistics",
      id: videoId,
    });

    if (!data.items || data.items.length === 0) return null;
    return this.transformVideoItem(data.items[0]);
  }

  async getRelatedVideos(videoId: string, limit = 12): Promise<YouTubeVideo[]> {
    // Official API relatedToVideoId was deprecated in v3; search by title or keywords is recommended
    const video = await this.getVideoDetails(videoId);
    if (!video) return [];

    const searchQuery = video.tags?.[0] || video.title.slice(0, 40);
    const searchRes = await this.search(searchQuery, { type: "video" });
    return searchRes.items
      .filter((i) => i.video && i.video.id !== videoId)
      .map((i) => i.video!)
      .slice(0, limit);
  }

  async getChannelDetails(channelId: string): Promise<YouTubeChannel | null> {
    const data = await this.fetchApi("channels", {
      part: "snippet,statistics,brandingSettings",
      id: channelId,
    });

    if (!data.items || data.items.length === 0) return null;
    const item = data.items[0];
    const subCount = parseInt(item.statistics?.subscriberCount || "0", 10);
    const videoCount = parseInt(item.statistics?.videoCount || "0", 10);
    const viewCount = parseInt(item.statistics?.viewCount || "0", 10);

    return {
      id: item.id,
      title: item.snippet?.title || "",
      customUrl: item.snippet?.customUrl,
      description: item.snippet?.description || "",
      publishedAt: item.snippet?.publishedAt || "",
      avatarUrl: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || "",
      bannerUrl: item.brandingSettings?.image?.bannerExternalUrl,
      subscriberCount: subCount,
      subscriberCountFormatted: formatSubscriberCount(subCount),
      videoCount,
      viewCount,
    };
  }

  async getChannelVideos(
    channelId: string,
    pageToken?: string
  ): Promise<YouTubeFeedResponse> {
    const searchParams: Record<string, string> = {
      part: "snippet",
      channelId,
      maxResults: "20",
      order: "date",
      type: "video",
    };
    if (pageToken) searchParams.pageToken = pageToken;

    const data = await this.fetchApi("search", searchParams);
    const videoIds = (data.items || []).map((i: any) => i.id?.videoId).filter(Boolean).join(",");

    if (!videoIds) return { videos: [] };

    const detailsData = await this.fetchApi("videos", {
      part: "contentDetails,statistics,snippet",
      id: videoIds,
    });

    const videos = (detailsData.items || []).map((item: any) =>
      this.transformVideoItem(item)
    );

    return {
      videos,
      nextPageToken: data.nextPageToken,
    };
  }

  async getVideoComments(
    videoId: string,
    pageToken?: string
  ): Promise<{ comments: YouTubeComment[]; nextPageToken?: string }> {
    const params: Record<string, string> = {
      part: "snippet,replies",
      videoId,
      maxResults: "25",
      order: "relevance",
    };
    if (pageToken) params.pageToken = pageToken;

    const data = await this.fetchApi("commentThreads", params);
    const comments: YouTubeComment[] = (data.items || []).map((item: any) => {
      const top = item.snippet?.topLevelComment?.snippet;
      return {
        id: item.id,
        authorDisplayName: top?.authorDisplayName || "Viewer",
        authorProfileImageUrl: top?.authorProfileImageUrl || "",
        authorChannelUrl: top?.authorChannelUrl,
        textDisplay: top?.textDisplay || "",
        likeCount: top?.likeCount || 0,
        publishedAt: top?.publishedAt || "",
        replyCount: item.snippet?.totalReplyCount || 0,
      };
    });

    return {
      comments,
      nextPageToken: data.nextPageToken,
    };
  }

  async getUserSubscriptions(
    accessToken: string,
    pageToken?: string
  ): Promise<{ channels: YouTubeChannel[]; nextPageToken?: string }> {
    const params: Record<string, string> = {
      part: "snippet",
      mine: "true",
      maxResults: "30",
    };
    if (pageToken) params.pageToken = pageToken;

    const data = await this.fetchApi("subscriptions", params, accessToken);
    const channels: YouTubeChannel[] = (data.items || []).map((item: any) => ({
      id: item.snippet?.resourceId?.channelId || item.id,
      title: item.snippet?.title || "",
      description: item.snippet?.description || "",
      publishedAt: item.snippet?.publishedAt || "",
      avatarUrl: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || "",
      subscriberCount: 0,
      subscriberCountFormatted: "",
      videoCount: 0,
      viewCount: 0,
    }));

    return {
      channels,
      nextPageToken: data.nextPageToken,
    };
  }

  async getUserPlaylists(
    accessToken: string,
    pageToken?: string
  ): Promise<{ playlists: YouTubePlaylistMeta[]; nextPageToken?: string }> {
    const params: Record<string, string> = {
      part: "snippet,contentDetails",
      mine: "true",
      maxResults: "25",
    };
    if (pageToken) params.pageToken = pageToken;

    const data = await this.fetchApi("playlists", params, accessToken);
    const playlists: YouTubePlaylistMeta[] = (data.items || []).map(
      (item: any) => ({
        id: item.id,
        title: item.snippet?.title || "",
        description: item.snippet?.description || "",
        publishedAt: item.snippet?.publishedAt || "",
        channelId: item.snippet?.channelId || "",
        channelTitle: item.snippet?.channelTitle || "",
        thumbnailUrl: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || "",
        itemCount: item.contentDetails?.itemCount || 0,
      })
    );

    return {
      playlists,
      nextPageToken: data.nextPageToken,
    };
  }
}
