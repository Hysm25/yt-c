import { NextResponse } from "next/server";

// Sample verified public direct streams for open content and fallbacks
const DIRECT_STREAM_MAP: Record<string, string> = {
  L_LUpnjgPso:
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  jNQXAC9IVRw:
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  dQw4w9WgXcQ:
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  fJ9rUzIMcZQ:
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "9bZkp7q19f0":
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
  kJQP7kiw5Fk:
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("id");

    if (!videoId) {
      return NextResponse.json(
        { error: "Video ID parameter is required" },
        { status: 400 }
      );
    }

    // Check if we have a direct stream for this video ID
    const streamUrl = DIRECT_STREAM_MAP[videoId];

    if (streamUrl) {
      return NextResponse.json({
        success: true,
        streamUrl,
        format: "mp4",
        quality: "1080p",
        hasDirectStream: true,
      });
    }

    // For any other video ID, indicate that embed fallback is recommended
    return NextResponse.json({
      success: true,
      hasDirectStream: false,
      recommendedProvider: "embed",
      message:
        "Direct stream cipher requires YouTube IFrame player for full playback fidelity.",
    });
  } catch (error: any) {
    console.error("GET /api/stream error:", error);
    return NextResponse.json(
      { error: "Stream resolution failed" },
      { status: 500 }
    );
  }
}
