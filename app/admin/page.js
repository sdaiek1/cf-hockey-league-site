"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase-client";

function createEmptyStarEntry(starRank) {
  return {
    player_name: "",
    team_name: "",
    position: "",
    blurb: "",
    image_url: "/player-placeholder.png",
    star_rank: starRank,
    is_active: true
  };
}

function starLabelFromRank(rank) {
  if (rank === 1) return "1st Star";
  if (rank === 2) return "2nd Star";
  return "3rd Star";
}

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
  const [newsPosts, setNewsPosts] = useState([]);
  const [playerOfWeekEntries, setPlayerOfWeekEntries] = useState([]);

  const [gameForm, setGameForm] = useState({
    game_date: "",
    game_time: "",
    home_team_name: "",
    away_team_name: "",
    rink: "Codey Arena",
    status: "Scheduled",
    home_score: "",
    away_score: "",
    result_type: "regulation"
  });

  const [playerForm, setPlayerForm] = useState({
    team_name: "",
    player_name: "",
    jersey_number: "",
    position: ""
  });

  const [statsForm, setStatsForm] = useState({
    player_id: "",
    games_played: "",
    goals: "",
    assists: "",
    penalty_minutes: "",
    wins: "",
    shutouts: ""
  });

  const [newsForm, setNewsForm] = useState({
    title: "",
    summary: "",
    game_id: "",
    is_published: true
  });

  const [playersOfWeekForm, setPlayersOfWeekForm] = useState({
    first: createEmptyStarEntry(1),
    second: createEmptyStarEntry(2),
    third: createEmptyStarEntry(3)
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
    await Promise.all([
      loadTeams(),
      loadGames(),
      loadPlayers(),
      loadNewsPosts(),
      loadPlayerOfWeekEntries()
    ]);
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
    setNewsPosts([]);
    setPlayerOfWeekEntries([]);
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
        home_score,
        away_score,
        result_type,
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
        position,
        games_played,
        goals,
        assists,
        points,
        points_per_game,
        penalty_minutes,
        wins,
        shutouts,
        team:team_id(name)
      `)
      .order("player_name", { ascending: true });

    if (error) {
      setMessage(error.message);
      return;
    }

    setPlayers(data || []);
  }

  async function loadNewsPosts() {
    const { data, error } = await supabase
      .from("news_posts")
      .select(`
        id,
        title,
        summary,
        is_published,
        created_at,
        game:game_id(
          id,
          game_date,
          home_team:home_team_id(name),
          away_team:away_team_id(name)
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setNewsPosts(data || []);
  }

  async function loadPlayerOfWeekEntries() {
    const { data, error } = await supabase
      .from("player_of_week")
      .select(`
        id,
        player_name,
        team_name,
        position,
        blurb,
        image_url,
        star_rank,
        is_active,
        created_at
      `)
      .order("is_active", { ascending: false })
      .order("star_rank", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setPlayerOfWeekEntries(data || []);
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

    const homeScore =
      gameForm.home_score === "" ? null : Number(gameForm.home_score);
    const awayScore =
      gameForm.away_score === "" ? null : Number(gameForm.away_score);

    const { error } = await supabase.from("games").insert({
      game_date: gameForm.game_date,
      game_time: gameForm.game_time || null,
      home_team_id: homeTeam.id,
      away_team_id: awayTeam.id,
      rink: gameForm.rink || "Codey Arena",
      status: gameForm.status,
      home_score: homeScore,
      away_score: awayScore,
      result_type: gameForm.result_type
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
      status: "Scheduled",
      home_score: "",
      away_score: "",
      result_type: "regulation"
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
      position: playerForm.position || null,
      games_played: 0,
      goals: 0,
      assists: 0,
      penalty_minutes: 0,
      wins: 0,
      shutouts: 0,
      is_active: true
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setPlayerForm({
      team_name: "",
      player_name: "",
      jersey_number: "",
      position: ""
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
    setMessage("Adding stats...");

    if (!statsForm.player_id) {
      setMessage("Please select a player.");
      return;
    }

    const selectedPlayer = players.find((player) => player.id === statsForm.player_id);

    if (!selectedPlayer) {
      setMessage("Selected player was not found.");
      return;
    }

    const currentGamesPlayed = Number(selectedPlayer.games_played || 0);
    const currentGoals = Number(selectedPlayer.goals || 0);
    const currentAssists = Number(selectedPlayer.assists || 0);
    const currentPenaltyMinutes = Number(selectedPlayer.penalty_minutes || 0);
    const currentGoalieWins = Number(selectedPlayer.wins || 0);
    const currentGoalieShutouts = Number(selectedPlayer.shutouts || 0);

    const addedGamesPlayed = Number(statsForm.games_played || 0);
    const addedGoals = Number(statsForm.goals || 0);
    const addedAssists = Number(statsForm.assists || 0);
    const addedPenaltyMinutes = Number(statsForm.penalty_minutes || 0);
    const addedGoalieWins = Number(statsForm.wins || 0);
    const addedGoalieShutouts = Number(statsForm.shutouts || 0);

    const { error } = await supabase
      .from("players")
      .update({
        games_played: currentGamesPlayed + addedGamesPlayed,
        goals: currentGoals + addedGoals,
        assists: currentAssists + addedAssists,
        penalty_minutes: currentPenaltyMinutes + addedPenaltyMinutes,
        wins: currentGoalieWins + addedGoalieWins,
        shutouts: currentGoalieShutouts + addedGoalieShutouts
      })
      .eq("id", statsForm.player_id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Stats added to current totals.");

    setStatsForm({
      player_id: "",
      games_played: "",
      goals: "",
      assists: "",
      penalty_minutes: "",
      wins: "",
      shutouts: ""
    });

    loadPlayers();
  }

  async function addNewsPost(e) {
    e.preventDefault();
    setMessage("Saving news post...");

    if (!newsForm.title || !newsForm.summary) {
      setMessage("Please fill in title and summary.");
      return;
    }

    const { error } = await supabase.from("news_posts").insert({
      title: newsForm.title,
      summary: newsForm.summary,
      game_id: newsForm.game_id || null,
      is_published: newsForm.is_published
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setNewsForm({
      title: "",
      summary: "",
      game_id: "",
      is_published: true
    });

    setMessage("News post added.");
    loadNewsPosts();
  }

  async function deleteNewsPost(id) {
    const confirmed = window.confirm("Delete this news post?");
    if (!confirmed) return;

    const { error } = await supabase.from("news_posts").delete().eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("News post deleted.");
    loadNewsPosts();
  }

  async function savePlayersOfWeek(e) {
    e.preventDefault();
    setMessage("Saving Players of the Week...");

    const entries = [
      { ...playersOfWeekForm.first, star_rank: 1, is_active: true },
      { ...playersOfWeekForm.second, star_rank: 2, is_active: true },
      { ...playersOfWeekForm.third, star_rank: 3, is_active: true }
    ];

    const missingRequired = entries.some(
      (entry) => !entry.player_name.trim() || !entry.blurb.trim()
    );

    if (missingRequired) {
      setMessage("Please fill in player name and blurb for all 3 stars.");
      return;
    }

    const { error: deactivateError } = await supabase
      .from("player_of_week")
      .update({ is_active: false })
      .eq("is_active", true);

    if (deactivateError) {
      setMessage(deactivateError.message);
      return;
    }

    const { error } = await supabase.from("player_of_week").insert(
      entries.map((entry) => ({
        player_name: entry.player_name,
        team_name: entry.team_name || null,
        position: entry.position || null,
        blurb: entry.blurb,
        image_url: entry.image_url || "/player-placeholder.png",
        star_rank: entry.star_rank,
        is_active: true
      }))
    );

    if (error) {
      setMessage(error.message);
      return;
    }

    setPlayersOfWeekForm({
      first: createEmptyStarEntry(1),
      second: createEmptyStarEntry(2),
      third: createEmptyStarEntry(3)
    });

    setMessage("Players of the Week saved.");
    loadPlayerOfWeekEntries();
  }

  async function deletePlayerOfWeek(id) {
    const confirmed = window.confirm("Delete this Player of the Week entry?");
    if (!confirmed) return;

    const { error } = await supabase.from("player_of_week").delete().eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Player of the Week entry deleted.");
    loadPlayerOfWeekEntries();
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
    const { name, value } = e.target;

    setStatsForm((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  function handleNewsChange(e) {
    const value =
      e.target.name === "is_published" ? e.target.checked : e.target.value;

    setNewsForm((prev) => ({
      ...prev,
      [e.target.name]: value
    }));
  }

  function handlePlayersOfWeekChange(starKey, e) {
    const value =
      e.target.name === "is_active" ? e.target.checked : e.target.value;

    setPlayersOfWeekForm((prev) => ({
      ...prev,
      [starKey]: {
        ...prev[starKey],
        [e.target.name]: value
      }
    }));
  }

  function gameLabel(game) {
    return `${game.game_date} - ${game.home_team?.name || ""} vs ${game.away_team?.name || ""}`;
  }

  function playerPoints(player) {
    if (player.points !== null && player.points !== undefined) {
      return Number(player.points || 0);
    }

    return Number(player.goals || 0) + Number(player.assists || 0);
  }

  function playerPpg(player) {
    if (player.points_per_game !== null && player.points_per_game !== undefined) {
      return Number(player.points_per_game || 0).toFixed(2);
    }

    const gp = Number(player.games_played || 0);
    if (gp <= 0) return "0.00";

    return (playerPoints(player) / gp).toFixed(2);
  }

  const activePlayerOfWeekEntries = playerOfWeekEntries
    .filter((entry) => entry.is_active)
    .sort((a, b) => (a.star_rank || 99) - (b.star_rank || 99));

  const adminCss = `
    .admin-page,
    .admin-login-page {
      width: 100%;
      color: #ffffff;
    }

    .admin-shell {
      max-width: 1180px;
      margin: 0 auto;
      padding: 24px;
    }

    .admin-login-shell {
      max-width: 760px;
      margin: 0 auto;
      padding: 24px;
    }

    .admin-card {
      padding: 20px;
      border-radius: 20px;
      background: #0f172a;
      border: 1px solid #1e293b;
      box-shadow: 0 18px 45px rgba(0,0,0,0.18);
    }

    .admin-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      gap: 12px;
    }

    .admin-title {
      margin: 0 0 4px;
      font-size: 34px;
      line-height: 1.05;
      letter-spacing: -0.03em;
    }

    .admin-subtitle {
      color: #cbd5e1;
      margin: 0;
      font-size: 17px;
      line-height: 1.45;
    }

    .admin-tabs {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .admin-tab-button {
      padding: 10px 14px;
      border-radius: 12px;
      border: 0;
      font-weight: 700;
      text-transform: capitalize;
      min-height: 44px;
      cursor: pointer;
      white-space: nowrap;
    }

    .admin-grid {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 20px;
      align-items: start;
    }

    .admin-form {
      display: grid;
      gap: 12px;
      margin-top: 16px;
    }

    .admin-list {
      display: grid;
      gap: 12px;
      margin-top: 16px;
    }

    .admin-item {
      padding: 16px;
      border-radius: 16px;
      background: #111827;
      border: 1px solid #1f2937;
    }

    .admin-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
    }

    .admin-delete-button {
      padding: 8px 12px;
      border-radius: 10px;
      border: 1px solid #7f1d1d;
      background: #450a0a;
      color: #fecaca;
      height: fit-content;
      cursor: pointer;
      font-weight: 700;
      min-height: 40px;
      flex-shrink: 0;
    }

    .admin-submit-button {
      padding: 12px;
      border-radius: 12px;
      border: 0;
      background: #22d3ee;
      color: #082f49;
      font-weight: 800;
      min-height: 46px;
      cursor: pointer;
    }

    .admin-signout-button {
      padding: 10px 14px;
      border-radius: 12px;
      border: 1px solid #334155;
      background: #0f172a;
      color: white;
      min-height: 44px;
      cursor: pointer;
      flex-shrink: 0;
    }

    .admin-section-title {
      margin-top: 0;
      margin-bottom: 0;
      font-size: 26px;
      line-height: 1.15;
      letter-spacing: -0.02em;
    }

    .admin-helper-text {
      color: #cbd5e1;
      margin-top: 6px;
      line-height: 1.5;
    }

    .admin-player-stat-line {
      color: #e2e8f0;
      line-height: 1.6;
    }

    .admin-star-layout {
      display: flex;
      justify-content: space-between;
      gap: 12px;
    }

    .admin-star-content {
      display: flex;
      gap: 14px;
    }

    .admin-page input,
    .admin-page select,
    .admin-page textarea,
    .admin-login-page input {
      font-size: 16px !important;
      min-height: 46px;
      width: 100%;
    }

    .admin-page button,
    .admin-login-page button {
      font-size: 15px;
    }

    @media (max-width: 900px) {
      .admin-shell,
      .admin-login-shell {
        max-width: 100%;
        padding: 14px;
      }

      .admin-header {
        align-items: flex-start;
      }

      .admin-title {
        font-size: 30px;
      }

      .admin-subtitle {
        font-size: 15px;
      }

      .admin-tabs {
        flex-wrap: nowrap;
        overflow-x: auto;
        padding-bottom: 6px;
        margin-left: -2px;
        margin-right: -2px;
        scrollbar-width: none;
      }

      .admin-tabs::-webkit-scrollbar {
        display: none;
      }

      .admin-tab-button {
        flex: 0 0 auto;
      }

      .admin-grid {
        grid-template-columns: 1fr !important;
        gap: 16px;
      }

      .admin-card {
        padding: 18px !important;
        border-radius: 18px !important;
      }

      .admin-row {
        flex-direction: column;
      }

      .admin-delete-button {
        width: 100%;
      }

      .admin-star-layout {
        flex-direction: column;
      }

      .admin-star-content {
        align-items: flex-start;
      }
    }

    @media (max-width: 520px) {
      .admin-shell,
      .admin-login-shell {
        padding: 10px;
      }

      .admin-header {
        display: grid;
        grid-template-columns: 1fr;
      }

      .admin-title {
        font-size: 27px;
      }

      .admin-card {
        padding: 14px !important;
      }

      .admin-section-title {
        font-size: 23px;
      }

      .admin-item {
        padding: 14px !important;
      }

      .admin-tabs {
        gap: 8px;
      }

      .admin-tab-button {
        padding: 10px 12px;
        font-size: 14px;
      }

      .admin-submit-button,
      .admin-signout-button {
        width: 100%;
      }

      .admin-player-stat-line {
        font-size: 15px;
      }

      .admin-star-content {
        display: grid;
        grid-template-columns: 64px 1fr;
        gap: 12px;
      }

      .admin-star-content img {
        width: 64px !important;
        height: 64px !important;
      }
    }
  `;

  if (!session) {
    return (
      <main className="admin-login-page">
        <style>{adminCss}</style>

        <div className="admin-login-shell">
          <div className="admin-card">
            <h1 className="admin-title">Admin Sign-In</h1>
            <p className="admin-subtitle">Sign in to manage the league.</p>

            <form onSubmit={signIn} className="admin-form">
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

              <button type="submit" className="admin-submit-button">
                Sign In
              </button>
            </form>

            {message ? <p style={{ marginTop: 16, color: "#67e8f9" }}>{message}</p> : null}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <style>{adminCss}</style>

      <div className="admin-shell">
        <div className="admin-header">
          <div>
            <h1 className="admin-title">League Admin</h1>
            <p className="admin-subtitle">
              Manage schedule, rosters, stats, news, and Players of the Week.
            </p>
          </div>

          <button onClick={signOut} className="admin-signout-button">
            Sign Out
          </button>
        </div>

        <div className="admin-tabs">
          {["schedule", "rosters", "stats", "news", "playeroftheweek"].map((name) => (
            <button
              key={name}
              onClick={() => setTab(name)}
              className="admin-tab-button"
              style={{
                background: tab === name ? "#22d3ee" : "#0f172a",
                color: tab === name ? "#082f49" : "white"
              }}
            >
              {name === "news"
                ? "News Editor"
                : name === "playeroftheweek"
                  ? "Players of the Week"
                  : `${name.charAt(0).toUpperCase() + name.slice(1)} Editor`}
            </button>
          ))}
        </div>

        {message ? <p style={{ marginBottom: 16, color: "#67e8f9", fontWeight: 700 }}>{message}</p> : null}
        {loading ? <p style={{ color: "#cbd5e1" }}>Loading...</p> : null}

        {tab === "schedule" && (
          <div className="admin-grid">
            <div className="admin-card">
              <h2 className="admin-section-title">Add / Record Game</h2>

              <form onSubmit={addGame} className="admin-form">
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

                <input name="home_score" type="number" value={gameForm.home_score} onChange={handleGameChange} placeholder="Home score" style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }} />
                <input name="away_score" type="number" value={gameForm.away_score} onChange={handleGameChange} placeholder="Away score" style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }} />

                <select name="result_type" value={gameForm.result_type} onChange={handleGameChange} style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }}>
                  <option value="regulation">Regulation</option>
                  <option value="overtime">Overtime</option>
                  <option value="shootout">Shootout</option>
                  <option value="tie">Tie</option>
                </select>

                <button type="submit" className="admin-submit-button">
                  Save Game
                </button>
              </form>
            </div>

            <div className="admin-card">
              <h2 className="admin-section-title">Current Schedule / Results</h2>

              <div className="admin-list">
                {games.map((game) => (
                  <div key={game.id} className="admin-item">
                    <div className="admin-row">
                      <div>
                        <div style={{ color: "#67e8f9", fontSize: 14, fontWeight: 800 }}>
                          {game.game_date} {game.game_time ? `• ${game.game_time}` : ""}
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2, marginTop: 4 }}>
                          {game.home_team?.name} vs {game.away_team?.name}
                        </div>
                        <div style={{ color: "#cbd5e1", marginTop: 6, lineHeight: 1.5 }}>
                          {game.rink} • {game.status}
                          {game.home_score !== null && game.away_score !== null ? ` • ${game.home_score}-${game.away_score}` : ""}
                          {game.result_type ? ` • ${game.result_type}` : ""}
                        </div>
                      </div>

                      <button onClick={() => deleteGame(game.id)} className="admin-delete-button">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "rosters" && (
          <div className="admin-grid">
            <div className="admin-card">
              <h2 className="admin-section-title">Add Player</h2>

              <form onSubmit={addPlayer} className="admin-form">
                <select name="team_name" value={playerForm.team_name} onChange={handlePlayerChange} style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }}>
                  <option value="">Select team</option>
                  {teams.map((team) => <option key={team.id} value={team.name}>{team.name}</option>)}
                </select>

                <input name="player_name" type="text" value={playerForm.player_name} onChange={handlePlayerChange} placeholder="Player name" style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }} />
                <input name="jersey_number" type="number" value={playerForm.jersey_number} onChange={handlePlayerChange} placeholder="Jersey number" style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }} />
                <input name="position" type="text" value={playerForm.position} onChange={handlePlayerChange} placeholder="Position" style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }} />

                <button type="submit" className="admin-submit-button">
                  Save Player
                </button>
              </form>
            </div>

            <div className="admin-card">
              <h2 className="admin-section-title">Current Players</h2>

              <div className="admin-list">
                {players.map((player) => (
                  <div key={player.id} className="admin-item">
                    <div className="admin-row">
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>
                          {player.player_name} #{player.jersey_number}
                        </div>
                        <div style={{ color: "#cbd5e1", marginTop: 5 }}>
                          {player.team?.name || "No team"}{player.position ? ` • ${player.position}` : ""}
                        </div>
                      </div>

                      <button onClick={() => deletePlayer(player.id)} className="admin-delete-button">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "stats" && (
          <div className="admin-grid">
            <div className="admin-card">
              <h2 className="admin-section-title">Add Game Stats</h2>
              <p className="admin-helper-text">
                Enter only the stats from the latest game. These numbers will be added to the player’s current season totals. PTS and PPG are calculated automatically.
              </p>

              <form onSubmit={updateStats} className="admin-form">
                <select name="player_id" value={statsForm.player_id} onChange={handleStatsChange} style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }}>
                  <option value="">Select player</option>
                  {players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.player_name} #{player.jersey_number} ({player.team?.name || "No team"})
                    </option>
                  ))}
                </select>

                <input name="games_played" type="number" min="0" value={statsForm.games_played} onChange={handleStatsChange} placeholder="+ Games played, usually 1" style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }} />
                <input name="goals" type="number" min="0" value={statsForm.goals} onChange={handleStatsChange} placeholder="+ Goals this game" style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }} />
                <input name="assists" type="number" min="0" value={statsForm.assists} onChange={handleStatsChange} placeholder="+ Assists this game" style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }} />
                <input name="penalty_minutes" type="number" min="0" value={statsForm.penalty_minutes} onChange={handleStatsChange} placeholder="+ Penalty minutes this game" style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }} />
                <input name="wins" type="number" min="0" value={statsForm.wins} onChange={handleStatsChange} placeholder="+ Goalie wins, usually 0 or 1" style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }} />
                <input name="shutouts" type="number" min="0" value={statsForm.shutouts} onChange={handleStatsChange} placeholder="+ Goalie shutouts, usually 0 or 1" style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }} />

                <button type="submit" className="admin-submit-button">
                  Add Stats
                </button>
              </form>
            </div>

            <div className="admin-card">
              <h2 className="admin-section-title">Current Player Stats</h2>

              <div className="admin-list">
                {players.map((player) => (
                  <div key={player.id} className="admin-item">
                    <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>
                      {player.player_name} #{player.jersey_number}
                    </div>
                    <div style={{ color: "#cbd5e1", marginBottom: 8, marginTop: 5 }}>
                      {player.team?.name || "No team"}{player.position ? ` • ${player.position}` : ""}
                    </div>
                    <div className="admin-player-stat-line">
                      GP: {player.games_played || 0} • G: {player.goals || 0} • A: {player.assists || 0} • PTS: {playerPoints(player)} • PPG: {playerPpg(player)} • PIM: {player.penalty_minutes || 0}
                      <br />
                      Goalie W: {player.wins || 0} • SO: {player.shutouts || 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "news" && (
          <div className="admin-grid">
            <div className="admin-card">
              <h2 className="admin-section-title">Create News Post</h2>

              <form onSubmit={addNewsPost} className="admin-form">
                <input name="title" type="text" value={newsForm.title} onChange={handleNewsChange} placeholder="Headline" style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }} />

                <select name="game_id" value={newsForm.game_id} onChange={handleNewsChange} style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }}>
                  <option value="">Optional: link to game</option>
                  {games.map((game) => (
                    <option key={game.id} value={game.id}>
                      {gameLabel(game)}
                    </option>
                  ))}
                </select>

                <textarea name="summary" value={newsForm.summary} onChange={handleNewsChange} placeholder="Game summary / news story" rows={8} style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white", resize: "vertical" }} />

                <label style={{ color: "#cbd5e1", display: "flex", gap: 10, alignItems: "center" }}>
                  <input type="checkbox" name="is_published" checked={newsForm.is_published} onChange={handleNewsChange} style={{ width: "auto", minHeight: "auto" }} />
                  Publish immediately
                </label>

                <button type="submit" className="admin-submit-button">
                  Save News Post
                </button>
              </form>
            </div>

            <div className="admin-card">
              <h2 className="admin-section-title">Current News Posts</h2>

              {newsPosts.length === 0 ? (
                <p style={{ color: "#cbd5e1" }}>No news posts yet.</p>
              ) : (
                <div className="admin-list">
                  {newsPosts.map((post) => (
                    <div key={post.id} className="admin-item">
                      <div className="admin-row">
                        <div>
                          <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>{post.title}</div>
                          <div style={{ color: "#67e8f9", fontSize: 14, marginTop: 4, fontWeight: 800 }}>
                            {new Date(post.created_at).toLocaleDateString()} • {post.is_published ? "Published" : "Draft"}
                          </div>
                          {post.game ? (
                            <div style={{ color: "#cbd5e1", marginTop: 6 }}>
                              {post.game.game_date} • {post.game.home_team?.name} vs {post.game.away_team?.name}
                            </div>
                          ) : null}
                          <div style={{ color: "#e2e8f0", marginTop: 10, whiteSpace: "pre-wrap", lineHeight: 1.55 }}>
                            {post.summary}
                          </div>
                        </div>

                        <button onClick={() => deleteNewsPost(post.id)} className="admin-delete-button">
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

        {tab === "playeroftheweek" && (
          <div className="admin-grid">
            <div className="admin-card">
              <h2 className="admin-section-title">Set Players of the Week</h2>

              <form onSubmit={savePlayersOfWeek} style={{ display: "grid", gap: 16, marginTop: 16 }}>
                {[
                  { key: "first", label: "1st Star" },
                  { key: "second", label: "2nd Star" },
                  { key: "third", label: "3rd Star" }
                ].map(({ key, label }) => (
                  <div key={key} className="admin-item" style={{ display: "grid", gap: 10 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#67e8f9" }}>
                      {label}
                    </div>

                    <input name="player_name" type="text" value={playersOfWeekForm[key].player_name} onChange={(e) => handlePlayersOfWeekChange(key, e)} placeholder="Player name" style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }} />
                    <input name="team_name" type="text" value={playersOfWeekForm[key].team_name} onChange={(e) => handlePlayersOfWeekChange(key, e)} placeholder="Team name" style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }} />
                    <input name="position" type="text" value={playersOfWeekForm[key].position} onChange={(e) => handlePlayersOfWeekChange(key, e)} placeholder="Position" style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }} />
                    <input name="image_url" type="text" value={playersOfWeekForm[key].image_url} onChange={(e) => handlePlayersOfWeekChange(key, e)} placeholder="/player-placeholder.png" style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }} />
                    <textarea name="blurb" value={playersOfWeekForm[key].blurb} onChange={(e) => handlePlayersOfWeekChange(key, e)} placeholder="Why this player was selected" rows={4} style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white", resize: "vertical" }} />
                  </div>
                ))}

                <button type="submit" className="admin-submit-button">
                  Save All 3 Stars
                </button>
              </form>
            </div>

            <div className="admin-card">
              <h2 className="admin-section-title">Current Active Stars</h2>

              {activePlayerOfWeekEntries.length === 0 ? (
                <p style={{ color: "#cbd5e1" }}>No active Players of the Week yet.</p>
              ) : (
                <div className="admin-list">
                  {activePlayerOfWeekEntries.map((entry) => (
                    <div key={entry.id} className="admin-item" style={{ border: "1px solid #22d3ee" }}>
                      <div className="admin-star-layout">
                        <div className="admin-star-content">
                          <img src={entry.image_url || "/player-placeholder.png"} alt={entry.player_name} style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 12, border: "1px solid #334155", background: "#020617" }} />

                          <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: "#67e8f9", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                              {starLabelFromRank(entry.star_rank)}
                            </div>
                            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, lineHeight: 1.2 }}>
                              {entry.player_name}
                            </div>
                            <div style={{ color: "#67e8f9", fontSize: 14, marginTop: 4 }}>
                              {entry.team_name ? `${entry.team_name}` : ""}
                              {entry.position ? ` • ${entry.position}` : ""}
                            </div>
                            <div style={{ color: "#e2e8f0", marginTop: 10, whiteSpace: "pre-wrap", lineHeight: 1.55 }}>
                              {entry.blurb}
                            </div>
                          </div>
                        </div>

                        <button onClick={() => deletePlayerOfWeek(entry.id)} className="admin-delete-button">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <h2 className="admin-section-title" style={{ marginTop: 28 }}>All Saved Entries</h2>

              {playerOfWeekEntries.length === 0 ? (
                <p style={{ color: "#cbd5e1" }}>No Players of the Week entries yet.</p>
              ) : (
                <div className="admin-list">
                  {playerOfWeekEntries.map((entry) => (
                    <div key={`history-${entry.id}`} className="admin-item" style={{ border: entry.is_active ? "1px solid #22d3ee" : "1px solid #1f2937" }}>
                      <div className="admin-row">
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: "#67e8f9", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            {starLabelFromRank(entry.star_rank)}
                            {entry.is_active ? " • ACTIVE" : ""}
                          </div>
                          <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>
                            {entry.player_name}
                          </div>
                          <div style={{ color: "#cbd5e1", marginTop: 4, lineHeight: 1.45 }}>
                            {new Date(entry.created_at).toLocaleDateString()}
                            {entry.team_name ? ` • ${entry.team_name}` : ""}
                            {entry.position ? ` • ${entry.position}` : ""}
                          </div>
                        </div>

                        <button onClick={() => deletePlayerOfWeek(entry.id)} className="admin-delete-button">
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
      </div>
    </main>
  );
}
