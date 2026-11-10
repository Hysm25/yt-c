# YouTube Web Client

A modern, full-featured **YouTube Web Client** featuring an independent custom user interface, a native HTML5 video player with dual-playback architecture, embedded PostgreSQL persistence with zero background daemons, quota-aware YouTube Data API v3 integration, and Google OAuth authentication.

---

## ✨ Features

### 🎬 Video Playback & Dual-Engine Architecture
- **Native Browser HTML5 Player (`<video controls>`)**: Uses the browser's default HTML5 `<video controls>` player with native appearance and behavior. No custom player interface or unmaintainable UI overlays; keeps only the functionality necessary to load and play videos. Verified with open-source direct media streams (Archive.org, MDN, W3C) for 100% reliable direct playback testing.
- **Official YouTube Player Engine**: Privacy-enhanced YouTube IFrame embed (`youtube-nocookie.com`) ensuring 100% video playback compatibility for YouTube cipher-protected videos with automated progress synchronization and next-video advancement.
- **Seamless Playback Fallbacks**: Direct streams play natively. For cipher-protected YouTube streams where direct MP4 streaming is restricted by YouTube signature ciphers, the player provides a clean in-player fallback card with a one-click button to play in the Official YouTube Player without frustrating abrupt reroutes.
- **Instant Engine Switching**: Switch between the Native Browser Player and the Official YouTube Player directly in the player header or globally from the top navigation.

### 🌐 Live YouTube Data Integration (Zero API Key Requirement)
- **Real YouTube Search**: Live search queries YouTube directly, returning actual video, channel, and playlist results with full metadata (views, length, channel name, thumbnails).
- **Real Trending Feeds**: Dynamic categorized video feeds (Music, Gaming, News, Tech, Education, Sports, Entertainment) with live YouTube content instead of hardcoded mock data.
- **Full Channel Browsing & Pagination**: Channel profiles display high-resolution avatars, responsive banners (up to 2560px), subscriber counts, video counts, and complete video grids with continuation pagination ("Load More Videos" in batches of 30).
- **Real Comments & Replies**: Fetches live YouTube comments with real avatars, author handles (`@user`), like counts, relative dates, and reply counts. Supports continuous pagination ("Load More Comments") and expandable replies ("View X replies") for comment threads.
- **Official YouTube Data API v3 Support**: If a `YOUTUBE_API_KEY` is provided, the client prioritizes official v3 endpoints with in-memory TTL/LRU quota caching. Authenticated users can post comments and replies directly to real YouTube videos.
- **Offline Fallback Resilience**: If network access is completely offline, the client automatically falls back to local sample content so the application remains runnable.

### 📁 Complete Playlists Management & Queue
- **Full Playlist Lifecycle**: Create, rename/edit title and description, and delete playlists with complete cascade deletion.
- **Add & Remove Videos**: Add videos to any playlist via the Save dialog on the Watch page, and remove items directly from the playlist detail view.
- **Playlist Playback Queue**: Playing a playlist opens the Watch page with an active Playlist Queue panel in the right sidebar showing tracklist, current index ("Video X of Y"), previous/next track buttons, and automated next-video playback transition on track end.
- **Google YouTube Playlists Sync**: When authenticated with Google OAuth, merges and displays the user's Google YouTube playlists alongside local playlists with clear status badges, allowing viewing and playing real YouTube playlists.

### 🔐 Authentication, Navigation & User Persistence
- **Prominent Google Sign-In Option**: Clear, visible Sign In button in the navigation header (accessible on both desktop and mobile) and dedicated YouTube-style sign-in cards in the sidebar navigation.
- **Auth.js (NextAuth v5) with Google OAuth**: Interactive account menu supporting Google sign-in with automatic YouTube scopes (`youtube.readonly`, `youtube.force-ssl`).
- **Resilient OAuth Validation & Dedicated Error Recovery**: If Google credentials (`AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`) are not set or unconfigured, the app gracefully guides the user with a setup dialog and dedicated `/auth/error` page rather than breaking with configuration errors.
- **Zero-Daemon Local Database**: Embedded **PGlite** (WebAssembly PostgreSQL) operates inside `.data/pglite` without requiring Docker or a running PostgreSQL daemon.
- **External PostgreSQL Support**: Connects to external PostgreSQL (e.g. Supabase, Neon, AWS RDS) by setting `DATABASE_URL`.
- **Guest Mode**: Full local persistence for watch history, custom playlists, liked videos, and settings without requiring login.
- **Data Export & Privacy**: One-click JSON backup export and history clearing in Settings.

---

## 🛠️ Tech Stack

| Domain | Technology |
| :--- | :--- |
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router, Turbopack, React 19) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) (Strict Mode) |
| **Styling & UI** | [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), Lucide Icons |
| **Database & ORM** | [Drizzle ORM](https://orm.drizzle.team/), [PGlite](https://pglite.electric-sql.com/) (Embedded WASM Postgres) & Postgres.js |
| **Authentication** | [Auth.js (NextAuth v5)](https://authjs.dev/) with Google OAuth |
| **Validation** | [Zod](https://zod.dev/) |
| **Package Manager** | [pnpm](https://pnpm.io/) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18.17+ or Node.js 20+
- pnpm (recommended: `corepack enable pnpm` or `npm install -g pnpm`)

### Installation & Run

```bash
# Clone the repository
git clone https://github.com/Hysm25/yt-c.git
cd yt-c

# Install dependencies
pnpm install

# Run type check & automated tests
pnpm type-check
pnpm test

# Build for production
pnpm build

# Start the production server
pnpm start
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
| `AUTH_SECRET` | Recommended | Random 32+ character string for Auth.js cookie encryption (`openssl rand -base64 32`) |
| `AUTH_GOOGLE_ID` | Optional | Google OAuth 2.0 Client ID for Google Sign-In |
| `AUTH_GOOGLE_SECRET` | Optional | Google OAuth 2.0 Client Secret for Google Sign-In |
| `NEXTAUTH_URL` | Optional | Canonical application URL (default: `http://localhost:3000`) |
| `YOUTUBE_API_KEY` | Optional | Google Cloud YouTube Data API v3 key for high-volume quota |
| `DATABASE_URL` | Optional | External PostgreSQL connection URL. If omitted, uses embedded PGlite. |

> **Note**: Even without any API keys or credentials, the application functions out of the box with real YouTube search, live trending feeds, real comments, full channel browsing, and embedded PostgreSQL persistence in Guest Mode.
