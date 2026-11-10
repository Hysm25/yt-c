import { NextResponse } from "next/server";
import { youtubeService } from "@/services/youtube/service-factory";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("videoId");
    const pageToken = searchParams.get("pageToken") || undefined;
    const replyToken = searchParams.get("replyToken") || undefined;

    // If requesting replies for a comment
    if (replyToken) {
      const replies = await youtubeService.getCommentReplies(replyToken);
      return NextResponse.json(replies);
    }

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { videoId, text, parentId, authorName } = body;

    if (!text?.trim()) {
      return NextResponse.json(
        { error: "Comment text cannot be empty" },
        { status: 400 }
      );
    }

    // Guest comment created locally
    const guestComment = {
      id: `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      authorDisplayName: authorName?.trim() || "Guest Viewer",
      authorProfileImageUrl:
        "https://yt3.ggpht.com/default=s88-c-k-c0x00ffffff-no-rj",
      textDisplay: text.trim(),
      likeCount: 0,
      publishedAt: "Just now",
      isGuest: true,
      replyCount: 0,
      parentId: parentId || null,
      videoId: videoId || null,
    };

    return NextResponse.json({ success: true, comment: guestComment });
  } catch (error: any) {
    console.error("POST /api/youtube/comments error:", error);
    return NextResponse.json(
      { error: "Failed to post comment" },
      { status: 500 }
    );
  }
}
