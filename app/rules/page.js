export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";

export default async function StatsPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let players = [];
  let playersError = null;

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("players")
      .select(`
        id,
        player_name,
        jersey_number,
        position,
        games_played,
        goals,
        assists,
        points,
        penalty_minutes,
        team:team_id(name)
      `)
      .order("points", { ascending: false })
      .order("goals", { ascending: false })
      .order("assists", { ascending: false });

    if (error) {
      playersError = error.message;
    } else {
      players = data || [];
    }
  } else {
    playersError = "Missing Supabase environment variables.";
  }

  const card = {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 20,
    padding: 20
  };

  return (
    <main style={{ maxWidth: 1220, margin: "0 auto", padding: 20 }}>
      <section style={card}>
        <h1 style={{ fontSize: 40, marginTop: 0, marginBottom: 10 }}>Player Stats</h1>
        <p style={{ color: "#94a3b8", marginTop: 0, marginBottom: 24 }}>
          League scoring leaders and player totals.
        </p>

        {playersError ? (
          <p style={{ color: "#fca5a5" }}>Could not load stats: {playersError}</p>
        ) : players.length === 0 ? (
          <p style={{ color: "#cbd5e1" }}>No player stats yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ color: "#94a3b8", textAlign: "left" }}>
                  <th style={{ paddingBottom: 12 }}>Player</th>
                  <th>#</th>
                  <th>Team</th>
                  <th>Pos</th>
                  <th>GP</th>
                  <th>G</th>
                  <th>A</th>
                  <th>PTS</th>
                  <th>PIM</th>
                </tr>
              </thead>
              <tbody>
                {players.map((row) => (
                  <tr key={row.id}>
                    <td style={{ padding: "12px 0", fontWeight: 700 }}>{row.player_name}</td>
                    <td>{row.jersey_number}</td>
                    <td>{row.team?.name || ""}</td>
                    <td>{row.position || "-"}</td>
                    <td>{row.games_played}</td>
                    <td>{row.goals}</td>
                    <td>{row.assists}</td>
                    <td style={{ color: "#67e8f9", fontWeight: 800 }}>{row.points}</td>
                    <td>{row.penalty_minutes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
