import { NextResponse } from "next/server";
import { Ytdl } from "@distube/ytdl-core";
import { apiCache } from "@/services/youtube/cache";

const ytdl = new Ytdl();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("id") || searchParams.get("videoId");
    const lang = searchParams.get("lang") || "en";

    if (!videoId) {
      return NextResponse.json(
        { error: "Video ID parameter is required" },
        { status: 400 }
      );
    }

    const cacheKey = `captions:${videoId}:${lang}`;
    const cachedVtt = apiCache.get<string>(cacheKey);
    if (cachedVtt) {
      return new Response(cachedVtt, {
        status: 200,
        headers: {
          "Content-Type": "text/vtt; charset=utf-8",
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Extract captions using Ytdl
    try {
      const vtt = await ytdl.getCaptions(videoId, { lang });
      if (vtt && vtt.includes("-->")) {
        apiCache.set(cacheKey, vtt, 86400);
        return new Response(vtt, {
          status: 200,
          headers: {
            "Content-Type": "text/vtt; charset=utf-8",
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    } catch (captionErr: any) {
      console.warn(`Caption extraction failed for ${videoId} (${lang}):`, captionErr.message);
    }

    // Return empty WebVTT if no captions available
    const emptyVtt = "WEBVTT\n\n";
    return new Response(emptyVtt, {
      status: 200,
      headers: {
        "Content-Type": "text/vtt; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    console.error("GET /api/stream/captions error:", error);
    return new Response("WEBVTT\n\n", {
      status: 500,
      headers: { "Content-Type": "text/vtt; charset=utf-8" },
    });
  }
}
