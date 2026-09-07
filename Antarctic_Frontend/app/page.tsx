import HeroSection from "@/components/HeroSection";

export default function Home() {
  return (
    <main className="min-h-screen bg-surface">
      <nav className="w-full border-b border-border">
        <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ink text-sm tracking-tight">
              POLARIS AI
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-ink-muted">
            <a href="#about" className="hover:text-ink transition-colors">
              How it works
            </a>
            <a href="/dashboard" className="hover:text-ink transition-colors">
              Dashboard
            </a>
          </div>

          <a
            href="/dashboard"
            className="inline-flex items-center justify-center px-4 py-2 bg-navy-900 text-white text-sm font-medium rounded hover:bg-navy-800 transition-colors"
          >
            Open Dashboard
          </a>
        </div>
      </nav>

      <HeroSection />
    </main>
  );
}