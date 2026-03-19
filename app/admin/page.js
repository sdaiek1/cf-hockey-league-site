export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";
import { sampleLeague } from "../../lib/sample-data";

export default async function HomePage() {
  const league = sampleLeague;

  let games = [];
  let gamesError = null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    gamesError = "Missing Supabase environment variables.";
  } else {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("games")
      .select(`
        id,
        game_date,
        game_time,
        rink,
        status,
        home_team:home_team_id(name),
        away_team:away_team_id(name)
      `)
      .order("game_date", { ascending: true });

    if (error) {
      gamesError = error.message;
    } else {
      games = data || [];
    }
  }

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
      <section
        style={{
          padding: 24,
          border: "1px solid #1e293b",
          borderRadius: 20,
          background: "linear-gradient(135deg, #082f49, #020617)",
          marginBottom: 24
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "6px 12px",
            borderRadius: 999,
            background: "#0f172a",
            color: "#7dd3fc",
            border: "1px solid #164e63"
          }}
        >
          Adult Summer Hockey
        </div>

        <h1 style={{ fontSize: 44, marginBottom: 12 }}>
          {league.name}
        </h1>

        <p style={{ fontSize: 18, color: "#cbd5e1", maxWidth: 850 }}>
          Schedules, standings, rosters, player stats, rules, playoff information, and league updates all in one place.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: 12,
            marginTop: 24
          }}
        >
          {[
            ["Teams", "6"],
            ["Games", "14"],
            ["Playoff Spots", "4"],
            ["Team Cost", "$6,000"]
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                padding: 16,
                borderRadius: 16,
                background: "#0f172a",
                border: "1px solid #1e293b"
              }}
            >
              <div style={{ color: "#94a3b8", fontSize: 12, textTransform: "uppercase" }}>
                {label}
              </div>
              <div style={{ color: "#67e8f9", fontSize: 28, fontWeight: 700 }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 20,
          marginBottom: 24
        }}
      >
        <div
          style={{
            padding: 20,
            borderRadius: 20,
            background: "#0f172a",
            border: "1px solid #1e293b"
          }}
        >
          <h2>Upcoming Schedule</h2>

          {gamesError ? (
            <p style={{ color: "#fca5a5" }}>Could not load schedule: {gamesError}</p>
          ) : games.length === 0 ? (
            <p style={{ color: "#cbd5e1" }}>No games posted yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {games.map((game) => (
                <div
                  key={game.id}
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    background: "#111827",
                    border: "1px solid #1f2937"
                  }}
                >
                  <div style={{ color: "#67e8f9", fontSize: 14 }}>{game.game_date}</div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>
                    {game.home_team?.name} vs {game.away_team?.name}
                  </div>
                  <div style={{ color: "#cbd5e1" }}>
                    {game.game_time || "TBD"} • {game.rink || "Codey Arena"} • {game.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            padding: 20,
            borderRadius: 20,
            background: "#0f172a",
            border: "1px solid #1e293b"
          }}
        >
          <h2>League Updates</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {league.announcements.map((item) => (
              <div
                key={item}
                style={{
                  padding: 14,
                  borderRadius: 14,
                  background: "#111827",
                  color: "#e2e8f0"
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 24
        }}
      >
        <div
          style={{
            padding: 20,
            borderRadius: 20,
            background: "#0f172a",
            border: "1px solid #1e293b",
            overflowX: "auto"
          }}
        >
          <h2>Standings</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ color: "#94a3b8", textAlign: "left" }}>
                <th>Team</th>
                <th>GP</th>
                <th>W</th>
                <th>L</th>
                <th>OTL</th>
                <th>PTS</th>
              </tr>
            </thead>
            <tbody>
              {league.standings.map((row) => (
                <tr key={row.team}>
                  <td style={{ padding: "8px 0" }}>{row.team}</td>
                  <td>{row.gp}</td>
                  <td>{row.w}</td>
                  <td>{row.l}</td>
                  <td>{row.otl}</td>
                  <td style={{ color: "#67e8f9", fontWeight: 700 }}>{row.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          style={{
            padding: 20,
            borderRadius: 20,
            background: "#0f172a",
            border: "1px solid #1e293b",
            overflowX: "auto"
          }}
        >
          <h2>Player Stats</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ color: "#94a3b8", textAlign: "left" }}>
                <th>Player</th>
                <th>#</th>
                <th>Team</th>
                <th>G</th>
                <th>A</th>
                <th>PTS</th>
                <th>PIM</th>
              </tr>
            </thead>
            <tbody>
              {league.stats.map((row) => (
                <tr key={row.player}>
                  <td style={{ padding: "8px 0" }}>{row.player}</td>
                  <td>{row.number}</td>
                  <td>{row.team}</td>
                  <td>{row.g}</td>
                  <td>{row.a}</td>
                  <td style={{ color: "#67e8f9", fontWeight: 700 }}>{row.pts}</td>
                  <td>{row.pim}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section
        style={{
          padding: 20,
          borderRadius: 20,
          background: "#0f172a",
          border: "1px solid #1e293b"
        }}
      >
        <h2>Rules & Info</h2>
        <ul>
          {league.rules.map((rule) => (
            <li key={rule} style={{ marginBottom: 8 }}>
              {rule}
            </li>
          ))}
        </ul>

        <p style={{ color: "#cbd5e1", marginTop: 20 }}>
          League Contact: {league.contactName} — {league.contactEmail}
        </p>

        <p style={{ color: "#67e8f9" }}>
          Admin login: /admin
        </p>
      </section>
    </main>
  );
}
