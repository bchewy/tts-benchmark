"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { Prompt, Provider } from "@/lib/bench-data";
import { audioSrc } from "@/lib/bench-data";

type Matchup = {
  left: Provider;
  right: Provider;
};

type VoteStatus = "idle" | "saving" | "saved" | "error";

type BenchmarkArenaProps = {
  providers: Provider[];
  prompts: Prompt[];
};

const pickPair = (list: Provider[]): Matchup | null => {
  if (list.length < 2) {
    return null;
  }

  const firstIndex = Math.floor(Math.random() * list.length);
  let secondIndex = Math.floor(Math.random() * (list.length - 1));

  if (secondIndex >= firstIndex) {
    secondIndex += 1;
  }

  return {
    left: list[firstIndex],
    right: list[secondIndex],
  };
};

const defaultPair = (list: Provider[]): Matchup | null => {
  if (list.length < 2) {
    return null;
  }

  return {
    left: list[0],
    right: list[1],
  };
};

const AudioCard = ({
  label,
  provider,
  promptId,
  revealed,
  heard,
  onPlay,
}: {
  label: string;
  provider: Provider;
  promptId: string;
  revealed: boolean;
  heard: boolean;
  onPlay: () => void;
}) => {
  const [missing, setMissing] = useState(false);

  return (
    <div
      className="panel panel-cut panel-soft p-5"
      style={{
        borderColor: `${provider.accent}55`,
      }}
    >
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-[color:var(--muted-2)]">
        <span>{label}</span>
        <div className="flex items-center gap-2">
          <span
            className="tag"
            style={{
              backgroundColor: revealed
                ? `${provider.accent}26`
                : "rgba(12, 17, 24, 0.9)",
              color: revealed ? provider.accent : "var(--muted-2)",
              borderColor: revealed ? `${provider.accent}66` : "var(--stroke)",
            }}
          >
            {revealed ? provider.name : "Hidden"}
          </span>
          <span
            className="tag"
            style={{
              backgroundColor: heard
                ? "rgba(77, 224, 210, 0.22)"
                : "rgba(12, 17, 24, 0.9)",
              color: heard ? "var(--accent-2)" : "var(--muted-2)",
              borderColor: heard ? "var(--accent-2)" : "var(--stroke)",
            }}
          >
            {heard ? "Heard" : "Unheard"}
          </span>
        </div>
      </div>
      <div className="mt-4 text-sm font-semibold text-[color:var(--text)]">
        {revealed ? provider.tagline : "Listen first. Judge later."}
      </div>
      <audio
        className="mt-4 w-full"
        controls
        preload="none"
        onError={() => setMissing(true)}
        onPlay={onPlay}
        src={audioSrc(provider.id, promptId)}
      />
      {missing && (
        <p className="mt-3 text-xs text-[color:var(--muted)]">
          Audio failed to load. Check your API keys in
          <span className="font-mono"> .env.local</span> and the provider config.
        </p>
      )}
    </div>
  );
};

