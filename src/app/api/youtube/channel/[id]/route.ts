import { NextResponse } from "next/server";
import { youtubeService } from "@/services/youtube/service-factory";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const pageToken = searchParams.get("pageToken") || undefined;

    const channel = await youtubeService.getChannelDetails(id);
    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const videos = await youtubeService.getChannelVideos(id, pageToken);
    return NextResponse.json({ channel, videos });
  } catch (error: any) {
    console.error("GET /api/youtube/channel/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch channel details" },
      { status: 500 }
    );
  }
}
