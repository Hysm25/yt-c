import { NextResponse } from "next/server";
import { youtubeService } from "@/services/youtube/service-factory";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    const accessToken = session?.accessToken;
    const { searchParams } = new URL(request.url);
    const pageToken = searchParams.get("pageToken") || undefined;

    const result = await youtubeService.getUserSubscriptions(accessToken, pageToken);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/youtube/subscriptions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}
