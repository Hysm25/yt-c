import { NextResponse } from "next/server";
import { youtubeService } from "@/services/youtube/service-factory";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;
    const pageToken = searchParams.get("pageToken") || undefined;

    const feed = await youtubeService.getTrendingFeed(category, pageToken);
    return NextResponse.json(feed);
  } catch (error: any) {
    console.error("GET /api/youtube/feed error:", error);
    return NextResponse.json(
      { error: "Failed to fetch video feed" },
      { status: 500 }
    );
  }
}
