export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

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

function isGoalie(position = "") {
  const pos = normalizePosition(position);
  return pos === "g" || pos === "goalie" || pos === "goalkeeper";
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
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

function getPlayerPpg(player) {
  if (
    player.points_per_game !== null &&
    player.points_per_game !== undefined
  ) {
    return toNumber(player.points_per_game).toFixed(2);
  }

  if (toNumber(player.stat_gp) <= 0) return "0.00";

  return (toNumber(player.stat_points) / toNumber(player.stat_gp)).toFixed(2);
}

export default async function TeamRosterPage({ params }) {
  const { slug } = params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return (
      <main
        style={{
          minHeight: "100vh",
          padding: 24,
          color: "#fff",
          background: "#020617",
        }}
      >
        Missing Supabase environment variables.
      </main>
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: players = [], error: playersError } = await supabase
    .from("players")
    .select(`
      *,
      team:team_id(id, name)
    `)
    .order("player_name", { ascending: true });

  if (playersError) {
    return (
      <main
        style={{
          minHeight: "100vh",
          padding: 24,
          color: "#fff",
          background: "#020617",
        }}
      >
        Could not load roster: {playersError.message}
      </main>
    );
  }

  const teamPlayers = players.filter(
    (player) => player.team?.name && slugifyTeamName(player.team.name) === slug
  );

  if (teamPlayers.length === 0) {
    notFound();
  }

  const teamName = teamPlayers[0].team.name;
  const teamId = teamPlayers[0].team.id;

  const { data: games = [], error: gamesError } = await supabase
    .from("games")
    .select("id, status, home_team_id, away_team_id");

  if (gamesError) {
    return (
      <main
        style={{
          minHeight: "100vh",
          padding: 24,
          color: "#fff",
          background: "#020617",
        }}
      >
        Could not load games: {gamesError.message}
      </main>
    );
  }

  const teamGamesPlayed = games.filter(
    (game) =>
      game.status === "Final" &&
      (game.home_team_id === teamId || game.away_team_id === teamId)
  ).length;

  const mergedPlayers = teamPlayers
    .map((player) => ({
      ...player,
      stat_gp: toNumber(player.games_played ?? player.gp ?? 0),
      stat_goals: toNumber(player.goals),
      stat_assists: toNumber(player.assists),
      stat_points: toNumber(
        player.points ?? toNumber(player.goals) + toNumber(player.assists)
      ),
      stat_pim: toNumber(player.penalty_minutes),
      stat_wins: toNumber(player.wins),
      stat_shutouts: toNumber(player.shutouts),
    }))
    .sort((a, b) => {
      if (b.stat_points !== a.stat_points) return b.stat_points - a.stat_points;
      if (b.stat_goals !== a.stat_goals) return b.stat_goals - a.stat_goals;
      return String(a.player_name || "").localeCompare(
        String(b.player_name || "")
      );
    });

  const goalies = mergedPlayers.filter((p) => isGoalie(p.position));
  const skaters = mergedPlayers.filter((p) => !isGoalie(p.position));

  const pageWrap = {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, rgba(2,6,23,0.96) 0%, rgba(3,7,18,0.98) 100%)",
    padding: 24,
    color: "#ffffff",
  };

  const shell = {
    maxWidth: 1280,
    margin: "0 auto",
  };

  const card = {
    background: "linear-gradient(180deg, #0f172a 0%, #0b1120 100%)",
    border: "1px solid rgba(34,211,238,0.12)",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 18px 45px rgba(0,0,0,0.28)",
  };

  const tableWrap = {
    overflowX: "auto",
    border: "1px solid rgba(34,211,238,0.10)",
    borderRadius: 18,
    background: "linear-gradient(180deg, #111827 0%, #0b1220 100%)",
  };

  const thStyle = {
    padding: "14px 12px",
    textAlign: "left",
    fontSize: 13,
    color: "#94a3b8",
    borderBottom: "1px solid rgba(148,163,184,0.12)",
    whiteSpace: "nowrap",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  };

  const tdStyle = {
    padding: "14px 12px",
    borderBottom: "1px solid rgba(148,163,184,0.08)",
    whiteSpace: "nowrap",
  };

  const renderStat = (label, value, highlight = false) => (
    <div className="team-roster-stat">
      <span className="team-roster-stat-label">{label}</span>
      <span className={highlight ? "team-roster-stat-value highlight" : "team-roster-stat-value"}>
        {value}
      </span>
    </div>
  );

  const renderSkaterSection = (rows, title) => (
    <div className="team-roster-section">
      <h2 className="team-roster-section-title">{title}</h2>

      {rows.length === 0 ? (
        <p style={{ color: "#cbd5e1" }}>No players listed.</p>
      ) : (
        <>
          <div style={tableWrap} className="team-roster-table-wrap">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Player</th>
                  <th style={thStyle}>Pos</th>
                  <th style={thStyle}>GP</th>
                  <th style={thStyle}>G</th>
                  <th style={thStyle}>A</th>
                  <th style={thStyle}>PTS</th>
                  <th style={thStyle}>PPG</th>
                  <th style={thStyle}>PIM</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((player) => (
                  <tr key={player.id}>
                    <td style={tdStyle}>{player.jersey_number ?? "-"}</td>
                    <td style={{ ...tdStyle, fontWeight: 800 }}>
                      {player.player_name}
                    </td>
                    <td style={tdStyle}>{player.position || "-"}</td>
                    <td style={tdStyle}>{player.stat_gp}</td>
                    <td style={tdStyle}>{player.stat_goals}</td>
                    <td style={tdStyle}>{player.stat_assists}</td>
                    <td style={{ ...tdStyle, color: "#67e8f9", fontWeight: 900 }}>
                      {player.stat_points}
                    </td>
                    <td style={tdStyle}>{getPlayerPpg(player)}</td>
                    <td style={tdStyle}>{player.stat_pim}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="team-roster-mobile-list">
            {rows.map((player) => (
              <div key={`mobile-${player.id}`} className="team-roster-player-card">
                <div className="team-roster-player-top">
                  <div className="team-roster-number">
                    #{player.jersey_number ?? "-"}
                  </div>

                  <div>
                    <div className="team-roster-player-name">
                      {player.player_name}
                    </div>
                    <div className="team-roster-player-meta">
                      {player.position || "Player"}
                    </div>
                  </div>
                </div>

                <div className="team-roster-stat-grid">
                  {renderStat("GP", player.stat_gp)}
                  {renderStat("G", player.stat_goals)}
                  {renderStat("A", player.stat_assists)}
                  {renderStat("PTS", player.stat_points, true)}
                  {renderStat("PPG", getPlayerPpg(player))}
                  {renderStat("PIM", player.stat_pim)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  const renderGoalieSection = (rows, title) => (
    <div className="team-roster-section">
      <h2 className="team-roster-section-title">{title}</h2>

      {rows.length === 0 ? (
        <p style={{ color: "#cbd5e1" }}>No goalies listed.</p>
      ) : (
        <>
          <div style={tableWrap} className="team-roster-table-wrap">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Player</th>
                  <th style={thStyle}>Pos</th>
                  <th style={thStyle}>GP</th>
                  <th style={thStyle}>W</th>
                  <th style={thStyle}>SO</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((player) => (
                  <tr key={player.id}>
                    <td style={tdStyle}>{player.jersey_number ?? "-"}</td>
                    <td style={{ ...tdStyle, fontWeight: 800 }}>
                      {player.player_name}
                    </td>
                    <td style={tdStyle}>{player.position || "-"}</td>
                    <td style={tdStyle}>{player.stat_gp}</td>
                    <td style={{ ...tdStyle, color: "#67e8f9", fontWeight: 900 }}>
                      {player.stat_wins}
                    </td>
                    <td style={tdStyle}>{player.stat_shutouts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="team-roster-mobile-list">
            {rows.map((player) => (
              <div key={`mobile-goalie-${player.id}`} className="team-roster-player-card">
                <div className="team-roster-player-top">
                  <div className="team-roster-number">
                    #{player.jersey_number ?? "-"}
                  </div>

                  <div>
                    <div className="team-roster-player-name">
                      {player.player_name}
                    </div>
                    <div className="team-roster-player-meta">
                      {player.position || "Goalie"}
                    </div>
                  </div>
                </div>

                <div className="team-roster-stat-grid goalie">
                  {renderStat("GP", player.stat_gp)}
                  {renderStat("W", player.stat_wins, true)}
                  {renderStat("SO", player.stat_shutouts)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <main style={pageWrap} className="team-roster-page">
      <style>{`
        .team-roster-back {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 18px;
          color: #67e8f9;
          background: rgba(17,24,39,0.72);
          border: 1px solid rgba(34,211,238,0.10);
          border-radius: 12px;
          padding: 10px 13px;
          text-decoration: none;
          font-weight: 800;
          min-height: 44px;
        }

        .team-roster-header {
          display: grid;
          grid-template-columns: 130px 1fr;
          gap: 20px;
          align-items: center;
          margin-bottom: 22px;
        }

        .team-roster-logo-box {
          width: 130px;
          height: 130px;
          border-radius: 20px;
          background: rgba(2,6,23,0.30);
          border: 1px solid rgba(34,211,238,0.10);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px;
        }

        .team-roster-logo {
          max-width: 100%;
          max-height: 110px;
          object-fit: contain;
        }

        .team-roster-title {
          font-size: 42px;
          margin: 0 0 12px;
          letter-spacing: -0.03em;
          line-height: 1.05;
        }

        .team-roster-summary {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          color: #cbd5e1;
        }

        .team-roster-summary-pill {
          background: rgba(2,6,23,0.28);
          border: 1px solid rgba(148,163,184,0.10);
          border-radius: 999px;
          padding: 8px 11px;
          font-size: 14px;
          font-weight: 800;
        }

        .team-roster-section {
          margin-top: 28px;
        }

        .team-roster-section-title {
          font-size: 26px;
          margin: 0 0 12px;
          letter-spacing: -0.02em;
        }

        .team-roster-mobile-list {
          display: none;
        }

        .team-roster-player-card {
          background: linear-gradient(180deg, #111827 0%, #0b1220 100%);
          border: 1px solid rgba(34,211,238,0.10);
          border-radius: 18px;
          padding: 16px;
        }

        .team-roster-player-top {
          display: grid;
          grid-template-columns: 52px 1fr;
          gap: 12px;
          align-items: center;
          margin-bottom: 13px;
        }

        .team-roster-number {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: rgba(34,211,238,0.13);
          color: #67e8f9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 900;
        }

        .team-roster-player-name {
          font-size: 19px;
          font-weight: 900;
          line-height: 1.15;
          color: #f8fafc;
        }

        .team-roster-player-meta {
          margin-top: 4px;
          color: #94a3b8;
          font-size: 14px;
          font-weight: 700;
        }

        .team-roster-stat-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }

        .team-roster-stat-grid.goalie {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .team-roster-stat {
          background: rgba(2,6,23,0.28);
          border: 1px solid rgba(148,163,184,0.10);
          border-radius: 12px;
          padding: 10px 8px;
          text-align: center;
        }

        .team-roster-stat-label {
          display: block;
          color: #94a3b8;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }

        .team-roster-stat-value {
          display: block;
          color: #f8fafc;
          font-size: 18px;
          font-weight: 900;
          line-height: 1;
        }

        .team-roster-stat-value.highlight {
          color: #67e8f9;
        }

        @media (max-width: 760px) {
          .team-roster-page {
            padding: 14px !important;
          }

          .team-roster-shell {
            max-width: 100% !important;
          }

          .team-roster-main-card {
            padding: 18px !important;
            border-radius: 20px !important;
          }

          .team-roster-header {
            grid-template-columns: 82px 1fr !important;
            gap: 14px !important;
          }

          .team-roster-logo-box {
            width: 82px !important;
            height: 82px !important;
            border-radius: 16px !important;
            padding: 8px !important;
          }

          .team-roster-logo {
            max-height: 70px !important;
          }

          .team-roster-title {
            font-size: 30px !important;
            line-height: 1.05 !important;
            margin-bottom: 9px !important;
          }

          .team-roster-summary {
            gap: 7px !important;
          }

          .team-roster-summary-pill {
            font-size: 12px !important;
            padding: 7px 9px !important;
          }

          .team-roster-section {
            margin-top: 24px !important;
          }

          .team-roster-section-title {
            font-size: 23px !important;
          }

          .team-roster-table-wrap {
            display: none !important;
          }

          .team-roster-mobile-list {
            display: grid !important;
            gap: 12px;
          }
        }

        @media (max-width: 420px) {
          .team-roster-page {
            padding: 10px !important;
          }

          .team-roster-main-card {
            padding: 14px !important;
          }

          .team-roster-header {
            grid-template-columns: 72px 1fr !important;
            gap: 12px !important;
          }

          .team-roster-logo-box {
            width: 72px !important;
            height: 72px !important;
          }

          .team-roster-title {
            font-size: 26px !important;
          }

          .team-roster-player-card {
            padding: 14px !important;
          }

          .team-roster-player-name {
            font-size: 17px !important;
          }

          .team-roster-stat-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .team-roster-stat-grid.goalie {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
        }
      `}</style>

      <div style={shell} className="team-roster-shell">
        <section style={card} className="team-roster-main-card">
          <Link href="/rosters" className="team-roster-back">
            ← Back to Rosters
          </Link>

          <div className="team-roster-header">
            <div className="team-roster-logo-box">
              <img
                className="team-roster-logo"
                src={getTeamLogoSrc(teamName)}
                alt={`${teamName} logo`}
              />
            </div>

            <div>
              <h1 className="team-roster-title">{teamName}</h1>

              <div className="team-roster-summary">
                <div className="team-roster-summary-pill">
                  Players: {mergedPlayers.length}
                </div>
                <div className="team-roster-summary-pill">
                  Team GP: {teamGamesPlayed}
                </div>
                <div className="team-roster-summary-pill">
                  Goalies: {goalies.length}
                </div>
                <div className="team-roster-summary-pill">
                  Skaters: {skaters.length}
                </div>
              </div>
            </div>
          </div>

          {renderGoalieSection(goalies, "Goalies")}
          {renderSkaterSection(skaters, "Skaters")}
        </section>
      </div>
    </main>
  );
}
