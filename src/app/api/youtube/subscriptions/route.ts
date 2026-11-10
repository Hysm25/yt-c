import { NextResponse } from "next/server";
import { repository } from "@/services/db/repository";
import { getGuestUserId, attachGuestCookieIfMissing } from "@/lib/guest-session";

export async function GET(request: Request) {
  try {
    const userId = getGuestUserId(request);
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get("channelId");

    // Check if subscribed to a specific channel
    if (channelId) {
      const isSubscribed = await repository.isSubscribed(userId, channelId);
      const res = NextResponse.json({ isSubscribed });
      return attachGuestCookieIfMissing(res, userId);
    }

    // List all user subscriptions
    const subscriptions = await repository.getSubscriptions(userId);
    const channels = subscriptions.map((sub: any) => ({
      id: sub.channelId,
      title: sub.channelTitle,
      avatarUrl: sub.avatarUrl,
      subscribedAt: sub.subscribedAt,
    }));

    const res = NextResponse.json({ channels });
    return attachGuestCookieIfMissing(res, userId);
  } catch (error: any) {
    console.error("GET /api/youtube/subscriptions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = getGuestUserId(request);
    const body = await request.json();

    if (!body.channelId || !body.channelTitle) {
      return NextResponse.json(
        { error: "Channel ID and title are required" },
        { status: 400 }
      );
    }

    const result = await repository.toggleSubscription(userId, {
      channelId: body.channelId,
      channelTitle: body.channelTitle,
      avatarUrl: body.avatarUrl,
    });

    const res = NextResponse.json({
      success: true,
      subscribed: result.subscribed,
    });
    return attachGuestCookieIfMissing(res, userId);
  } catch (error: any) {
    console.error("POST /api/youtube/subscriptions error:", error);
    return NextResponse.json(
      { error: "Failed to toggle subscription" },
      { status: 500 }
    );
  }
}
