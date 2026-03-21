export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";

export default async function StandingsPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let teams = [];
  let games = [];
  let teamsError = null;
  let gamesError = null;

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: teamData, error: teamError } = await supabase
      .from("teams")
      .select("id, name")
      .order("name", { ascending: true });

    if (teamError) {
      teamsError = teamError.message;
    } else {
      teams = teamData || [];
    }

    const { data: gameData, error: gameError } = await supabase
      .from("games")
      .select(`
        id,
        status,
        home_score,
        away_score,
        result_type,
        home_team:home_team_id(name),
        away_team:away_team_id(name)
      `)
      .eq("status", "Final");

    if (gameError) {
      gamesError = gameError.message;
    } else {
      games = gameData || [];
    }
  } else {
    teamsError = "Missing Supabase environment variables.";
    gamesError = "Missing Supabase environment variables.";
  }

  const standingsMap = {};
  for (const team of teams) {
    standingsMap[team.name] = {
      team: team.name,
      gp: 0,
      w: 0,
      l: 0,
      otl: 0,
      t: 0,
      pts: 0
    };
  }

  for (const game of games) {
    if (
      game.home_score === null ||
      game.away_score === null ||
      !game.home_team?.name ||
      !game.away_team?.name
    ) {
      continue;
    }

    const home = standingsMap[game.home_team.name];
    const away = standingsMap[game.away_team.name];
    if (!home || !away) continue;

    home.gp += 1;
    away.gp += 1;

    const homeWon = game.home_score > game.away_score;
    const awayWon = game.away_score > game.home_score;
    const tied = game.home_score === game.away_score;

    if (tied || game.result_type === "tie") {
      home.t += 1;
      away.t += 1;
      home.pts += 2;
      away.pts += 2;
      continue;
    }

    if (game.result_type === "overtime" || game.result_type === "shootout") {
      if (homeWon) {
        home.w += 1;
        home.pts += 3;
        away.otl += 1;
        away.pts += 1;
      } else if (awayWon) {
        away.w += 1;
        away.pts += 3;
        home.otl += 1;
        home.pts += 1;
      }
      continue;
    }

    if (homeWon) {
      home.w += 1;
      home.pts += 3;
      away.l += 1;
    } else if (awayWon) {
      away.w += 1;
      away.pts += 3;
      home.l += 1;
    }
  }

  const standings = Object.values(standingsMap).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.w !== a.w) return b.w - a.w;
    return a.team.localeCompare(b.team);
  });

  const card = {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 20,
    padding: 20
  };

  return (
    <main style={{ maxWidth: 1220, margin: "0 auto", padding: 20 }}>
      <section style={card}>
        <h1 style={{ fontSize: 40, marginTop: 0, marginBottom: 10 }}>Standings</h1>
        <p style={{ color: "#94a3b8", marginTop: 0, marginBottom: 24 }}>
          Win = 3 points, Tie = 2 points, OTL = 1 point, Loss = 0 points.
        </p>

        {teamsError || gamesError ? (
          <p style={{ color: "#fca5a5" }}>
            Could not load standings: {teamsError || gamesError}
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ color: "#94a3b8", textAlign: "left" }}>
                  <th style={{ paddingBottom: 12 }}>Team</th>
                  <th>GP</th>
                  <th>W</th>
                  <th>L</th>
                  <th>OTL</th>
                  <th>T</th>
                  <th>PTS</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row) => (
                  <tr key={row.team}>
                    <td style={{ padding: "12px 0", fontWeight: 700 }}>{row.team}</td>
                    <td>{row.gp}</td>
                    <td>{row.w}</td>
                    <td>{row.l}</td>
                    <td>{row.otl}</td>
                    <td>{row.t}</td>
                    <td style={{ color: "#67e8f9", fontWeight: 800 }}>{row.pts}</td>
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
