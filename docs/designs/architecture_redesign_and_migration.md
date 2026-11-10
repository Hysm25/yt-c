# Architecture Redesign & Migration Specification: Video Playback, Auth Removal, and Bun Migration

## 1. Problem Statement & Objectives

This specification outlines the technical design for three major architectural changes in the YouTube Web Client:
1. **Video Playback Overhaul**: Resolve native HTML5 playback failures, replace the restrictive hardcoded stream lookup with dynamic stream extraction and a media streaming proxy, and provide an honest, reliable fallback to the official player when signature ciphers or Botguard restrict raw progressive media access.
2. **Complete Authentication Removal**: Completely eliminate Auth.js (`next-auth`), Google OAuth configurations, session providers, sign-in/out UI, and authentication routes while keeping all application features (playlists, history, liked videos, settings) fully operational in a clean guest mode.
3. **Package Manager Migration to Bun**: Fully migrate the repository from `pnpm` to `bun`, updating lockfiles, scripts, commands, and documentation.

---

## 2. Video Playback Architecture

### 2.1 Current Limitations
Currently, `src/app/api/stream/route.ts` only resolves streams for 6 hardcoded video IDs. For all other videos, it immediately returns `hasDirectStream: false`, forcing the UI to display "Playback Available in Official Player".

### 2.2 Technical Analysis of YouTube Media Streams
YouTube video delivery falls into three primary categories:
1. **Public / Open Direct Media Streams**: Unciphered progressive MP4 files (e.g. Archive.org, W3C, MDN, creative commons assets) which play natively in HTML5 `<video controls>`.
2. **InnerTube Progressive Formats (itag 18 / 22)**: Some YouTube endpoints (such as `ANDROID_VR` or mobile clients) provide unciphered progressive MP4 URLs (`itag 18` = 360p, `itag 22` = 720p). However, these googlevideo URLs expire quickly, enforce IP/token validation, and lack browser CORS headers.
3. **Cipher-Protected / Server ABR Streams**: The majority of modern YouTube videos requested from server IPs require Proof of Origin (Botguard / PO token) or JavaScript player signature deciphering, or are delivered via chunked Server ABR without progressive URLs.

### 2.3 Playback Pipeline Design
The new playback pipeline operates as follows:
1. **Stream Resolution (`/api/stream?id=...`)**:
   - Check if the requested video ID is an explicit URL (e.g. `http://`, `https://`, `.mp4`). If so, return it directly.
   - In development/testing environments, check verified open media fixtures.
   - Attempt dynamic progressive stream extraction via YouTube InnerTube (`ANDROID_VR` / mobile client player).
   - If a valid progressive MP4 stream with audio (`itag 18` / `itag 22`) is found, generate an HMAC-SHA256 signed proxy URL (`/api/stream/proxy?url=...&sig=...&exp=...`) using a server-side secret with a 2-hour expiration window.
   - If direct progressive streams cannot be obtained due to YouTube bot verification (`LOGIN_REQUIRED`) or signature ciphers, honestly return:
     `{ success: true, hasDirectStream: false, recommendedProvider: "embed", reason: "Direct stream is restricted by YouTube cipher protection. Official YouTube Player fallback is recommended." }`.
2. **Secure Media Proxy Endpoint (`/api/stream/proxy`)**:
   - **Host Validation**: Restrict proxy targets strictly to YouTube googlevideo hosts (`/^([a-z0-9\-]+\.)*googlevideo\.com$/i`) and approved public media hosts. Reject all private/loopback IP addresses (RFC 1918, RFC 3927, 127.0.0.0/8, 169.254.x).
   - **Cryptographic Signature**: Verify HMAC-SHA256 token and expiration timestamp to eliminate open reverse proxy abuse and SSRF.
   - **Stream Forwarding**: Forward client `Range` headers to upstream, forward `request.signal` (AbortSignal) to cancel upstream downloads immediately when client seeks or pauses, and stream response with status `206 Partial Content`, `Content-Range`, `Content-Length`, `Content-Type: video/mp4`, and `Accept-Ranges: bytes`.
