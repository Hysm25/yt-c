import { NextResponse } from "next/server";
import { repository } from "@/services/db/repository";
import { auth } from "@/lib/auth";
import { youtubeService } from "@/services/youtube/service-factory";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id || "guest";
    const localPlaylists = await repository.getUserPlaylists(userId);

    // If user is authenticated with Google OAuth, also fetch their YouTube playlists
    let youtubePlaylists: any[] = [];
    if (session?.accessToken) {
      try {
        const ytRes = await youtubeService.getUserPlaylists(session.accessToken);
        if (ytRes?.playlists?.length > 0) {
          youtubePlaylists = ytRes.playlists.map((pl) => ({
            id: pl.id,
            userId,
            title: pl.title,
            description: pl.description || "",
            thumbnailUrl: pl.thumbnailUrl,
            itemCount: pl.itemCount,
            isYouTube: true,
            source: "youtube",
            createdAt: pl.publishedAt || new Date().toISOString(),
            updatedAt: pl.publishedAt || new Date().toISOString(),
          }));
        }
      } catch (err: any) {
        console.warn("Failed to fetch Google YouTube playlists:", err.message);
      }
    }

    // Return merged list: local playlists + Google YouTube playlists
    return NextResponse.json({
      playlists: [
        ...localPlaylists.map((p: any) => ({ ...p, isYouTube: false, source: "local" })),
        ...youtubePlaylists,
      ],
    });
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

    return NextResponse.json({ success: true, playlist });
  } catch (error: any) {
    console.error("POST /api/playlists error:", error);
    return NextResponse.json(
      { error: "Failed to create playlist" },
      { status: 500 }
    );
  }
}
