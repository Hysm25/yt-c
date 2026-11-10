# YouTube Web Client

A modern, full-featured **YouTube Web Client** featuring an independent custom user interface, a native HTML5 video player with dual-playback architecture, embedded PostgreSQL persistence with zero background daemons, quota-aware YouTube Data API v3 integration, and Google OAuth authentication.

---

## ✨ Features

### 🎬 Custom HTML5 Video Player
- **Native Custom Controls**: Interactive timeline scrubber with live buffered progress, touch scrubbing, and hover preview timestamps.
- **Mobile Gestures**: Double-tap left or right to seek ±10 seconds with visual pill feedback; touch-to-show auto-hiding controls (3.5s timeout).
- **Playback Controls**: Play, pause, 10s jump backward/forward, volume slider with mute toggle and local memory.
- **Speed & Quality Selectors**: Variable playback rate (0.25x, 0.5x, 0.75x, 1x, 1.25x, 1.5x, 1.75x, 2x) and resolution switching.
- **Subtitles & Closed Captions (CC)**: In-player subtitle parser and overlay renderer.
- **Display Modes**: Standard view, Fullscreen (double-click video to toggle), Theater mode, and native browser Picture-in-Picture (PiP).
- **Auto-Advance & Progress Sync**: Automatically transitions to next related video upon completion and syncs watch progress every 5 seconds (both HTML5 and Embed engines).
- **Standard YouTube Keyboard Shortcuts**: Full hotkey support for intuitive navigation.

### 🔄 Dual-Playback Engine
- **Direct HTML5 Stream Engine**: Streams open media assets directly via HTML5 `<video>`.
- **Official YouTube Embed Engine**: Privacy-enhanced YouTube IFrame embed (`youtube-nocookie.com`) ensuring 100% video playback compatibility for cipher-protected videos with postMessage API synchronization.
- **Automatic Fallback & Real-Time Toggle**: Auto-falls back to Embed engine when signature ciphers are detected, or switch between playback engines instantly from the header or player overlay.

### 🌐 Quota-Aware YouTube Data Integration
- **Official YouTube Data API v3**: Fetches trending feeds, search results, video metadata, comments, channel profiles, and user subscriptions.
- **In-Memory Quota Shield**: Built-in TTL/LRU caching protects Google Cloud's 10,000 units/day quota.
- **Offline / Fallback Provider**: High-fidelity offline data provider automatically serves playable sample content if API quota is exhausted or if no API key is configured.

### 🔐 Authentication, Navigation & User Persistence
- **Auth.js (NextAuth v5)**: Google OAuth integration with interactive user menu in header, offline access tokens, and auto-refresh for YouTube scopes (`youtube.readonly`, `youtube.force-ssl`).
- **Responsive Navigation**: Full-width expandable mobile search, slide-out mobile drawer with backdrop, and bottom navigation bar for mobile viewports.
- **Zero-Daemon Local Database**: Embedded **PGlite** (WebAssembly PostgreSQL) operates inside `.data/pglite` without requiring Docker or a running PostgreSQL daemon.
- **External PostgreSQL Support**: Seamlessly connects to external PostgreSQL (e.g. Supabase, Neon, AWS RDS) by setting `DATABASE_URL`.
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

## ⌨️ Player Keyboard Shortcuts

| Shortcut | Action |
| :---: | :--- |
| <kbd>Space</kbd> or <kbd>K</kbd> | Toggle Play / Pause |
| <kbd>J</kbd> | Seek backward 10 seconds |
| <kbd>L</kbd> | Seek forward 10 seconds |
| <kbd>←</kbd> | Seek backward 5 seconds |
| <kbd>→</kbd> | Seek forward 5 seconds |
| <kbd>↑</kbd> | Increase volume by 5% |
| <kbd>↓</kbd> | Decrease volume by 5% |
| <kbd>M</kbd> | Toggle mute |
| <kbd>F</kbd> | Toggle Fullscreen mode |
| <kbd>T</kbd> | Toggle Theater mode |
| <kbd>C</kbd> | Toggle Closed Captions / Subtitles |
| <kbd>0</kbd> – <kbd>9</kbd> | Seek to 0% – 90% of the video duration |

---

## 🔒 Security & Privacy

- **Token Protection**: OAuth access tokens and refresh tokens are handled securely on the server side via encrypted JWT session cookies.
- **Git Exclusions**: Local `.data/` database directories, `.env*` secret files, and build caches are strictly ignored by `.gitignore`.
- **Sanitized Embeds**: Embedded videos utilize `https://www.youtube-nocookie.com` to prevent tracking cookies without user consent.
- **Input Sanitization**: External parameters and API payloads are parsed and validated safely.

---

## 📄 License

This project is licensed under the MIT License.
