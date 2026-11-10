# YouTube Web Client

A modern, full-featured **YouTube Web Client** featuring an independent custom user interface, a native HTML5 video player with dual-playback architecture, embedded PostgreSQL persistence with zero background daemons, quota-aware YouTube Data API v3 integration, and Google OAuth authentication.

---

## ✨ Features

### 🎬 Video Playback & Dual-Engine Architecture
- **Native Browser HTML5 Player (`<video controls>`)**: Uses the browser's default HTML5 `<video controls>` player with native appearance and behavior. No custom player interface or unmaintainable UI overlays; keeps only the functionality necessary to load and play videos.
- **Official YouTube Player Engine**: Privacy-enhanced YouTube IFrame embed (`youtube-nocookie.com`) ensuring 100% video playback compatibility for YouTube cipher-protected videos with automated progress synchronization and next-video advancement.
- **Seamless Playback Fallbacks**: Direct streams play natively. For cipher-protected YouTube streams where direct MP4 streaming is restricted by YouTube signature ciphers, the player automatically switches to the YouTube embed player without displaying confusing error messages. If a video is creator-restricted from third-party embedding, a clean notice with a direct YouTube link is displayed.
- **Instant Engine Switching**: Switch between the Native Browser Player and the Official YouTube Player directly in the player header or globally from the top navigation.

### 🌐 Live YouTube Data Integration (Zero API Key Requirement)
- **Real YouTube Search**: Live search queries YouTube directly, returning actual video, channel, and playlist results with full metadata (views, length, channel name, thumbnails).
- **Real Trending Feeds**: Dynamic categorized video feeds (Music, Gaming, News, Tech, Education, Sports, Entertainment) with live YouTube content instead of hardcoded mock data.
- **Full Channel Browsing & Pagination**: Channel profiles display high-resolution avatars, responsive banners (up to 2560px), subscriber counts, video counts, and complete video grids with continuation pagination ("Load More Videos" in batches of 30).
- **Official YouTube Data API v3 Support**: If a `YOUTUBE_API_KEY` is provided, the client prioritizes official v3 endpoints with in-memory TTL/LRU quota caching.
- **Offline Fallback Resilience**: If network access is completely offline, the client automatically falls back to local sample content so the application remains runnable.

### 🔐 Authentication, Navigation & User Persistence
- **Auth.js (NextAuth v5) with Google OAuth**: Interactive account menu supporting Google sign-in with automatic YouTube scopes (`youtube.readonly`, `youtube.force-ssl`).
- **Resilient OAuth Validation & Dedicated Error Recovery**: If Google credentials (`AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`) are not set or unconfigured, the app gracefully guides the user with a dedicated `/auth/error` page and setup instructions rather than breaking with configuration errors.
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

## 📁 Project Structure

```text
YoutubeClient/
├── src/
│   ├── app/                               # Next.js App Router
│   │   ├── api/                           # REST API Endpoints
│   │   │   ├── auth/[...nextauth]/        # Auth.js Google OAuth route
│   │   │   ├── history/                   # Watch history CRUD API
│   │   │   ├── liked/                     # Liked videos toggle & list API
│   │   │   ├── playlists/                 # Playlist management & item APIs
│   │   │   ├── settings/                  # User preferences API
│   │   │   ├── stream/                    # Direct video stream resolver
│   │   │   └── youtube/                   # Feed, search, video, channel, comments APIs
│   │   ├── channel/[id]/                  # Channel profile & video grid page
│   │   ├── history/                       # Watch history with resume bars page
│   │   ├── liked/                         # Liked videos collection page
│   │   ├── playlist/[id]/                 # Custom playlist detail view page
│   │   ├── playlists/                     # Custom playlists library page
│   │   ├── search/                        # Multi-filter search results page
│   │   ├── settings/                      # Preferences, API keys, and backup page
│   │   ├── subscriptions/                 # Subscriptions feed page
│   │   ├── watch/                         # Main video player & info watch page
│   │   └── page.tsx                       # Home page with category chip filters
│   ├── components/
│   │   ├── channel/                       # Channel banner and header components
│   │   ├── comments/                      # Comment thread and input components
│   │   ├── layout/                        # App header, persistent sidebar, mobile bottom bar
│   │   ├── player/                        # HTML5 player, embed player, scrubber, controls
│   │   ├── providers/                     # Dark/Light theme provider
│   │   ├── ui/                            # Buttons, inputs, badges, avatars, skeletons
│   │   └── video/                         # VideoCard, VideoGrid, and VideoInfo
│   ├── db/
│   │   ├── index.ts                       # Dual database factory (PGlite + PostgreSQL)
│   │   └── schema.ts                      # Drizzle ORM PostgreSQL schema
│   ├── lib/
│   │   ├── auth.ts                        # NextAuth configuration and token refresher
│   │   └── utils.ts                       # Time, duration, view count, and string formatters
│   ├── services/
│   │   ├── db/                            # Repository CRUD operations
│   │   └── youtube/                       # Official API provider, mock fallback, cache layer
│   └── test/
│       └── run-tests.ts                   # Comprehensive test runner suite
├── drizzle.config.ts                      # Drizzle Kit migration configuration
├── next.config.ts                         # Next.js configuration (WASM & external packages)
├── package.json                           # Dependencies & scripts
├── PHASES.md                              # Implementation phases log
├── PROGRESS.md                            # Technical handoff & verification record
└── tailwind.config.ts                     # Tailwind CSS styling configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.18 or higher (v20+ recommended)
- **pnpm**: v9 or higher (`npm install -g pnpm`)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/Hysm25/yt-c.git
cd yt-c
pnpm install
```

