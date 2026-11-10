# YouTube Web Client

A modern, high-performance **YouTube Web Client** featuring an independent custom user interface, a native browser HTML5 video player (`<video controls>`) with dynamic stream extraction and secure media proxying, reliable Official YouTube Player fallback, embedded PostgreSQL persistence with zero background daemons, and complete account-free guest privacy.

---

## ✨ Features

### 🎬 Video Playback & Dual-Engine Architecture
- **Native Browser HTML5 Player (`<video controls>`) as Primary**: Uses the browser's native `<video controls>` element with default appearance and behavior. No bloated player UI or custom overlays—only clean, high-performance video playback.
- **Dynamic Stream Extraction & Media Proxying**: Automatically extracts progressive MP4 streams (`itag 18` / `itag 22`) via YouTube InnerTube and serves them through a secure Next.js media proxy (`/api/stream/proxy`).
- **Cryptographic Security & SSRF Protection**: Media proxy endpoints enforce HMAC-SHA256 signature verification, 2-hour expiration timestamps, and strict hostname allowlisting (`*.googlevideo.com`, `archive.org`, etc.), preventing open proxy abuse and SSRF attacks.
- **Immediate Range Request & Cancellation Support**: Supports HTTP `206 Partial Content` Range requests for smooth seeking and buffering, and passes `AbortSignal` to immediately cancel upstream downloads when seeking or pausing.
- **Reliable Official YouTube Player Fallback**: For videos where raw progressive streams are restricted by YouTube signature ciphers or Botguard verification, the player provides a clean in-player fallback notice with an immediate one-click action to play in the Official YouTube Player without disrupting the user.

### 🌐 Live YouTube Data Integration (Zero API Key Requirement)
- **Real YouTube Search**: Live search queries YouTube directly, returning real video, channel, and playlist results with full metadata (views, length, channel name, thumbnails).
- **Categorized Trending Feeds**: Dynamic categorized video feeds (Music, Gaming, News, Tech, Education, Sports, Entertainment) with live YouTube content.
- **Full Channel Browsing & Pagination**: Channel profiles display high-resolution avatars, responsive banners, subscriber counts, video counts, and complete video grids with continuation pagination ("Load More Videos" in batches of 30).
- **Real Comments & Guest Posting**: Fetches live YouTube comments with real avatars, author handles, like counts, and reply counts. Supports continuous pagination ("Load More Comments") and expandable replies. Allows guest users to post comments and replies with local persistence.
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

The test suite covers utilities, media stream proxy cryptography, SSRF protection, database repository operations (history, playlists, likes, subscriptions, settings), and live YouTube data feeds:

```bash
bun run test
```
