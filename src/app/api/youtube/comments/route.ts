import { NextResponse } from "next/server";
import { youtubeService } from "@/services/youtube/service-factory";
import { auth } from "@/lib/auth";

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
    const session = await auth();
    const body = await request.json();
    const { videoId, text, parentId } = body;

    if (!text?.trim()) {
      return NextResponse.json(
        { error: "Comment text cannot be empty" },
        { status: 400 }
      );
    }

    if (!session?.accessToken) {
      return NextResponse.json(
        {
          error:
            "Google account authentication is required to post comments to YouTube. Please sign in with your Google account.",
          requiresAuth: true,
        },
        { status: 401 }
      );
    }

    // Post to official YouTube API using the authenticated user's access token
    try {
      if (parentId) {
        // Posting a reply to an existing comment
        const res = await fetch(
          "https://www.googleapis.com/youtube/v3/comments?part=snippet",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              snippet: {
                parentId,
                textOriginal: text.trim(),
              },
            }),
          }
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error?.message || "YouTube API reply submission failed");
        }
        return NextResponse.json({ success: true, comment: data });
      } else {
        // Posting a top-level comment thread
        if (!videoId) {
          return NextResponse.json(
            { error: "videoId is required for top-level comments" },
            { status: 400 }
          );
        }
        const res = await fetch(
          "https://www.googleapis.com/youtube/v3/commentThreads?part=snippet",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              snippet: {
                videoId,
                topLevelComment: {
                  snippet: {
                    textOriginal: text.trim(),
                  },
                },
              },
            }),
          }
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error?.message || "YouTube API comment submission failed");
        }
        return NextResponse.json({ success: true, comment: data });
      }
    } catch (apiError: any) {
      console.warn("YouTube comment post API error:", apiError.message);
      return NextResponse.json(
        {
          error: `YouTube API permission error: ${apiError.message}. Make sure your account has YouTube channel permissions enabled.`,
        },
        { status: 403 }
      );
    }
  } catch (error: any) {
    console.error("POST /api/youtube/comments error:", error);
    return NextResponse.json(
      { error: "Failed to post comment" },
      { status: 500 }
    );
  }
}
