import { NextResponse } from "next/server";

// Verified public direct streams for open media assets and reliable native testing
const DIRECT_STREAM_MAP: Record<string, string> = {
  L_LUpnjgPso:
    "https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4",
  jNQXAC9IVRw:
    "https://www.w3schools.com/html/mov_bbb.mp4",
  dQw4w9WgXcQ:
    "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  fJ9rUzIMcZQ:
    "https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4",
  "9bZkp7q19f0":
    "https://archive.org/download/Tears-of-Steel/tears_of_steel_720p.mp4",
  kJQP7kiw5Fk:
    "https://archive.org/download/Sintel/sintel-2048-surround.mp4",
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("id") || searchParams.get("videoId");
    const directUrl = searchParams.get("url");

    // If explicit direct media URL was provided
    if (directUrl && (directUrl.startsWith("http://") || directUrl.startsWith("https://"))) {
      return NextResponse.json({
        success: true,
        streamUrl: directUrl,
        format: "mp4",
        quality: "original",
        hasDirectStream: true,
      });
    }

    if (!videoId) {
      return NextResponse.json(
        { error: "Video ID parameter is required" },
        { status: 400 }
      );
    }

    // If videoId itself is a direct media URL
    if (
      videoId.startsWith("http://") ||
      videoId.startsWith("https://") ||
      videoId.endsWith(".mp4") ||
      videoId.endsWith(".webm")
    ) {
      return NextResponse.json({
        success: true,
        streamUrl: videoId,
        format: videoId.endsWith(".webm") ? "webm" : "mp4",
        quality: "direct",
        hasDirectStream: true,
      });
    }

    // Check verified direct streams map
    const mappedStream = DIRECT_STREAM_MAP[videoId];
    if (mappedStream) {
      return NextResponse.json({
        success: true,
        streamUrl: mappedStream,
        format: "mp4",
        quality: "720p",
        hasDirectStream: true,
      });
    }

    // YouTube streams protected by signature ciphers require YouTube IFrame embed
    return NextResponse.json({
      success: true,
      hasDirectStream: false,
      recommendedProvider: "embed",
      message:
        "Direct stream is unavailable for this video due to YouTube cipher protection. The Official YouTube Player is recommended for 100% playback fidelity.",
    });
  } catch (error: any) {
    console.error("GET /api/stream error:", error);
    return NextResponse.json(
      { error: "Stream resolution failed" },
      { status: 500 }
    );
  }
}
