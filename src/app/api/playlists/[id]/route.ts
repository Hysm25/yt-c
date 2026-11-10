import { NextResponse } from "next/server";
import { repository } from "@/services/db/repository";
import { auth } from "@/lib/auth";
import { youtubeService } from "@/services/youtube/service-factory";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    // Try local database first
    const playlist = await repository.getPlaylistWithItems(id);
    if (playlist) {
      return NextResponse.json({ playlist: { ...playlist, isYouTube: false } });
    }

    // If not in local DB and user is authenticated with Google OAuth or it's a YouTube playlist ID
    if (session?.accessToken || id.startsWith("PL") || id.startsWith("UU")) {
      const ytResult = await youtubeService.getPlaylistItems(id, session?.accessToken);
      if (ytResult?.items?.length > 0) {
        return NextResponse.json({
          playlist: {
            id,
            title: ytResult.title || "YouTube Playlist",
            description: ytResult.description || "",
            items: ytResult.items,
            isYouTube: true,
          },
        });
      }
    }

    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  } catch (error: any) {
    console.error("GET /api/playlists/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch playlist items" },
      { status: 500 }
    );
  }
}

// Rename / Update Playlist
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id || "guest";
    const { id: playlistId } = await params;
    const body = await request.json();

    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: "Playlist title is required" },
        { status: 400 }
      );
    }

    const playlist = await repository.updatePlaylist(userId, playlistId, {
      title: body.title.trim(),
      description: body.description?.trim(),
    });

    if (!playlist) {
      return NextResponse.json(
        { error: "Playlist not found or unauthorized to edit" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, playlist });
  } catch (error: any) {
    console.error("PUT /api/playlists/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update playlist" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: playlistId } = await params;
    const body = await request.json();

    if (!body.videoId || !body.title) {
      return NextResponse.json(
        { error: "Video ID and title are required" },
        { status: 400 }
      );
    }

    const item = await repository.addPlaylistItem(playlistId, {
      videoId: body.videoId,
      title: body.title,
      channelTitle: body.channelTitle || "Unknown",
      channelId: body.channelId,
      thumbnailUrl: body.thumbnailUrl,
      duration: body.duration,
    });

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    console.error("POST /api/playlists/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to add playlist item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id || "guest";
    const { id: playlistId } = await params;
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("videoId");

    if (videoId) {
      await repository.removePlaylistItem(playlistId, videoId);
      return NextResponse.json({ success: true, removedVideoId: videoId });
    }

    await repository.deletePlaylist(userId, playlistId);
    return NextResponse.json({ success: true, deletedPlaylistId: playlistId });
  } catch (error: any) {
    console.error("DELETE /api/playlists/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete playlist or item" },
      { status: 500 }
    );
  }
}
