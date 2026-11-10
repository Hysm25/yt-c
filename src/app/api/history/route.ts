import { NextResponse } from "next/server";
import { repository } from "@/services/db/repository";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id || "guest";
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const videoId = searchParams.get("videoId");

    if (videoId) {
      const progress = await repository.getWatchProgress(userId, videoId);
      return NextResponse.json({ progress });
    }

    const history = await repository.getWatchHistory(userId, limit);
    return NextResponse.json({ history });
  } catch (error: any) {
    console.error("GET /api/history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch watch history" },
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
        { error: "Missing required video metadata" },
        { status: 400 }
      );
    }

    const record = await repository.upsertWatchProgress({
      userId,
      videoId: body.videoId,
      title: body.title,
      channelTitle: body.channelTitle || "Unknown Channel",
      channelId: body.channelId,
      thumbnailUrl: body.thumbnailUrl,
      duration: body.duration,
      progressSeconds: body.progressSeconds || 0,
      totalSeconds: body.totalSeconds || 0,
    });

    return NextResponse.json({ success: true, record });
  } catch (error: any) {
    console.error("POST /api/history error:", error);
    return NextResponse.json(
      { error: "Failed to record watch progress" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id || "guest";
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("videoId");

    if (videoId) {
      await repository.deleteWatchHistoryItem(userId, videoId);
      return NextResponse.json({ success: true, deletedVideoId: videoId });
    }

    await repository.clearWatchHistory(userId);
    return NextResponse.json({ success: true, cleared: true });
  } catch (error: any) {
    console.error("DELETE /api/history error:", error);
    return NextResponse.json(
      { error: "Failed to clear watch history" },
      { status: 500 }
    );
  }
}
