export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function playerPoints(player) {
  if (player.points !== null && player.points !== undefined) {
    return toNumber(player.points);
  }

  return toNumber(player.goals) + toNumber(player.assists);
}

function playerPpg(player) {
  if (
    player.points_per_game !== null &&
    player.points_per_game !== undefined
  ) {
    return toNumber(player.points_per_game);
  }

  const gamesPlayed = toNumber(player.games_played);
  if (gamesPlayed <= 0) return 0;

  return playerPoints(player) / gamesPlayed;
}

function getStatValue(player, statKey) {
  if (statKey === "points") return playerPoints(player);
  if (statKey === "points_per_game") return playerPpg(player);
  return toNumber(player[statKey]);
}

function formatStatValue(value, statKey) {
  if (statKey === "points_per_game") {
    return toNumber(value).toFixed(2);
  }

  return toNumber(value);
}

function isGoalie(player) {
  const pos = String(player.position || "").trim().toLowerCase();
  return pos === "g" || pos === "goalie" || pos === "goalkeeper";
}

function getLeaders(players, statKey, limit = 5, options = {}) {
  const { requireGamesPlayed = false } = options;

  return [...players]
    .filter((player) => {
      if (!requireGamesPlayed) return true;
      return toNumber(player.games_played) > 0;
    })
    .sort((a, b) => {
      const diff = getStatValue(b, statKey) - getStatValue(a, statKey);
      if (diff !== 0) return diff;

      const secondaryDiff = playerPoints(b) - playerPoints(a);
      if (secondaryDiff !== 0) return secondaryDiff;

      const nameA = String(a.player_name || "");
      const nameB = String(b.player_name || "");
      return nameA.localeCompare(nameB);
    })
    .slice(0, limit);
}

