import { NextResponse } from "next/server";
import { verifyProxyUrl } from "@/lib/stream-crypto";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const upstreamUrl = searchParams.get("url");
    const exp = searchParams.get("exp");
    const sig = searchParams.get("sig");

    if (!upstreamUrl) {
      return NextResponse.json(
        { error: "Missing required stream URL" },
        { status: 400 }
      );
    }

    // Cryptographic and allowlist verification
    const isValid = verifyProxyUrl(upstreamUrl, exp, sig);
    if (!isValid) {
      return NextResponse.json(
        { error: "Unauthorized or expired media stream request" },
        { status: 403 }
      );
    }

    // Forward Range header from client
    const clientRange = request.headers.get("range");
    const upstreamHeaders: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 10; Quest 2) AppleWebKit/537.36 (KHTML, like Gecko) OculusBrowser/31.0.0.28.69.549214717 SamsungBrowser/4.0 Chrome/120.0.6099.144 Mobile VR Safari/537.36",
      Accept: "*/*",
    };

    if (clientRange) {
      upstreamHeaders["Range"] = clientRange;
    }

    // Wire client abort signal to cancel upstream download immediately when client seeks or pauses
    const upstreamResponse = await fetch(upstreamUrl, {
      method: "GET",
      headers: upstreamHeaders,
      signal: request.signal,
    });

    if (!upstreamResponse.ok && upstreamResponse.status !== 206) {
      console.warn(
        `Upstream media fetch returned HTTP ${upstreamResponse.status}`
      );
      return new Response("Upstream media fetch failed", {
        status: upstreamResponse.status,
      });
    }

    // Forward streaming headers
    const responseHeaders = new Headers();
    responseHeaders.set(
      "Content-Type",
      upstreamResponse.headers.get("content-type") || "video/mp4"
    );
    responseHeaders.set("Accept-Ranges", "bytes");

    const contentRange = upstreamResponse.headers.get("content-range");
    if (contentRange) {
      responseHeaders.set("Content-Range", contentRange);
    }

    const contentLength = upstreamResponse.headers.get("content-length");
    if (contentLength) {
      responseHeaders.set("Content-Length", contentLength);
    }

    responseHeaders.set(
      "Cache-Control",
      "public, max-age=7200, stale-while-revalidate=3600"
    );

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    if (error.name === "AbortError") {
      // Client cancelled stream (e.g. paused or sought)
      return new Response(null, { status: 499 });
    }
    console.error("GET /api/stream/proxy error:", error);
    return NextResponse.json(
      { error: "Media proxy streaming error" },
      { status: 500 }
    );
  }
}
