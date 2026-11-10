# YouTube Web Client

A modern, high-performance **YouTube Web Client** featuring an independent custom user interface, a native browser HTML5 video player (`<video controls>`) with cipher-deciphering stream extraction and secure media proxying, authentic video descriptions with interactive formatting, embedded PostgreSQL persistence with zero background daemons, and complete account-free guest privacy.

---

## ✨ Features

### 🎬 Native HTML5 Video Playback & Cipher Decryption
- **Native Browser HTML5 Player (`<video controls>`) as Primary**: Uses the browser's native `<video controls>` element with default appearance and behavior. No bloated custom player UI—clean, high-performance, native browser video playback.
- **Cipher-Protected Stream Decryption**: Deciphers YouTube signature ciphers and `n`-parameter throttling via `@distube/ytdl-core`, unlocking direct streaming for cipher-protected videos in 1080p, 720p, 480p, and 360p.
- **Dual-Track Synchronized HTML5 Playback**: Seamlessly synchronizes adaptive video streams (`avc1`/H.264) with native high-quality audio streams (`mp4a`/AAC) in real time across play, pause, seek, volume, and playback rate changes.
- **Secure Next.js Media Proxying (`/api/stream/proxy`)**: Serves video and audio streams through an authenticated Next.js proxy with HMAC-SHA256 cryptographic signatures, 2-hour expiration timestamps, and strict hostname allowlisting (`*.googlevideo.com`, `archive.org`, etc.), preventing open proxy abuse and SSRF attacks.
- **HTTP 206 Range Requests & Instant Cancellation**: Forwards HTTP `206 Partial Content` Range headers for smooth seeking, and wires client `AbortSignal` to immediately terminate upstream downloads when seeking or pausing.
- **Emergency Official Player Fallback**: If a video is region-restricted or requires paid verification, provides an in-player fallback notice with one-click playback in the Official YouTube Player.

### 📝 Authentic Video Descriptions & Metadata
- **Complete Authentic Descriptions**: Extracts the authentic multi-line video descriptions directly from YouTube metadata and watch page responses (including timestamps, tracklists, social links, and credits).
- **Interactive Formatting**: Parses URLs into clickable links (`<a href="..." target="_blank">`) with auto-wrapping (`whitespace-pre-wrap break-words`) that adapts cleanly across mobile, tablet, and desktop viewports.
- **Expandable Description Card**: Clean collapsible box with view counts, relative timestamps, and one-click expand/collapse.

### 🌐 Live YouTube Data Integration (Zero API Key Requirement)
- **Real YouTube Search**: Live search queries YouTube directly, returning real video, channel, and playlist results with full metadata (views, length, channel name, thumbnails).
- **Categorized Trending Feeds**: Dynamic categorized video feeds (Music, Gaming, News, Tech, Education, Sports, Entertainment) with live YouTube content.
- **Full Channel Browsing & Pagination**: Channel profiles display high-resolution avatars, responsive banners, subscriber counts, video counts, and complete video grids with continuation pagination ("Load More Videos" in batches of 30).
- **Clean Distraction-Free Experience**: Distraction-free watch experience with no comments section clutter.
- **Optional YouTube Data API v3 Quota**: If a `YOUTUBE_API_KEY` is provided, the client prioritizes official v3 endpoints with in-memory TTL/LRU quota caching.

### 📁 Complete Playlists Management & Queue
- **Full Playlist Lifecycle**: Create, rename, edit descriptions, and delete playlists with cascade deletion.
- **Add & Remove Videos**: Add videos to any playlist via the Save dialog on the Watch page, and remove items directly from the playlist detail view.
- **Playlist Playback Queue**: Playing a playlist opens the Watch page with an active Playlist Queue panel in the right sidebar showing tracklist, current index ("Video X of Y"), previous/next track buttons, and automated next-video playback transition on track end.

