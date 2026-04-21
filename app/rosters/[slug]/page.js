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

export default async function TeamRosterPage({ params }) {
  const { slug } = params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return (
      <main style={{ minHeight: "100vh", padding: 24, color: "#fff", background: "#020617" }}>
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
      <main style={{ minHeight: "100vh", padding: 24, color: "#fff", background: "#020617" }}>
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
      <main style={{ minHeight: "100vh", padding: 24, color: "#fff", background: "#020617" }}>
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
      stat_points: toNumber(player.points ?? (toNumber(player.goals) + toNumber(player.assists))),
      stat_pim: toNumber(player.penalty_minutes),
      stat_wins: toNumber(player.wins),
      stat_shutouts: toNumber(player.shutouts),
    }))
    .sort((a, b) => {
      if (b.stat_points !== a.stat_points) return b.stat_points - a.stat_points;
      if (b.stat_goals !== a.stat_goals) return b.stat_goals - a.stat_goals;
      return String(a.player_name || "").localeCompare(String(b.player_name || ""));
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
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 20,
    padding: 20,
    boxShadow: "0 18px 45px rgba(0,0,0,0.28)",
  };

  const tableWrap = {
    overflowX: "auto",
    border: "1px solid rgba(148,163,184,0.12)",
    borderRadius: 16,
    background: "#111827",
  };

  const thStyle = {
    padding: "14px 12px",
    textAlign: "left",
    fontSize: 13,
    color: "#94a3b8",
    borderBottom: "1px solid rgba(148,163,184,0.12)",
    whiteSpace: "nowrap",
  };

  const tdStyle = {
    padding: "14px 12px",
    borderBottom: "1px solid rgba(148,163,184,0.08)",
    whiteSpace: "nowrap",
  };

  const renderSkaterTable = (rows, title) => (
    <div style={{ marginTop: 26 }}>
      <h2 style={{ fontSize: 26, marginBottom: 12 }}>{title}</h2>

      {rows.length === 0 ? (
        <p style={{ color: "#cbd5e1" }}>No players listed.</p>
      ) : (
        <div style={tableWrap}>
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
                <th style={thStyle}>PIM</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((player) => (
                <tr key={player.id}>
                  <td style={tdStyle}>{player.jersey_number ?? "-"}</td>
                  <td style={{ ...tdStyle, fontWeight: 700 }}>{player.player_name}</td>
                  <td style={tdStyle}>{player.position || "-"}</td>
                  <td style={tdStyle}>{player.stat_gp}</td>
                  <td style={tdStyle}>{player.stat_goals}</td>
                  <td style={tdStyle}>{player.stat_assists}</td>
                  <td style={{ ...tdStyle, color: "#67e8f9", fontWeight: 800 }}>
                    {player.stat_points}
                  </td>
                  <td style={tdStyle}>{player.stat_pim}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderGoalieTable = (rows, title) => (
    <div style={{ marginTop: 26 }}>
      <h2 style={{ fontSize: 26, marginBottom: 12 }}>{title}</h2>

      {rows.length === 0 ? (
        <p style={{ color: "#cbd5e1" }}>No goalies listed.</p>
      ) : (
        <div style={tableWrap}>
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
                  <td style={{ ...tdStyle, fontWeight: 700 }}>{player.player_name}</td>
                  <td style={tdStyle}>{player.position || "-"}</td>
                  <td style={tdStyle}>{player.stat_gp}</td>
                  <td style={tdStyle}>{player.stat_wins}</td>
                  <td style={tdStyle}>{player.stat_shutouts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <main style={pageWrap}>
      <div style={shell}>
        <section style={card}>
          <Link
            href="/rosters"
            style={{
              display: "inline-block",
              marginBottom: 18,
              color: "#67e8f9",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            ← Back to Rosters
          </Link>

          <h1 style={{ fontSize: 40, marginTop: 0, marginBottom: 10 }}>{teamName}</h1>

          <div
            style={{
              display: "flex",
              gap: 18,
              flexWrap: "wrap",
              marginBottom: 20,
              color: "#cbd5e1",
            }}
          >
            <div><strong>Players:</strong> {mergedPlayers.length}</div>
            <div><strong>Team GP:</strong> {teamGamesPlayed}</div>
            <div><strong>Goalies:</strong> {goalies.length}</div>
            <div><strong>Skaters:</strong> {skaters.length}</div>
          </div>

          {renderGoalieTable(goalies, "Goalies")}
          {renderSkaterTable(skaters, "Skaters")}
        </section>
      </div>
    </main>
  );
}
