export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";
import { sampleLeague } from "../../lib/sample-data";

export default async function HomePage() {
  const league = sampleLeague;

  let games = [];
  let players = [];
  let teams = [];
  let gamesError = null;
  let playersError = null;
  let teamsError = null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    gamesError = "Missing Supabase environment variables.";
    playersError = "Missing Supabase environment variables.";
    teamsError = "Missing Supabase environment variables.";
  } else {
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
        game_date,
        game_time,
        rink,
        status,
        home_score,
        away_score,
        result_type,
        home_team:home_team_id(id,name),
        away_team:away_team_id(id,name)
      `)
      .order("game_date", { ascending: true });

    if (gameError) {
      gamesError = gameError.message;
    } else {
      games = gameData || [];
    }

    const { data: playerData, error: playerError } = await supabase
      .from("players")
      .select(`
        id,
        player_name,
        jersey_number,
        games_played,
        goals,
        assists,
        points,
        penalty_minutes,
        team:team_id(name)
      `)
      .order("points", { ascending: false })
      .order("goals", { ascending: false })
      .order("assists", { ascending: false });

    if (playerError) {
      playersError = playerError.message;
    } else {
      players = playerData || [];
    }
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
      game.status !== "Final" ||
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

  const rostersByTeam = players.reduce((acc, player) => {
    const teamName = player.team?.name || "No Team";
    if (!acc[teamName]) acc[teamName] = [];
    acc[teamName].push(player);
    return acc;
  }, {});

  const teamNames = Object.keys(rostersByTeam).sort();

  const upcomingGames = games.filter((game) => game.status !== "Final");
  const finalGames = games.filter((game) => game.status === "Final").reverse();

  function formatResultType(resultType) {
    if (!resultType) return "";
    if (resultType === "overtime") return "OT";
    if (resultType === "shootout") return "SO";
    if (resultType === "tie") return "Tie";
    return "Regulation";
  }

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
      <section
        style={{
          padding: 24,
          border: "1px solid #1e293b",
          borderRadius: 20,
          background: "linear-gradient(135deg, #082f49, #020617)",
          marginBottom: 24
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "6px 12px",
            borderRadius: 999,
            background: "#0f172a",
            color: "#7dd3fc",
            border: "1px solid #164e63"
          }}
        >
          Adult Summer Hockey
        </div>

        <h1 style={{ fontSize: 44, marginBottom: 12 }}>
          {league.name}
        </h1>

        <p style={{ fontSize: 18, color: "#cbd5e1", maxWidth: 850 }}>
          Schedules, standings, rosters, player stats, rules, playoff information, and league updates all in one place.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: 12,
            marginTop: 24
          }}
        >
          {[
            ["Teams", "6"],
            ["Games", "14"],
            ["Playoff Spots", "4"],
            ["Team Cost", "$6,000"]
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                padding: 16,
                borderRadius: 16,
                background: "#0f172a",
                border: "1px solid #1e293b"
              }}
            >
              <div style={{ color: "#94a3b8", fontSize: 12, textTransform: "uppercase" }}>
                {label}
              </div>
              <div style={{ color: "#67e8f9", fontSize: 28, fontWeight: 700 }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 20,
          marginBottom: 24
        }}
      >
        <div
          style={{
            padding: 20,
            borderRadius: 20,
            background: "#0f172a",
            border: "1px solid #1e293b"
          }}
        >
          <h2>Upcoming Schedule</h2>

          {gamesError ? (
            <p style={{ color: "#fca5a5" }}>Could not load schedule: {gamesError}</p>
          ) : upcomingGames.length === 0 ? (
            <p style={{ color: "#cbd5e1" }}>No upcoming games posted yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {upcomingGames.map((game) => (
                <div
                  key={game.id}
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    background: "#111827",
                    border: "1px solid #1f2937"
                  }}
                >
                  <div style={{ color: "#67e8f9", fontSize: 14 }}>{game.game_date}</div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>
                    {game.home_team?.name} vs {game.away_team?.name}
                  </div>
                  <div style={{ color: "#cbd5e1" }}>
                    {game.game_time || "TBD"} • {game.rink || "Codey Arena"} • {game.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            padding: 20,
            borderRadius: 20,
            background: "#0f172a",
            border: "1px solid #1e293b"
          }}
        >
          <h2>League Updates</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {league.announcements.map((item) => (
              <div
                key={item}
                style={{
                  padding: 14,
                  borderRadius: 14,
                  background: "#111827",
                  color: "#e2e8f0"
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        style={{
          padding: 20,
          borderRadius: 20,
          background: "#0f172a",
          border: "1px solid #1e293b",
          marginBottom: 24
        }}
      >
        <h2>Recent Results</h2>

        {gamesError ? (
          <p style={{ color: "#fca5a5" }}>Could not load results: {gamesError}</p>
        ) : finalGames.length === 0 ? (
          <p style={{ color: "#cbd5e1" }}>No final results yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {finalGames.map((game) => (
              <div
                key={game.id}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  background: "#111827",
                  border: "1px solid #1f2937"
                }}
              >
                <div style={{ color: "#67e8f9", fontSize: 14 }}>{game.game_date}</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>
                  {game.home_team?.name} {game.home_score} - {game.away_score} {game.away_team?.name}
                </div>
                <div style={{ color: "#cbd5e1" }}>
                  {game.game_time || "TBD"} • {game.rink || "Codey Arena"} • {formatResultType(game.result_type)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 24
        }}
      >
        <div
          style={{
            padding: 20,
            borderRadius: 20,
            background: "#0f172a",
            border: "1px solid #1e293b",
            overflowX: "auto"
          }}
        >
          <h2>Standings</h2>

          {teamsError ? (
            <p style={{ color: "#fca5a5" }}>Could not load standings: {teamsError}</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ color: "#94a3b8", textAlign: "left" }}>
                  <th>Team</th>
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
                    <td style={{ padding: "8px 0" }}>{row.team}</td>
                    <td>{row.gp}</td>
                    <td>{row.w}</td>
                    <td>{row.l}</td>
                    <td>{row.otl}</td>
                    <td>{row.t}</td>
                    <td style={{ color: "#67e8f9", fontWeight: 700 }}>{row.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div
          style={{
            padding: 20,
            borderRadius: 20,
            background: "#0f172a",
            border: "1px solid #1e293b",
            overflowX: "auto"
          }}
        >
          <h2>Player Stats</h2>

          {playersError ? (
            <p style={{ color: "#fca5a5" }}>Could not load stats: {playersError}</p>
          ) : players.length === 0 ? (
            <p style={{ color: "#cbd5e1" }}>No player stats yet.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ color: "#94a3b8", textAlign: "left" }}>
                  <th>Player</th>
                  <th>#</th>
                  <th>Team</th>
                  <th>GP</th>
                  <th>G</th>
                  <th>A</th>
                  <th>PTS</th>
                  <th>PIM</th>
                </tr>
              </thead>
              <tbody>
                {players.map((row) => (
                  <tr key={row.id}>
                    <td style={{ padding: "8px 0" }}>{row.player_name}</td>
                    <td>{row.jersey_number}</td>
                    <td>{row.team?.name || ""}</td>
                    <td>{row.games_played}</td>
                    <td>{row.goals}</td>
                    <td>{row.assists}</td>
                    <td style={{ color: "#67e8f9", fontWeight: 700 }}>{row.points}</td>
                    <td>{row.penalty_minutes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section
        style={{
          padding: 20,
          borderRadius: 20,
          background: "#0f172a",
          border: "1px solid #1e293b",
          marginBottom: 24
        }}
      >
        <h2>Team Rosters</h2>

        {playersError ? (
          <p style={{ color: "#fca5a5" }}>Could not load rosters: {playersError}</p>
        ) : teamNames.length === 0 ? (
          <p style={{ color: "#cbd5e1" }}>No players added yet.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
              marginTop: 16
            }}
          >
            {teamNames.map((teamName) => (
              <div
                key={teamName}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  background: "#111827",
                  border: "1px solid #1f2937"
                }}
              >
                <h3 style={{ marginTop: 0 }}>{teamName}</h3>
                <div style={{ display: "grid", gap: 8 }}>
                  {rostersByTeam[teamName].map((player) => (
                    <div
                      key={player.id}
                      style={{
                        padding: 10,
                        borderRadius: 12,
                        background: "#0b1220",
                        color: "#e2e8f0"
                      }}
                    >
                      {player.player_name} #{player.jersey_number}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section
        style={{
          padding: 20,
          borderRadius: 20,
          background: "#0f172a",
          border: "1px solid #1e293b"
        }}
      >
        <h2>Rules & Info</h2>
        <ul>
          {league.rules.map((rule) => (
            <li key={rule} style={{ marginBottom: 8 }}>
              {rule}
            </li>
          ))}
        </ul>

        <p style={{ color: "#cbd5e1", marginTop: 20 }}>
          League Contact: {league.contactName} — {league.contactEmail}
        </p>

        <p style={{ color: "#67e8f9" }}>
          Admin login: /admin
        </p>
      </section>
    </main>
  );
}
