import { NextResponse } from "next/server";
import { repository } from "@/services/db/repository";
import { getGuestUserId, attachGuestCookieIfMissing } from "@/lib/guest-session";

export async function GET(request: Request) {
  try {
    const userId = getGuestUserId(request);
    const settings = await repository.getUserSettings(userId);
    const res = NextResponse.json({ settings });
    return attachGuestCookieIfMissing(res, userId);
  } catch (error: any) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = getGuestUserId(request);
    const body = await request.json();

    const updated = await repository.updateUserSettings(userId, {
      defaultPlaybackProvider: body.defaultPlaybackProvider,
      autoplay: body.autoplay,
      defaultQuality: body.defaultQuality,
      preferredSpeed: body.preferredSpeed,
      customApiKey: body.customApiKey,
    });

    const res = NextResponse.json({ success: true, settings: updated });
    return attachGuestCookieIfMissing(res, userId);
  } catch (error: any) {
    console.error("POST /api/settings error:", error);
    return NextResponse.json(
      { error: "Failed to update user settings" },
      { status: 500 }
    );
  }
}
