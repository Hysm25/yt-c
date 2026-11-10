import { NextResponse } from "next/server";
import { youtubeService } from "@/services/youtube/service-factory";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("videoId");
    const pageToken = searchParams.get("pageToken") || undefined;

    if (!videoId) {
      return NextResponse.json(
        { error: "videoId query parameter is required" },
        { status: 400 }
      );
    }

    const result = await youtubeService.getVideoComments(videoId, pageToken);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/youtube/comments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch video comments" },
      { status: 500 }
    );
  }
}
