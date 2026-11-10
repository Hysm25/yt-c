import { NextResponse } from "next/server";
import { repository } from "@/services/db/repository";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id || "guest";
    const playlists = await repository.getUserPlaylists(userId);
    return NextResponse.json({ playlists });
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
    const session = await auth();
    const userId = session?.user?.id || "guest";
    const body = await request.json();

    if (!body.title) {
      return NextResponse.json(
        { error: "Playlist title is required" },
        { status: 400 }
      );
    }

    const playlist = await repository.createPlaylist(
      userId,
      body.title,
      body.description || ""
    );

    return NextResponse.json({ success: true, playlist });
  } catch (error: any) {
    console.error("POST /api/playlists error:", error);
    return NextResponse.json(
      { error: "Failed to create playlist" },
      { status: 500 }
    );
  }
}
