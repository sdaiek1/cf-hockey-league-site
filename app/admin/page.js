"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase-client";

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("schedule");

  const [games, setGames] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);

  const [gameForm, setGameForm] = useState({
    game_date: "",
    game_time: "",
    home_team_name: "",
    away_team_name: "",
    rink: "Codey Arena",
    status: "Scheduled"
  });

  const [playerForm, setPlayerForm] = useState({
    team_name: "",
    player_name: "",
    jersey_number: ""
  });

  const [statsForm, setStatsForm] = useState({
    player_id: "",
    games_played: "",
    goals: "",
    assists: "",
    penalty_minutes: ""
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      loadEverything();
    } else {
      setLoading(false);
    }
  }, [session]);

  async function loadEverything() {
    setLoading(true);
    await Promise.all([loadTeams(), loadGames(), loadPlayers()]);
    setLoading(false);
  }

  async function signIn(e) {
    e.preventDefault();
    setMessage("Signing in...");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Signed in.");
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setGames([]);
    setTeams([]);
    setPlayers([]);
    setMessage("Signed out.");
  }

  async function loadTeams() {
    const { data, error } = await supabase
      .from("teams")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) {
      setMessage(error.message);
      return;
    }

    setTeams(data || []);
  }

  async function loadGames() {
    const { data, error } = await supabase
      .from("games")
      .select(`
        id,
        game_date,
        game_time,
        rink,
        status,
        home_team:home_team_id(name),
        away_team:away_team_id(name)
      `)
      .order("game_date", { ascending: true });

    if (error) {
      setMessage(error.message);
      return;
    }

    setGames(data || []);
  }

  async function loadPlayers() {
    const { data, error } = await supabase
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
      .order("player_name", { ascending: true });

    if (error) {
      setMessage(error.message);
      return;
    }

    setPlayers(data || []);
  }

  async function addGame(e) {
    e.preventDefault();
    setMessage("Saving game...");

    if (!gameForm.home_team_name || !gameForm.away_team_name || !gameForm.game_date) {
      setMessage("Please fill in date, home team, and away team.");
      return;
    }

    if (gameForm.home_team_name === gameForm.away_team_name) {
      setMessage("Home and away teams cannot be the same.");
      return;
    }

    const homeTeam = teams.find((t) => t.name === gameForm.home_team_name);
    const awayTeam = teams.find((t) => t.name === gameForm.away_team_name);

    if (!homeTeam || !awayTeam) {
      setMessage("One or both team names were not found.");
      return;
    }

    const { error } = await supabase.from("games").insert({
      game_date: gameForm.game_date,
      game_time: gameForm.game_time || null,
      home_team_id: homeTeam.id,
      away_team_id: awayTeam.id,
      rink: gameForm.rink || "Codey Arena",
      status: gameForm.status
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setGameForm({
      game_date: "",
      game_time: "",
      home_team_name: "",
      away_team_name: "",
      rink: "Codey Arena",
      status: "Scheduled"
    });

    setMessage("Game added.");
    loadGames();
  }

  async function deleteGame(id) {
    const confirmed = window.confirm("Delete this game?");
    if (!confirmed) return;

    const { error } = await supabase.from("games").delete().eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Game deleted.");
    loadGames();
  }

  async function addPlayer(e) {
    e.preventDefault();
    setMessage("Saving player...");

    if (!playerForm.team_name || !playerForm.player_name || !playerForm.jersey_number) {
      setMessage("Please fill in team, player name, and jersey number.");
      return;
    }

    const team = teams.find((t) => t.name === playerForm.team_name);

    if (!team) {
      setMessage("Team not found.");
      return;
    }

    const { error } = await supabase.from("players").insert({
      team_id: team.id,
      player_name: playerForm.player_name,
      jersey_number: Number(playerForm.jersey_number),
      games_played: 0,
      goals: 0,
      assists: 0,
      penalty_minutes: 0,
      is_active: true
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setPlayerForm({
      team_name: "",
      player_name: "",
      jersey_number: ""
    });

    setMessage("Player added.");
    loadPlayers();
  }

  async function deletePlayer(id) {
    const confirmed = window.confirm("Delete this player?");
    if (!confirmed) return;

    const { error } = await supabase.from("players").delete().eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Player deleted.");
    loadPlayers();
  }

  async function updateStats(e) {
    e.preventDefault();
    setMessage("Saving stats...");

    if (!statsForm.player_id) {
      setMessage("Please select a player.");
      return;
    }

    const { error } = await supabase
      .from("players")
      .update({
        games_played: Number(statsForm.games_played || 0),
        goals: Number(statsForm.goals || 0),
        assists: Number(statsForm.assists || 0),
        penalty_minutes: Number(statsForm.penalty_minutes || 0)
      })
      .eq("id", statsForm.player_id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Stats updated.");
    setStatsForm({
      player_id: "",
      games_played: "",
      goals: "",
      assists: "",
      penalty_minutes: ""
    });
    loadPlayers();
  }

  function handleGameChange(e) {
    setGameForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  }

  function handlePlayerChange(e) {
    setPlayerForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  }

  function handleStatsChange(e) {
    setStatsForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  }

  if (!session) {
    return (
      <main style={{ maxWidth: 760, margin: "0 auto", padding: 24 }}>
        <div style={{ padding: 24, borderRadius: 20, background: "#0f172a", border: "1px solid #1e293b" }}>
          <h1>Admin Sign-In</h1>
          <p style={{ color: "#cbd5e1" }}>Sign in to manage the league.</p>

          <form onSubmit={signIn} style={{ display: "grid", gap: 12, marginTop: 20 }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Admin email"
              style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }}
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }}
            />

            <button
              type="submit"
              style={{ padding: 12, borderRadius: 12, border: 0, background: "#22d3ee", color: "#082f49", fontWeight: 700 }}
            >
              Sign In
            </button>
          </form>

          {message ? <p style={{ marginTop: 16, color: "#67e8f9" }}>{message}</p> : null}
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 12 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>League Admin</h1>
          <p style={{ color: "#cbd5e1", margin: 0 }}>Manage schedule, rosters, and stats.</p>
        </div>
        <button
          onClick={signOut}
          style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid #334155", background: "#0f172a", color: "white" }}
        >
          Sign Out
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <button
          onClick={() => setTab("schedule")}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: 0,
            background: tab === "schedule" ? "#22d3ee" : "#0f172a",
            color: tab === "schedule" ? "#082f49" : "white",
            fontWeight: 700
          }}
        >
          Schedule Editor
        </button>
        <button
          onClick={() => setTab("rosters")}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: 0,
            background: tab === "rosters" ? "#22d3ee" : "#0f172a",
            color: tab === "rosters" ? "#082f49" : "white",
            fontWeight: 700
          }}
        >
          Roster Editor
        </button>
        <button
          onClick={() => setTab("stats")}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: 0,
            background: tab === "stats" ? "#22d3ee" : "#0f172a",
            color: tab === "stats" ? "#082f49" : "white",
            fontWeight: 700
          }}
        >
          Stats Editor
        </button>
      </div>

      {message ? <p style={{ marginBottom: 16, color: "#67e8f9" }}>{message}</p> : null}
      {loading ? <p style={{ color: "#cbd5e1" }}>Loading...</p> : null}

      {tab === "schedule" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 20 }}>
          <div style={{ padding: 20, borderRadius: 20, background: "#0f172a", border: "1px solid #1e293b", height: "fit-content" }}>
            <h2>Add Game</h2>

            <form onSubmit={addGame} style={{ display: "grid", gap: 12, marginTop: 16 }}>
              <input name="game_date" type="date" value={gameForm.game_date} onChange={handleGameChange} style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }} />
              <input name="game_time" type="text" value={gameForm.game_time} onChange={handleGameChange} placeholder="7:10 PM" style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }} />

              <select name="home_team_name" value={gameForm.home_team_name} onChange={handleGameChange} style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }}>
                <option value="">Select home team</option>
                {teams.map((team) => <option key={team.id} value={team.name}>{team.name}</option>)}
              </select>

              <select name="away_team_name" value={gameForm.away_team_name} onChange={handleGameChange} style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }}>
                <option value="">Select away team</option>
                {teams.map((team) => <option key={team.id} value={team.name}>{team.name}</option>)}
              </select>

              <input name="rink" type="text" value={gameForm.rink} onChange={handleGameChange} placeholder="Rink" style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }} />

              <select name="status" value={gameForm.status} onChange={handleGameChange} style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }}>
                <option value="Scheduled">Scheduled</option>
                <option value="Final">Final</option>
                <option value="Postponed">Postponed</option>
                <option value="Canceled">Canceled</option>
              </select>

              <button type="submit" style={{ padding: 12, borderRadius: 12, border: 0, background: "#22d3ee", color: "#082f49", fontWeight: 700 }}>
                Save Game
              </button>
            </form>
          </div>

          <div style={{ padding: 20, borderRadius: 20, background: "#0f172a", border: "1px solid #1e293b" }}>
            <h2>Current Schedule</h2>

            {games.length === 0 ? (
              <p style={{ color: "#cbd5e1" }}>No games added yet.</p>
            ) : (
              <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                {games.map((game) => (
                  <div key={game.id} style={{ padding: 16, borderRadius: 16, background: "#111827", border: "1px solid #1f2937" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div>
                        <div style={{ color: "#67e8f9", fontSize: 14 }}>{game.game_date} {game.game_time ? `• ${game.game_time}` : ""}</div>
                        <div style={{ fontSize: 20, fontWeight: 700 }}>{game.home_team?.name} vs {game.away_team?.name}</div>
                        <div style={{ color: "#cbd5e1" }}>{game.rink} • {game.status}</div>
                      </div>

                      <button
                        onClick={() => deleteGame(game.id)}
                        style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #7f1d1d", background: "#450a0a", color: "#fecaca", height: "fit-content" }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "rosters" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 20 }}>
          <div style={{ padding: 20, borderRadius: 20, background: "#0f172a", border: "1px solid #1e293b", height: "fit-content" }}>
            <h2>Add Player</h2>

            <form onSubmit={addPlayer} style={{ display: "grid", gap: 12, marginTop: 16 }}>
              <select name="team_name" value={playerForm.team_name} onChange={handlePlayerChange} style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }}>
                <option value="">Select team</option>
                {teams.map((team) => <option key={team.id} value={team.name}>{team.name}</option>)}
              </select>

              <input name="player_name" type="text" value={playerForm.player_name} onChange={handlePlayerChange} placeholder="Player name" style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }} />
              <input name="jersey_number" type="number" value={playerForm.jersey_number} onChange={handlePlayerChange} placeholder="Jersey number" style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }} />

              <button type="submit" style={{ padding: 12, borderRadius: 12, border: 0, background: "#22d3ee", color: "#082f49", fontWeight: 700 }}>
                Save Player
              </button>
            </form>
          </div>

          <div style={{ padding: 20, borderRadius: 20, background: "#0f172a", border: "1px solid #1e293b" }}>
            <h2>Current Players</h2>

            {players.length === 0 ? (
              <p style={{ color: "#cbd5e1" }}>No players added yet.</p>
            ) : (
              <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                {players.map((player) => (
                  <div key={player.id} style={{ padding: 16, borderRadius: 16, background: "#111827", border: "1px solid #1f2937" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 700 }}>{player.player_name} #{player.jersey_number}</div>
                        <div style={{ color: "#cbd5e1" }}>{player.team?.name || "No team"}</div>
                      </div>

                      <button
                        onClick={() => deletePlayer(player.id)}
                        style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #7f1d1d", background: "#450a0a", color: "#fecaca", height: "fit-content" }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "stats" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 20 }}>
          <div style={{ padding: 20, borderRadius: 20, background: "#0f172a", border: "1px solid #1e293b", height: "fit-content" }}>
            <h2>Update Player Stats</h2>

            <form onSubmit={updateStats} style={{ display: "grid", gap: 12, marginTop: 16 }}>
              <select
                name="player_id"
                value={statsForm.player_id}
                onChange={handleStatsChange}
                style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }}
              >
                <option value="">Select player</option>
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.player_name} #{player.jersey_number} ({player.team?.name || "No team"})
                  </option>
                ))}
              </select>

              <input
                name="games_played"
                type="number"
                value={statsForm.games_played}
                onChange={handleStatsChange}
                placeholder="Games played"
                style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }}
              />

              <input
                name="goals"
                type="number"
                value={statsForm.goals}
                onChange={handleStatsChange}
                placeholder="Goals"
                style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }}
              />

              <input
                name="assists"
                type="number"
                value={statsForm.assists}
                onChange={handleStatsChange}
                placeholder="Assists"
                style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }}
              />

              <input
                name="penalty_minutes"
                type="number"
                value={statsForm.penalty_minutes}
                onChange={handleStatsChange}
                placeholder="Penalty minutes"
                style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }}
              />

              <button
                type="submit"
                style={{ padding: 12, borderRadius: 12, border: 0, background: "#22d3ee", color: "#082f49", fontWeight: 700 }}
              >
                Save Stats
              </button>
            </form>
          </div>

          <div style={{ padding: 20, borderRadius: 20, background: "#0f172a", border: "1px solid #1e293b" }}>
            <h2>Current Player Stats</h2>

            {players.length === 0 ? (
              <p style={{ color: "#cbd5e1" }}>No players added yet.</p>
            ) : (
              <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                {players.map((player) => (
                  <div key={player.id} style={{ padding: 16, borderRadius: 16, background: "#111827", border: "1px solid #1f2937" }}>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>
                      {player.player_name} #{player.jersey_number}
                    </div>
                    <div style={{ color: "#cbd5e1", marginBottom: 8 }}>
                      {player.team?.name || "No team"}
                    </div>
                    <div style={{ color: "#e2e8f0" }}>
                      GP: {player.games_played} • G: {player.goals} • A: {player.assists} • PTS: {player.points} • PIM: {player.penalty_minutes}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
