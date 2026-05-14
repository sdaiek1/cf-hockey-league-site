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
    if (b.gf !== a.gf) return b.gf - a.gf;
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
    background: "linear-gradient(180deg, #0f172a 0%, #0b1120 100%)",
    border: "1px solid rgba(34,211,238,0.12)",
    borderRadius: 24,
    padding: 24,
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
    <main style={pageWrap} className="standings-page">
      <style>{`
        .standings-table-wrap {
          overflow-x: auto;
          background: rgba(2,6,23,0.20);
          border: 1px solid rgba(34,211,238,0.08);
          border-radius: 18px;
          padding: 12px;
        }

        .standings-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 760px;
        }

        .standings-mobile-cards {
          display: none;
        }

        .standings-card-row {
          background: linear-gradient(180deg, #111827 0%, #0b1220 100%);
          border: 1px solid rgba(34,211,238,0.10);
          border-radius: 18px;
          padding: 16px;
        }

        .standings-rank {
          width: 36px;
          height: 36px;
          border-radius: 999px;
          background: rgba(34,211,238,0.14);
          color: #67e8f9;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 16px;
          flex-shrink: 0;
        }

        .standings-team-line {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }

        .standings-team-link {
          color: #67e8f9;
          text-decoration: none;
          font-weight: 900;
          font-size: 18px;
          line-height: 1.2;
        }

        .standings-points-pill {
          margin-left: auto;
          background: rgba(34,211,238,0.12);
          border: 1px solid rgba(34,211,238,0.18);
          color: #67e8f9;
          border-radius: 999px;
          padding: 7px 10px;
          font-size: 13px;
          font-weight: 900;
          white-space: nowrap;
        }

        .standings-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        .standings-stat {
          background: rgba(2,6,23,0.28);
          border: 1px solid rgba(148,163,184,0.10);
          border-radius: 12px;
          padding: 10px 8px;
          text-align: center;
        }

        .standings-stat-label {
          display: block;
          color: #94a3b8;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }

        .standings-stat-value {
          display: block;
          color: #f8fafc;
          font-size: 18px;
          font-weight: 900;
          line-height: 1;
        }

        .standings-stat-value.points {
          color: #67e8f9;
        }

        @media (max-width: 760px) {
          .standings-page {
            padding: 14px !important;
          }

          .standings-shell {
            max-width: 100% !important;
          }

          .standings-main-card {
            padding: 18px !important;
            border-radius: 20px !important;
          }

          .standings-title {
            font-size: 30px !important;
            line-height: 1.05 !important;
          }

          .standings-intro {
            font-size: 15px !important;
            line-height: 1.5 !important;
            margin-bottom: 18px !important;
          }

          .standings-table-wrap {
            display: none !important;
          }

          .standings-mobile-cards {
            display: grid !important;
            gap: 12px;
          }
        }

        @media (max-width: 420px) {
          .standings-page {
            padding: 10px !important;
          }

          .standings-main-card {
            padding: 14px !important;
          }

          .standings-title {
            font-size: 26px !important;
          }

          .standings-team-link {
            font-size: 16px !important;
          }

          .standings-stat-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>

      <div style={shell} className="standings-shell">
        <section style={card} className="standings-main-card">
          <h1
            className="standings-title"
            style={{
              fontSize: 40,
              marginTop: 0,
              marginBottom: 10,
              letterSpacing: "-0.03em",
            }}
          >
            Standings
          </h1>

          <p
            className="standings-intro"
            style={{
              color: "#94a3b8",
              marginTop: 0,
              marginBottom: 24,
              fontSize: 17,
              lineHeight: 1.6,
            }}
          >
            Win = 3 points, Tie = 2 points, OTL = 1 point, Loss = 0 points.
          </p>

          {teamsError || gamesError ? (
            <p style={{ color: "#fca5a5" }}>
              Could not load standings: {teamsError || gamesError}
            </p>
          ) : (
            <>
              <div className="standings-table-wrap">
                <table className="standings-table">
                  <thead>
                    <tr>
                      <th style={thStyle}>Team</th>
                      <th style={thStyle}>GP</th>
                      <th style={thStyle}>W</th>
                      <th style={thStyle}>L</th>
                      <th style={thStyle}>OTL</th>
                      <th style={thStyle}>T</th>
                      <th style={thStyle}>GF</th>
                      <th style={thStyle}>GA</th>
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
                        <td style={tdStyle}>{row.gf}</td>
                        <td style={tdStyle}>{row.ga}</td>
                        <td
                          style={{
                            ...tdStyle,
                            color: "#67e8f9",
                            fontWeight: 800,
                          }}
                        >
                          {row.pts}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="standings-mobile-cards">
                {standings.map((row, index) => (
                  <div key={`mobile-${row.team}`} className="standings-card-row">
                    <div className="standings-team-line">
                      <span className="standings-rank">{index + 1}</span>

                      <Link
                        href={`/standings/${slugifyTeamName(row.team)}`}
                        className="standings-team-link"
                      >
                        {row.team}
                      </Link>

                      <span className="standings-points-pill">
                        {row.pts} PTS
                      </span>
                    </div>

                    <div className="standings-stat-grid">
                      <div className="standings-stat">
                        <span className="standings-stat-label">GP</span>
                        <span className="standings-stat-value">{row.gp}</span>
                      </div>

                      <div className="standings-stat">
                        <span className="standings-stat-label">W</span>
                        <span className="standings-stat-value">{row.w}</span>
                      </div>

                      <div className="standings-stat">
                        <span className="standings-stat-label">L</span>
                        <span className="standings-stat-value">{row.l}</span>
                      </div>

                      <div className="standings-stat">
                        <span className="standings-stat-label">OTL</span>
                        <span className="standings-stat-value">{row.otl}</span>
                      </div>

                      <div className="standings-stat">
                        <span className="standings-stat-label">T</span>
                        <span className="standings-stat-value">{row.t}</span>
                      </div>

                      <div className="standings-stat">
                        <span className="standings-stat-label">GF</span>
                        <span className="standings-stat-value">{row.gf}</span>
                      </div>

                      <div className="standings-stat">
                        <span className="standings-stat-label">GA</span>
                        <span className="standings-stat-value">{row.ga}</span>
                      </div>

                      <div className="standings-stat">
                        <span className="standings-stat-label">PTS</span>
                        <span className="standings-stat-value points">
                          {row.pts}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
