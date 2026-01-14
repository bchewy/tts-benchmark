import Image from "next/image";

import { getLogoSize, providers } from "@/lib/bench-data";

export default function ProviderGrid() {
  return (
    <section id="providers" className="mt-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Provider Sheet</p>
          <h2 className="font-display mt-3 text-3xl font-semibold">
            Specs at a glance
          </h2>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Update these as you test latency and price for each provider.
          </p>
        </div>
        <a
          href="#arena"
          className="btn-ghost px-4 py-2 text-xs font-semibold hover:-translate-y-0.5"
        >
          Back to arena
        </a>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {providers.map((provider) => (
          <div
            key={provider.id}
            className="panel panel-cut p-6"
            style={{ borderColor: `${provider.accent}55` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {provider.logo && (
                  <Image
                    src={provider.logo}
                    alt={provider.logoAlt ?? provider.name}
                    {...getLogoSize(provider, 26, 160)}
                    className={`brand-logo brand-logo-xl ${
                      provider.enabled ? "opacity-90" : "opacity-50"
                    }`}
                  />
                )}
                <h3
                  className={provider.logo ? "sr-only" : "text-xl font-semibold"}
                >
                  {provider.name}
                </h3>
              </div>
              <span
                className="tag"
                style={{
                  backgroundColor: provider.enabled
                    ? `${provider.accent}24`
                    : "rgba(12, 17, 24, 0.9)",
                  color: provider.enabled ? provider.accent : "var(--muted-2)",
                  borderColor: provider.enabled
                    ? `${provider.accent}66`
                    : "var(--stroke)",
                }}
              >
                {provider.enabled ? "Active" : "Queued"}
              </span>
            </div>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              {provider.tagline}
            </p>
            <dl className="mt-5 space-y-2 text-xs text-[color:var(--muted)]">
              <div className="flex items-center justify-between">
                <dt>Price</dt>
                <dd className="font-semibold text-[color:var(--text)]">
                  {provider.price}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Latency</dt>
                <dd className="font-semibold text-[color:var(--text)]">
                  {provider.latency}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Streaming</dt>
                <dd className="font-semibold text-[color:var(--text)]">
                  {provider.streaming}
                </dd>
              </div>
            </dl>
            <a
              href={provider.url}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-[color:var(--text)]"
            >
              Visit provider
              <span aria-hidden>→</span>
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
