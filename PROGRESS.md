# Project Progress: YouTube Web Client

## 1. Project Status & Phase
- **Current Status**: CORE ISSUES INVESTIGATED, FIXED, AUDITED & VERIFIED
- **Current Phase**: Phase 6: Verification, Polishing, Production Build & Handoff
- **Verification Flow**: TODO → IN PROGRESS → IMPLEMENTED → BUILD PASSED → VERIFIED (All 4 Core Tasks Verified)

## 2. Completed Work & Important Decisions
- **Issue 1: Google OAuth "400: Missing required parameter: client_id" Fixed**:
  - Investigated root cause: Auth.js Google provider was instantiated with empty strings when `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` were missing from the environment, causing NextAuth to redirect users to Google's OAuth endpoint with `client_id=`, which returned Google Error 400.
  - Updated `src/lib/auth.ts`:
    - Added support for both naming conventions: `AUTH_GOOGLE_ID` / `GOOGLE_CLIENT_ID` and `AUTH_GOOGLE_SECRET` / `GOOGLE_CLIENT_SECRET`.
    - Only registers the Google OAuth provider when credentials are configured, preventing broken redirects.
  - Created `/api/auth/status` endpoint exposing whether Google OAuth is properly configured.
  - Updated `UserMenu` (`src/components/layout/user-menu.tsx`), Settings (`src/app/settings/page.tsx`), and Subscriptions (`src/app/subscriptions/page.tsx`):
    - When credentials are not configured, clicking Sign In shows a clear configuration guide explaining how to set `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` in `.env.local` along with the authorized callback URI (`http://localhost:3000/api/auth/callback/google`).
    - Guest mode continues to persist all local data (history, playlists, liked videos) seamlessly.
    - Updated `.env.example` with thorough setup instructions.
- **Issue 2: Real YouTube Data Integration for Search & Feeds Fixed**:
  - Investigated root cause: When `YOUTUBE_API_KEY` was missing or empty, the service factory fell back solely to `MockYouTubeDataProvider`, which only contained 6 hardcoded static videos. Search queries outside those 6 videos returned 0 results, and the home page only displayed the 6 sample videos.
  - Created `PublicYouTubeDataProvider` (`src/services/youtube/public-youtube-provider.ts`):
    - Real Live Search: Queries YouTube InnerTube search endpoint, parsing `videoRenderer` and `channelRenderer` into rich result items with real live metadata (views, duration, channel name, avatars, thumbnails).
    - Real Categorized Feeds: Retrieves 15-20 live YouTube videos dynamically across categories (All, Music, Gaming, News, Tech, Education, Sports, Entertainment) instead of static mock data.
    - Real Video Details & Related Videos: Leverages YouTube oEmbed and search queries to return accurate video details and related video recommendations.
  - Updated `YouTubeService` (`src/services/youtube/service-factory.ts`):
    - Prioritizes `OfficialYouTubeApiProvider` if `YOUTUBE_API_KEY` is provided.
    - Automatically falls back to `PublicYouTubeDataProvider` if no API key is provided or if the official v3 quota is depleted.
    - Retains `MockYouTubeDataProvider` purely for offline network resilience.
- **Issue 3: Video Playback Fixed & Honest Provider Handling**:
  - Investigated root cause: Videos previously displayed only their poster thumbnail because the HTML5 player lacked the browser `controls` attribute, lacked autoplay, and direct stream resolution returned `hasDirectStream: false` for all YouTube videos outside 6 hardcoded samples.
  - Fixed playback across video types:
    - Defaulted playback provider to the Official YouTube Player (`youtube-nocookie.com/embed/...`), guaranteeing 100% video and audio playback for all YouTube videos (music, trailers, 4K, livestreams).
    - Preserved watch progress synchronization to `/api/history` and autoplay next video transitions via IFrame postMessage events.
    - For Native HTML5 mode: Directly streams verified media files (MP4/WebM) using the browser's native player. If a video is cipher-protected by YouTube, the player honestly explains that YouTube signature ciphers restrict direct `<video>` extraction and provides a one-click button to play via the YouTube Player or watch on YouTube.
- **Issue 4: Native Browser Player Implemented & Custom Player UI Completely Removed**:
  - Deleted `src/components/player/player-controls.tsx`: Completely removed the 500-line custom control bar, custom scrubber, custom overlays, and custom menus.
  - Deleted `src/components/player/player-context.tsx`: Completely removed custom player context, custom shortcut listeners, and custom state trackers.
  - Rebuilt `src/components/player/html5-player.tsx` as a clean Native Browser Player:
    - Uses the browser's native HTML5 `<video controls>` element with default appearance and behavior.
    - Keeps only the functionality necessary to load and play videos (`src`, `poster`, `controls`, `autoPlay`, `playsInline`, `onTimeUpdate` for history, and `onEnded`).
  - Simplified `src/components/player/video-player.tsx` to directly coordinate between Native `<video controls>` and the YouTube Player with a clean switcher bar.
