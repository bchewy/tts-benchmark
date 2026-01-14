import Image from "next/image";

import { getLogoSize, providers } from "@/lib/bench-data";
import type { LeaderboardItem } from "@/lib/queries";

type LeaderboardProps = {
  items: LeaderboardItem[];
  totalVotes: number;
};

export default function Leaderboard({ items, totalVotes }: LeaderboardProps) {
  const providerMap = new Map(
    providers.map((provider) => [provider.id, provider])
  );

  return (
    <section id="leaderboard" className="mt-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Leaderboard</p>
          <h2 className="font-display mt-3 text-3xl font-semibold">
            Community favorites
          </h2>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            {totalVotes} votes total. Rankings update instantly after each vote.
          </p>
        </div>
        <div className="tag">Updated live</div>
      </div>

      <div className="mt-6 grid gap-4">
        {items.map((item, index) => {
          const provider = providerMap.get(item.id);
          const share = totalVotes > 0 ? (item.wins / totalVotes) * 100 : 0;

          return (
            <div key={item.id} className="panel panel-cut px-6 py-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {provider?.logo && (
                    <Image
                      src={provider.logo}
                      alt={provider.logoAlt ?? item.name}
                      {...getLogoSize(provider, 16, 110)}
                      className="brand-logo brand-logo-sm opacity-70"
                    />
                  )}
                  <div>
                    <div className="eyebrow">Rank {index + 1}</div>
                    <div
                      className={`mt-2 text-xl font-semibold ${
                        provider?.logo ? "sr-only" : ""
                      }`}
                    >
                      {item.name}
                    </div>
                    <div className="mt-1 text-xs text-[color:var(--muted)]">
                      {provider?.tagline ?? ""}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-semibold">{item.wins}</div>
                  <div className="text-xs text-[color:var(--muted-2)]">votes</div>
                </div>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden bg-white/10">
                <div
                  className="h-full"
                  style={{
                    width: `${Math.max(4, share)}%`,
                    backgroundColor: provider?.accent ?? "#111827",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
