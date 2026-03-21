export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";

export default async function RostersPage() {
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
        team:team_id(name)
      `)
      .order("team_id", { ascending: true })
      .order("jersey_number", { ascending: true });

    if (error) {
      playersError = error.message;
    } else {
      players = data || [];
    }
  } else {
    playersError = "Missing Supabase environment variables.";
  }

  const rostersByTeam = players.reduce((acc, player) => {
    const teamName = player.team?.name || "No Team";
    if (!acc[teamName]) acc[teamName] = [];
    acc[teamName].push(player);
    return acc;
  }, {});

  const teamNames = Object.keys(rostersByTeam).sort();

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
        <h1 style={{ fontSize: 40, marginTop: 0, marginBottom: 10 }}>Rosters</h1>
        <p style={{ color: "#94a3b8", marginTop: 0, marginBottom: 24 }}>
          Team rosters and jersey numbers.
        </p>

        {playersError ? (
          <p style={{ color: "#fca5a5" }}>Could not load rosters: {playersError}</p>
        ) : teamNames.length === 0 ? (
          <p style={{ color: "#cbd5e1" }}>No players added yet.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16
            }}
          >
            {teamNames.map((teamName) => (
              <div key={teamName} style={subCard}>
                <h2 style={{ marginTop: 0, fontSize: 24 }}>{teamName}</h2>
                <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
                  {rostersByTeam[teamName].map((player) => (
                    <div
                      key={player.id}
                      style={{
                        padding: 10,
                        borderRadius: 12,
                        background: "#0b1220",
                        color: "#e2e8f0"
                      }}
                    >
                      {player.player_name} #{player.jersey_number}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
