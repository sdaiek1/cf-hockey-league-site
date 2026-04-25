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
    "Mayhem": "/Mayhem_Logo.png",
    "Swiss Army": "/Swiss_Logo.PNG",
    "WCFD": "/WCFD_Logo.PNG",
    "H-Town Assassins": "/H-Town_Logo.png",
    "Replacements": "/Replacements_Logo.png",
    "Venom": "/Venom_Logo.JPG",
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
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 20,
    padding: 20,
    boxShadow: "0 18px 45px rgba(0,0,0,0.28)",
  };

  const teamCard = {
    background: "#111827",
    border: "1px solid rgba(148,163,184,0.12)",
    borderRadius: 18,
    padding: 20,
  };

  const buttonStyle = {
    display: "inline-block",
    marginTop: 16,
    color: "#082f49",
    background: "linear-gradient(180deg, #67e8f9 0%, #22d3ee 100%)",
    padding: "10px 14px",
    borderRadius: 12,
    fontWeight: 800,
    textDecoration: "none",
    fontSize: 14,
    boxShadow: "0 8px 20px rgba(34,211,238,0.18)",
  };

  const quickLinkStyle = {
    display: "inline-block",
    color: "#67e8f9",
    textDecoration: "none",
    fontWeight: 700,
    marginRight: 18,
    marginBottom: 10,
  };

  return (
    <main style={pageWrap}>
      <div style={shell}>
        <section style={card}>
          <h1 style={{ fontSize: 40, marginTop: 0, marginBottom: 10 }}>Rosters</h1>

          <p
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
                <h2 style={{ fontSize: 28, marginBottom: 14 }}>Team Directory</h2>

                {teams.length === 0 ? (
                  <p style={{ color: "#cbd5e1" }}>No roster data has been added yet.</p>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                      gap: 16,
                    }}
                  >
                    {teams.map((team) => (
                      <div key={team.id} style={teamCard}>
                        <div
                          style={{
                            width: "100%",
                            height: 100,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 14,
                            background: "rgba(255,255,255,0.02)",
                            borderRadius: 14,
                            border: "1px solid rgba(148,163,184,0.10)",
                            padding: 10,
                          }}
                        >
                          <img
                            src={getTeamLogoSrc(team.name)}
                            alt={`${team.name} logo`}
                            style={{
                              maxWidth: "100%",
                              maxHeight: 120,
                              objectFit: "contain",
                            }}
                          />
                        </div>

                        <div
                          style={{
                            fontSize: 24,
                            fontWeight: 800,
                            marginBottom: 14,
                          }}
                        >
                          {team.name}
                        </div>

                        <div style={{ color: "#cbd5e1", lineHeight: 1.8, fontSize: 15 }}>
                          <div><strong>Players:</strong> {team.totalPlayers}</div>
                          <div><strong>Games Played:</strong> {team.gamesPlayed}</div>
                          <div><strong>Goalies:</strong> {team.goalies}</div>
                          <div><strong>Skaters:</strong> {team.skaters}</div>
                        </div>

                        <Link
                          href={`/rosters/${slugifyTeamName(team.name)}`}
                          style={buttonStyle}
                        >
                          View Full Roster
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginTop: 8 }}>
                <h2 style={{ fontSize: 24, marginBottom: 12 }}>Quick Links</h2>
                <div>
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
