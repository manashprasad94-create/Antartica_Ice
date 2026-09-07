export default function HeroSection() {
  return (
    <section className="w-full bg-surface">
      <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-12 lg:gap-16 min-h-[88vh] py-16">
          <div className="flex flex-col gap-6 max-w-xl">
            <span className="font-data text-xs text-ice-600 tracking-wide">
              SIH 2026 - PS 26059 - Ministry of Earth Sciences / NCPOR
            </span>

            <h1 className="text-4xl md:text-5xl lg:text-[3.4rem] leading-[1.08] font-semibold text-ink tracking-tight">
              Antarctic Sea-Ice and Navigation
              <br />
              Decision Support System
            </h1>

            <p className="text-ink-muted text-base md:text-lg leading-relaxed">
              Forecast sea-ice concentration, track drifting icebergs, and
              plan the safest route between research stations, built for
              the Bharati to Maitri corridor, powered by physics and
              machine learning working together.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="/dashboard"
                className="inline-flex items-center justify-center px-6 py-3 bg-navy-900 text-white text-sm font-medium rounded hover:bg-navy-800 transition-colors"
              >
                Open Dashboard
              </a>
              <a
                href="#about"
                className="inline-flex items-center justify-center px-6 py-3 border border-border text-ink text-sm font-medium rounded hover:border-ice-400 transition-colors"
              >
                How it works
              </a>
            </div>

            <div className="flex items-center gap-8 pt-8 border-t border-border mt-4">
              <div>
                <div className="font-data text-2xl text-ink">5-day</div>
                <div className="text-xs text-ink-muted mt-1">
                  Ice concentration forecast
                </div>
              </div>
              <div>
                <div className="font-data text-2xl text-ink">78/22</div>
                <div className="text-xs text-ink-muted mt-1">
                  Physics / ML drift blend
                </div>
              </div>
              <div>
                <div className="font-data text-2xl text-ink">34%</div>
                <div className="text-xs text-ink-muted mt-1">
                  Avg. risk reduction on route
                </div>
              </div>
            </div>
          </div>

          <div className="relative w-full aspect-[4/5] lg:aspect-[3/4] bg-surface-alt border border-border overflow-hidden rounded">
            <video
              className="absolute inset-0 w-full h-full object-cover"
              src="/videos/iceberg-hero.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
            />
            <div className="absolute inset-0 border border-border pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
}