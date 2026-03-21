import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  const upcomingGames = [
    {
      date: "2026-06-10",
      matchup: "Mayhem vs Replacements",
      details: "8:00PM • Codey Arena • Scheduled",
    },
  ];

  const standings = [
    { team: "Mayhem", gp: 3, w: 2, pts: 8 },
    { team: "Replacements", gp: 3, w: 0, pts: 3 },
    { team: "TBD", gp: 0, w: 0, pts: 0 },
    { team: "TBD 2", gp: 0, w: 0, pts: 0 },
  ];

  const news = [
    {
      title: "Mayhem Defeats Replacements in OT",
      date: "3/19/2026",
      excerpt: "Game summary",
    },
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.16),transparent_22%),radial-gradient(circle_at_80%_20%,rgba(37,99,235,0.14),transparent_18%),linear-gradient(to_bottom,#020617,#0f172a,#111827)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Top Nav */}
        <header className="mb-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md">
          <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="Cold Fusion Summer Hockey League logo"
                  width={64}
                  height={64}
                  className="h-14 w-14 object-contain sm:h-16 sm:w-16"
                  priority
                />
                <div>
                  <div className="text-lg font-bold leading-tight sm:text-xl">
                    Cold Fusion Summer Hockey League
                  </div>
                  <div className="text-sm text-slate-300">
                    Codey Arena • West Orange, NJ
                  </div>
                </div>
              </Link>
            </div>

            <nav className="flex flex-wrap gap-2 text-sm font-medium text-slate-200">
              <Link href="/" className="rounded-full px-3 py-2 transition hover:bg-white/10">
                Home
              </Link>
              <Link href="/schedule" className="rounded-full px-3 py-2 transition hover:bg-white/10">
                Schedule
              </Link>
              <Link href="/news" className="rounded-full px-3 py-2 transition hover:bg-white/10">
                News
              </Link>
              <Link href="/results" className="rounded-full px-3 py-2 transition hover:bg-white/10">
                Results
              </Link>
              <Link href="/standings" className="rounded-full px-3 py-2 transition hover:bg-white/10">
                Standings
              </Link>
              <Link href="/rosters" className="rounded-full px-3 py-2 transition hover:bg-white/10">
                Rosters
              </Link>
              <Link href="/stats" className="rounded-full px-3 py-2 transition hover:bg-white/10">
                Stats
              </Link>
              <Link href="/rules" className="rounded-full px-3 py-2 transition hover:bg-white/10">
                Rules
              </Link>
              <Link href="/contact" className="rounded-full px-3 py-2 transition hover:bg-white/10">
                Contact
              </Link>
              <Link href="/admin" className="rounded-full px-3 py-2 transition hover:bg-white/10">
                Admin
              </Link>
            </nav>
          </div>
        </header>

        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-blue-950/95 shadow-2xl">
          {/* Background effects */}
          <div className="absolute inset-0">
            <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-sky-300/10 blur-3xl" />

            <div
              className="absolute inset-0 opacity-[0.10]"
              style={{
                backgroundImage: `
                  linear-gradient(115deg, rgba(255,255,255,0.12) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.08) 100%),
                  repeating-linear-gradient(
                    0deg,
                    rgba(255,255,255,0.04) 0px,
                    rgba(255,255,255,0.04) 1px,
                    transparent 1px,
                    transparent 38px
                  )
                `,
              }}
            />

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,transparent_45%,rgba(2,6,23,0.45)_100%)]" />
          </div>

          <div className="relative z-10 px-6 py-14 sm:px-10 sm:py-20">
            <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.15fr_.85fr]">
              <div>
                <div className="mb-4 inline-flex items-center rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                  Adult Summer Hockey
                </div>

                <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Cold Fusion Summer Hockey League
                </h1>

                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                  Competitive adult summer hockey with league news, upcoming games,
                  standings, stats, team rosters, and featured stories all in one place.
                </p>

                <div className="mt-3 text-sm font-medium text-cyan-200">
                  Codey Arena • West Orange, NJ
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/schedule"
                    className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-300"
                  >
                    View Schedule
                  </Link>
                  <Link
                    href="/news"
                    className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                  >
                    Recent News
                  </Link>
                </div>
              </div>

              <div className="flex justify-center lg:justify-end">
                <div className="relative flex h-64 w-64 items-center justify-center rounded-full border border-white/10 bg-white/5 shadow-2xl backdrop-blur-sm sm:h-80 sm:w-80">
                  <div className="absolute inset-0 rounded-full bg-cyan-400/5 blur-2xl" />
                  <Image
                    src="/logo.png"
                    alt="Cold Fusion Summer Hockey League logo"
                    width={260}
                    height={260}
                    className="relative z-10 h-44 w-44 object-contain drop-shadow-[0_0_30px_rgba(103,232,249,0.22)] sm:h-56 sm:w-56"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main grid */}
        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Upcoming Games */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md lg:col-span-2">
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-white">Upcoming Games</h2>
              <p className="mt-1 text-sm text-slate-300">
                The next games on the league calendar.
              </p>
            </div>

            <div className="space-y-4">
              {upcomingGames.map((game, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 transition hover:border-cyan-300/20 hover:bg-slate-900/50"
                >
                  <div className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
                    {game.date}
                  </div>
                  <div className="mt-2 text-xl font-bold text-white">{game.matchup}</div>
                  <div className="mt-1 text-sm text-slate-300">{game.details}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Standings */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-white">Top 4 Standings</h2>
              <p className="mt-1 text-sm text-slate-300">
                Current leaders in the playoff race.
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10">
              <table className="min-w-full text-sm">
                <thead className="bg-white/10 text-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Team</th>
                    <th className="px-4 py-3 text-left font-semibold">GP</th>
                    <th className="px-4 py-3 text-left font-semibold">W</th>
                    <th className="px-4 py-3 text-left font-semibold">PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((team, idx) => (
                    <tr
                      key={idx}
                      className="border-t border-white/10 bg-slate-950/30 text-slate-100"
                    >
                      <td className="px-4 py-3">{team.team}</td>
                      <td className="px-4 py-3">{team.gp}</td>
                      <td className="px-4 py-3">{team.w}</td>
                      <td className="px-4 py-3 font-semibold text-cyan-300">
                        {team.pts}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <Link
                href="/standings"
                className="text-sm font-semibold text-cyan-300 transition hover:text-cyan-200"
              >
                Full standings →
              </Link>
            </div>
          </div>
        </section>

        {/* Feature row */}
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Player of the Week */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-white">Player of the Week</h2>
              <p className="mt-1 text-sm text-slate-300">Featured league spotlight.</p>
            </div>

            <div className="grid gap-5 sm:grid-cols-[150px_1fr]">
              <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-slate-950/40 text-sm font-semibold text-slate-400">
                PLAYER PHOTO
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">Player Name Here</h3>
                <div className="mt-1 text-sm font-medium text-cyan-300">
                  Team Name • Position
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  Add a weekly featured player here with a short writeup about a big
                  performance, great sportsmanship, or standout week.
                </p>
              </div>
            </div>
          </div>

          {/* Sponsor */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-white">The Hockey Truck</h2>
              <p className="mt-1 text-sm text-slate-300">
                League partner / featured spotlight block.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-[150px_1fr]">
              <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-slate-950/40 text-center text-sm font-semibold text-slate-400">
                HOCKEY TRUCK
                <br />
                IMAGE / LOGO
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">The Hockey Truck</h3>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  Use this space for your featured sponsor, partner, or league
                  promotion. You can swap this text out later for real info, a logo,
                  and a link.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* News */}
        <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-white">Recent News</h2>
            <p className="mt-1 text-sm text-slate-300">
              Latest game summaries and league stories.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {news.map((item, idx) => (
              <article
                key={idx}
                className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 transition hover:border-cyan-300/20 hover:bg-slate-900/50"
              >
                <div className="text-sm font-semibold text-cyan-300">{item.date}</div>
                <h3 className="mt-2 text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{item.excerpt}</p>
              </article>
            ))}
          </div>

          <div className="mt-5">
            <Link
              href="/news"
              className="text-sm font-semibold text-cyan-300 transition hover:text-cyan-200"
            >
              View all news →
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-8 rounded-3xl border border-white/10 bg-white/5 px-6 py-6 text-sm text-slate-300 backdrop-blur-md">
          <div className="font-semibold text-white">Cold Fusion Summer Hockey League</div>
          <div className="mt-1">Codey Arena • West Orange, NJ</div>
          <div className="mt-3">League Contact: Shane Daiek</div>
          <div className="text-cyan-300">shane.daiek@gmail.com</div>
        </footer>
      </div>
    </main>
  );
}