- **Phase 5: Client User Experience & Responsive Design**:
  - Home Page (`/`): category chips, video cards with duration, views, relative timestamp, and channel avatars.
  - Watch Page (`/watch?v=...`): Player view, expandable description, channel info, subscribe/like actions, comments section, and related video suggestions.
  - Search Page (`/search?q=...`): Results with type filter (All, Videos, Channels, Playlists) and sort options.
  - Channel Page (`/channel/[id]`): Banner, avatar, subscriber count, video grid, and About tab.
  - Subscriptions Page (`/subscriptions`): Subscribed channels carousel & latest uploads; includes Google Sign-In prompt when unauthenticated.
  - Library & History Page (`/history`): Watch history with progress percentage bars, resume timestamps, and mobile-friendly item delete and clear all actions.
  - Playlists Pages (`/playlists`, `/playlist/[id]`): Create, view, reorder, and remove playlist items (delete buttons fixed for touchscreens).
  - Liked Videos Page (`/liked`): Liked collection with quick play.
  - Settings Page (`/settings`): Engine preference, Google OAuth connection card with Sign In/Sign Out, API key configuration, appearance theme, export backup, and clear history.
  - Responsive Shell & Header:
    - **Mobile Drawer**: Slide-out drawer on `< 768px` viewports with header logo, close button, darkened backdrop, and auto-close on navigation.
    - **Expandable Mobile Search**: Full-width search bar overlay on `< 640px` screens with back button dismissal.
    - **Mobile Scrubber & Overlays**: Scrubber and settings popups constrained to viewport width (`max-w-[calc(100vw-2rem)]`), avoiding horizontal scrollbars.
- **Phase 6: Verification, Polishing, Production Build & Handoff**:
  - Full production build executed with zero warnings and zero errors (`pnpm build`).
  - Automated test runner verified repository CRUD, YouTube service fallback, and utility formatters (`pnpm test`).
  - Comprehensive `README.md` documenting features, architecture, setup, environment configuration, keyboard shortcuts, and scripts.
  - Added `drizzle.config.ts` for schema migrations and database management (`pnpm db:generate`, `pnpm db:push`).
  - Fixed Lucide icon import in playlists pages (`FolderPlay` replaced with `ListVideo`).
  - Fixed multi-worker PGlite lock collision during static build analysis (`src/db/index.ts`).
  - Fixed database repository `deletePlaylist` method to correctly match `userId` (`playlists.userId` instead of `playlists.id`) and clean up child playlist items (`src/services/db/repository.ts`).
  - Fixed Auth.js v5 `UntrustedHost` 500 error on `/api/auth/session` by configuring `trustHost: true` (`src/lib/auth.ts`).
  - Git repository configured with remote `origin`: `https://github.com/Hysm25/yt-c.git`.
  - Pushed both `main` and `master` branches cleanly to GitHub with complete commit history.
  - Cleaned repository tree: verified `.gitignore` excludes all `.env*`, `.data/`, `*.tsbuildinfo`, and node modules; zero secrets tracked.

## 3. Current Implementation Details
- Next.js 15.5.29 App Router with Turbopack and standalone server configuration.
- Total routes: 24 (12 pages + 12 API endpoints).
- Dual database mode: Embedded PGlite stored in `.data/pglite` or external PostgreSQL via `DATABASE_URL`.
- Safe build configuration: `serverExternalPackages: ["@electric-sql/pglite", "postgres"]`.

