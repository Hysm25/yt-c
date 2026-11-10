import { NextResponse } from "next/server";
import { youtubeService } from "@/services/youtube/service-factory";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const video = await youtubeService.getVideoDetails(id);

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const related = await youtubeService.getRelatedVideos(id);
    return NextResponse.json({ video, related });
  } catch (error: any) {
    console.error("GET /api/youtube/video/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch video details" },
      { status: 500 }
    );
  }
}
