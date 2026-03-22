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
        pts: 0,
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
    zIndex: 1,
  };

  const card = {
    background: "rgba(8, 15, 31, 0.72)",
    border: "1px solid rgba(53, 88, 128, 0.45)",
    borderRadius: 22,
    padding: 22,
    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.28)",
    backdropFilter: "blur(12px)",
  };

  const subCard = {
    background:
      "linear-gradient(180deg, rgba(10,19,38,0.98) 0%, rgba(6,12,24,0.98) 100%)",
    border: "1px solid rgba(38, 62, 96, 0.75)",
    borderRadius: 18,
    padding: 16,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
  };

  const sectionTitle = {
    fontSize: 28,
    marginTop: 0,
    marginBottom: 8,
    letterSpacing: "-0.02em",
  };

  const sectionText = {
    color: "#9fb2c9",
    marginTop: 0,
    marginBottom: 18,
    lineHeight: 1.6,
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        paddingBottom: 28,
        position: "relative",
        overflow: "hidden",
        background: `
          radial-gradient(circle at top left, rgba(40,200,255,0.16) 0%, rgba(40,200,255,0) 22%),
          radial-gradient(circle at top right, rgba(46,118,255,0.14) 0%, rgba(46,118,255,0) 24%),
          radial-gradient(circle at 50% 0%, rgba(120,220,255,0.08) 0%, rgba(120,220,255,0) 28%),
          linear-gradient(180deg, #020817 0%, #061326 36%, #08101f 68%, #020817 100%)
        `,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.07,
          backgroundImage: `
            linear-gradient(115deg, rgba(255,255,255,0.08) 0%, transparent 22%, transparent 75%, rgba(255,255,255,0.05) 100%),
            repeating-linear-gradient(
              0deg,
              rgba(255,255,255,0.03) 0px,
              rgba(255,255,255,0.03) 1px,
              transparent 1px,
              transparent 40px
            )
          `,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `
            radial-gradient(circle at 15% 18%, rgba(34,211,238,0.08) 0%, rgba(34,211,238,0) 22%),
            radial-gradient(circle at 82% 16%, rgba(59,130,246,0.08) 0%, rgba(59,130,246,0) 20%),
            radial-gradient(circle at 50% 35%, rgba(0,163,255,0.04) 0%, rgba(0,163,255,0) 30%)
          `,
        }}
      />

      <div style={shell}>
        <header
          style={{
            ...card,
            marginBottom: 20,
            padding: "14px 18px",
            background: "rgba(5, 12, 26, 0.78)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 18,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <img
                src="/logo.png"
                alt="Cold Fusion Summer Hockey League logo"
                style={{
                  width: 88,
                  height: 88,
                  objectFit: "contain",
                  borderRadius: 18,
                  boxShadow: "0 0 24px rgba(34,211,238,0.18)",
                }}
              />
              <div>
                <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.1 }}>
                  Cold Fusion Summer Hockey League
                </div>
                <div style={{ color: "#9fb2c9", marginTop: 6 }}>
                  Codey Arena • West Orange, NJ
                </div>
              </div>
            </div>

            <nav style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                ["Home", "/"],
                ["Schedule", "/schedule"],
                ["News", "/news"],
                ["Results", "/results"],
                ["Standings", "/standings"],
                ["Rosters", "/rosters"],
                ["Stats", "/stats"],
                ["Rules", "/rules"],
                ["Contact", "/contact"],
                ["Admin", "/admin"],
              ].map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  style={{
                    textDecoration: "none",
                    padding: "12px 18px",
                    borderRadius: 999,
                    background:
                      label === "Admin"
                        ? "linear-gradient(180deg, #3fe6ff 0%, #22d3ee 100%)"
                        : "rgba(9, 18, 36, 0.82)",
                    color: label === "Admin" ? "#06243b" : "#e5edf8",
                    border:
                      label === "Admin"
                        ? "1px solid rgba(85,245,255,0.55)"
                        : "1px solid rgba(37, 63, 99, 0.75)",
                    fontWeight: 700,
                    boxShadow:
                      label === "Admin"
                        ? "0 0 20px rgba(34,211,238,0.22)"
                        : "none",
                  }}
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </header>

        <section
          style={{
            ...card,
            position: "relative",
            overflow: "hidden",
            background:
              "linear-gradient(135deg, rgba(18,76,109,0.96) 0%, rgba(7,35,67,0.96) 38%, rgba(3,15,35,0.98) 100%)",
            border: "1px solid rgba(45, 124, 180, 0.5)",
            padding: 40,
            marginBottom: 24,
            boxShadow:
              "0 0 60px rgba(34,211,238,0.08), 0 24px 60px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,255,255,0.03)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `
                radial-gradient(circle at 18% 50%, rgba(55,220,255,0.28) 0%, rgba(55,220,255,0.10) 18%, rgba(2,6,23,0) 40%),
                radial-gradient(circle at 78% 18%, rgba(71,134,255,0.18) 0%, rgba(2,6,23,0) 28%),
                linear-gradient(120deg, rgba(170,235,255,0.08) 0%, rgba(170,235,255,0) 35%)
              `,
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.06,
              backgroundImage: `
                linear-gradient(115deg, rgba(255,255,255,0.12) 0%, transparent 22%, transparent 74%, rgba(255,255,255,0.08) 100%),
                repeating-linear-gradient(
                  0deg,
                  rgba(255,255,255,0.04) 0px,
                  rgba(255,255,255,0.04) 1px,
                  transparent 1px,
                  transparent 34px
                )
              `,
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "grid",
              gridTemplateColumns: "0.82fr 1.18fr",
              gap: 28,
              alignItems: "center",
            }}
          >
            <div
              style={{
                minHeight: 290,
                borderRadius: 30,
                background:
                  "radial-gradient(circle at center, rgba(58,225,255,0.20) 0%, rgba(3,16,35,0.35) 46%, rgba(2,8,20,0.92) 100%)",
                border: "1px solid rgba(45, 124, 180, 0.48)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 28,
                boxShadow:
                  "inset 0 0 70px rgba(34,211,238,0.10), 0 0 40px rgba(34,211,238,0.08)",
              }}
            >
              <img
                src="/logo.png"
                alt="Cold Fusion Summer Hockey League logo"
                style={{
                  maxWidth: "100%",
                  maxHeight: 250,
                  objectFit: "contain",
                  filter: "drop-shadow(0 0 30px rgba(34,211,238,0.25))",
                }}
              />
            </div>

            <div>
              <div
                style={{
                  display: "inline-block",
                  padding: "8px 14px",
                  borderRadius: 999,
                  background: "rgba(7, 18, 38, 0.76)",
                  color: "#83dfff",
                  border: "1px solid rgba(55, 146, 214, 0.45)",
                  fontSize: 13,
                  fontWeight: 800,
                  marginBottom: 16,
                  boxShadow: "0 0 16px rgba(34,211,238,0.08)",
                }}
              >
                Codey Arena • West Orange, NJ
              </div>

              <h1
                style={{
                  fontSize: 58,
                  lineHeight: 0.98,
                  marginTop: 0,
                  marginBottom: 16,
                  color: "#f4f8ff",
                  letterSpacing: "-0.04em",
                  textShadow: "0 8px 24px rgba(0,0,0,0.35)",
                }}
              >
                Cold Fusion Summer Hockey League
              </h1>

              <p
                style={{
                  fontSize: 18,
                  color: "#d6e3f0",
                  maxWidth: 720,
                  lineHeight: 1.75,
                  marginBottom: 28,
                }}
              >
                Competitive adult summer hockey with league news, upcoming games,
                standings, stats, team rosters, and featured stories all in one place.
              </p>

              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                <a
                  href="/schedule"
                  style={{
                    textDecoration: "none",
                    color: "#06243b",
                    background: "linear-gradient(180deg, #57eaff 0%, #22d3ee 100%)",
                    padding: "15px 22px",
                    borderRadius: 14,
                    fontWeight: 800,
                    boxShadow: "0 0 24px rgba(34,211,238,0.22)",
                  }}
                >
                  View Schedule
                </a>
                <a
                  href="/news"
                  style={{
                    textDecoration: "none",
                    color: "white",
                    background: "rgba(8, 18, 36, 0.78)",
                    border: "1px solid rgba(45, 124, 180, 0.45)",
                    padding: "15px 22px",
                    borderRadius: 14,
                    fontWeight: 700,
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
            marginBottom: 24,
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
                fontWeight: 800,
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
            marginBottom: 24,
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
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: 18,
                  overflow: "hidden",
                  background: "#0b1220",
                  border: "1px solid #1e293b",
                }}
              >
                <img
                  src={playerOfWeek?.image_url || "/player-placeholder.png"}
                  alt={playerOfWeek?.player_name || "Player of the Week"}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
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
                  marginBottom: 16,
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
                gap: 16,
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
                      overflow: "hidden",
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
              fontWeight: 800,
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
            flexWrap: "wrap",
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
      </div>
    </main>
  );
}
