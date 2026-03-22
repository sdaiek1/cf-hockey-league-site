export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";

export default async function HomePage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let upcomingGames = [];
  let standings = [];
  let recentNews = [];
  let playerOfWeek = null;

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
        created_at
      `)
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    const { data: playerOfWeekRow = null } = await supabase
      .from("player_of_week")
      .select(`
        id,
        player_name,
        team_name,
        position,
        blurb,
        image_url
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    recentNews = newsPosts.slice(0, 3);
    upcomingGames = games.filter((game) => game.status !== "Final").slice(0, 3);
    playerOfWeek = playerOfWeekRow;

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
    padding: 20,
    color: "#ffffff",
    position: "relative",
    zIndex: 1
  };

  const card = {
    background: "rgba(15, 23, 42, 0.78)",
    border: "1px solid rgba(51, 65, 85, 0.9)",
    borderRadius: 22,
    padding: 22,
    boxShadow: "0 18px 45px rgba(0, 0, 0, 0.28)",
    backdropFilter: "blur(10px)"
  };

  const subCard = {
    background: "linear-gradient(180deg, rgba(17,24,39,0.95) 0%, rgba(10,15,28,0.98) 100%)",
    border: "1px solid rgba(31, 41, 55, 1)",
    borderRadius: 18,
    padding: 16,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)"
  };

  const sectionTitle = {
    fontSize: 28,
    marginTop: 0,
    marginBottom: 8,
    letterSpacing: "-0.02em"
  };

  const sectionText = {
    color: "#94a3b8",
    marginTop: 0,
    marginBottom: 18,
    lineHeight: 1.6
  };

  return (
<main
  style={{
    minHeight: "100vh",
    background: "linear-gradient(180deg, #ff0000 0%, #000000 100%)",
    paddingBottom: 28
  }}
>
  <div
    style={{
      position: "absolute",
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.08,
          backgroundImage: `
            linear-gradient(115deg, rgba(255,255,255,0.08) 0%, transparent 22%, transparent 75%, rgba(255,255,255,0.06) 100%),
            repeating-linear-gradient(
              0deg,
              rgba(255,255,255,0.04) 0px,
              rgba(255,255,255,0.04) 1px,
              transparent 1px,
              transparent 38px
            )
          `
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `
            radial-gradient(circle at 15% 20%, rgba(34,211,238,0.10) 0%, rgba(34,211,238,0) 24%),
            radial-gradient(circle at 85% 18%, rgba(59,130,246,0.08) 0%, rgba(59,130,246,0) 20%)
          `
        }}
      />

      <div style={shell}>
        <section
          style={{
            ...card,
            position: "relative",
            overflow: "hidden",
            background: "linear-gradient(135deg, #0b3a5a 0%, #07233a 35%, #031220 70%, #020617 100%)",
            border: "1px solid #164e63",
            padding: 34,
            marginBottom: 24,
            boxShadow:
              "0 0 60px rgba(34,211,238,0.10), 0 24px 60px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.03)"
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `
                radial-gradient(circle at 18% 45%, rgba(34,211,238,0.32) 0%, rgba(34,211,238,0.12) 18%, rgba(2,6,23,0) 40%),
                radial-gradient(circle at 78% 18%, rgba(59,130,246,0.22) 0%, rgba(2,6,23,0) 30%),
                linear-gradient(120deg, rgba(125,211,252,0.10) 0%, rgba(125,211,252,0) 35%)
              `,
              pointerEvents: "none"
            }}
          />

          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.08,
              backgroundImage: `
                linear-gradient(115deg, rgba(255,255,255,0.15) 0%, transparent 22%, transparent 74%, rgba(255,255,255,0.08) 100%),
                repeating-linear-gradient(
                  0deg,
                  rgba(255,255,255,0.05) 0px,
                  rgba(255,255,255,0.05) 1px,
                  transparent 1px,
                  transparent 34px
                )
              `,
              pointerEvents: "none"
            }}
          />

          <div
            style={{
              position: "absolute",
              right: -120,
              top: -120,
              width: 320,
              height: 320,
              borderRadius: "50%",
              background: "rgba(34,211,238,0.08)",
              filter: "blur(40px)",
              pointerEvents: "none"
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "grid",
              gridTemplateColumns: "0.8fr 1.2fr",
              gap: 24,
              alignItems: "center"
            }}
          >
            <div
              style={{
                minHeight: 280,
                borderRadius: 28,
                background:
                  "radial-gradient(circle at center, rgba(34,211,238,0.22) 0%, rgba(2,6,23,0.30) 46%, rgba(2,6,23,0.88) 100%)",
                border: "1px solid #1e3a5f",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
                boxShadow:
                  "inset 0 0 70px rgba(34,211,238,0.12), 0 0 40px rgba(34,211,238,0.10)"
              }}
            >
              <img
                src="/logo.png"
                alt="Cold Fusion Summer Hockey League logo"
                style={{
                  maxWidth: "100%",
                  maxHeight: 245,
                  objectFit: "contain",
                  filter: "drop-shadow(0 0 28px rgba(34,211,238,0.25))"
                }}
              />
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
                    fontWeight: 800,
                    boxShadow: "0 0 18px rgba(34,211,238,0.22)"
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
                  overflow: "hidden",
                  background: "#0b1220",
                  border: "1px solid #1e293b"
                }}
              >
                <img
                  src={playerOfWeek?.image_url || "/player-placeholder.png"}
                  alt={playerOfWeek?.player_name || "Player of the Week"}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover"
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>
                  {playerOfWeek?.player_name || "Player Name Here"}
                </div>
                <div style={{ color: "#67e8f9", marginTop: 6, fontWeight: 700 }}>
                  {playerOfWeek
                    ? `${playerOfWeek.team_name || "Team Name"} • ${playerOfWeek.position || "Position"}`
                    : "Team Name • Position"}
                </div>
                <p style={{ color: "#e2e8f0", lineHeight: 1.7, marginBottom: 0 }}>
                  {playerOfWeek?.blurb ||
                    "Add a weekly featured player here with a short writeup about a big performance, great sportsmanship, or standout week."}
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
              THIS IS THE NEW HOMEPAGE
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
      </div>
    </main>
  );
}
