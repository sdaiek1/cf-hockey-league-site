export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";

export default async function RosterPage({ searchParams }) {
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
          id,
          player_name,
          jersey_number,
          position,
          is_active,
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

  const groupedPlayers =
    selectedTeam === "all"
      ? teams
          .map((teamName) => ({
            teamName,
            players: filteredPlayers
              .filter((player) => player.team?.name === teamName)
              .sort((a, b) => {
                const aNum =
                  a.jersey_number === null || a.jersey_number === undefined
                    ? 9999
                    : Number(a.jersey_number);
                const bNum =
                  b.jersey_number === null || b.jersey_number === undefined
                    ? 9999
                    : Number(b.jersey_number);

                if (aNum !== bNum) return aNum - bNum;
                return String(a.player_name || "").localeCompare(
                  String(b.player_name || "")
                );
              }),
          }))
          .filter((group) => group.players.length > 0)
      : [
          {
            teamName: selectedTeam,
            players: filteredPlayers.sort((a, b) => {
              const aNum =
                a.jersey_number === null || a.jersey_number === undefined
                  ? 9999
                  : Number(a.jersey_number);
              const bNum =
                b.jersey_number === null || b.jersey_number === undefined
                  ? 9999
                  : Number(b.jersey_number);

              if (aNum !== bNum) return aNum - bNum;
              return String(a.player_name || "").localeCompare(
                String(b.player_name || "")
              );
            }),
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

  const subCard = {
    background: "#111827",
    border: "1px solid rgba(148,163,184,0.12)",
    borderRadius: 18,
    padding: 18,
    marginTop: 18,
  };

  const filterWrap = {
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 24,
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
          <h1 style={{ fontSize: 40, marginTop: 0, marginBottom: 10 }}>Roster</h1>
          <p style={{ color: "#94a3b8", marginTop: 0, marginBottom: 24 }}>
            Team rosters for the current season.
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
                View roster for:
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
              Could not load roster: {playersError || teamsError}
            </p>
          ) : groupedPlayers.length === 0 ? (
            <p style={{ color: "#cbd5e1" }}>
              {selectedTeam === "all"
                ? "No roster data has been added yet."
                : `No roster data has been added yet for ${selectedTeam}.`}
            </p>
          ) : (
            groupedPlayers.map((group) => (
              <div key={group.teamName} style={subCard}>
                <h2 style={{ fontSize: 28, marginTop: 0, marginBottom: 14 }}>
                  {group.teamName}
                </h2>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>#</th>
                        <th style={thStyle}>Player</th>
                        <th style={thStyle}>Position</th>
                        <th style={thStyle}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.players.map((player) => (
                        <tr key={player.id}>
                          <td style={tdStyle}>{player.jersey_number ?? "—"}</td>
                          <td style={{ ...tdStyle, fontWeight: 700 }}>
                            {player.player_name || "Player"}
                          </td>
                          <td style={tdStyle}>{player.position || "-"}</td>
                          <td
                            style={{
                              ...tdStyle,
                              color: player.is_active ? "#67e8f9" : "#94a3b8",
                              fontWeight: 700,
                            }}
                          >
                            {player.is_active ? "Active" : "Inactive"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
