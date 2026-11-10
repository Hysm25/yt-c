import { NextResponse } from "next/server";
import { repository } from "@/services/db/repository";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id || "guest";
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("videoId");

    if (videoId) {
      const isLiked = await repository.isLikedVideo(userId, videoId);
      return NextResponse.json({ isLiked });
    }

    const liked = await repository.getLikedVideos(userId);
    return NextResponse.json({ liked });
  } catch (error: any) {
    console.error("GET /api/liked error:", error);
    return NextResponse.json(
      { error: "Failed to fetch liked videos" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id || "guest";
    const body = await request.json();

    if (!body.videoId || !body.title) {
      return NextResponse.json(
        { error: "Video ID and title are required" },
        { status: 400 }
      );
    }

    const result = await repository.toggleLikeVideo(userId, {
      videoId: body.videoId,
      title: body.title,
      channelTitle: body.channelTitle || "Unknown",
      channelId: body.channelId,
      thumbnailUrl: body.thumbnailUrl,
      duration: body.duration,
    });

    return NextResponse.json({ success: true, liked: result.liked });
  } catch (error: any) {
    console.error("POST /api/liked error:", error);
    return NextResponse.json(
      { error: "Failed to toggle liked video" },
      { status: 500 }
    );
  }
}
