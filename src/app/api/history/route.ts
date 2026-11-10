import { NextResponse } from "next/server";
import { repository } from "@/services/db/repository";
import { getGuestUserId, attachGuestCookieIfMissing } from "@/lib/guest-session";

export async function GET(request: Request) {
  try {
    const userId = getGuestUserId(request);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const videoId = searchParams.get("videoId");

    if (videoId) {
      const progress = await repository.getWatchProgress(userId, videoId);
      const res = NextResponse.json({ progress });
      return attachGuestCookieIfMissing(res, userId);
    }

    const history = await repository.getWatchHistory(userId, limit);
    const res = NextResponse.json({ history });
    return attachGuestCookieIfMissing(res, userId);
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
    const userId = getGuestUserId(request);
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

    const res = NextResponse.json({ success: true, record });
    return attachGuestCookieIfMissing(res, userId);
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
    const userId = getGuestUserId(request);
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("videoId");

    if (videoId) {
      await repository.deleteWatchHistoryItem(userId, videoId);
      const res = NextResponse.json({ success: true, deletedVideoId: videoId });
      return attachGuestCookieIfMissing(res, userId);
    }

    await repository.clearWatchHistory(userId);
    const res = NextResponse.json({ success: true, cleared: true });
    return attachGuestCookieIfMissing(res, userId);
  } catch (error: any) {
    console.error("DELETE /api/history error:", error);
    return NextResponse.json(
      { error: "Failed to clear watch history" },
      { status: 500 }
    );
  }
}
