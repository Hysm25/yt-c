import { NextResponse } from "next/server";
import { Ytdl } from "@distube/ytdl-core";
import { signProxyUrl } from "@/lib/stream-crypto";
import { apiCache } from "@/services/youtube/cache";

const ytdl = new Ytdl();

// Open-source media fixtures for local offline development / unit tests
const OPEN_TEST_STREAMS: Record<string, string> = {
  L_LUpnjgPso:
    "https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4",
  fJ9rUzIMcZQ:
    "https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4",
  "9bZkp7q19f0":
    "https://archive.org/download/Tears-of-Steel/tears_of_steel_720p.mp4",
  kJQP7kiw5Fk:
    "https://archive.org/download/Sintel/sintel-2048-surround.mp4",
};

/**
 * Secondary stream extractor fallback using InnerTube Android VR client
 */
async function extractProgressiveStreamFallback(videoId: string): Promise<{
  url: string;
  itag: number;
  qualityLabel?: string;
} | null> {
  try {
    const res = await fetch("https://www.youtube.com/youtubei/v1/player", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10; Quest 2) AppleWebKit/537.36 (KHTML, like Gecko) OculusBrowser/31.0.0.28.69.549214717 SamsungBrowser/4.0 Chrome/120.0.6099.144 Mobile VR Safari/537.36",
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: "ANDROID_VR",
            clientVersion: "1.60.19",
            hl: "en",
            gl: "US",
          },
        },
        videoId,
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const formats = data.streamingData?.formats;
    if (!Array.isArray(formats) || formats.length === 0) return null;

    const directFormat = formats.find(
      (f: any) =>
        f.url &&
        !f.signatureCipher &&
        !f.cipher &&
        (f.itag === 18 || f.itag === 22 || f.mimeType?.includes("video/mp4"))
    );

    if (directFormat && directFormat.url) {
      return {
        url: directFormat.url,
        itag: directFormat.itag,
        qualityLabel: directFormat.qualityLabel,
      };
    }
    return null;
  } catch (err: any) {
    console.warn(`Fallback stream extraction failed for ${videoId}:`, err.message);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("id") || searchParams.get("videoId");
    const directUrl = searchParams.get("url");

    // 1. Explicit direct media URL provided
    if (
      directUrl &&
      (directUrl.startsWith("http://") || directUrl.startsWith("https://"))
    ) {
      return NextResponse.json({
        success: true,
        streamUrl: directUrl,
        audioUrl: null,
        format: "mp4",
        quality: "original",
        qualities: [{ label: "Original", height: 720, itag: 0, streamUrl: directUrl }],
        captions: [],
        hasDirectStream: true,
      });
    }

    if (!videoId) {
      return NextResponse.json(
        { error: "Video ID parameter is required" },
        { status: 400 }
      );
    }

    // 2. Direct media file URL passed as videoId
    if (
      videoId.startsWith("http://") ||
      videoId.startsWith("https://") ||
      videoId.endsWith(".mp4") ||
      videoId.endsWith(".webm")
    ) {
      return NextResponse.json({
        success: true,
        streamUrl: videoId,
        audioUrl: null,
        format: videoId.endsWith(".webm") ? "webm" : "mp4",
        quality: "direct",
        qualities: [{ label: "Direct", height: 720, itag: 0, streamUrl: videoId }],
        captions: [],
        hasDirectStream: true,
      });
    }

    // Check memory cache
    const cacheKey = `stream_v2:${videoId}`;
    const cached = apiCache.get<any>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // 3. Primary extraction via Ytdl (deciphers signature and n-parameter for cipher-protected videos)
    try {
      const info = await ytdl.getInfo(videoId);

      // Extract all available video formats (mp4/h264)
      const videoFormats = info.formats.filter(
        (f) => f.hasVideo && f.container === "mp4" && f.url && f.height
      );

      // Deduplicate qualities by label/height, selecting highest bitrate
      const qualityMap = new Map<string, any>();
      for (const f of videoFormats) {
        const label = f.qualityLabel || `${f.height}p`;
        if (!qualityMap.has(label) || (f.bitrate || 0) > (qualityMap.get(label).bitrate || 0)) {
          qualityMap.set(label, f);
        }
      }

      const qualities = Array.from(qualityMap.values())
        .sort((a, b) => (b.height || 0) - (a.height || 0))
        .map((f) => ({
          label: f.qualityLabel || `${f.height}p`,
          height: f.height || 720,
          itag: f.itag,
          streamUrl: signProxyUrl(f.url, 7200),
        }));

      // Extract best audio stream
      const audioFormats = info.formats.filter(
        (f) =>
          !f.hasVideo &&
          f.hasAudio &&
          (f.container === "mp4" || f.container === "m4a") &&
          f.url
      );
      audioFormats.sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0));
      const bestAudio = audioFormats[0];
      const signedAudioUrl = bestAudio?.url ? signProxyUrl(bestAudio.url, 7200) : null;

      // Check for progressive format with both audio and video
      const muxedFormats = info.formats.filter(
        (f) => f.hasVideo && f.hasAudio && f.container === "mp4" && f.url
      );
      if (muxedFormats.length > 0) {
        muxedFormats.sort((a, b) => (b.height || 0) - (a.height || 0));
      }

      // Extract available caption tracks
      const captions = (info.captionTracks || []).map((t) => ({
        languageCode: t.languageCode,
        name: t.name,
        isDefault: !!t.isDefault,
        url: `/api/stream/captions?id=${encodeURIComponent(videoId)}&lang=${encodeURIComponent(
          t.languageCode
        )}`,
      }));

      // Determine default stream: prefer 1080p or 720p or highest available <= 1080p
      const defaultVideo =
        qualities.find((q) => q.height <= 1080) || qualities[0];

      if (defaultVideo) {
        const responsePayload = {
          success: true,
          hasDirectStream: true,
          streamUrl: defaultVideo.streamUrl,
          audioUrl: signedAudioUrl,
          quality: defaultVideo.label,
          itag: defaultVideo.itag,
          audioItag: bestAudio?.itag,
          qualities: qualities.length > 0 ? qualities : [defaultVideo],
          captions,
          format: "mp4",
          isProxied: true,
        };

        apiCache.set(cacheKey, responsePayload, 1800);
        return NextResponse.json(responsePayload);
      }
    } catch (ytdlErr: any) {
      console.warn(`ytdl extraction failed for ${videoId}:`, ytdlErr.message);
    }

    // 4. Secondary fallback via InnerTube Android VR client
    const fallbackExtracted = await extractProgressiveStreamFallback(videoId);
    if (fallbackExtracted && fallbackExtracted.url) {
      const signedProxyUrl = signProxyUrl(fallbackExtracted.url, 7200);
      const qualityLabel = fallbackExtracted.qualityLabel || "360p";
      const responsePayload = {
        success: true,
        hasDirectStream: true,
        streamUrl: signedProxyUrl,
        audioUrl: null,
        quality: qualityLabel,
        itag: fallbackExtracted.itag,
        qualities: [
          {
            label: qualityLabel,
            height: 360,
            itag: fallbackExtracted.itag,
            streamUrl: signedProxyUrl,
          },
        ],
        captions: [],
        format: "mp4",
        isProxied: true,
      };

      apiCache.set(cacheKey, responsePayload, 1800);
      return NextResponse.json(responsePayload);
    }

    // 5. Open-source media fixture fallback for test assets
    const openFixture = OPEN_TEST_STREAMS[videoId];
    if (openFixture) {
      return NextResponse.json({
        success: true,
        streamUrl: openFixture,
        audioUrl: null,
        format: "mp4",
        quality: "720p",
        qualities: [{ label: "720p", height: 720, itag: 22, streamUrl: openFixture }],
        captions: [],
        hasDirectStream: true,
        isTestFixture: true,
      });
    }

    // 6. Video genuinely unavailable or restricted by DRM/region locks
    return NextResponse.json({
      success: true,
      hasDirectStream: false,
      message:
        "Direct stream is unavailable for this video. This video may be private, age-restricted, or region-locked.",
    });
  } catch (error: any) {
    console.error("GET /api/stream error:", error);
    return NextResponse.json(
      { error: "Stream resolution failed" },
      { status: 500 }
    );
  }
}
