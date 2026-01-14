import path from "node:path";

import { createClient } from "@libsql/client";

const dbUrl =
  process.env.TURSO_DATABASE_URL ??
  `file:${path.join(process.cwd(), "local.db")}`;

const authToken = process.env.TURSO_AUTH_TOKEN;

export const db = createClient({
  url: dbUrl,
  authToken,
});

let schemaReady = false;

export async function ensureSchema() {
  if (schemaReady) {
    return;
  }

  await db.execute(`
    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prompt_id TEXT NOT NULL,
      winner_provider TEXT NOT NULL,
      loser_provider TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
  `);

  await db.execute(
    "CREATE INDEX IF NOT EXISTS idx_votes_winner ON votes (winner_provider);"
  );
  await db.execute(
    "CREATE INDEX IF NOT EXISTS idx_votes_prompt ON votes (prompt_id);"
  );

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tts_audio (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_id TEXT NOT NULL,
      prompt_id TEXT NOT NULL,
      model TEXT NOT NULL,
      voice TEXT NOT NULL,
      format TEXT NOT NULL,
      audio_base64 TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      UNIQUE(provider_id, prompt_id, model, voice)
    );
  `);

  await db.execute(
    "CREATE INDEX IF NOT EXISTS idx_audio_provider ON tts_audio (provider_id);"
  );
  await db.execute(
    "CREATE INDEX IF NOT EXISTS idx_audio_prompt ON tts_audio (prompt_id);"
  );

  schemaReady = true;
}
