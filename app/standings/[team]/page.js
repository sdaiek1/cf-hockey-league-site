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
  playerStats = (playersData || []).map((player) => ({
    id: player.id,
    name: player.player_name || "Player",
    number: player.jersey_number,
    gp: Number(player.games_played || 0),
    goals: Number(player.goals || 0),
    assists: Number(player.assists || 0),
    points: Number(player.points || 0),
    pim: Number(player.penalty_minutes || 0),
    position: player.position || "-",
  }));
}
