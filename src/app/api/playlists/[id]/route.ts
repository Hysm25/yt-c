import { NextResponse } from "next/server";
import { repository } from "@/services/db/repository";
import { auth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const playlist = await repository.getPlaylistWithItems(id);
    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }
    return NextResponse.json({ playlist });
  } catch (error: any) {
    console.error("GET /api/playlists/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch playlist items" },
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
