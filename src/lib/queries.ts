import { providers } from "@/lib/bench-data";
import { db, ensureSchema } from "@/lib/db";

export type LeaderboardItem = {
  id: string;
  name: string;
  wins: number;
};

export async function getLeaderboard() {
  await ensureSchema();

  const result = await db.execute(
    "SELECT winner_provider AS provider, COUNT(*) AS wins FROM votes GROUP BY winner_provider;"
  );

  const totalResult = await db.execute(
    "SELECT COUNT(*) AS total FROM votes;"
  );

  const winsMap = new Map<string, number>();

  for (const row of result.rows) {
    const provider = String(row.provider);
    const wins = Number(row.wins ?? 0);
    winsMap.set(provider, wins);
  }

  const items = providers
    .filter((provider) => provider.enabled)
    .map((provider) => ({
      id: provider.id,
      name: provider.name,
      wins: winsMap.get(provider.id) ?? 0,
    }))
    .sort((a, b) => b.wins - a.wins);

  const totalVotes = Number(totalResult.rows[0]?.total ?? 0);

  return { items, totalVotes };
}
