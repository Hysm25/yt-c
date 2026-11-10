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

## Phase 3: YouTube Data Integration & Quota-Aware Services
- [x] Design modular `YouTubeDataProvider` abstraction interface for data fetching
- [x] Implement YouTube Data API v3 provider:
  - [x] Video feeds (Trending / Most Popular, category filters)
  - [x] Video details, statistics, and channel metadata
  - [x] Search endpoint (query, filters by type, sort order)
  - [x] Channel profile, banner, statistics, and uploads with pagination
  - [x] Subscribed channels feed and latest uploads
  - [x] Real comments thread, replies, and pagination via InnerTube & v3 API
- [x] Implement in-memory/database caching strategy to protect the 10,000 units/day quota
- [x] Implement public InnerTube browse & next integration for channel metadata, video pagination, comments, and replies
- [x] Verify YouTube API service operations and cache behavior

## Phase 4: Native Browser HTML5 Video Player & Secure Media Streaming
- [x] Implement Native Browser HTML5 `<video controls>` Player as primary player:
  - [x] Default browser native controls and appearance (play/pause, scrubber, volume, fullscreen, playback speed)
  - [x] Dynamic progressive stream extraction via YouTube InnerTube (`ANDROID_VR` / mobile endpoints)
  - [x] Next.js Media Streaming Proxy (`/api/stream/proxy`) with HMAC-SHA256 URL signing and 2-hour expiration
  - [x] SSRF defenses: Host allowlisting (`*.googlevideo.com`, `archive.org`) and blocking of private/cloud metadata IPs
  - [x] HTTP 206 Partial Content Range streaming and AbortSignal cancellation on seek/pause
  - [x] Honest, clear in-player fallback card with one-click switch to YouTube Player for cipher-protected streams
  - [x] Watch progress tracking to local history via `onTimeUpdate`
  - [x] Auto-advance / Autoplay transition via `onEnded`
- [x] Implement dual Playback Provider system:
  - [x] Direct Stream Provider: native HTML5 `<video controls>` for direct media
  - [x] Official YouTube IFrame Provider: privacy-enhanced embed (`youtube-nocookie.com`) guaranteeing 100% playback for cipher-protected videos
  - [x] In-player engine toggle enabling instant switching between Native `<video>` and YouTube Player
- [x] Verify playback across direct streams, cipher-protected videos, and watch history synchronization

## Phase 5: Client User Experience & Pages
- [x] Home Page (`/`): Category chips, video feed cards with duration, views, relative timestamp, and channel avatar
- [x] Watch Page (`/watch?v=...`): Player view, expandable description, channel info, subscribe/like actions, comments section, and related video suggestions
- [x] Search Page (`/search?q=...`): Rich result cards (videos, channels, playlists), filters, and sort options
- [x] Channel Page (`/channel/[id]`): High-res channel avatar, responsive banner (up to 2560px), subscriber & video counters, About tab, and full video pagination
- [x] Subscriptions Page (`/subscriptions`): Channel subscriptions list and latest uploads feed with zero account requirements
- [x] Library & History Page (`/history`, `/library`, `/liked`): Local and isolated history with progress bar indicators, resume playback, and mobile-friendly clear/delete buttons
- [x] Complete Playlists Management:
  - [x] Create, rename/edit (PUT), and delete playlists
  - [x] Add and remove videos (via Watch page Save dialog and Playlist detail view)
  - [x] View playlists with video counts and cascade deletion
  - [x] Play videos from playlist with active Playlist Queue panel and automated next-track playback transition on Watch page
- [x] Comments & Replies System:
  - [x] Display real comments with authors, avatars, like counts, and relative dates
  - [x] Comments pagination / Load More Comments button
  - [x] Expandable replies toggle ("View X replies") with real thread replies
  - [x] Guest comment and reply submission with local persistence
- [x] Settings Page (`/settings`): Configure preferred playback provider, custom API key, theme preferences, and data clear options
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
