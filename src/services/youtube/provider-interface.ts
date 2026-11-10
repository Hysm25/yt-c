import {
  YouTubeVideo,
  YouTubeChannel,
  YouTubePlaylistMeta,
  YouTubeFeedResponse,
  YouTubeSearchResponse,
} from "./types";

export interface SearchOptions {
  type?: "video" | "channel" | "playlist" | "all";
  order?: "relevance" | "date" | "viewCount" | "rating";
  pageToken?: string;
  category?: string;
}

export interface IYouTubeDataProvider {
  readonly name: string;

  getTrendingFeed(
    category?: string,
    pageToken?: string
  ): Promise<YouTubeFeedResponse>;

  search(
    query: string,
    options?: SearchOptions
  ): Promise<YouTubeSearchResponse>;

  getVideoDetails(videoId: string): Promise<YouTubeVideo | null>;

  getRelatedVideos(
    videoId: string,
    limit?: number
  ): Promise<YouTubeVideo[]>;

  getChannelDetails(channelId: string): Promise<YouTubeChannel | null>;

  getChannelVideos(
    channelId: string,
    pageToken?: string
  ): Promise<YouTubeFeedResponse>;

  getUserSubscriptions(
    accessToken: string,
    pageToken?: string
  ): Promise<{ channels: YouTubeChannel[]; nextPageToken?: string }>;

  getUserPlaylists(
    accessToken: string,
    pageToken?: string
  ): Promise<{ playlists: YouTubePlaylistMeta[]; nextPageToken?: string }>;
}
