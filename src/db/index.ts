import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import postgres from "postgres";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

let dbInstance: any = null;
let tablesInitialized = false;

export function getDatabase() {
  if (dbInstance) return dbInstance;

  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && databaseUrl.trim() !== "") {
    // Standard PostgreSQL connection (e.g. Supabase, Neon, self-hosted Postgres)
    const client = postgres(databaseUrl);
    dbInstance = drizzlePg(client, { schema });
    return dbInstance;
  }

  // Only auto-initialize tables at runtime, not during static build collection
  const isBuildPhase =
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.npm_lifecycle_event === "build";

  if (isBuildPhase) {
    // Ephemeral in-memory PGlite for static build analysis to avoid concurrent worker directory lock collisions
    const pglite = new PGlite();
    dbInstance = drizzlePglite(pglite, { schema });
    return dbInstance;
  }

  // Embedded local PGlite (zero-dependency / zero-daemon embedded PostgreSQL)
  const dataDir = path.resolve(process.cwd(), ".data/pglite");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const pglite = new PGlite(dataDir);
  dbInstance = drizzlePglite(pglite, { schema });

  if (!tablesInitialized) {
    tablesInitialized = true;
    initEmbeddedTables(pglite).catch((err) => {
      console.warn("Table auto-migration notice:", err);
    });
  }

  return dbInstance;
}

async function initEmbeddedTables(pglite: PGlite) {
  try {
    await pglite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT NOT NULL UNIQUE,
        "emailVerified" TIMESTAMP,
        image TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS accounts (
        "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        provider TEXT NOT NULL,
        "providerAccountId" TEXT NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at INTEGER,
        token_type TEXT,
        scope TEXT,
        id_token TEXT,
        session_state TEXT,
        PRIMARY KEY (provider, "providerAccountId")
      );

      CREATE TABLE IF NOT EXISTS sessions (
        "sessionToken" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "verificationToken" (
        identifier TEXT NOT NULL,
        token TEXT NOT NULL,
        expires TIMESTAMP NOT NULL,
        PRIMARY KEY (identifier, token)
      );

      CREATE TABLE IF NOT EXISTS watch_history (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        video_id TEXT NOT NULL,
        title TEXT NOT NULL,
        channel_title TEXT NOT NULL,
        channel_id TEXT,
        thumbnail_url TEXT,
        duration INTEGER DEFAULT 0,
        progress_seconds INTEGER DEFAULT 0,
        total_seconds INTEGER DEFAULT 0,
        completed BOOLEAN DEFAULT FALSE,
        last_watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS playlists (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        is_public BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS playlist_items (
        id TEXT PRIMARY KEY,
        playlist_id TEXT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
        video_id TEXT NOT NULL,
        title TEXT NOT NULL,
        channel_title TEXT NOT NULL,
        channel_id TEXT,
        thumbnail_url TEXT,
        duration INTEGER DEFAULT 0,
        position INTEGER DEFAULT 0,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS liked_videos (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        video_id TEXT NOT NULL,
        title TEXT NOT NULL,
        channel_title TEXT NOT NULL,
        channel_id TEXT,
        thumbnail_url TEXT,
        duration INTEGER DEFAULT 0,
        liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user_settings (
        user_id TEXT PRIMARY KEY,
        default_playback_provider TEXT DEFAULT 'html5',
        autoplay BOOLEAN DEFAULT TRUE,
        default_quality TEXT DEFAULT 'auto',
        preferred_speed TEXT DEFAULT '1',
        custom_api_key TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);
  } catch (err) {
    console.warn("Table auto-migration notice:", err);
  }
}

export const db = getDatabase();
export { schema };
