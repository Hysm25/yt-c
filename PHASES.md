# Project Phases: YouTube Web Client

## Phase 1: Environment Setup & Project Baseline
- [x] Initialize Next.js 15+ (App Router) project with TypeScript, Tailwind CSS, and pnpm
- [x] Install and configure shadcn/ui components and styling foundation (dark/light theme support)
- [x] Configure Drizzle ORM and PostgreSQL database layer (PGlite embedded for local zero-daemon mode + standard PostgreSQL connection support)
- [x] Create core client shell layout (responsive top navigation header, collapsible sidebar, search bar, and main container)
- [x] Verify baseline production build (`pnpm build`)

## Phase 2: Data Models, Persistence & Authentication
- [x] Configure Auth.js (NextAuth v5) with Google OAuth provider and YouTube scopes
- [x] Implement secure OAuth token lifecycle handling (access token storage & refresh token mechanism)
- [x] Define database repository services for local user data (watch history, playlists, liked videos, settings)
- [x] Implement API routes for user data persistence (`/api/history`, `/api/playlists`, `/api/liked`, `/api/settings`)
- [x] Verify authentication endpoints and data persistence operations

## Phase 3: YouTube Data Integration & Quota-Aware Services
- [x] Design modular `YouTubeDataProvider` abstraction interface for data fetching
- [x] Implement YouTube Data API v3 provider:
  - [x] Video feeds (Trending / Most Popular, category filters)
  - [x] Video details, statistics, and channel metadata
  - [x] Search endpoint (query, filters by type, sort order)
  - [x] Channel profile, banner, statistics, and uploads
  - [x] User subscriptions feed (`subscriptions.list`)
  - [x] User playlists and playlist items (`playlists.list`, `playlistItems.list`)
  - [x] Liked videos feed
  - [x] Comments thread & pagination
- [x] Implement in-memory/database caching strategy to protect the 10,000 units/day quota
- [x] Implement fallback mock/offline data mode for quota depletion or unauthenticated browsing
- [x] Verify YouTube API service operations and cache behavior

## Phase 4: Full-Featured Custom HTML5 Video Player
- [x] Implement custom HTML5 `<video>` Player component with custom styling:
  - [x] Play, Pause, Replay, and Seeking
  - [x] Interactive timeline scrubber with buffer progress and timestamp hover tooltip
  - [x] Volume slider and mute toggle
  - [x] Playback speed selector (0.25x, 0.5x, 0.75x, 1x, 1.25x, 1.5x, 1.75x, 2x)
  - [x] Resolution/Quality switcher
  - [x] Subtitles / Closed Captions (CC) parser and renderer
  - [x] Fullscreen, Theater mode, and Picture-in-Picture (PiP)
  - [x] Standard YouTube keyboard shortcuts (Space/K, J/L, Arrows, M, F, T)
  - [x] Auto-advance / Autoplay toggle
- [x] Implement dual Playback Provider system:
  - [x] Direct Stream Provider (HTML5 native playback via stream resolver/proxy)
  - [x] Official YouTube IFrame / Embed Provider (resilient fallback toggle ensuring 100% playback guarantee)
- [x] Implement watch progress tracking and auto-resume from last timestamp
- [x] Verify player features, provider switching, and keyboard navigation

## Phase 5: Client User Experience & Pages
- [x] Home Page (`/`): Category chips, video feed cards with duration, views, relative timestamp, and channel avatar
- [x] Watch Page (`/watch?v=...`): Player view, expandable description, channel info, subscribe/like actions, comments section, and related video suggestions
- [x] Search Page (`/search?q=...`): Rich result cards (videos, channels, playlists), filters, and sort options
- [x] Channel Page (`/channel/[id]`): Channel header, tabs (Home, Videos, Playlists, About), and video grids
- [x] Subscriptions Page (`/subscriptions`): Latest uploads feed from subscribed channels and channel quick-list
- [x] Library & History Page (`/history`, `/library`, `/liked`): Local and synced history with progress bar indicators, resume playback, and clear history
- [x] Playlists Management (`/playlists`, `/playlist/[id]`): View, create, and manage playlists
- [x] Settings Page (`/settings`): Configure preferred playback provider (HTML5 Direct vs YouTube Embed), custom API key, theme preferences, and data clear options
- [x] Verify all routes, responsive mobile/desktop design, and navigation

## Phase 6: Verification, Polishing, Production Build & Handoff
- [x] Run comprehensive production build (`pnpm build`) and fix any lint/type errors
- [x] End-to-end flow verification (Home -> Search -> Watch -> Channel -> History -> Settings)
- [x] Verify security guidelines (no leaked secrets, sanitized inputs, safe token handling)
- [x] Finalize `PHASES.md` and `PROGRESS.md` with complete handoff documentation
