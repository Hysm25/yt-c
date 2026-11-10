import { NextResponse } from "next/server";
import { repository } from "@/services/db/repository";
import { getGuestUserId, attachGuestCookieIfMissing } from "@/lib/guest-session";

export async function GET(request: Request) {
  try {
    const userId = getGuestUserId(request);
    const localPlaylists = await repository.getUserPlaylists(userId);

    const res = NextResponse.json({
      playlists: localPlaylists.map((p: any) => ({
        ...p,
        isYouTube: false,
        source: "local",
      })),
    });
    return attachGuestCookieIfMissing(res, userId);
  } catch (error: any) {
    console.error("GET /api/playlists error:", error);
    return NextResponse.json(
      { error: "Failed to fetch playlists" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = getGuestUserId(request);
    const body = await request.json();

    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: "Playlist title is required" },
        { status: 400 }
      );
    }

    const playlist = await repository.createPlaylist(
      userId,
      body.title.trim(),
      body.description?.trim() || ""
    );

    const res = NextResponse.json({ success: true, playlist });
    return attachGuestCookieIfMissing(res, userId);
  } catch (error: any) {
    console.error("POST /api/playlists error:", error);
    return NextResponse.json(
      { error: "Failed to create playlist" },
      { status: 500 }
    );
  }
}
