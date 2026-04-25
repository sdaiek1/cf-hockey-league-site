export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

function slugifyTeamName(name = "") {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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
    pts: 0,
    gf: 0,
    ga: 0,
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

    home.gf += Number(game.home_score || 0);
    home.ga += Number(game.away_score || 0);
    away.gf += Number(game.away_score || 0);
    away.ga += Number(game.home_score || 0);

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

  const pageWrap = {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, rgba(2,6,23,0.96) 0%, rgba(3,7,18,0.98) 100%)",
    padding: 24,
    color: "#ffffff",
  };

  const shell = {
    maxWidth: 1220,
    margin: "0 auto",
  };

  const card = {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 20,
    padding: 20,
    boxShadow: "0 18px 45px rgba(0,0,0,0.28)",
  };

  const thStyle = {
    paddingBottom: 12,
    color: "#94a3b8",
    textAlign: "left",
    fontSize: 14,
    fontWeight: 700,
  };

  const tdStyle = {
    padding: "12px 0",
    borderTop: "1px solid rgba(148,163,184,0.12)",
  };

  return (
    <main style={pageWrap}>
      <div style={shell}>
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
                  <tr>
                    <th style={thStyle}>Team</th>
                    <th style={thStyle}>GP</th>
                    <th style={thStyle}>W</th>
                    <th style={thStyle}>L</th>
                    <th style={thStyle}>OTL</th>
                    <th style={thStyle}>T</th>
                    <th style={thStyle}>PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row) => (
                    <tr key={row.team}>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>
                        <Link
                          href={`/standings/${slugifyTeamName(row.team)}`}
                          style={{
                            color: "#67e8f9",
                            textDecoration: "none",
                            fontWeight: 800,
                          }}
                        >
                          {row.team}
                        </Link>
                      </td>
                      <td style={tdStyle}>{row.gp}</td>
                      <td style={tdStyle}>{row.w}</td>
                      <td style={tdStyle}>{row.l}</td>
                      <td style={tdStyle}>{row.otl}</td>
                      <td style={tdStyle}>{row.t}</td>
                      <td style={{ ...tdStyle, color: "#67e8f9", fontWeight: 800 }}>
                        {row.pts}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
