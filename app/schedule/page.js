export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";

export default async function SchedulePage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let games = [];
  let gamesError = null;

  if (supabaseUrl && supabaseKey) {
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
      .neq("status", "Final")
      .order("game_date", { ascending: true });

    if (error) {
      gamesError = error.message;
    } else {
      games = data || [];
    }
  } else {
    gamesError = "Missing Supabase environment variables.";
  }

  const card = {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 20,
    padding: 20
  };

  const subCard = {
    background: "#111827",
    border: "1px solid #1f2937",
    borderRadius: 16,
    padding: 16
  };

  return (
    <main style={{ maxWidth: 1220, margin: "0 auto", padding: 20 }}>
      <section style={card}>
        <h1 style={{ fontSize: 40, marginTop: 0, marginBottom: 10 }}>Schedule</h1>
        <p style={{ color: "#94a3b8", marginTop: 0, marginBottom: 24 }}>
          Upcoming games and league schedule at Codey Arena.
        </p>

        {gamesError ? (
          <p style={{ color: "#fca5a5" }}>Could not load schedule: {gamesError}</p>
        ) : games.length === 0 ? (
          <p style={{ color: "#cbd5e1" }}>No upcoming games posted yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {games.map((game) => (
              <div key={game.id} style={subCard}>
                <div style={{ color: "#67e8f9", fontSize: 13, fontWeight: 700 }}>
                  {game.game_date}
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>
                  {game.home_team?.name} vs {game.away_team?.name}
                </div>
                <div style={{ color: "#cbd5e1", marginTop: 8 }}>
                  {game.game_time || "TBD"} • {game.rink || "Codey Arena"} • {game.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
