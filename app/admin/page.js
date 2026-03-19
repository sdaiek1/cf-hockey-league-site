"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase-client";

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [session, setSession] = useState(null);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    game_date: "",
    game_time: "",
    home_team_name: "",
    away_team_name: "",
    rink: "Codey Arena",
    status: "Scheduled"
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
      loadGames();
    } else {
      setLoading(false);
    }
  }, [session]);

  async function signIn(e) {
    e.preventDefault();
    setMessage("Sending sign-in link...");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/admin`
      }
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for the sign-in link.");
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setGames([]);
    setMessage("Signed out.");
  }

  async function loadGames() {
    setLoading(true);

    const { data, error } = await supabase
      .from("games")
      .select(`
        id,
        game_date,
        game_time,
        rink,
        status,
        home_score,
        away_score,
        notes,
        home_team:home_team_id(name),
        away_team:away_team_id(name)
      `)
      .order("game_date", { ascending: true });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setGames(data || []);
    setLoading(false);
  }

  async function addGame(e) {
    e.preventDefault();
    setMessage("Saving game...");

    if (!form.home_team_name || !form.away_team_name || !form.game_date) {
      setMessage("Please fill in date, home team, and away team.");
      return;
    }

    if (form.home_team_name === form.away_team_name) {
      setMessage("Home and away teams cannot be the same.");
      return;
    }

    const { data: teams, error: teamError } = await supabase
      .from("teams")
      .select("id, name")
      .in("name", [form.home_team_name, form.away_team_name]);

    if (teamError) {
      setMessage(teamError.message);
      return;
    }

    const homeTeam = teams.find((t) => t.name === form.home_team_name);
    const awayTeam = teams.find((t) => t.name === form.away_team_name);

    if (!homeTeam || !awayTeam) {
      setMessage("One or both team names were not found in the teams table.");
      return;
    }

    const { error } = await supabase.from("games").insert({
      game_date: form.game_date,
      game_time: form.game_time || null,
      home_team_id: homeTeam.id,
      away_team_id: awayTeam.id,
      rink: form.rink || "Codey Arena",
      status: form.status
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setForm({
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

  function handleChange(e) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  }

  if (!session) {
    return (
      <main style={{ maxWidth: 760, margin: "0 auto", padding: 24 }}>
        <div style={{ padding: 24, borderRadius: 20, background: "#0f172a", border: "1px solid #1e293b" }}>
          <h1>Admin Sign-In</h1>
          <p style={{ color: "#cbd5e1" }}>
            Sign in to manage the league schedule.
          </p>

          <form onSubmit={signIn} style={{ display: "grid", gap: 12, marginTop: 20 }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Admin email"
              style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }}
            />
            <button
              type="submit"
              style={{ padding: 12, borderRadius: 12, border: 0, background: "#22d3ee", color: "#082f49", fontWeight: 700 }}
            >
              Send magic link
            </button>
          </form>

          {message ? <p style={{ marginTop: 16, color: "#67e8f9" }}>{message}</p> : null}
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>Schedule Editor</h1>
          <p style={{ color: "#cbd5e1", margin: 0 }}>Add and manage league games.</p>
        </div>
        <button
          onClick={signOut}
          style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid #334155", background: "#0f172a", color: "white" }}
        >
          Sign Out
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 20 }}>
        <div style={{ padding: 20, borderRadius: 20, background: "#0f172a", border: "1px solid #1e293b", height: "fit-content" }}>
          <h2>Add Game</h2>

          <form onSubmit={addGame} style={{ display: "grid", gap: 12, marginTop: 16 }}>
            <input
              name="game_date"
              type="date"
              value={form.game_date}
              onChange={handleChange}
              style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }}
            />

            <input
              name="game_time"
              type="text"
              value={form.game_time}
              onChange={handleChange}
              placeholder="7:10 PM"
              style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }}
            />

            <input
              name="home_team_name"
              type="text"
              value={form.home_team_name}
              onChange={handleChange}
              placeholder="Home team"
              style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }}
            />

            <input
              name="away_team_name"
              type="text"
              value={form.away_team_name}
              onChange={handleChange}
              placeholder="Away team"
              style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }}
            />

            <input
              name="rink"
              type="text"
              value={form.rink}
              onChange={handleChange}
              placeholder="Rink"
              style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }}
            />

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }}
            >
              <option value="Scheduled">Scheduled</option>
              <option value="Final">Final</option>
              <option value="Postponed">Postponed</option>
              <option value="Canceled">Canceled</option>
            </select>

            <button
              type="submit"
              style={{ padding: 12, borderRadius: 12, border: 0, background: "#22d3ee", color: "#082f49", fontWeight: 700 }}
            >
              Save Game
            </button>
          </form>

          {message ? <p style={{ marginTop: 16, color: "#67e8f9" }}>{message}</p> : null}
        </div>

        <div style={{ padding: 20, borderRadius: 20, background: "#0f172a", border: "1px solid #1e293b" }}>
          <h2>Current Schedule</h2>

          {loading ? (
            <p style={{ color: "#cbd5e1" }}>Loading...</p>
          ) : games.length === 0 ? (
            <p style={{ color: "#cbd5e1" }}>No games added yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
              {games.map((game) => (
                <div
                  key={game.id}
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    background: "#111827",
                    border: "1px solid #1f2937"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ color: "#67e8f9", fontSize: 14 }}>
                        {game.game_date} {game.game_time ? `• ${game.game_time}` : ""}
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>
                        {game.home_team?.name} vs {game.away_team?.name}
                      </div>
                      <div style={{ color: "#cbd5e1" }}>
                        {game.rink} • {game.status}
                      </div>
                    </div>

                    <button
                      onClick={() => deleteGame(game.id)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 10,
                        border: "1px solid #7f1d1d",
                        background: "#450a0a",
                        color: "#fecaca",
                        height: "fit-content"
                      }}
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
    </main>
  );
}
