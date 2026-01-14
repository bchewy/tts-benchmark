import { NextResponse } from "next/server";

import { prompts, providers } from "@/lib/bench-data";
import { db, ensureSchema } from "@/lib/db";

const providerIds = new Set(providers.map((provider) => provider.id));
const promptIds = new Set(prompts.map((prompt) => prompt.id));

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);

  if (!payload) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { promptId, winner, loser } = payload as {
    promptId?: string;
    winner?: string;
    loser?: string;
  };

  if (!promptId || !winner || !loser) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!promptIds.has(promptId)) {
    return NextResponse.json({ error: "Unknown prompt" }, { status: 400 });
  }

  if (!providerIds.has(winner) || !providerIds.has(loser)) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

  if (winner === loser) {
    return NextResponse.json({ error: "Invalid matchup" }, { status: 400 });
  }

  await ensureSchema();

  await db.execute({
    sql: "INSERT INTO votes (prompt_id, winner_provider, loser_provider) VALUES (?, ?, ?);",
    args: [promptId, winner, loser],
  });

  return NextResponse.json({ ok: true });
}
