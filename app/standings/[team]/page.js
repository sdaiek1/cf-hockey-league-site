export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

function slugifyTeamName(name = "") {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDisplayDate(gameDate) {
  if (!gameDate) return "Date TBD";

  const date = new Date(`${gameDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return gameDate;

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getTeamResult(game, teamId) {
  const isHome = game.home_team_id === teamId;
  const teamScore = isHome ? game.home_score : game.away_score;
  const oppScore = isHome ? game.away_score : game.home_score;

  if (teamScore === null || oppScore === null) return "—";

  if (teamScore === oppScore || game.result_type === "tie") {
    return "T";
  }

  const teamWon = teamScore > oppScore;
  const isExtraTime =
    game.result_type === "overtime" || game.result_type === "shootout";

  if (teamWon) return "W";
  if (isExtraTime) return "OTL";
  return "L";
}

function getOpponentName(game, teamId) {
  const isHome = game.home_team_id === teamId;
  return isHome
    ? game.away_team?.name || "Opponent"
    : game.home_team?.name || "Opponent";
}

function getTeamScoreDisplay(game, teamId) {
  const isHome = game.home_team_id === teamId;
  const teamScore = isHome ? game.home_score : game.away_score;
  const oppScore = isHome ? game.away_score : game.home_score;
  return `${teamScore ?? "-"} - ${oppScore ?? "-"}`;
}

function getStatsSortValue(row, key) {
  const value = row[key];
  return typeof value === "number" ? value : 0;
}

export default async function TeamPage({ params }) {
  const { team: teamSlug } = await params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return (
      <main style={{ maxWidth: 1220, margin: "0 auto", padding: 20, color: "#fff" }}>
        <p style={{ color: "#fca5a5" }}>Missing Supabase environment variables.</p>
      </main>
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: allTeams, error: teamsError } = await supabase
    .from("teams")
    .select("id, name")
    .order("name", { ascending: true });

  if (teamsError) {
    return (
      <main style={{ maxWidth: 1220, margin: "0 auto", padding: 20, color: "#fff" }}>
        <p style={{ color: "#fca5a5" }}>Could not load team: {teamsError.message}</p>
      </main>
    );
  }

  const team = (allTeams || []).find(
    (item) => slugifyTeamName(item.name) === teamSlug
  );

  if (!team) {
    notFound();
  }

  const { data: gamesData, error: gamesError } = await supabase
    .from("games")
    .select(`
      id,
      game_date,
      game_time,
      status,
      result_type,
      home_score,
      away_score,
      home_team_id,
      away_team_id,
      home_team:home_team_id(name),
      away_team:away_team_id(name)
    `)
    .eq("status", "Final")
    .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
    .order("game_date", { ascending: false });

  let playerStats = [];
  let playerStatsError = null;

  const { data: playersData, error: playersError } = await supabase
    .from("players")
    .select(`
      id,
      player_name,
      jersey_number,
      position,
      team_id,
      games_played,
      goals,
      assists,
      points,
      penalty_minutes
    `)
    .eq("team_id", team.id)
    .order("points", { ascending: false })
    .order("goals", { ascending: false })
    .order("assists", { ascending: false });

  if (playersError) {
    playerStatsError = playersError.message;
  } else {
    playerStats = (playersData || [])
      .map((player) => ({
        id: player.id,
        name: player.player_name || "Player",
        number: player.jersey_number,
        gp: Number(player.games_played || 0),
        goals: Number(player.goals || 0),
        assists: Number(player.assists || 0),
        points: Number(player.points || 0),
        pim: Number(player.penalty_minutes || 0),
        position: player.position || "-",
      }))
      .sort((a, b) => {
        if (getStatsSortValue(b, "points") !== getStatsSortValue(a, "points")) {
          return getStatsSortValue(b, "points") - getStatsSortValue(a, "points");
        }
        if (getStatsSortValue(b, "goals") !== getStatsSortValue(a, "goals")) {
          return getStatsSortValue(b, "goals") - getStatsSortValue(a, "goals");
        }
        return a.name.localeCompare(b.name);
      });
  }

  const games = gamesData || [];

  let teamWins = 0;
  let teamLosses = 0;
  let teamOTL = 0;
  let teamTies = 0;

  for (const game of games) {
    const result = getTeamResult(game, team.id);
    if (result === "W") teamWins += 1;
    if (result === "L") teamLosses += 1;
    if (result === "OTL") teamOTL += 1;
    if (result === "T") teamTies += 1;
  }

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

  const subCard = {
    background: "#111827",
    border: "1px solid rgba(148,163,184,0.12)",
    borderRadius: 16,
    padding: 18,
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
        <div style={{ marginBottom: 18 }}>
          <Link
            href="/standings"
            style={{
              color: "#67e8f9",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            ← Back to Standings
          </Link>
        </div>

        <section style={card}>
          <h1 style={{ fontSize: 40, marginTop: 0, marginBottom: 8 }}>
            {team.name}
          </h1>
          <p style={{ color: "#94a3b8", marginTop: 0, marginBottom: 24 }}>
            Team results and player stats
          </p>

          {gamesError ? (
            <p style={{ color: "#fca5a5" }}>
              Could not load results: {gamesError.message}
            </p>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: 12,
                  marginBottom: 24,
                }}
              >
                <div style={subCard}>
                  <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 6 }}>
                    Games Played
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800 }}>{games.length}</div>
                </div>

                <div style={subCard}>
                  <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 6 }}>
                    Wins
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#67e8f9" }}>
                    {teamWins}
                  </div>
                </div>

                <div style={subCard}>
                  <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 6 }}>
                    Losses
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800 }}>{teamLosses}</div>
                </div>

                <div style={subCard}>
                  <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 6 }}>
                    OTL
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800 }}>{teamOTL}</div>
                </div>

                <div style={subCard}>
                  <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 6 }}>
                    Ties
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800 }}>{teamTies}</div>
                </div>
              </div>

              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 28, marginBottom: 14 }}>Results</h2>

                {games.length === 0 ? (
                  <p style={{ color: "#cbd5e1" }}>
                    No final games posted yet for this team.
                  </p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <th style={thStyle}>Date</th>
                          <th style={thStyle}>Opponent</th>
                          <th style={thStyle}>Result</th>
                          <th style={thStyle}>Score</th>
                          <th style={thStyle}>Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {games.map((game) => {
                          const result = getTeamResult(game, team.id);

                          return (
                            <tr key={game.id}>
                              <td style={tdStyle}>
                                {formatDisplayDate(game.game_date)}
                              </td>
                              <td style={{ ...tdStyle, fontWeight: 700 }}>
                                {getOpponentName(game, team.id)}
                              </td>
                              <td
                                style={{
                                  ...tdStyle,
                                  fontWeight: 800,
                                  color:
                                    result === "W"
                                      ? "#67e8f9"
                                      : result === "OTL" || result === "T"
                                      ? "#facc15"
                                      : "#fca5a5",
                                }}
                              >
                                {result}
                              </td>
                              <td style={tdStyle}>
                                {getTeamScoreDisplay(game, team.id)}
                              </td>
                              <td style={tdStyle}>
                                {game.result_type
                                  ? String(game.result_type).replace(/^./, (m) =>
                                      m.toUpperCase()
                                    )
                                  : "Regulation"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <h2 style={{ fontSize: 28, marginBottom: 14 }}>Player Stats</h2>

                {playerStatsError ? (
                  <p style={{ color: "#fca5a5" }}>{playerStatsError}</p>
                ) : playerStats.length === 0 ? (
                  <p style={{ color: "#cbd5e1" }}>
                    No player stats posted yet for this team.
                  </p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <th style={thStyle}>Player</th>
                          <th style={thStyle}>#</th>
                          <th style={thStyle}>Pos</th>
                          <th style={thStyle}>GP</th>
                          <th style={thStyle}>G</th>
                          <th style={thStyle}>A</th>
                          <th style={thStyle}>PTS</th>
                          <th style={thStyle}>PIM</th>
                        </tr>
                      </thead>
                      <tbody>
                        {playerStats.map((player) => (
                          <tr key={player.id}>
                            <td style={{ ...tdStyle, fontWeight: 700 }}>
                              {player.name}
                            </td>
                            <td style={tdStyle}>{player.number ?? "—"}</td>
                            <td style={tdStyle}>{player.position}</td>
                            <td style={tdStyle}>{player.gp}</td>
                            <td style={tdStyle}>{player.goals}</td>
                            <td style={tdStyle}>{player.assists}</td>
                            <td
                              style={{
                                ...tdStyle,
                                color: "#67e8f9",
                                fontWeight: 800,
                              }}
                            >
                              {player.points}
                            </td>
                            <td style={tdStyle}>{player.pim}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
