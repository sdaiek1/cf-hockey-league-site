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

function normalizePosition(position = "") {
  return String(position).trim().toLowerCase();
}

function getTeamLogoSrc(teamName = "") {
  const TEAM_LOGOS = {
    "Team Rasta": "/Rasta_Logo.JPG",
    "Zero Pucks Given": "/ZPG_Logo.PNG",
    Mayhem: "/Mayhem_Logo.png",
    "Swiss Army": "/Swiss_Logo.PNG",
    WCFD: "/WCFD_Logo.PNG",
    "H-Town Assassins": "/H-Town_Logo.png",
    Replacements: "/Replacements_Logo.png",
    Venom: "/Venom_Logo.JPG",
  };

  return TEAM_LOGOS[teamName] || "/logo.png";
}

export default async function RosterPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let players = [];
  let games = [];
  let playersError = null;

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: playerData, error: playerError } = await supabase
      .from("players")
      .select(`
        id,
        player_name,
        jersey_number,
        position,
        team:team_id(id, name)
      `)
      .order("player_name", { ascending: true });

    const { data: gameData, error: gameError } = await supabase
      .from("games")
      .select(`
        id,
        status,
        home_team_id,
        away_team_id
      `);

    if (playerError) {
      playersError = playerError.message;
    } else if (gameError) {
      playersError = gameError.message;
    } else {
      players = playerData || [];
      games = gameData || [];
    }
  } else {
    playersError = "Missing Supabase environment variables.";
  }

  const validPlayers = players.filter((player) => player.team?.name);

  const teamMap = {};

  for (const player of validPlayers) {
    const teamId = player.team.id;
    const teamName = player.team.name;

    if (!teamMap[teamId]) {
      teamMap[teamId] = {
        id: teamId,
        name: teamName,
        totalPlayers: 0,
        goalies: 0,
        skaters: 0,
        gamesPlayed: 0,
      };
    }

    teamMap[teamId].totalPlayers += 1;

    const pos = normalizePosition(player.position);
    if (pos === "g" || pos === "goalie" || pos === "goalkeeper") {
      teamMap[teamId].goalies += 1;
    } else {
      teamMap[teamId].skaters += 1;
    }
  }

  for (const game of games) {
    if (game.status !== "Final") continue;

    if (teamMap[game.home_team_id]) {
      teamMap[game.home_team_id].gamesPlayed += 1;
    }

    if (teamMap[game.away_team_id]) {
      teamMap[game.away_team_id].gamesPlayed += 1;
    }
  }

  const teams = Object.values(teamMap).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

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

  const teamCard = {
    background: "linear-gradient(180deg, #111827 0%, #0b1220 100%)",
    border: "1px solid rgba(34,211,238,0.10)",
    borderRadius: 18,
    padding: 20,
  };

  const buttonStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    color: "#082f49",
    background: "linear-gradient(180deg, #67e8f9 0%, #22d3ee 100%)",
    padding: "11px 14px",
    borderRadius: 12,
    fontWeight: 800,
    textDecoration: "none",
    fontSize: 14,
    minHeight: 44,
    boxShadow: "0 8px 20px rgba(34,211,238,0.18)",
  };

  const quickLinkStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#67e8f9",
    background: "rgba(17,24,39,0.72)",
    border: "1px solid rgba(34,211,238,0.10)",
    borderRadius: 12,
    padding: "10px 13px",
    textDecoration: "none",
    fontWeight: 800,
    minHeight: 44,
  };

  return (
    <main style={pageWrap} className="rosters-page">
      <style>{`
        .rosters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 16px;
        }

        .rosters-team-card {
          transition: transform 160ms ease, border-color 160ms ease;
        }

        .rosters-team-card:hover {
          transform: translateY(-1px);
          border-color: rgba(34,211,238,0.22);
        }

        .rosters-logo-box {
          width: 100%;
          height: 110px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
          background: rgba(255,255,255,0.02);
          border-radius: 14px;
          border: 1px solid rgba(148,163,184,0.10);
          padding: 10px;
        }

        .rosters-logo {
          max-width: 100%;
          max-height: 105px;
          object-fit: contain;
        }

        .rosters-team-name {
          font-size: 24px;
          font-weight: 900;
          margin-bottom: 14px;
          line-height: 1.15;
        }

        .rosters-stat-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 9px;
        }

        .rosters-stat {
          background: rgba(2,6,23,0.28);
          border: 1px solid rgba(148,163,184,0.10);
          border-radius: 12px;
          padding: 10px;
        }

        .rosters-stat-label {
          display: block;
          color: #94a3b8;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }

        .rosters-stat-value {
          display: block;
          color: #f8fafc;
          font-size: 20px;
          font-weight: 900;
          line-height: 1;
        }

        .quick-links-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        @media (max-width: 760px) {
          .rosters-page {
            padding: 14px !important;
          }

          .rosters-shell {
            max-width: 100% !important;
          }

          .rosters-main-card {
            padding: 18px !important;
            border-radius: 20px !important;
          }

          .rosters-title {
            font-size: 30px !important;
            line-height: 1.05 !important;
          }

          .rosters-intro {
            font-size: 15px !important;
            line-height: 1.5 !important;
            margin-bottom: 22px !important;
          }

          .rosters-section-title {
            font-size: 24px !important;
          }

          .rosters-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }

          .rosters-team-card {
            padding: 16px !important;
            border-radius: 18px !important;
          }

          .rosters-team-top {
            display: grid !important;
            grid-template-columns: 72px 1fr !important;
            gap: 13px !important;
            align-items: center !important;
            margin-bottom: 14px !important;
          }

          .rosters-logo-box {
            height: 72px !important;
            margin-bottom: 0 !important;
            padding: 7px !important;
          }

          .rosters-logo {
            max-height: 64px !important;
          }

          .rosters-team-name {
            font-size: 21px !important;
            margin-bottom: 0 !important;
          }

          .rosters-stat-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .rosters-view-button {
            width: 100% !important;
            font-size: 15px !important;
          }

          .quick-links-row {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
          }
        }

        @media (max-width: 420px) {
          .rosters-page {
            padding: 10px !important;
          }

          .rosters-main-card {
            padding: 14px !important;
          }

          .rosters-title {
            font-size: 26px !important;
          }

          .rosters-team-top {
            grid-template-columns: 64px 1fr !important;
          }

          .rosters-logo-box {
            height: 64px !important;
          }

          .rosters-logo {
            max-height: 56px !important;
          }

          .rosters-team-name {
            font-size: 19px !important;
          }

          .quick-links-row {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div style={shell} className="rosters-shell">
        <section style={card} className="rosters-main-card">
          <h1
            className="rosters-title"
            style={{
              fontSize: 40,
              marginTop: 0,
              marginBottom: 10,
              letterSpacing: "-0.03em",
            }}
          >
            Rosters
          </h1>

          <p
            className="rosters-intro"
            style={{
              color: "#94a3b8",
              marginTop: 0,
              marginBottom: 28,
              fontSize: 17,
              lineHeight: 1.6,
            }}
          >
            Browse team rosters for the current season.
          </p>

          {playersError ? (
            <p style={{ color: "#fca5a5" }}>Could not load roster: {playersError}</p>
          ) : (
            <>
              <div style={{ marginBottom: 32 }}>
                <h2
                  className="rosters-section-title"
                  style={{
                    fontSize: 28,
                    marginTop: 0,
                    marginBottom: 14,
                  }}
                >
                  Team Directory
                </h2>

                {teams.length === 0 ? (
                  <p style={{ color: "#cbd5e1" }}>No roster data has been added yet.</p>
                ) : (
                  <div className="rosters-grid">
                    {teams.map((team) => (
                      <div
                        key={team.id}
                        style={teamCard}
                        className="rosters-team-card"
                      >
                        <div className="rosters-team-top">
                          <div className="rosters-logo-box">
                            <img
                              className="rosters-logo"
                              src={getTeamLogoSrc(team.name)}
                              alt={`${team.name} logo`}
                            />
                          </div>

                          <div className="rosters-team-name">{team.name}</div>
                        </div>

                        <div className="rosters-stat-grid">
                          <div className="rosters-stat">
                            <span className="rosters-stat-label">Players</span>
                            <span className="rosters-stat-value">
                              {team.totalPlayers}
                            </span>
                          </div>

                          <div className="rosters-stat">
                            <span className="rosters-stat-label">Games</span>
                            <span className="rosters-stat-value">
                              {team.gamesPlayed}
                            </span>
                          </div>

                          <div className="rosters-stat">
                            <span className="rosters-stat-label">Goalies</span>
                            <span className="rosters-stat-value">
                              {team.goalies}
                            </span>
                          </div>

                          <div className="rosters-stat">
                            <span className="rosters-stat-label">Skaters</span>
                            <span className="rosters-stat-value">
                              {team.skaters}
                            </span>
                          </div>
                        </div>

                        <Link
                          href={`/rosters/${slugifyTeamName(team.name)}`}
                          style={buttonStyle}
                          className="rosters-view-button"
                        >
                          View Full Roster
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginTop: 8 }}>
                <h2
                  className="rosters-section-title"
                  style={{
                    fontSize: 24,
                    marginTop: 0,
                    marginBottom: 12,
                  }}
                >
                  Quick Links
                </h2>

                <div className="quick-links-row">
                  <Link href="/standings" style={quickLinkStyle}>
                    Standings
                  </Link>
                  <Link href="/stats" style={quickLinkStyle}>
                    Player Stats
                  </Link>
                  <Link href="/schedule" style={quickLinkStyle}>
                    Schedule
                  </Link>
                  <Link href="/waiver" style={quickLinkStyle}>
                    Waiver
                  </Link>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
