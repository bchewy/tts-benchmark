import Image from "next/image";

import BenchmarkArena from "@/components/BenchmarkArena";
import Leaderboard from "@/components/Leaderboard";
import ProviderGrid from "@/components/ProviderGrid";
import { getLogoSize, prompts, providers, type Provider } from "@/lib/bench-data";
import { getLeaderboard } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { items, totalVotes } = await getLeaderboard();
  const activeProviders = providers.filter((provider) => provider.enabled);
  const logoProviders = activeProviders.filter(
    (provider): provider is Provider & { logo: string } =>
      typeof provider.logo === "string" && provider.logo.length > 0
  );

  const stats = [
    { label: "Providers", value: activeProviders.length, note: "Active voices" },
    { label: "Prompts", value: prompts.length, note: "Scripted tests" },
    { label: "Database", value: "Turso", note: "Live votes" },
    { label: "Format", value: "MP3 + WAV", note: "Cached audio" },
  ];

  const steps = [
    {
      title: "Load the prompt",
      description:
        "Pick a short, emotional, or numbers-heavy line to test clarity and control.",
    },
    {
      title: "Listen blind",
      description:
        "Hear Voice A vs Voice B without provider names. Focus on naturalness.",
    },
    {
      title: "Vote fast",
      description:
        "Cast the winner. Turso stores the result and the leaderboard updates live.",
    },
  ];

  return (
    <div className="min-h-screen">
      <header className="relative overflow-hidden">
        <div className="signal-lines pointer-events-none absolute inset-0" />
        <div className="mx-auto max-w-6xl px-6 pb-12 pt-16 md:pt-20">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="relative z-10 animate-fade-up">
              <p className="eyebrow">Day 14 Build</p>
              <h1 className="font-display mt-4 text-4xl font-semibold md:text-6xl">
                TTS Throwdown
              </h1>
              <p className="mt-4 text-base text-[color:var(--muted)] md:text-lg">
                A blind A/B benchmark for text-to-speech providers. Compare
                voices, vote for the winners, and build a public leaderboard.
              </p>
              <div className="mt-7 flex flex-wrap gap-3 text-sm">
                <a
                  href="#arena"
                  className="btn-primary px-5 py-2 font-semibold transition hover:-translate-y-0.5"
                >
                  Start a round
                </a>
                <a
                  href="#providers"
                  className="btn-outline px-5 py-2 font-semibold transition hover:-translate-y-0.5"
                >
                  Provider sheet
                </a>
              </div>
              {logoProviders.length > 0 && (
                <div className="mt-8 flex flex-wrap items-center gap-4 text-xs text-[color:var(--muted-2)]">
                  <span className="text-[0.6rem] uppercase tracking-[0.35em]">
                    Featuring
                  </span>
                  <div className="flex flex-wrap items-center gap-4">
                    {logoProviders.map((provider) => (
                      <Image
                        key={provider.id}
                        src={provider.logo}
                        alt={provider.logoAlt ?? provider.name}
                        {...getLogoSize(provider, 22, 150)}
                        className="brand-logo brand-logo-lg opacity-90"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="panel panel-cut p-6 md:p-8">
              <div className="eyebrow">Signal deck</div>
              <div className="signal-bars mt-5">
                {Array.from({ length: 12 }).map((_, index) => (
                  <span key={`bar-${index}`} />
                ))}
              </div>
              <div className="mt-6 space-y-4 text-sm">
                {stats.map((item, index) => (
                  <div
                    key={item.label}
                    className={`pb-3 ${
                      index === stats.length - 1 ? "border-b-0" : "border-b"
                    } border-white/10`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted-2)]">
                        {item.label}
                      </span>
                      <span className="text-lg font-semibold">{item.value}</span>
                    </div>
                    <div className="mt-1 text-xs text-[color:var(--muted)]">
                      {item.note}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24">
        <section className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((item, index) => (
            <div
              key={item.title}
              className="panel panel-cut animate-fade-up p-6"
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              <div className="eyebrow">Step 0{index + 1}</div>
              <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                {item.description}
              </p>
            </div>
          ))}
        </section>

        <BenchmarkArena providers={providers} prompts={prompts} />

        <Leaderboard items={items} totalVotes={totalVotes} />

        <ProviderGrid />

        <section className="panel panel-cut mt-16 p-8">
          <div className="eyebrow">Live Playback</div>
          <h2 className="font-display mt-3 text-2xl font-semibold">
            API keys + caching
          </h2>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Add <span className="font-mono">OPENAI_API_KEY</span>,
            <span className="font-mono"> ELEVENLABS_API_KEY</span>, and
            <span className="font-mono"> INWORLD_BASIC_AUTH</span> to
            <span className="font-mono"> .env.local</span>. First play generates
            audio and caches it in Turso.
          </p>
          <p className="mt-4 text-xs text-[color:var(--muted)]">
            Optional overrides:
            <span className="font-mono"> OPENAI_TTS_VOICE</span>,
            <span className="font-mono"> OPENAI_TTS_MODEL</span>,
            <span className="font-mono"> ELEVENLABS_VOICE_ID</span>,
            <span className="font-mono"> INWORLD_TTS_VOICE</span>.
          </p>
        </section>
      </main>
    </div>
  );
}
