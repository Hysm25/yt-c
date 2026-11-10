export interface YouTubeThumbnail {
  url: string;
  width?: number;
  height?: number;
}

export interface YouTubeThumbnails {
  default?: YouTubeThumbnail;
  medium?: YouTubeThumbnail;
  high?: YouTubeThumbnail;
  standard?: YouTubeThumbnail;
  maxres?: YouTubeThumbnail;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  channelThumbnailUrl?: string;
  thumbnails: YouTubeThumbnails;
  duration: number; // in seconds
  durationFormatted: string;
  viewCount: number;
  viewCountFormatted: string;
  likeCount?: number;
  likeCountFormatted?: string;
  commentCount?: number;
  isLive?: boolean;
  tags?: string[];
}

export interface YouTubeChannel {
  id: string;
  title: string;
  customUrl?: string;
  description: string;
  publishedAt: string;
  avatarUrl: string;
  bannerUrl?: string;
  subscriberCount: number;
  subscriberCountFormatted: string;
  videoCount: number;
  viewCount: number;
}

export interface YouTubeComment {
  id: string;
  authorDisplayName: string;
  authorProfileImageUrl: string;
  authorChannelUrl?: string;
  textDisplay: string;
  likeCount: number;
  publishedAt: string;
  replyCount?: number;
  replies?: YouTubeComment[];
}

export interface YouTubePlaylistMeta {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  thumbnailUrl: string;
  itemCount: number;
}

export interface YouTubeFeedResponse {
  videos: YouTubeVideo[];
  nextPageToken?: string;
}

export interface YouTubeSearchResponse {
  items: Array<{
    type: "video" | "channel" | "playlist";
    video?: YouTubeVideo;
    channel?: YouTubeChannel;
    playlist?: YouTubePlaylistMeta;
  }>;
  nextPageToken?: string;
  totalResults: number;
}
