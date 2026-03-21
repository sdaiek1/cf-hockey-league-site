export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";

export default async function HomePage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let upcomingGames = [];
  let standings = [];
  let featuredNews = null;
  let latestResults = [];

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: teams = [] } = await supabase
      .from("teams")
      .select("id, name")
      .order("name", { ascending: true });

    const { data: games = [] } = await supabase
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

    const { data: newsPosts = [] } = await supabase
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

    featuredNews = newsPosts[0] || null;
    upcomingGames = games.filter((game) => game.status !== "Final").slice(0, 3);
    latestResults = games.filter((game) => game.status === "Final").reverse().slice(0, 3);

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

    standings = Object.values(standingsMap)
      .sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.w !== a.w) return b.w - a.w;
        return a.team.localeCompare(b.team);
      })
      .slice(0, 4);
  }

  function formatResultType(resultType) {
    if (!resultType) return "";
    if (resultType === "overtime") return "OT";
    if (resultType === "shootout") return "SO";
    if (resultType === "tie") return "Tie";
    return "Regulation";
  }

  const shell = {
    maxWidth: 1220,
    margin: "0 auto",
    padding: 20
  };

  const card = {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 22,
    padding: 22
  };

  const subCard = {
    background: "#111827",
    border: "1px solid #1f2937",
    borderRadius: 18,
    padding: 16
  };

  const sectionTitle = {
    fontSize: 28,
    marginTop: 0,
    marginBottom: 8
  };

  const sectionText = {
    color: "#94a3b8",
    marginTop: 0,
    marginBottom: 18,
    lineHeight: 1.6
  };

  return (
    <main style={shell}>
      <section
        style={{
          ...card,
          background: "linear-gradient(135deg, #0c4a6e 0%, #082f49 40%, #020617 100%)",
          border: "1px solid #164e63",
          padding: 30,
          marginBottom: 24
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr",
            gap: 22,
            alignItems: "stretch"
          }}
        >
          <div>
            <div
              style={{
                display: "inline-block",
                padding: "7px 12px",
                borderRadius: 999,
                background: "rgba(15,23,42,0.72)",
                color: "#7dd3fc",
                border: "1px solid #164e63",
                fontSize: 13,
                fontWeight: 800,
                marginBottom: 14
              }}
            >
              Adult Summer Hockey • West Orange, NJ
            </div>

            <h1
              style={{
                fontSize: 56,
                lineHeight: 1.02,
                marginTop: 0,
                marginBottom: 14
              }}
            >
              Cold Fusion Summer Hockey League
            </h1>

            <p
              style={{
                fontSize: 18,
                color: "#cbd5e1",
                maxWidth: 720,
                lineHeight: 1.7,
                marginBottom: 24
              }}
            >
              Follow the season with live schedules, recent results, standings,
              team rosters, player stats, and AI-generated game recap stories.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a
                href="/schedule"
                style={{
                  textDecoration: "none",
                  color: "#082f49",
                  background: "#22d3ee",
                  padding: "14px 18px",
                  borderRadius: 14,
                  fontWeight: 800
                }}
              >
                View Schedule
              </a>
              <a
                href="/standings"
                style={{
                  textDecoration: "none",
                  color: "white",
                  background: "rgba(15,23,42,0.72)",
                  border: "1px solid #1e3a5f",
                  padding: "14px 18px",
                  borderRadius: 14,
                  fontWeight: 700
                }}
              >
                See Standings
              </a>
              <a
                href="/news"
                style={{
                  textDecoration: "none",
                  color: "white",
                  background: "rgba(15,23,42,0.72)",
                  border: "1px solid #1e3a5f",
                  padding: "14px 18px",
                  borderRadius: 14,
                  fontWeight: 700
                }}
              >
                Read News
              </a>
            </div>
          </div>

          <div
            style={{
              background: "rgba(2,6,23,0.55)",
              border: "1px solid #1e3a5f",
              borderRadius: 20,
              padding: 20,
              display: "grid",
              gap: 12
            }}
          >
            {[
              ["Teams", "6"],
              ["Regular Season Games", "14"],
              ["Playoff Teams", "4"],
              ["Team Entry", "$6,000"]
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  padding: 14,
                  borderRadius: 14,
                  background: "rgba(15,23,42,0.78)",
                  border: "1px solid #1e293b"
                }}
              >
                <div
                  style={{
                    color: "#94a3b8",
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: 0.5
                  }}
                >
                  {label}
                </div>
                <div style={{ color: "#67e8f9", fontSize: 30, fontWeight: 800 }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 18,
          marginBottom: 24
        }}
      >
        <a href="/schedule" style={{ ...card, textDecoration: "none", color: "white" }}>
          <div style={{ color: "#67e8f9", fontSize: 13, fontWeight: 800, marginBottom: 10 }}>
            QUICK LINK
          </div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>Schedule</div>
          <p style={{ color: "#94a3b8", lineHeight: 1.6 }}>
            See upcoming games, dates, times, and rink information.
          </p>
        </a>

        <a href="/results" style={{ ...card, textDecoration: "none", color: "white" }}>
          <div style={{ color: "#67e8f9", fontSize: 13, fontWeight: 800, marginBottom: 10 }}>
            QUICK LINK
          </div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>Results</div>
          <p style={{ color: "#94a3b8", lineHeight: 1.6 }}>
            Review final scores and completed game outcomes.
          </p>
        </a>

        <a href="/stats" style={{ ...card, textDecoration: "none", color: "white" }}>
          <div style={{ color: "#67e8f9", fontSize: 13, fontWeight: 800, marginBottom: 10 }}>
            QUICK LINK
          </div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>Player Stats</div>
          <p style={{ color: "#94a3b8", lineHeight: 1.6 }}>
            Follow goals, assists, points, and penalty minutes.
          </p>
        </a>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1.05fr 0.95fr",
          gap: 20,
          marginBottom: 24
        }}
      >
        <div style={card}>
          <h2 style={sectionTitle}>Featured News</h2>
          <p style={sectionText}>
            Game stories, league announcements, and recap coverage.
          </p>

          {!featuredNews ? (
            <p style={{ color: "#cbd5e1" }}>No news posted yet.</p>
          ) : (
            <div style={subCard}>
              <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.15 }}>
                {featuredNews.title}
              </div>
              <div style={{ color: "#67e8f9", marginTop: 8 }}>
                {new Date(featuredNews.created_at).toLocaleDateString()}
              </div>
              <div
                style={{
                  color: "#e2e8f0",
                  marginTop: 14,
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap"
                }}
              >
                {featuredNews.summary}
              </div>
              <a
                href="/news"
                style={{
                  display: "inline-block",
                  marginTop: 16,
                  color: "#67e8f9",
                  textDecoration: "none",
                  fontWeight: 800
                }}
              >
                View all news →
              </a>
            </div>
          )}
        </div>

        <div style={card}>
          <h2 style={sectionTitle}>Top 4 Standings</h2>
          <p style={sectionText}>Current leaders in the playoff race.</p>

          {standings.length === 0 ? (
            <p style={{ color: "#cbd5e1" }}>No standings yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ color: "#94a3b8", textAlign: "left" }}>
                    <th style={{ paddingBottom: 10 }}>Team</th>
                    <th>GP</th>
                    <th>W</th>
                    <th>PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row) => (
                    <tr key={row.team}>
                      <td style={{ padding: "10px 0", fontWeight: 700 }}>{row.team}</td>
                      <td>{row.gp}</td>
                      <td>{row.w}</td>
                      <td style={{ color: "#67e8f9", fontWeight: 800 }}>{row.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <a
            href="/standings"
            style={{
              display: "inline-block",
              marginTop: 16,
              color: "#67e8f9",
              textDecoration: "none",
              fontWeight: 800
            }}
          >
            Full standings →
          </a>
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
        <div style={card}>
          <h2 style={sectionTitle}>Next Games</h2>
          <p style={sectionText}>What’s coming up on the schedule.</p>

          {upcomingGames.length === 0 ? (
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

        <div style={card}>
          <h2 style={sectionTitle}>Latest Results</h2>
          <p style={sectionText}>Most recent final scores.</p>

          {latestResults.length === 0 ? (
            <p style={{ color: "#cbd5e1" }}>No final results yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {latestResults.map((game) => (
                <div key={game.id} style={subCard}>
                  <div style={{ color: "#67e8f9", fontSize: 13, fontWeight: 700 }}>
                    {game.game_date}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6 }}>
                    {game.home_team?.name} {game.home_score} - {game.away_score} {game.away_team?.name}
                  </div>
                  <div style={{ color: "#cbd5e1", marginTop: 8 }}>
                    {formatResultType(game.result_type)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section style={{ ...card, marginBottom: 24 }}>
        <h2 style={sectionTitle}>League Information</h2>
        <p style={sectionText}>
          Quick season details and league structure.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 14
          }}
        >
          {[
            "Season runs from the first week of June through the end of August.",
            "6 teams • 14-game regular season • Top 4 qualify for playoffs.",
            "Warm-up and game pucks are provided by the league.",
            "Championship team wins a $400 Verona Inn gift card and trophy."
          ].map((item) => (
            <div key={item} style={subCard}>
              {item}
            </div>
          ))}
        </div>
      </section>

      <footer
        style={{
          ...card,
          display: "flex",
          justifyContent: "space-between",
          gap: 20,
          flexWrap: "wrap"
        }}
      >
        <div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>
            Cold Fusion Summer Hockey League
          </div>
          <div style={{ color: "#94a3b8", marginTop: 8 }}>
            Codey Arena • West Orange, NJ
          </div>
        </div>

        <div style={{ color: "#cbd5e1" }}>
          League Contact: Shane Daiek
          <br />
          shane.daiek@gmail.com
        </div>
      </footer>
    </main>
  );
}
