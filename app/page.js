import { sampleLeague } from "../lib/sample-data";

export default function HomePage() {
  const league = sampleLeague;

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <section style={{ padding: 24, border: "1px solid #1e293b", borderRadius: 20, background: "linear-gradient(135deg, #082f49, #020617)" }}>
        <div style={{ display: "inline-block", padding: "6px 12px", borderRadius: 999, background: "#0f172a", color: "#7dd3fc", border: "1px solid #164e63" }}>
          Adult Summer Hockey
        </div>
        <h1 style={{ fontSize: 44, marginBottom: 12 }}>{league.name}</h1>
        <p style={{ fontSize: 18, color: "#cbd5e1", maxWidth: 800 }}>
          Schedules, standings, rosters, player stats, rules, playoff information, and league updates all in one place.
        </p>
      </section>
    </main>
  );
}
