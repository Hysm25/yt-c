import { NextResponse } from "next/server";
import { youtubeService } from "@/services/youtube/service-factory";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const type = (searchParams.get("type") as any) || "all";
    const order = (searchParams.get("order") as any) || "relevance";
    const pageToken = searchParams.get("pageToken") || undefined;

    if (!query.trim()) {
      // If query is empty, return trending feed as fallback
      const feed = await youtubeService.getTrendingFeed();
      return NextResponse.json({
        items: feed.videos.map((v) => ({ type: "video", video: v })),
        totalResults: feed.videos.length,
      });
    }

    const results = await youtubeService.search(query, {
      type,
      order,
      pageToken,
    });

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("GET /api/youtube/search error:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
}
