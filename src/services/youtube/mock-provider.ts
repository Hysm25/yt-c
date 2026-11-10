import {
  IYouTubeDataProvider,
  SearchOptions,
} from "./provider-interface";
import {
  YouTubeVideo,
  YouTubeChannel,
  YouTubePlaylistMeta,
  YouTubeFeedResponse,
  YouTubeSearchResponse,
} from "./types";
import { formatDuration, formatViewCount, formatSubscriberCount } from "@/lib/utils";

export const MOCK_VIDEOS: YouTubeVideo[] = [
  {
    id: "dQw4w9WgXcQ",
    title: "Rick Astley - Never Gonna Give You Up (Official Music Video)",
    description: "The official video for “Never Gonna Give You Up” by Rick Astley.\nTaken from the album ‘Whenever You Need Somebody’ - deluxe 2CD and digital deluxe out now.\n\nSubscribe to the official Rick Astley YouTube channel: https://RickAstley.lnk.to/YTSubID",
    publishedAt: "2009-10-25T06:57:33Z",
    channelId: "UCuAXFkgsw1L7xaCfnd5JJOw",
    channelTitle: "Rick Astley",
    channelThumbnailUrl: "https://yt3.ggpht.com/ytc/AIdro_k6E3w2k6u6u6=s176-c-k-c0x00ffffff-no-rj",
    thumbnails: {
      default: { url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg", width: 120, height: 90 },
      medium: { url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg", width: 320, height: 180 },
      high: { url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg", width: 480, height: 360 },
      maxres: { url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg", width: 1280, height: 720 },
    },
    duration: 213,
    durationFormatted: "3:33",
    viewCount: 1540000000,
    viewCountFormatted: "1.5B views",
    likeCount: 16000000,
    likeCountFormatted: "16M",
    tags: ["Rick Astley", "Music", "80s Pop", "Never Gonna Give You Up"],
  },
  {
    id: "jNQXAC9IVRw",
    title: "Me at the zoo",
    description: "The first video on YouTube, uploaded at 8:27PM on Saturday April 23rd, 2005. The video was shot by Yakov Lapitsky at the San Diego Zoo.",
    publishedAt: "2005-04-24T03:31:52Z",
    channelId: "UC4QobU6ST3KWZCmTQ451W6w",
    channelTitle: "jawed",
    channelThumbnailUrl: "https://yt3.ggpht.com/ytc/AIdro_mqf7U1fU1fU1=s176-c-k-c0x00ffffff-no-rj",
    thumbnails: {
      default: { url: "https://i.ytimg.com/vi/jNQXAC9IVRw/default.jpg", width: 120, height: 90 },
      medium: { url: "https://i.ytimg.com/vi/jNQXAC9IVRw/mqdefault.jpg", width: 320, height: 180 },
      high: { url: "https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg", width: 480, height: 360 },
      maxres: { url: "https://i.ytimg.com/vi/jNQXAC9IVRw/maxresdefault.jpg", width: 1280, height: 720 },
    },
    duration: 19,
    durationFormatted: "0:19",
    viewCount: 312000000,
    viewCountFormatted: "312M views",
    likeCount: 15000000,
    likeCountFormatted: "15M",
    tags: ["Jawed Karim", "First YouTube Video", "Zoo", "History"],
  },
  {
    id: "L_LUpnjgPso",
    title: "Big Buck Bunny 60fps 4K - Official Blender Foundation",
    description: "Big Buck Bunny is a 2008 animated comedy short film by the Blender Institute, part of the Blender Foundation. Like the foundation's previous film Elephants Dream, the film was made using Blender, a free software application for 3D computer graphics.",
    publishedAt: "2014-05-27T08:14:02Z",
    channelId: "UCbXwS09o20T58vN16qX9kcg",
    channelTitle: "Blender",
    channelThumbnailUrl: "https://yt3.ggpht.com/ytc/AIdro_blender=s176-c-k-c0x00ffffff-no-rj",
    thumbnails: {
      default: { url: "https://i.ytimg.com/vi/L_LUpnjgPso/default.jpg", width: 120, height: 90 },
      medium: { url: "https://i.ytimg.com/vi/L_LUpnjgPso/mqdefault.jpg", width: 320, height: 180 },
      high: { url: "https://i.ytimg.com/vi/L_LUpnjgPso/hqdefault.jpg", width: 480, height: 360 },
      maxres: { url: "https://i.ytimg.com/vi/L_LUpnjgPso/maxresdefault.jpg", width: 1280, height: 720 },
    },
    duration: 634,
    durationFormatted: "10:34",
    viewCount: 12800000,
    viewCountFormatted: "12M views",
    likeCount: 78000,
    likeCountFormatted: "78K",
    tags: ["Blender", "3D Animation", "Open Source", "Big Buck Bunny", "4K 60fps"],
  },
  {
    id: "fJ9rUzIMcZQ",
    title: "Queen – Bohemian Rhapsody (Official Video Remastered)",
    description: "Remastered in HD! ‘Bohemian Rhapsody’ by Queen taken from ‘A Night At The Opera’, 1975.\nSing along to 'Bohemian Rhapsody' with The Official Queen Sing Along version.\nSubscribe to the official Queen channel: http://bit.ly/Subscribe2Queen",
    publishedAt: "2008-08-01T14:48:33Z",
    channelId: "UCiMhD4jzUqG-IgPzUmmytRQ",
    channelTitle: "Queen Official",
    channelThumbnailUrl: "https://yt3.ggpht.com/ytc/AIdro_queen=s176-c-k-c0x00ffffff-no-rj",
    thumbnails: {
      default: { url: "https://i.ytimg.com/vi/fJ9rUzIMcZQ/default.jpg", width: 120, height: 90 },
      medium: { url: "https://i.ytimg.com/vi/fJ9rUzIMcZQ/mqdefault.jpg", width: 320, height: 180 },
      high: { url: "https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg", width: 480, height: 360 },
      maxres: { url: "https://i.ytimg.com/vi/fJ9rUzIMcZQ/maxresdefault.jpg", width: 1280, height: 720 },
    },
    duration: 359,
    durationFormatted: "5:59",
    viewCount: 1720000000,
    viewCountFormatted: "1.7B views",
    likeCount: 12000000,
    likeCountFormatted: "12M",
    tags: ["Queen", "Bohemian Rhapsody", "Rock", "Freddie Mercury"],
  },
  {
    id: "9bZkp7q19f0",
    title: "PSY - GANGNAM STYLE(강남스타일) M/V",
    description: "PSY - ‘I LUV IT’ M/V @ https://youtu.be/Xvjnoagk6GU\nPSY - ‘New Face’ M/V @ https://youtu.be/OwJPPaEy9x0\nPSY - 8TH ALBUM '4X2=8' on iTunes @\nhttp://smarturl.it/PSY_8b4X2_8",
    publishedAt: "2012-07-15T07:46:32Z",
    channelId: "UCrDkAvwZum-UTjHmzDI2iIw",
    channelTitle: "officialpsy",
    channelThumbnailUrl: "https://yt3.ggpht.com/ytc/AIdro_psy=s176-c-k-c0x00ffffff-no-rj",
    thumbnails: {
      default: { url: "https://i.ytimg.com/vi/9bZkp7q19f0/default.jpg", width: 120, height: 90 },
      medium: { url: "https://i.ytimg.com/vi/9bZkp7q19f0/mqdefault.jpg", width: 320, height: 180 },
      high: { url: "https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg", width: 480, height: 360 },
      maxres: { url: "https://i.ytimg.com/vi/9bZkp7q19f0/maxresdefault.jpg", width: 1280, height: 720 },
    },
    duration: 252,
    durationFormatted: "4:12",
    viewCount: 5200000000,
    viewCountFormatted: "5.2B views",
    likeCount: 28000000,
    likeCountFormatted: "28M",
    tags: ["PSY", "Gangnam Style", "K-Pop", "Dance"],
  },
  {
    id: "kJQP7kiw5Fk",
    title: "Luis Fonsi - Despacito ft. Daddy Yankee",
    description: "“Despacito” disponible ya en todas las plataformas digitales: https://UMLE.lnk.to/DespacitoFp\nSigue a Luis Fonsi en: \nInstagram: https://www.instagram.com/luisfonsi\nFacebook: https://www.facebook.com/luisfonsi",
    publishedAt: "2017-01-13T05:00:02Z",
    channelId: "UCLp8RBhQHu9wSsq62j_Md6A",
    channelTitle: "Luis Fonsi",
    channelThumbnailUrl: "https://yt3.ggpht.com/ytc/AIdro_fonsi=s176-c-k-c0x00ffffff-no-rj",
    thumbnails: {
      default: { url: "https://i.ytimg.com/vi/kJQP7kiw5Fk/default.jpg", width: 120, height: 90 },
      medium: { url: "https://i.ytimg.com/vi/kJQP7kiw5Fk/mqdefault.jpg", width: 320, height: 180 },
      high: { url: "https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg", width: 480, height: 360 },
      maxres: { url: "https://i.ytimg.com/vi/kJQP7kiw5Fk/maxresdefault.jpg", width: 1280, height: 720 },
    },
    duration: 281,
    durationFormatted: "4:41",
    viewCount: 8400000000,
    viewCountFormatted: "8.4B views",
    likeCount: 53000000,
    likeCountFormatted: "53M",
    tags: ["Luis Fonsi", "Daddy Yankee", "Despacito", "Latin Pop"],
  },
];

export const MOCK_CHANNELS: Record<string, YouTubeChannel> = {
  UCuAXFkgsw1L7xaCfnd5JJOw: {
    id: "UCuAXFkgsw1L7xaCfnd5JJOw",
    title: "Rick Astley",
    customUrl: "@RickAstleyYT",
    description: "The official YouTube channel for Rick Astley. Never Gonna Give You Up, Together Forever, and more.",
    publishedAt: "2006-11-06T18:00:00Z",
    avatarUrl: "https://yt3.ggpht.com/ytc/AIdro_k6E3w2k6u6u6=s176-c-k-c0x00ffffff-no-rj",
    subscriberCount: 3800000,
    subscriberCountFormatted: "3.8M subscribers",
    videoCount: 145,
    viewCount: 2200000000,
  },
  UC4QobU6ST3KWZCmTQ451W6w: {
    id: "UC4QobU6ST3KWZCmTQ451W6w",
    title: "jawed",
    customUrl: "@jawed",
    description: "Co-founder of YouTube. First video ever uploaded to YouTube.",
    publishedAt: "2005-04-23T20:00:00Z",
    avatarUrl: "https://yt3.ggpht.com/ytc/AIdro_mqf7U1fU1fU1=s176-c-k-c0x00ffffff-no-rj",
    subscriberCount: 4600000,
    subscriberCountFormatted: "4.6M subscribers",
    videoCount: 1,
    viewCount: 312000000,
  },
  UCbXwS09o20T58vN16qX9kcg: {
    id: "UCbXwS09o20T58vN16qX9kcg",
    title: "Blender",
    customUrl: "@BlenderOfficial",
    description: "Blender is the free and open source 3D creation suite. It supports the entirety of the 3D pipeline.",
    publishedAt: "2007-06-25T12:00:00Z",
    avatarUrl: "https://yt3.ggpht.com/ytc/AIdro_blender=s176-c-k-c0x00ffffff-no-rj",
    subscriberCount: 1250000,
    subscriberCountFormatted: "1.2M subscribers",
    videoCount: 840,
    viewCount: 140000000,
  },
};

export class MockYouTubeDataProvider implements IYouTubeDataProvider {
  readonly name = "Mock/Demo Provider";

  async getTrendingFeed(category?: string): Promise<YouTubeFeedResponse> {
    let list = [...MOCK_VIDEOS];
    if (category && category !== "All") {
      const catLower = category.toLowerCase();
      const filtered = list.filter(
        (v) =>
          v.tags?.some((t) => t.toLowerCase().includes(catLower)) ||
          v.title.toLowerCase().includes(catLower)
      );
      if (filtered.length > 0) list = filtered;
    }
    return { videos: list };
  }

  async search(query: string, options?: SearchOptions): Promise<YouTubeSearchResponse> {
    const qLower = query.toLowerCase();
    const matchedVideos = MOCK_VIDEOS.filter(
      (v) =>
        v.title.toLowerCase().includes(qLower) ||
        v.description.toLowerCase().includes(qLower) ||
        v.channelTitle.toLowerCase().includes(qLower) ||
        v.tags?.some((t) => t.toLowerCase().includes(qLower))
    );

    const results = matchedVideos.length > 0 ? matchedVideos : MOCK_VIDEOS;

    return {
      items: results.map((v) => ({
        type: "video",
        video: v,
      })),
      totalResults: results.length,
    };
  }

  async getVideoDetails(videoId: string): Promise<YouTubeVideo | null> {
    const found = MOCK_VIDEOS.find((v) => v.id === videoId);
    if (found) return found;

    // Return dynamic fallback video object for any valid YouTube video ID requested
    return {
      id: videoId,
      title: `YouTube Video (${videoId})`,
      description: "Direct stream and YouTube playback stream available.",
      publishedAt: new Date().toISOString(),
      channelId: "UC_custom",
      channelTitle: "YouTube Creator",
      channelThumbnailUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
      thumbnails: {
        default: { url: `https://i.ytimg.com/vi/${videoId}/default.jpg` },
        medium: { url: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` },
        high: { url: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` },
        maxres: { url: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` },
      },
      duration: 300,
      durationFormatted: "5:00",
      viewCount: 1000000,
      viewCountFormatted: "1M views",
      likeCount: 50000,
      likeCountFormatted: "50K",
    };
  }

  async getRelatedVideos(videoId: string, limit = 10): Promise<YouTubeVideo[]> {
    return MOCK_VIDEOS.filter((v) => v.id !== videoId).slice(0, limit);
  }

  async getChannelDetails(channelId: string): Promise<YouTubeChannel | null> {
    if (MOCK_CHANNELS[channelId]) return MOCK_CHANNELS[channelId];
    return {
      id: channelId,
      title: "YouTube Channel",
      customUrl: `@channel_${channelId.slice(0, 6)}`,
      description: "Official channel page in YouTube Web Client.",
      publishedAt: "2020-01-01T00:00:00Z",
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
      subscriberCount: 500000,
      subscriberCountFormatted: "500K subscribers",
      videoCount: 42,
      viewCount: 15000000,
    };
  }

  async getChannelVideos(channelId: string): Promise<YouTubeFeedResponse> {
    const channelVideos = MOCK_VIDEOS.filter((v) => v.channelId === channelId);
    return { videos: channelVideos.length > 0 ? channelVideos : MOCK_VIDEOS.slice(0, 4) };
  }

  async getUserSubscriptions(): Promise<{ channels: YouTubeChannel[] }> {
    return { channels: Object.values(MOCK_CHANNELS) };
  }

  async getUserPlaylists(): Promise<{ playlists: YouTubePlaylistMeta[] }> {
    return {
      playlists: [
        {
          id: "PL_demo_1",
          title: "All Time Greatest Music Videos",
          description: "Curated collection of legendary tracks",
          publishedAt: "2024-01-01T00:00:00Z",
          channelId: "UCuAXFkgsw1L7xaCfnd5JJOw",
          channelTitle: "Rick Astley",
          thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
          itemCount: 12,
        },
      ],
    };
  }
}
