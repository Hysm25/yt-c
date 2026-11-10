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
- [x] Handle production configuration safeguards (guaranteed `AUTH_SECRET` fallback and dedicated `/auth/error` UI page)
- [x] Define database repository services for local user data (watch history, playlists, liked videos, settings)
- [x] Implement API routes for user data persistence (`/api/history`, `/api/playlists`, `/api/liked`, `/api/settings`)
- [x] Verify authentication endpoints and data persistence operations

## Phase 3: YouTube Data Integration & Quota-Aware Services
- [x] Design modular `YouTubeDataProvider` abstraction interface for data fetching
- [x] Implement YouTube Data API v3 provider:
  - [x] Video feeds (Trending / Most Popular, category filters)
  - [x] Video details, statistics, and channel metadata
  - [x] Search endpoint (query, filters by type, sort order)
  - [x] Channel profile, banner, statistics, and uploads with pagination
  - [x] User subscriptions feed (`subscriptions.list`)
  - [x] User playlists and playlist items (`playlists.list`, `playlistItems.list`)
  - [x] Liked videos feed
  - [x] Comments thread & pagination
- [x] Implement in-memory/database caching strategy to protect the 10,000 units/day quota
- [x] Implement fallback mock/offline data mode for quota depletion or unauthenticated browsing
- [x] Implement public InnerTube browse integration for full channel metadata and continuation pagination
- [x] Verify YouTube API service operations and cache behavior

## Phase 4: Native Browser HTML5 Video Player & Dual Playback Engine
- [x] Implement Native Browser HTML5 `<video controls>` Player:
  - [x] Default browser native controls and appearance (play/pause, scrubber, volume, fullscreen, playback speed)
  - [x] Stream loading and playback for direct media assets
  - [x] Seamless auto-switch to YouTube embed on cipher-protected streams without confusing error jargon
  - [x] Watch progress tracking to local history via `onTimeUpdate`
  - [x] Auto-advance / Autoplay transition via `onEnded`
- [x] Implement dual Playback Provider system:
  - [x] Direct Stream Provider: native HTML5 `<video controls>` for direct media
  - [x] Official YouTube IFrame Provider: privacy-enhanced embed (`youtube-nocookie.com`) guaranteeing 100% playback for cipher-protected videos
  - [x] Graceful handling for creator-restricted embeds (error codes 101/150) with friendly notice and YouTube link
  - [x] In-player engine toggle enabling instant switching between Native `<video>` and YouTube Player
- [x] Verify playback across direct streams, cipher-protected videos, and watch history synchronization

## Phase 5: Client User Experience & Pages
- [x] Home Page (`/`): Category chips, video feed cards with duration, views, relative timestamp, and channel avatar
- [x] Watch Page (`/watch?v=...`): Player view, expandable description, channel info, subscribe/like actions, comments section, and related video suggestions (with client-side Next.js routing)
- [x] Search Page (`/search?q=...`): Rich result cards (videos, channels, playlists), filters, and sort options
- [x] Channel Page (`/channel/[id]`): High-res channel avatar, responsive banner (up to 2560px), subscriber & video counters, About tab, and full video pagination
- [x] Subscriptions Page (`/subscriptions`): Latest uploads feed from subscribed channels and channel quick-list with Google Sign-In prompt
- [x] Library & History Page (`/history`, `/library`, `/liked`): Local and synced history with progress bar indicators, resume playback, and mobile-friendly clear/delete buttons
- [x] Playlists Management (`/playlists`, `/playlist/[id]`): View, create, and manage playlists
- [x] Settings Page (`/settings`): Configure preferred playback provider, Google account connection status / sign-out, custom API key, theme preferences, and data clear options
- [x] Header & Navigation: Full-width expandable mobile search, slide-out mobile drawer with backdrop, and interactive UserMenu (Google Sign-In modal & Sign-Out)
- [x] Verify all routes, responsive mobile/tablet/desktop design, and navigation

## Phase 6: Verification, Polishing, Production Build & Handoff
- [x] Run comprehensive production build (`pnpm build`) and fix any lint/type errors
- [x] End-to-end flow verification (Home -> Search -> Watch -> Channel -> History -> Settings) across screen sizes
- [x] Verify security guidelines (no leaked secrets, sanitized inputs, safe token handling)
- [x] Finalize `PHASES.md` and `PROGRESS.md` with complete handoff documentation
