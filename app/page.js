export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";

export default async function HomePage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let upcomingGames = [];
  let standings = [];
  let recentNews = [];

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

    recentNews = newsPosts.slice(0, 3);
    upcomingGames = games.filter((game) => game.status !== "Final").slice(0, 3);

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
          background: "linear-gradient(135deg, #0c4a6e 0%, #082f49 42%, #020617 100%)",
          border: "1px solid #164e63",
          padding: 30,
          marginBottom: 24
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "0.8fr 1.2fr",
            gap: 24,
            alignItems: "center"
          }}
        >
          <div
            style={{
              minHeight: 260,
              borderRadius: 24,
              background: "rgba(2,6,23,0.45)",
              border: "1px solid #1e3a5f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
              textAlign: "center"
            }}
          >
            <div>
              <div
                style={{
                  width: 150,
                  height: 150,
                  borderRadius: 999,
                  margin: "0 auto 16px auto",
                  border: "2px solid #164e63",
                  background: "rgba(15,23,42,0.72)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#7dd3fc"
                }}
              >
                LEAGUE
                <br />
                LOGO
              </div>
              <div style={{ color: "#94a3b8", fontSize: 14 }}>
                Replace this with your actual logo next
              </div>
            </div>
          </div>

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
              Codey Arena • West Orange, NJ
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
                maxWidth: 700,
                lineHeight: 1.7,
                marginBottom: 24
              }}
            >
              Competitive adult summer hockey with league news, upcoming games,
              standings, stats, team rosters, and featured stories all in one place.
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
                Recent News
              </a>
            </div>
          </div>
        </div>
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
          <h2 style={sectionTitle}>Upcoming Games</h2>
          <p style={sectionText}>The next games on the league calendar.</p>

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
          <h2 style={sectionTitle}>Player of the Week</h2>
          <p style={sectionText}>Featured league spotlight.</p>

          <div
            style={{
              ...subCard,
              display: "grid",
              gridTemplateColumns: "110px 1fr",
              gap: 16,
              alignItems: "center"
            }}
          >
            <div
              style={{
                width: 110,
                height: 110,
                borderRadius: 18,
                background: "#0b1220",
                border: "1px solid #1e293b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#67e8f9",
                fontWeight: 800,
                textAlign: "center",
                fontSize: 14
              }}
            >
              PLAYER
              <br />
              PHOTO
            </div>

            <div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>Player Name Here</div>
              <div style={{ color: "#67e8f9", marginTop: 6, fontWeight: 700 }}>
                Team Name • Position
              </div>
              <p style={{ color: "#e2e8f0", lineHeight: 1.7, marginBottom: 0 }}>
                Add a weekly featured player here with a short writeup about a big
                performance, great sportsmanship, or standout week.
              </p>
            </div>
          </div>
        </div>

        <div style={card}>
          <h2 style={sectionTitle}>The Hockey Truck</h2>
          <p style={sectionText}>League partner / featured spotlight block.</p>

          <div style={subCard}>
            <div
              style={{
                width: "100%",
                minHeight: 130,
                borderRadius: 16,
                background: "#0b1220",
                border: "1px solid #1e293b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#67e8f9",
                fontWeight: 800,
                marginBottom: 16
              }}
            >
              HOCKEY TRUCK IMAGE / LOGO
            </div>

            <div style={{ fontSize: 26, fontWeight: 800 }}>The Hockey Truck</div>
            <p style={{ color: "#e2e8f0", lineHeight: 1.7, marginBottom: 0 }}>
              Use this space for your featured sponsor, partner, or league promotion.
              You can swap this text out later for real info, a logo, and a link.
            </p>
          </div>
        </div>
      </section>

      <section style={{ ...card, marginBottom: 24 }}>
        <h2 style={sectionTitle}>Recent News</h2>
        <p style={sectionText}>Latest game summaries and league stories.</p>

        {recentNews.length === 0 ? (
          <p style={{ color: "#cbd5e1" }}>No news posted yet.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16
            }}
          >
            {recentNews.map((post) => (
              <div key={post.id} style={subCard}>
                <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.2 }}>
                  {post.title}
                </div>
                <div style={{ color: "#67e8f9", marginTop: 8 }}>
                  {new Date(post.created_at).toLocaleDateString()}
                </div>
                <div
                  style={{
                    color: "#e2e8f0",
                    marginTop: 12,
                    lineHeight: 1.7,
                    display: "-webkit-box",
                    WebkitLineClamp: 5,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden"
                  }}
                >
                  {post.summary}
                </div>
              </div>
            ))}
          </div>
        )}

        <a
          href="/news"
          style={{
            display: "inline-block",
            marginTop: 18,
            color: "#67e8f9",
            textDecoration: "none",
            fontWeight: 800
          }}
        >
          View all news →
        </a>
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