### 🛡️ Pure Guest Mode & Complete Privacy (No Authentication Required)
- **Zero Authentication Complexity**: Auth.js, Google OAuth, session cookies, sign-in/out prompts, and external OAuth dependencies have been completely removed from the codebase.
- **Isolated Visitor Sessions**: Each browser session is assigned an anonymous, cryptographically random visitor ID (`yt_guest_id` cookie), ensuring that each visitor's watch history, playlists, liked videos, subscriptions, and settings are strictly isolated and never collide.
- **Channel Subscriptions**: Subscribe and unsubscribe from channels with one click on channel pages; view your subscribed channels list and latest uploads on the Subscriptions page.
- **Zero-Daemon Local Database**: Embedded **PGlite** (WebAssembly PostgreSQL) operates inside `.data/pglite` without requiring Docker or a running PostgreSQL daemon.
- **External PostgreSQL Support**: Optionally connects to external PostgreSQL (e.g. Supabase, Neon, AWS RDS) by setting `DATABASE_URL`.

---

## 🛠️ Tech Stack

| Domain | Technology |
| :--- | :--- |
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router, Turbopack, React 19) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) (Strict Mode) |
| **Styling & UI** | [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), Lucide Icons |
| **Stream Extraction** | [@distube/ytdl-core](https://github.com/distubeteam/ytdl-core) & YouTube InnerTube |
| **Database & ORM** | [Drizzle ORM](https://orm.drizzle.team/), [PGlite](https://pglite.electric-sql.com/) (Embedded WASM Postgres) & Postgres.js |
| **Validation** | [Zod](https://zod.dev/) |
| **Package Manager & Runner** | [Bun](https://bun.sh/) |
| **Architecture Review** | [Elephant-Goldfish Model (EGM)](https://github.com/google/elephant-goldfish-model) |

---

## 🚀 Quick Start

### Prerequisites
- [Bun](https://bun.sh/) 1.1+ or 1.4+ (install via `curl -fsSL https://bun.sh/install | bash`)

### Installation & Run

```bash
# Clone the repository
git clone https://github.com/Hysm25/yt-c.git
cd yt-c

# Install dependencies using Bun
bun install

# Run type check & automated tests
bun run type-check
bun run test

# Build for production
bun run build

# Start the production server
bun run start
```

Open [http://localhost:3000](http://localhost:3000) to start browsing!

---

## ⚙️ Environment Configuration

Copy the example file to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Required | Default / Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | Optional | External PostgreSQL connection URL. If omitted, uses embedded PGlite in `.data/pglite`. |
| `YOUTUBE_API_KEY` | Optional | Google Cloud YouTube Data API v3 key for high-volume quota fallback. |
| `NEXT_PUBLIC_DEFAULT_PLAYBACK_PROVIDER` | Optional | Default playback engine: `"html5"` (default) or `"embed"`. |
| `STREAM_PROXY_SECRET` | Optional | Secret key used for signing stream proxy URLs (auto-generated if omitted). |

---

## 🧪 Testing

The automated test suite (`bun run test`) verifies utilities, stream proxy cryptography and SSRF defenses, database repository operations, channel subscriptions, and live YouTube feed/details extraction:

```bash
$ bun run test
=== STARTING FULL TEST SUITE ===
[1/5] Testing Utility Functions...
✓ Utilities verified successfully
[2/5] Testing Media Stream Proxy Security & Signatures...
✓ Media stream proxy cryptography and SSRF defenses verified
[3/5] Testing Database Repository...
✓ User settings verified
✓ Watch history verified
✓ Playlists and cascade deletion verified
✓ Video likes toggle verified
[4/5] Testing Subscriptions Repository...
✓ Channel subscriptions verified
[5/5] Testing YouTube Service & Cache...
✓ Trending feed fetched (6 videos)
✓ Video details & description verified: "..." (description: 578 chars)
✓ Search verified (20 items)
=== ALL TEST SUITES PASSED WITH 100% SUCCESS! ===
```
