export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function getLeaders(players, statKey, limit = 5) {
  return [...players]
    .sort((a, b) => {
      const diff = toNumber(b[statKey]) - toNumber(a[statKey]);
      if (diff !== 0) return diff;

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

  const hasWinsField = filteredPlayers.some(
    (player) => player.wins !== undefined && player.wins !== null
  );

  const hasShutoutsField = filteredPlayers.some(
    (player) => player.shutouts !== undefined && player.shutouts !== null
  );

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
      title: "Penalty Minutes",
      key: "penalty_minutes",
      leaders: getLeaders(filteredPlayers, "penalty_minutes"),
    },
    {
      title: "Wins",
      key: "wins",
      leaders: hasWinsField ? getLeaders(filteredPlayers, "wins") : [],
      missingField: !hasWinsField,
    },
    {
      title: "Shutouts",
      key: "shutouts",
      leaders: hasShutoutsField ? getLeaders(filteredPlayers, "shutouts") : [],
      missingField: !hasShutoutsField,
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
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 20,
    padding: 20,
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
    fontSize: 15,
    fontWeight: 700,
    minWidth: 220,
  };

  const submitButton = {
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid rgba(34,211,238,0.18)",
    background: "linear-gradient(180deg, #67e8f9 0%, #22d3ee 100%)",
    color: "#082f49",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
  };

  const boxStyle = {
    background: "#111827",
    border: "1px solid rgba(148,163,184,0.12)",
    borderRadius: 18,
    padding: 18,
  };

  return (
    <main style={pageWrap}>
      <div style={shell}>
        <section style={card}>
          <h1 style={{ fontSize: 40, marginTop: 0, marginBottom: 10 }}>
            Player Stats
          </h1>

          <p style={{ color: "#94a3b8", marginTop: 0, marginBottom: 24 }}>
            Top 5 leaders by category.
          </p>

          {!playersError && !teamsError && (
            <form method="GET" style={filterWrap}>
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
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 16,
              }}
            >
              {statBoxes.map((box) => (
                <div key={box.title} style={boxStyle}>
                  <h2 style={{ fontSize: 24, marginTop: 0, marginBottom: 14 }}>
                    {box.title}
                  </h2>

                  {box.missingField ? (
                    <p style={{ color: "#94a3b8", margin: 0 }}>
                      Add a <strong>{box.key}</strong> column in your players
                      table to show this category.
                    </p>
                  ) : box.leaders.length === 0 ? (
                    <p style={{ color: "#94a3b8", margin: 0 }}>
                      No stats posted yet for this category.
                    </p>
                  ) : (
                    <div style={{ display: "grid", gap: 10 }}>
                      {box.leaders.map((player, index) => (
                        <div
                          key={`${box.title}-${player.id}`}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            paddingBottom: 10,
                            borderBottom:
                              index === box.leaders.length - 1
                                ? "none"
                                : "1px solid rgba(148,163,184,0.12)",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 800 }}>
                              {index + 1}. {player.player_name || "Player"}
                            </div>

                            <div
                              style={{
                                color: "#94a3b8",
                                fontSize: 14,
                                marginTop: 2,
                              }}
                            >
                              #{player.jersey_number ?? "—"}
                              {selectedTeam === "all" && player.team?.name
                                ? ` • ${player.team.name}`
                                : ""}
                            </div>
                          </div>

                          <div
                            style={{
                              color: "#67e8f9",
                              fontWeight: 800,
                              fontSize: 22,
                              minWidth: 36,
                              textAlign: "right",
                            }}
                          >
                            {toNumber(player[box.key])}
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