3. **Player UI Component (`html5-player.tsx` & `video-player.tsx`)**:
   - The browser's native `<video controls>` element is the primary player by default.
   - When direct stream is unavailable due to YouTube cipher protection, the player displays a clear fallback notice card with video thumbnail and an immediate "Switch to YouTube Official Player" action.

---

## 3. Authentication Removal Architecture

### 3.1 Scope of Removal
1. **Dependencies**: Remove `next-auth` from `package.json`.
2. **Files Deleted**:
   - `src/lib/auth.ts`
   - `src/app/api/auth/[...nextauth]/route.ts`
   - `src/app/api/auth/status/route.ts`
   - `src/app/auth/error/page.tsx`
   - `src/components/providers/session-provider.tsx`
3. **Environment Variables Removed**:
   - `AUTH_SECRET`, `NEXTAUTH_SECRET`, `AUTH_GOOGLE_ID`, `GOOGLE_CLIENT_ID`, `AUTH_GOOGLE_SECRET`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_URL`.
4. **Database Schema Cleanup**:
   - Remove obsolete NextAuth tables (`users`, `accounts`, `sessions`, `verificationTokens`) from `src/db/schema.ts` and `src/db/index.ts`.
   - Add a `subscriptions` table to `src/db/schema.ts` (`userId`, `channelId`, `channelTitle`, `avatarUrl`, `subscribedAt`).

### 3.2 Guest State & Isolated Anonymous Sessions
To ensure complete multi-visitor data isolation without accounts:
- Each browser is assigned an anonymous, cryptographically random cookie session (`yt_guest_id` = `guest_${UUID}`, `HttpOnly`, `SameSite=Lax`, `Path=/`).
- Repository operations use this visitor ID so each visitor has their own isolated watch history, playlists, likes, subscriptions, and settings.
- If authentication is reintroduced in the future, the session resolver in API routes can swap `yt_guest_id` for an authenticated user ID without changing repository logic or data schemas.

### 3.3 UI Updates
- **`Header` / `UserMenu`**: Refactored into a clean User Preferences menu (displaying guest status, quick links to History, Liked Videos, Playlists, Settings, and theme toggle). No login or logout buttons.
- **`Sidebar`**: Remove the sign-in promotion card. Keep all functional navigation items.
- **`Comments`**: Remove the sign-in prompt and blocking dialog. Allow guest users to post comments locally, persisting them in localStorage and rendering them above live InnerTube comments.
- **`Settings`**: Remove Google OAuth connection status and instructions. Retain playback preferences, theme selector, history management, and cache controls.
- **`Subscriptions`**: Remove Google sign-in modal. Show guest-subscribed channels and their latest videos.

---

## 4. Bun Migration Architecture

### 4.1 Changes
- Adopt Bun as the primary package manager and task runner.
- Remove `pnpm-lock.yaml`, `pnpm-workspace.yaml`, and `.npmrc`.
- Generate `bun.lock` using `bun install`.
- Update `package.json` scripts:
  - `"dev": "next dev"`
  - `"build": "next build"`
  - `"start": "next start"`
  - `"type-check": "tsc --noEmit"`
  - `"test": "bun run src/test/run-tests.ts"`
- Update `README.md`, `PHASES.md`, and `PROGRESS.md` to reference `bun` instead of `pnpm`.

---

## 5. Risk Assessment & Mitigations

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **YouTube googlevideo IP locking** | Upstream video URL fetched by server fails when requested directly by client | The `/api/stream/proxy` endpoint proxies bytes on behalf of the client, preserving cookies, headers, and range requests. |
| **YouTube Cipher & Botguard** | Most popular videos cannot be decrypted without PO tokens or heavy JS sandbox | Honest fallback: Detect when progressive stream is unavailable, clearly inform user, and provide one-click switch to the official YouTube IFrame player. |
| **Guest Data Isolation** | Guest data could conflict if multi-tenancy is added later | Guest operations use `userId = "guest"`. In the database schema, `userId` is indexed. A future migration can reassign `"guest"` data to a newly logged-in account. |
| **Next.js App Router with Bun** | Potential compatibility issues with native Node packages | Next.js 15 fully supports Bun runtime for building and running. PGlite works with WebAssembly under Bun and Node. |
