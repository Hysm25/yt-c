import { NextResponse } from "next/server";
import { repository } from "@/services/db/repository";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id || "guest";
    const settings = await repository.getUserSettings(userId);
    return NextResponse.json({ settings });
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
    const session = await auth();
    const userId = session?.user?.id || "guest";
    const body = await request.json();

    const updated = await repository.updateUserSettings(userId, {
      defaultPlaybackProvider: body.defaultPlaybackProvider,
      autoplay: body.autoplay,
      defaultQuality: body.defaultQuality,
      preferredSpeed: body.preferredSpeed,
      customApiKey: body.customApiKey,
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    console.error("POST /api/settings error:", error);
    return NextResponse.json(
      { error: "Failed to update user settings" },
      { status: 500 }
    );
  }
}
