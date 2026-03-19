export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";
import { sampleLeague } from "../lib/sample-data";

export default async function HomePage() {
  const league = sampleLeague;

  let games = [];
  let players = [];
  let teams = [];
  let newsPosts = [];
  let gamesError = null;
  let playersError = null;
  let teamsError = null;
  let newsError = null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    gamesError = "Missing Supabase environment variables.";
    playersError = "Missing Supabase environment variables.";
    teamsError = "Missing Supabase environment variables.";
    newsError = "Missing Supabase environment variables.";
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

    const { data: newsData, error: newsLoadError } = await supabase
      .from("news_posts")
      .select(`
        id,
        title,
        summary,
        created_at,
        game:game_id(
          id,
          game_date,
          home_team:home_team_id(name),
          away_team:away_team_id(name)
        )
      `)
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (newsLoadError) {
      newsError = newsLoadError.message;
    } else {
      newsPosts = newsData || [];
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
  const featuredNews = newsPosts[0] || null;
  const moreNews = newsPosts.slice(1, 4);

  function formatResultType(resultType) {
    if (!resultType) return "";
    if (resultType === "overtime") return "OT";
    if (resultType === "shootout") return "SO";
    if (resultType === "tie") return "Tie";
    return "Regulation";
  }

  const card = {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 20,
    padding: 20
  };

  const subCard = {
    background: "#111827",
    border: "1px solid #1f2937",
    borderRadius: 16,
    padding: 16
  };

  const sectionTitleStyle = {
    fontSize: 28,
    marginTop: 0,
    marginBottom: 8
  };

  const sectionSubStyle = {
    color: "#94a3b8",
    marginTop: 0,
    marginBottom: 20,
    lineHeight: 1.5
  };

  return (
    <main
      style={{
        maxWidth: 1220,
        margin: "0 auto",
        padding: 20,
        color: "white"
      }}
    >
      <header
        style={{
          ...card,
          position: "sticky",
          top: 12,
          zIndex: 20,
          marginBottom: 20,
          background: "rgba(15, 23, 42, 0.92)",
          backdropFilter: "blur(10px)"
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 16,
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap"
          }}
        >
          <div>
            <div style={{ fontSize: 30, fontWeight: 800 }}>
              Cold Fusion Summer Hockey League
            </div>
            <div style={{ color: "#94a3b8", marginTop: 6 }}>
              Codey Arena • West Orange, NJ
            </div>
          </div>

          <nav
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap"
            }}
          >
            {[
              ["home", "Home"],
              ["news", "News"],
              ["schedule", "Schedule"],
              ["results", "Results"],
              ["standings", "Standings"],
              ["rosters", "Rosters"],
              ["stats", "Stats"],
              ["rules", "Rules"],
              ["contact", "Contact"]
            ].map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                style={{
                  padding: "10px 14px",
                  borderRadius: 999,
                  background: "#111827",
                  border: "1px solid #1f2937",
                  color: "#e2e8f0",
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 600
                }}
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <section
        id="home"
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 0.9fr",
          gap: 20,
          marginBottom: 24
        }}
      >
        <div
          style={{
            ...card,
            background: "linear-gradient(135deg, #0c4a6e 0%, #082f49 35%, #020617 100%)",
            border: "1px solid #164e63",
            padding: 28
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "6px 12px",
              borderRadius: 999,
              background: "rgba(15,23,42,0.7)",
              color: "#7dd3fc",
              border: "1px solid #164e63",
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 14
            }}
          >
            Adult Summer Hockey
          </div>

          <h1 style={{ fontSize: 52, lineHeight: 1.05, marginTop: 0, marginBottom: 14 }}>
            Cold Fusion Summer Hockey League
          </h1>

          <p
            style={{
              fontSize: 18,
              color: "#cbd5e1",
              maxWidth: 760,
              lineHeight: 1.6,
              marginBottom: 24
            }}
          >
            Live schedule, recent results, standings, team rosters, player stats,
            league news, and rules — all in one place.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 12
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
                  background: "rgba(15,23,42,0.72)",
                  border: "1px solid #1e3a5f"
                }}
              >
                <div
                  style={{
                    color: "#94a3b8",
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: 0.6
                  }}
                >
                  {label}
                </div>
                <div style={{ color: "#67e8f9", fontSize: 28, fontWeight: 800 }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...card, display: "flex", flexDirection: "column", gap: 14 }}>
          <h2 style={{ ...sectionTitleStyle, fontSize: 24, marginBottom: 0 }}>League Updates</h2>
          <p style={{ ...sectionSubStyle, marginBottom: 4 }}>
            Important dates and quick league info.
          </p>

          {league.announcements.map((item) => (
            <div key={item} style={subCard}>
              {item}
            </div>
          ))}

          <a
            href="/admin"
            style={{
              marginTop: "auto",
              display: "inline-block",
              textDecoration: "none",
              textAlign: "center",
              padding: "14px 16px",
              borderRadius: 14,
              background: "#22d3ee",
              color: "#082f49",
              fontWeight: 800
            }}
          >
            League Admin
          </a>
        </div>
      </section>

      <section id="news" style={{ ...card, marginBottom: 24 }}>
        <h2 style={sectionTitleStyle}>News</h2>
        <p style={sectionSubStyle}>
          League announcements, AI-generated recaps, and featured game summaries.
        </p>

        {newsError ? (
          <p style={{ color: "#fca5a5" }}>Could not load news: {newsError}</p>
        ) : newsPosts.length === 0 ? (
          <p style={{ color: "#cbd5e1" }}>No news posts yet.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 0.8fr",
              gap: 20
            }}
          >
            <div style={subCard}>
              <div style={{ color: "#67e8f9", fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                FEATURED STORY
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.15 }}>
                {featuredNews.title}
              </div>
              <div style={{ color: "#94a3b8", marginTop: 8 }}>
                {new Date(featuredNews.created_at).toLocaleDateString()}
              </div>
              {featuredNews.game ? (
                <div style={{ color: "#cbd5e1", marginTop: 10 }}>
                  {featuredNews.game.game_date} • {featuredNews.game.home_team?.name} vs{" "}
                  {featuredNews.game.away_team?.name}
                </div>
              ) : null}
              <div style={{ color: "#e2e8f0", marginTop: 14, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                {featuredNews.summary}
              </div>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {moreNews.map((post) => (
                <div key={post.id} style={subCard}>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{post.title}</div>
                  <div style={{ color: "#94a3b8", marginTop: 6 }}>
                    {new Date(post.created_at).toLocaleDateString()}
                  </div>
                  <div
                    style={{
                      color: "#e2e8f0",
                      marginTop: 10,
                      lineHeight: 1.6,
                      display: "-webkit-box",
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden"
                    }}
                  >
                    {post.summary}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section
        id="schedule"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 24
        }}
      >
        <div style={card}>
          <h2 style={sectionTitleStyle}>Upcoming Schedule</h2>
          <p style={sectionSubStyle}>Games that are still to be played.</p>

          {gamesError ? (
            <p style={{ color: "#fca5a5" }}>Could not load schedule: {gamesError}</p>
          ) : upcomingGames.length === 0 ? (
            <p style={{ color: "#cbd5e1" }}>No upcoming games posted yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {upcomingGames.map((game) => (
                <div key={game.id} style={subCard}>
                  <div style={{ color: "#67e8f9", fontSize: 13, fontWeight: 700 }}>
                    {game.game_date}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6 }}>
                    {game.home_team?.name} vs {game.away_team?.name}
                  </div>
                  <div style={{ color: "#cbd5e1", marginTop: 8 }}>
                    {game.game_time || "TBD"} • {game.rink || "Codey Arena"} • {game.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div id="results" style={card}>
          <h2 style={sectionTitleStyle}>Recent Results</h2>
          <p style={sectionSubStyle}>Final scores from completed games.</p>

          {gamesError ? (
            <p style={{ color: "#fca5a5" }}>Could not load results: {gamesError}</p>
          ) : finalGames.length === 0 ? (
            <p style={{ color: "#cbd5e1" }}>No final results yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {finalGames.map((game) => (
                <div key={game.id} style={subCard}>
                  <div style={{ color: "#67e8f9", fontSize: 13, fontWeight: 700 }}>
                    {game.game_date}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6 }}>
                    {game.home_team?.name} {game.home_score} - {game.away_score}{" "}
                    {game.away_team?.name}
                  </div>
                  <div style={{ color: "#cbd5e1", marginTop: 8 }}>
                    {game.game_time || "TBD"} • {game.rink || "Codey Arena"} •{" "}
                    {formatResultType(game.result_type)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 24
        }}
      >
        <div id="standings" style={card}>
          <h2 style={sectionTitleStyle}>Standings</h2>
          <p style={sectionSubStyle}>
            Win = 3, Tie = 2, OTL = 1, Loss = 0.
          </p>

          {teamsError ? (
            <p style={{ color: "#fca5a5" }}>Could not load standings: {teamsError}</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ color: "#94a3b8", textAlign: "left" }}>
                    <th style={{ paddingBottom: 10 }}>Team</th>
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
                      <td style={{ padding: "10px 0", fontWeight: 700 }}>{row.team}</td>
                      <td>{row.gp}</td>
                      <td>{row.w}</td>
                      <td>{row.l}</td>
                      <td>{row.otl}</td>
                      <td>{row.t}</td>
                      <td style={{ color: "#67e8f9", fontWeight: 800 }}>{row.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div id="stats" style={card}>
          <h2 style={sectionTitleStyle}>Player Stats</h2>
          <p style={sectionSubStyle}>Scoring leaders and penalty totals.</p>

          {playersError ? (
            <p style={{ color: "#fca5a5" }}>Could not load stats: {playersError}</p>
          ) : players.length === 0 ? (
            <p style={{ color: "#cbd5e1" }}>No player stats yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ color: "#94a3b8", textAlign: "left" }}>
                    <th style={{ paddingBottom: 10 }}>Player</th>
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
                      <td style={{ padding: "10px 0", fontWeight: 700 }}>{row.player_name}</td>
                      <td>{row.jersey_number}</td>
                      <td>{row.team?.name || ""}</td>
                      <td>{row.games_played}</td>
                      <td>{row.goals}</td>
                      <td>{row.assists}</td>
                      <td style={{ color: "#67e8f9", fontWeight: 800 }}>{row.points}</td>
                      <td>{row.penalty_minutes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section id="rosters" style={{ ...card, marginBottom: 24 }}>
        <h2 style={sectionTitleStyle}>Team Rosters</h2>
        <p style={sectionSubStyle}>Player lists by team.</p>

        {playersError ? (
          <p style={{ color: "#fca5a5" }}>Could not load rosters: {playersError}</p>
        ) : teamNames.length === 0 ? (
          <p style={{ color: "#cbd5e1" }}>No players added yet.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16
            }}
          >
            {teamNames.map((teamName) => (
              <div key={teamName} style={subCard}>
                <h3 style={{ marginTop: 0, marginBottom: 14, fontSize: 22 }}>{teamName}</h3>
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
        id="rules"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 0.8fr",
          gap: 20,
          marginBottom: 24
        }}
      >
        <div style={card}>
          <h2 style={sectionTitleStyle}>Rules & Info</h2>
          <p style={sectionSubStyle}>League format, gameplay, and important structure.</p>
          <ul style={{ paddingLeft: 18, margin: 0, lineHeight: 1.8 }}>
            {league.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>

        <div id="contact" style={card}>
          <h2 style={sectionTitleStyle}>Contact</h2>
          <p style={sectionSubStyle}>League questions, registration, and admin access.</p>

          <div style={{ display: "grid", gap: 12 }}>
            <div style={subCard}>
              <div style={{ color: "#94a3b8", fontSize: 13 }}>League Contact</div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>
                {league.contactName}
              </div>
            </div>

            <div style={subCard}>
              <div style={{ color: "#94a3b8", fontSize: 13 }}>Email</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 6 }}>
                {league.contactEmail}
              </div>
            </div>

            <div style={subCard}>
              <div style={{ color: "#94a3b8", fontSize: 13 }}>Admin</div>
              <a
                href="/admin"
                style={{
                  display: "inline-block",
                  marginTop: 8,
                  color: "#67e8f9",
                  fontWeight: 700,
                  textDecoration: "none"
                }}
              >
                Open admin dashboard
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