export default function BenchmarkArena({ providers, prompts }: BenchmarkArenaProps) {
  const router = useRouter();
  const activeProviders = useMemo(
    () => providers.filter((provider) => provider.enabled),
    [providers]
  );
  const [promptId, setPromptId] = useState(prompts[0]?.id ?? "");
  const [matchup, setMatchup] = useState<Matchup | null>(() =>
    defaultPair(activeProviders)
  );
  const [revealed, setRevealed] = useState(false);
  const [status, setStatus] = useState<VoteStatus>("idle");
  const [lastVote, setLastVote] = useState<{
    winner: Provider;
    loser: Provider;
  } | null>(null);
  const [heard, setHeard] = useState({ left: false, right: false });

  useEffect(() => {
    setMatchup(pickPair(activeProviders));
    setRevealed(false);
    setStatus("idle");
    setLastVote(null);
    setHeard({ left: false, right: false });
  }, [promptId, activeProviders]);

  const prompt = prompts.find((item) => item.id === promptId) ?? prompts[0];

  const handleVote = async (winner: Provider, loser: Provider) => {
    if (!prompt) {
      return;
    }

    setStatus("saving");

    try {
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptId: prompt.id,
          winner: winner.id,
          loser: loser.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Vote failed");
      }

      setStatus("saved");
      setRevealed(true);
      setLastVote({ winner, loser });
      router.refresh();
    } catch {
      setStatus("error");
    }
  };

  const handleShuffle = () => {
    setMatchup(pickPair(activeProviders));
    setRevealed(false);
    setStatus("idle");
    setLastVote(null);
    setHeard({ left: false, right: false });
  };

  const canVote = heard.left && heard.right && status !== "saving";

  if (!prompt || activeProviders.length < 2 || !matchup) {
    return (
      <section className="panel panel-cut mt-12 p-8">
        <h2 className="text-2xl font-semibold">Add more providers</h2>
        <p className="mt-3 text-sm text-[color:var(--muted)]">
          You need at least two active providers to run blind A/B tests.
        </p>
      </section>
    );
  }

  return (
    <section id="arena" className="mt-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Blind A/B Arena</p>
          <h2 className="font-display mt-3 text-3xl font-semibold">
            Pick the voice that lands.
          </h2>
          <p className="mt-2 max-w-xl text-sm text-[color:var(--muted)]">
            Same prompt, two providers, one vote. Reveal the names only after you
            decide.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-[color:var(--muted-2)]">
          <span className="tag">Prompt set: 3</span>
          <span className="tag">
            Providers: {activeProviders.length}
          </span>
          <span className="tag">Mode: blind</span>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_1.9fr]">
        <div className="panel panel-cut p-6">
          <div className="eyebrow">Prompt</div>
          <div className="mt-4 text-lg font-semibold text-[color:var(--text)]">
            {prompt.text}
          </div>
          <div className="mt-6 space-y-2">
            {prompts.map((item) => {
              const isActive = item.id === promptId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPromptId(item.id)}
                  className={`prompt-button flex w-full items-center justify-between text-left text-sm ${
                    isActive ? "prompt-button-active" : ""
                  }`}
                >
                  <span className="font-semibold">{item.label}</span>
                  <span className="text-xs text-[color:var(--muted-2)]">
                    {item.id}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-6 text-xs text-[color:var(--muted)]">
            Tip: Use headphones. Vote on naturalness first, style second.
          </div>
        </div>

        <div className="panel panel-cut p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <AudioCard
              key={`${matchup.left.id}-${prompt.id}`}
              label="Voice A"
              provider={matchup.left}
              promptId={prompt.id}
              revealed={revealed}
              heard={heard.left}
              onPlay={() =>
                setHeard((current) => ({ ...current, left: true }))
              }
            />
            <AudioCard
              key={`${matchup.right.id}-${prompt.id}`}
              label="Voice B"
              provider={matchup.right}
              promptId={prompt.id}
              revealed={revealed}
              heard={heard.right}
              onPlay={() =>
                setHeard((current) => ({ ...current, right: true }))
              }
            />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => handleVote(matchup.left, matchup.right)}
              disabled={!canVote}
              className="btn-primary px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Vote A
            </button>
            <button
              type="button"
              onClick={() => handleVote(matchup.right, matchup.left)}
              disabled={!canVote}
              className="btn-outline px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Vote B
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[color:var(--muted)]">
            {!canVote && (
              <span>Listen to both voices to unlock voting.</span>
            )}
            <button
              type="button"
              onClick={() => setRevealed((value) => !value)}
              className="btn-ghost px-4 py-2 text-xs font-semibold hover:-translate-y-0.5"
            >
              {revealed ? "Hide providers" : "Reveal providers"}
            </button>
            <button
              type="button"
              onClick={handleShuffle}
              className="btn-ghost px-4 py-2 text-xs font-semibold hover:-translate-y-0.5"
            >
              New matchup
            </button>
            {status === "saving" && <span>Saving vote...</span>}
            {status === "error" && (
              <span className="text-red-600">Vote failed. Try again.</span>
            )}
            {status === "saved" && lastVote && (
              <span>
                Saved: you picked {lastVote.winner.name} over {lastVote.loser.name}.
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