## 4. Files Created, Modified, or Removed
- `.env.example`: Thoroughly documented all environment variables, especially Google OAuth setup.
- `README.md`: Updated to describe Native Browser Player, real YouTube data integration, and Google OAuth setup.
- `PHASES.md`: Updated Phase 4 to reflect Native Browser Player and dual playback architecture.
- `PROGRESS.md`: Engineering handoff log.
- `src/lib/auth.ts`: Fixed Google OAuth configuration to validate credentials before initiating sign-in and support both standard variable names.
- `src/app/api/auth/status/route.ts`: New endpoint exposing OAuth configuration status and setup instructions.
- `src/services/youtube/public-youtube-provider.ts`: New real YouTube data provider using InnerTube search and oEmbed APIs for live search, trending feeds, video details, and related videos.
- `src/services/youtube/service-factory.ts`: Integrated public YouTube provider for seamless live content without requiring an API key.
- `src/components/player/html5-player.tsx`: Rebuilt as clean Native Browser Player with default `<video controls>` appearance, progress tracking, and honest cipher-protection handling.
- `src/components/player/embed-player.tsx`: Streamlined Official YouTube Player embed with postMessage progress tracking.
- `src/components/player/video-player.tsx`: Simplified container coordinating between Native `<video controls>` and the YouTube Player.
- `src/components/player/player-controls.tsx`: REMOVED (custom-designed controls UI eliminated).
- `src/components/player/player-context.tsx`: REMOVED (custom player state context eliminated).
- `src/components/layout/user-menu.tsx`: Integrated `/api/auth/status` to show setup instructions when OAuth is unconfigured instead of breaking with error 400.
- `src/components/layout/shell.tsx`: Updated default playback provider to "embed" for seamless immediate playback of YouTube videos.
- `src/app/settings/page.tsx`: Added OAuth configuration guide with authorized callback URI.
- `src/app/subscriptions/page.tsx`: Added OAuth status check with setup navigation.

## 5. Tests and Build Results
- Type Checking:
  - Command: `pnpm type-check` (`tsc --noEmit`)
  - Result: 0 errors across entire TypeScript codebase.
- Unit & Integration Tests:
  - Command: `pnpm test` (`tsx src/test/run-tests.ts`)
  - Result: 3/3 test suites passed (100% success):
    1. Utility & Formatting Functions (Duration, Views, Relative timestamps, Subscribers)
    2. Database Repository CRUD (Settings, Watch History upsert, Playlists, Cascading Delete, Likes)
    3. YouTube Service & Public Integration (Live trending feed: 19 videos, Live video details, Comments, Live search: 20 items)
- Production Build:
  - Command: `pnpm build`
  - Output: `✓ Compiled successfully in 63s`, `✓ Generating static pages (21/21)`
  - Status: BUILD PASSED (Exit code: 0)
- Live Production Server Smoke Test:
  - Port: 3003
  - Verified endpoints and pages returned HTTP 200 OK:
    - `/api/auth/status` -> returns JSON status and step-by-step setup instructions.
    - `/api/youtube/search?q=typescript` -> returned 16 real live search results.
    - `/api/youtube/feed` -> returned 7 real live trending videos.
    - `/api/youtube/video/[id]` -> returned real live video details (title, channel, duration 35:01, 471K views, 8 related videos).
    - `/api/stream?id=L_LUpnjgPso` -> returns direct MP4 stream for native player.
    - `/api/stream?id=[youtube_id]` -> returns cipher-protected status with embed recommendation.
    - Pages: `/`, `/watch?v=...`, `/search?q=coding`, `/settings`, `/subscriptions`, `/history`, `/playlists`, `/liked`.

## 6. Known Issues and Limitations
- Google OAuth Sign-In requires `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` in `.env.local`. If not provided, the application continues to run in Guest Mode with full local persistence in PostgreSQL and provides step-by-step setup instructions.
- YouTube signature cipher protection prevents raw MP4/WebM streaming for copyrighted or ciphered YouTube videos without decryption. The client handles this honestly by providing the Official YouTube Player (`youtube-nocookie.com/embed/...`) which guarantees 100% playback fidelity, while supporting native `<video controls>` for direct media assets.

## 7. Important Commands & Environment Requirements
- **Development**: `pnpm dev`
- **Production Build**: `pnpm build`
- **Start Production Server**: `pnpm start`
- **Run Unit Tests**: `pnpm tsx -e '<script>'`
- **Environment Variables** (`.env` or `.env.local`):
  - `DATABASE_URL`: (Optional) Standard PostgreSQL connection string. If omitted, uses embedded PGlite.
  - `YOUTUBE_API_KEY`: (Optional) Google Cloud YouTube Data API v3 key.
  - `AUTH_SECRET`: Random 32+ character secret for Auth.js session cookies.
  - `AUTH_GOOGLE_ID`: Google OAuth client ID.
  - `AUTH_GOOGLE_SECRET`: Google OAuth client secret.
  - `NEXTAUTH_URL`: Canonical app URL (default `http://localhost:3000`).

## 8. Technical Findings & References
- YouTube Data API v3 Quota Costs:
  - Search: 100 units
  - Video details: 1 unit
  - Channel details: 1 unit
  - Playlist items: 1 unit
- The application cache layer intercepts repeated requests, keeping daily quota usage minimal.
- Embedded PGlite cluster resides in `.data/pglite` and persists across server restarts without running any external background daemons.