export default async function StatsPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;

  const selectedTeam =
    typeof resolvedSearchParams?.team === "string"
      ? resolvedSearchParams.team
      : "all";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let players = [];
  let teams = [];
  let playersError = null;
  let teamsError = null;

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const [
      { data: playersData, error: playersFetchError },
      { data: teamsData, error: teamsFetchError },
    ] = await Promise.all([
      supabase
        .from("players")
        .select(`
          *,
          team:team_id(name)
        `)
        .order("player_name", { ascending: true }),
      supabase
        .from("teams")
        .select("name")
        .order("name", { ascending: true }),
    ]);

    if (playersFetchError) {
      playersError = playersFetchError.message;
    } else {
      players = playersData || [];
    }

    if (teamsFetchError) {
      teamsError = teamsFetchError.message;
    } else {
      teams = (teamsData || []).map((team) => team.name).filter(Boolean);
    }
  } else {
    playersError = "Missing Supabase environment variables.";
    teamsError = "Missing Supabase environment variables.";
  }

  const filteredPlayers =
    selectedTeam === "all"
      ? players
      : players.filter((player) => player.team?.name === selectedTeam);

  const goaliePlayers = filteredPlayers.filter(isGoalie);

  const statBoxes = [
    {
      title: "Goals",
      key: "goals",
      leaders: getLeaders(filteredPlayers, "goals"),
    },
    {
      title: "Assists",
      key: "assists",
      leaders: getLeaders(filteredPlayers, "assists"),
    },
    {
      title: "Points",
      key: "points",
      leaders: getLeaders(filteredPlayers, "points"),
    },
    {
      title: "Points Per Game",
      shortTitle: "PPG",
      key: "points_per_game",
      leaders: getLeaders(filteredPlayers, "points_per_game", 5, {
        requireGamesPlayed: true,
      }),
    },
    {
      title: "Penalty Minutes",
      shortTitle: "PIM",
      key: "penalty_minutes",
      leaders: getLeaders(filteredPlayers, "penalty_minutes"),
    },
    {
      title: "Goalie Wins",
      shortTitle: "Wins",
      key: "goalie_wins",
      leaders: getLeaders(goaliePlayers, "goalie_wins"),
    },
    {
      title: "Goalie Shutouts",
      shortTitle: "Shutouts",
      key: "goalie_shutouts",
      leaders: getLeaders(goaliePlayers, "goalie_shutouts"),
    },
  ];

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

  const filterWrap = {
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 28,
  };

  const selectStyle = {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(34,211,238,0.12)",
    background: "#0b1220",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: 700,
    minWidth: 220,
    minHeight: 46,
  };

  const submitButton = {
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid rgba(34,211,238,0.18)",
    background: "linear-gradient(180deg, #67e8f9 0%, #22d3ee 100%)",
    color: "#082f49",
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
    minHeight: 46,
  };

  const boxStyle = {
    background: "linear-gradient(180deg, #111827 0%, #0b1220 100%)",
    border: "1px solid rgba(34,211,238,0.10)",
    borderRadius: 18,
    padding: 18,
  };

  return (
    <main style={pageWrap} className="stats-page">
      <style>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .stats-leader-card {
          transition: transform 160ms ease, border-color 160ms ease;
        }

        .stats-leader-card:hover {
          transform: translateY(-1px);
          border-color: rgba(34,211,238,0.22);
        }

        .stats-row {
          display: grid;
          grid-template-columns: 34px 1fr auto;
          gap: 10px;
          align-items: center;
          padding-bottom: 10px;
        }

        .stats-row + .stats-row {
          padding-top: 10px;
        }

        .stats-rank {
          width: 30px;
          height: 30px;
          border-radius: 999px;
          background: rgba(34,211,238,0.13);
          color: #67e8f9;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 14px;
        }

        .stats-player-name {
          font-weight: 900;
          font-size: 16px;
          line-height: 1.2;
          color: #f8fafc;
        }

        .stats-player-meta {
          color: #94a3b8;
          font-size: 14px;
          margin-top: 3px;
          line-height: 1.3;
        }

        .stats-value {
          color: #67e8f9;
          font-weight: 900;
          font-size: 24px;
          min-width: 48px;
          text-align: right;
          line-height: 1;
        }

        .stats-filter-form {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        @media (max-width: 820px) {
          .stats-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 760px) {
          .stats-page {
            padding: 14px !important;
          }

          .stats-shell {
            max-width: 100% !important;
          }

          .stats-main-card {
            padding: 18px !important;
            border-radius: 20px !important;
          }

          .stats-title {
            font-size: 30px !important;
            line-height: 1.05 !important;
          }

          .stats-intro {
            font-size: 15px !important;
            line-height: 1.5 !important;
            margin-bottom: 18px !important;
          }

          .stats-filter-form {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
            margin-bottom: 18px !important;
          }

          .stats-filter-form select,
          .stats-filter-form button {
            width: 100% !important;
          }

          .stats-leader-card {
            padding: 16px !important;
            border-radius: 18px !important;
          }

          .stats-box-title {
            font-size: 21px !important;
            margin-bottom: 12px !important;
          }

          .stats-row {
            grid-template-columns: 32px 1fr auto !important;
            gap: 9px !important;
          }

          .stats-player-name {
            font-size: 15px !important;
          }

          .stats-player-meta {
            font-size: 13px !important;
          }

          .stats-value {
            font-size: 23px !important;
            min-width: 44px !important;
          }
        }

        @media (max-width: 420px) {
          .stats-page {
            padding: 10px !important;
          }

          .stats-main-card {
            padding: 14px !important;
          }

          .stats-title {
            font-size: 26px !important;
          }

          .stats-leader-card {
            padding: 14px !important;
          }

          .stats-value {
            font-size: 21px !important;
          }
        }
      `}</style>

      <div style={shell} className="stats-shell">
        <section style={card} className="stats-main-card">
          <h1
            className="stats-title"
            style={{
              fontSize: 40,
              marginTop: 0,
              marginBottom: 10,
              letterSpacing: "-0.03em",
            }}
          >
            Player Stats
          </h1>

          <p
            className="stats-intro"
            style={{
              color: "#94a3b8",
              marginTop: 0,
              marginBottom: 24,
              fontSize: 17,
              lineHeight: 1.6,
            }}
          >
            Top 5 leaders by category.
          </p>

          {!playersError && !teamsError && (
            <form method="GET" style={filterWrap} className="stats-filter-form">
              <label
                htmlFor="team"
                style={{
                  color: "#cbd5e1",
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                View stats for:
              </label>

              <select
                id="team"
                name="team"
                defaultValue={selectedTeam}
                style={selectStyle}
              >
                <option value="all">All Teams</option>
                {teams.map((teamName) => (
                  <option key={teamName} value={teamName}>
                    {teamName}
                  </option>
                ))}
              </select>

              <button type="submit" style={submitButton}>
                Go
              </button>
            </form>
          )}

          {playersError || teamsError ? (
            <p style={{ color: "#fca5a5" }}>
              Could not load stats: {playersError || teamsError}
            </p>
          ) : filteredPlayers.length === 0 ? (
            <p style={{ color: "#cbd5e1" }}>
              {selectedTeam === "all"
                ? "No player stats yet."
                : `No player stats yet for ${selectedTeam}.`}
            </p>
          ) : (
            <div className="stats-grid">
              {statBoxes.map((box) => (
                <div
                  key={box.title}
                  style={boxStyle}
                  className="stats-leader-card"
                >
                  <h2
                    className="stats-box-title"
                    style={{
                      fontSize: 24,
                      marginTop: 0,
                      marginBottom: 14,
                    }}
                  >
                    {box.title}
                  </h2>

                  {box.leaders.length === 0 ? (
                    <p style={{ color: "#94a3b8", margin: 0 }}>
                      No stats posted yet for this category.
                    </p>
                  ) : (
                    <div>
                      {box.leaders.map((player, index) => (
                        <div
                          key={`${box.title}-${player.id}`}
                          className="stats-row"
                          style={{
                            borderBottom:
                              index === box.leaders.length - 1
                                ? "none"
                                : "1px solid rgba(148,163,184,0.12)",
                          }}
                        >
                          <div className="stats-rank">{index + 1}</div>

                          <div>
                            <div className="stats-player-name">
                              {player.player_name || "Player"}
                            </div>

                            <div className="stats-player-meta">
                              #{player.jersey_number ?? "—"}
                              {selectedTeam === "all" && player.team?.name
                                ? ` • ${player.team.name}`
                                : ""}
                              {player.position ? ` • ${player.position}` : ""}
                            </div>
                          </div>

                          <div className="stats-value">
                            {formatStatValue(getStatValue(player, box.key), box.key)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