### 2. Environment Configuration

Copy the example environment configuration:

```bash
cp .env.example .env.local
```

Configure your environment variables as needed:

| Variable | Required | Default / Description |
| :--- | :---: | :--- |
| `DATABASE_URL` | No | PostgreSQL connection string. If omitted, embedded PGlite is used automatically. |
| `YOUTUBE_API_KEY` | No | Google Cloud YouTube Data API v3 key. If omitted, mock/fallback provider runs seamlessly. |
| `AUTH_SECRET` | Recommended | Random 32+ character string for Auth.js cookie encryption. |
| `AUTH_GOOGLE_ID` | Optional | Google OAuth Client ID for authenticating real YouTube accounts. |
| `AUTH_GOOGLE_SECRET` | Optional | Google OAuth Client Secret. |
| `NEXTAUTH_URL` | Optional | Canonical URL (e.g. `http://localhost:3000`). |

> **Note**: The client works immediately out-of-the-box with **zero configuration** in guest mode with embedded PGlite and the offline/fallback YouTube provider!

### 3. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| **Development** | `pnpm dev` | Starts Next.js development server with Turbopack. |
| **Production Build** | `pnpm build` | Compiles an optimized standalone production build. |
| **Start Production** | `pnpm start` | Runs the compiled Next.js production server. |
| **Run Tests** | `pnpm test` | Runs the automated test suite (Repository, YouTube service, Utilities). |
| **Type Check** | `pnpm type-check` | Performs strict TypeScript type validation (`tsc --noEmit`). |
| **Database Migrations** | `pnpm db:generate` | Generates SQL migrations from Drizzle schema. |
| **Database Push** | `pnpm db:push` | Pushes schema directly to database. |

---

## 🔑 Google OAuth Setup (Optional)

Signing in with Google is optional — the application runs completely in Guest Mode with full local watch history, playlists, and settings.

To enable real Google OAuth and live YouTube account synchronization:

1. **Google Cloud Console**: Visit [https://console.cloud.google.com](https://console.cloud.google.com) and create a project.
2. **Enable YouTube API**: Under **APIs & Services** > **Library**, enable **YouTube Data API v3**.
3. **Configure OAuth Consent**:
   - Choose **External** user type.
   - Add scopes: `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `.../auth/youtube.readonly`, `.../auth/youtube.force-ssl`.
4. **Create Credentials**:
   - Create **OAuth client ID** of type **Web application**.
   - Under **Authorized redirect URIs**, add:
     ```text
     http://localhost:3000/api/auth/callback/google
     ```
5. **Configure Environment**: In `.env.local`:
   ```bash
   AUTH_GOOGLE_ID=your-client-id.apps.googleusercontent.com
   AUTH_GOOGLE_SECRET=GOCSPX-your-client-secret
   AUTH_SECRET=random-32-byte-secret
   NEXTAUTH_URL=http://localhost:3000
   ```

---

## 🔒 Security & Privacy

- **Token Protection**: OAuth access tokens and refresh tokens are handled securely on the server side via encrypted JWT session cookies.
- **Git Exclusions**: Local `.data/` database directories, `.env*` secret files, and build caches are strictly ignored by `.gitignore`.
- **Sanitized Embeds**: Embedded videos utilize `https://www.youtube-nocookie.com` to prevent tracking cookies without user consent.
- **Input Sanitization**: External parameters and API payloads are parsed and validated safely.

---

## 📄 License

This project is licensed under the MIT License.
