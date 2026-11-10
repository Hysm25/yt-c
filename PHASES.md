# Project Phases: YouTube Web Client

## Phase 1: Environment Setup & Project Baseline
- [x] Initialize Next.js 15+ (App Router) project with TypeScript, Tailwind CSS
- [x] Install and configure shadcn/ui components and styling foundation (dark/light theme support)
- [x] Configure Drizzle ORM and PostgreSQL database layer (PGlite embedded for local zero-daemon mode + standard PostgreSQL connection support)
- [x] Create core client shell layout (responsive top navigation header, collapsible sidebar, search bar, and main container)
- [x] Verify baseline production build

## Phase 2: Data Models & Isolated Guest Persistence
- [x] Define database repository services for local user data (watch history, playlists, liked videos, subscriptions, settings)
- [x] Implement anonymous visitor cookie sessions (`yt_guest_id`) ensuring multi-user data isolation without accounts
- [x] Implement API routes for isolated persistence (`/api/history`, `/api/playlists`, `/api/liked`, `/api/settings`, `/api/youtube/subscriptions`)
- [x] Implement subscriptions table and repository methods (`getSubscriptions`, `isSubscribed`, `toggleSubscription`)
- [x] Complete removal of Auth.js, NextAuth dependencies, OAuth routes, callbacks, and orphaned schemas

## Phase 3: YouTube Data Integration & Metadata Extraction
- [x] Design modular `YouTubeDataProvider` abstraction interface for data fetching
- [x] Implement YouTube Data API v3 provider and Public YouTube integration:
  - [x] Video feeds (Trending / Most Popular, category filters)
  - [x] Video details, statistics, and channel metadata
  - [x] Authentic full multi-line video description extraction (via Ytdl and watch page HTML regex)
  - [x] Search endpoint (query, filters by type, sort order)
  - [x] Channel profile, banner, statistics, and uploads with pagination
  - [x] Subscribed channels feed and latest uploads
- [x] Implement in-memory/database caching strategy for API requests and extracted streams
- [x] Complete removal of all comment features, components, API endpoints, and types for a clean, distraction-free client

## Phase 4: Video.js JavaScript Player Engine (Zero Embedded IFrames)
- [x] Completely remove YouTube Official Player, IFrame Player (`embed-player.tsx`), and all embedded dependencies
- [x] Implement full-featured **Video.js 8** player engine (`src/components/player/video-player.tsx`):
  - [x] Adaptive Video Quality Selection (`1080p`, `720p`, `480p`, `360p`, `240p`, `144p`, up to `4K`) with seamless source switching
  - [x] Subtitles and Closed Captions: Real-time WebVTT stream delivery via `/api/stream/captions`, CC toggle, and language selector
  - [x] Playback Speed Controls (`0.25x` to `2x`) with synchronized audio pitch
  - [x] Audio and Volume Controls with dynamic icons, volume slider, mute toggle, and `localStorage` persistence
  - [x] Fullscreen API integration and responsive Theater Mode toggle
  - [x] Full YouTube Keyboard Shortcuts (`Space`/`k`, `j`/`l`, `ArrowLeft`/`ArrowRight`, `ArrowUp`/`ArrowDown`, `m`, `f`, `t`, `c`, `0`-`9`)
  - [x] Seeking, buffering spinner, double-tap seek (10s), and visual feedback ripple pills
  - [x] Dual-track synchronized audio track with sub-150ms drift correction
  - [x] Next.js Media Streaming Proxy (`/api/stream/proxy`) with HMAC-SHA256 signatures and HTTP `206 Partial Content` Range requests

## Phase 5: Client User Experience & Pages
- [x] Home Page (`/`): Category chips, video feed cards with duration, views, relative timestamp, and channel avatar
- [x] Watch Page (`/watch?v=...`): Video.js player, Theater Mode responsive layout, expandable description with clickable URLs, channel info, subscribe/like actions, and playlist queue / related videos
- [x] Search Page (`/search?q=...`): Rich result cards (videos, channels, playlists), filters, and sort options
- [x] Channel Page (`/channel/[id]`): High-res channel avatar, responsive banner (up to 2560px), subscriber & video counters, About tab, and full video pagination
- [x] Subscriptions Page (`/subscriptions`): Channel subscriptions list and latest uploads feed with zero account requirements
- [x] Library & History Page (`/history`, `/library`, `/liked`): Local and isolated history with progress bar indicators, resume playback, and mobile-friendly clear/delete buttons
- [x] Complete Playlists Management:
  - [x] Create, rename/edit (PUT), and delete playlists
  - [x] Add and remove videos (via Watch page Save dialog and Playlist detail view)
  - [x] View playlists with video counts and cascade deletion
  - [x] Play videos from playlist with active Playlist Queue panel and automated next-track playback transition on Watch page
- [x] Settings Page (`/settings`): Configure preferred default quality, autoplay, custom API key, theme preferences, and data clear options
- [x] Header & Navigation: Full-width expandable mobile search, slide-out mobile drawer with backdrop, and UserMenu

## Phase 6: Package Manager Migration to Bun & EGM Architectural Audit
- [x] Install Bun 1.4+ and migrate from pnpm to Bun:
  - [x] Remove `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.npmrc`
  - [x] Generate `bun.lock` using `bun install`
  - [x] Update `package.json` scripts: `"test": "bun run src/test/run-tests.ts"`, `"build": "next build"`, etc.
  - [x] Update documentation and setup guides
- [x] Install and execute Elephant-Goldfish Model (EGM) plugin:
  - [x] Install EGM plugin via `agy plugin install`
  - [x] Draft technical specification in `docs/designs/architecture_redesign_and_migration.md`
  - [x] Run adversarial design review via EGM Design Critic Goldfish persona
  - [x] Address all findings (SSRF protection, guest data isolation, AbortSignal handling, subscriptions schema, test runner syntax)
- [x] Run comprehensive verification with Bun:
  - [x] Type check (`bun run type-check`)
  - [x] Automated test suite (`bun run test`)
  - [x] Production build (`bun run build`)
  - [x] Live runtime endpoint testing on Next.js server
