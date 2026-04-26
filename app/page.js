export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";

function getTeamLogoSrc(teamName = "") {
  const TEAM_LOGOS = {
    "Team Rasta": "/Rasta_Logo.JPG",
    "Zero Pucks Given": "/ZPG_Logo.PNG",
    "Mayhem": "/Mayhem_Logo.png",
    "Swiss Army": "/Swiss_Logo.PNG",
    "WCFD": "/WCFD_Logo.PNG",
    "H-Town Assassins": "/H-Town_Logo.png",
    "Replacements": "/Replacements_Logo.png",
    "Venom": "/Venom_Logo.JPG",
  };

  return TEAM_LOGOS[teamName] || "/logo.png";
}

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

  function formatGameDate(dateString) {
    if (!dateString) return "";

    const d = new Date(`${dateString}T12:00:00`);

    return d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  const shell = {
    maxWidth: 1220,
    margin: "0 auto",
    padding: 24,
    color: "#ffffff",
    position: "relative",
    zIndex: 1,
  };

  const card = {
    background: "linear-gradient(180deg, rgba(7,16,34,0.56) 0%, rgba(4,10,24,0.68) 100%)",
    border: "1px solid rgba(34, 211, 238, 0.14)",
    borderRadius: 24,
    padding: 22,
    boxShadow: "0 18px 45px rgba(0, 0, 0, 0.26)",
    backdropFilter: "blur(7px)",
  };

  const subCard = {
    background: "linear-gradient(180deg, rgba(6,14,30,0.78) 0%, rgba(3,8,20,0.88) 100%)",
    border: "1px solid rgba(34, 211, 238, 0.10)",
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
    color: "#94a3b8",
    marginTop: 0,
    marginBottom: 18,
    lineHeight: 1.6,
  };

  const heroBadgeWrap = {
    display: "flex",
    justifyContent: "center",
    marginBottom: 12,
  };

  const heroActions = {
    display: "flex",
    gap: 14,
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "stretch",
    marginTop: 6,
  };

  const heroButtonBase = {
    textDecoration: "none",
    padding: "12px 16px",
    borderRadius: 14,
    fontWeight: 800,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    width: 210,
    minHeight: 72,
    lineHeight: 1.1,
  };

  const heroButtonTitle = {
    fontSize: 18,
    fontWeight: 800,
  };
  
  const heroButtonSubtitle = {
    fontSize: 11,
    fontWeight: 700,
    marginTop: 4,
    opacity: 0.85,
    letterSpacing: "0.01em",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        backgroundImage: `
          linear-gradient(rgba(2,6,23,0.38), rgba(2,6,23,0.54)),
          url("/cold-fusion-rink-bg.png")
        `,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        paddingBottom: 32,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `
            radial-gradient(circle at top left, rgba(56,189,248,0.08) 0%, rgba(56,189,248,0) 24%),
            radial-gradient(circle at top right, rgba(37,99,235,0.08) 0%, rgba(37,99,235,0) 22%),
            radial-gradient(circle at 50% 0%, rgba(14,165,233,0.04) 0%, rgba(14,165,233,0) 28%)
          `,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.018,
          backgroundImage: `
            linear-gradient(115deg, rgba(255,255,255,0.08) 0%, transparent 22%, transparent 75%, rgba(255,255,255,0.04) 100%),
            repeating-linear-gradient(
              0deg,
              rgba(255,255,255,0.03) 0px,
              rgba(255,255,255,0.03) 1px,
              transparent 1px,
              transparent 42px
            )
          `,
        }}
      />

      <div style={shell}>
        <section
          style={{
            ...card,
            position: "relative",
            overflow: "hidden",
            background:
              "linear-gradient(135deg, rgba(8,37,70,0.52) 0%, rgba(5,23,48,0.60) 42%, rgba(2,10,28,0.72) 100%)",
            border: "1px solid rgba(34,211,238,0.18)",
            padding: 18,
            marginBottom: 26,
            boxShadow:
              "0 0 50px rgba(34,211,238,0.04), 0 20px 44px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.03)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `
                radial-gradient(circle at 16% 50%, rgba(34,211,238,0.16) 0%, rgba(34,211,238,0.05) 18%, rgba(2,6,23,0) 38%),
                radial-gradient(circle at 84% 14%, rgba(59,130,246,0.08) 0%, rgba(2,6,23,0) 28%),
                linear-gradient(120deg, rgba(125,211,252,0.03) 0%, rgba(125,211,252,0) 35%)
              `,
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "grid",
              gridTemplateColumns: "0.8fr 1.2fr",
              gap: 22,
              alignItems: "center",
            }}
          >
            <div
              style={{
                minHeight: 260,
                borderRadius: 22,
                background:
                  "radial-gradient(circle at center, rgba(34,211,238,0.14) 0%, rgba(3,15,33,0.28) 42%, rgba(2,6,23,0.88) 100%)",
                border: "1px solid rgba(34,211,238,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 20,
                boxShadow:
                  "inset 0 0 60px rgba(34,211,238,0.07), 0 0 24px rgba(34,211,238,0.05)",
              }}
            >
              <img
                src="/logo.png"
                alt="Cold Fusion Summer Hockey League logo"
                style={{
                  maxWidth: "100%",
                  maxHeight: 230,
                  objectFit: "contain",
                  filter: "drop-shadow(0 0 20px rgba(34,211,238,0.18))",
                }}
              />
            </div>

            <div>
              <div style={heroBadgeWrap}>
                <div
                  style={{
                    display: "inline-block",
                    padding: "7px 16px",
                    borderRadius: 999,
                    background: "rgba(8,20,42,0.62)",
                    color: "#7dd3fc",
                    border: "1px solid rgba(34,211,238,0.14)",
                    fontSize: 13,
                    fontWeight: 800,
                    textAlign: "center",
                  }}
                >
                  For more info, contact: Shane - cfhockeyleague@gmail.com
                </div>
              </div>

              <h1
                style={{
                  fontSize: 30,
                  lineHeight: 1.0,
                  marginTop: 0,
                  marginBottom: 12,
                  color: "#f8fafc",
                  letterSpacing: "-0.04em",
                  textShadow: "0 8px 24px rgba(0,0,0,0.26)",
                }}
              >
                Welcome to Cold Fusion Hockey League 2026!
              </h1>

              <p
                style={{
                  fontSize: 17,
                  color: "#dbe7f3",
                  maxWidth: 680,
                  lineHeight: 1.6,
                  marginBottom: 20,
                }}
              >
                Competitive adult summer hockey with league news, upcoming games,
                standings, stats, team rosters, and featured stories all in one place.
              </p>

              <div style={heroActions}>
                <a
                  href="/schedule"
                  style={{
                    ...heroButtonBase,
                    color: "#082f49",
                    background: "linear-gradient(180deg, #67e8f9 0%, #22d3ee 100%)",
                    boxShadow: "0 0 16px rgba(34,211,238,0.18)",
                  }}
                >
                  <span style={heroButtonTitle}>View Schedule</span>
                  <span style={heroButtonSubtitle}>
                    (Link it to your Google Calendar)
                  </span>
                </a>

                <a
                  href="/cf-waiver-2026.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    ...heroButtonBase,
                    color: "#082f49",
                    background: "linear-gradient(180deg, #a5f3fc 0%, #67e8f9 100%)",
                    boxShadow: "0 0 16px rgba(34,211,238,0.18)",
                  }}
                >
                  <span style={heroButtonTitle}>Printable Waiver</span>
                  <span style={heroButtonSubtitle}>Download PDF Form</span>
                </a>

                <a
                  href="/news"
                  style={{
                    ...heroButtonBase,
                    color: "#ffffff",
                    background: "rgba(8,20,42,0.58)",
                    border: "1px solid rgba(34,211,238,0.12)",
                    boxShadow: "0 0 16px rgba(34,211,238,0.10)",
                  }}
                >
                  <span style={heroButtonTitle}>Recent News</span>
                  <span style={heroButtonSubtitle}>Game recaps and updates</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
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
                    <div
                      style={{
                        color: "#67e8f9",
                        fontSize: 20,
                        fontWeight: 800,
                        textAlign: "center",
                        marginBottom: 14,
                      }}
                    >
                      {formatGameDate(game.game_date)}
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto 1fr",
                        alignItems: "center",
                        gap: 14,
                        marginTop: 4,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          textAlign: "center",
                          gap: 10,
                        }}
                      >
                        <img
                          src={getTeamLogoSrc(game.home_team?.name)}
                          alt={`${game.home_team?.name || "Home team"} logo`}
                          style={{
                            width: 68,
                            height: 68,
                            objectFit: "contain",
                          }}
                        />
                        <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.2 }}>
                          {game.home_team?.name}
                        </div>
                      </div>

                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 800,
                          color: "#94a3b8",
                          textAlign: "center",
                        }}
                      >
                        vs
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          textAlign: "center",
                          gap: 10,
                        }}
                      >
                        <img
                          src={getTeamLogoSrc(game.away_team?.name)}
                          alt={`${game.away_team?.name || "Away team"} logo`}
                          style={{
                            width: 68,
                            height: 68,
                            objectFit: "contain",
                          }}
                        />
                        <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.2 }}>
                          {game.away_team?.name}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        color: "#cbd5e1",
                        marginTop: 16,
                        fontSize: 20,
                        fontWeight: 600,
                        textAlign: "center",
                      }}
                    >
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
              <div
                style={{
                  overflowX: "auto",
                  background: "rgba(2,6,23,0.20)",
                  borderRadius: 16,
                  padding: 12,
                  border: "1px solid rgba(34,211,238,0.10)",
                }}
              >
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
                        <td
                          style={{
                            padding: "10px 0",
                            fontWeight: 700,
                            borderTop: "1px solid rgba(51,65,85,0.30)",
                          }}
                        >
                          {row.team}
                        </td>
                        <td style={{ borderTop: "1px solid rgba(51,65,85,0.30)" }}>{row.gp}</td>
                        <td style={{ borderTop: "1px solid rgba(51,65,85,0.30)" }}>{row.w}</td>
                        <td
                          style={{
                            color: "#67e8f9",
                            fontWeight: 800,
                            borderTop: "1px solid rgba(51,65,85,0.30)",
                          }}
                        >
                          {row.pts}
                        </td>
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
            <p
              style={{
                color: "rgba(248, 250, 252, 0.82)",
                marginTop: 0,
                marginBottom: 18,
                lineHeight: 1.6,
                fontSize: 13,
                fontStyle: "italic",
                fontWeight: 600,
              }}
            >
              Spouse doesn&apos;t believe you? Show them this! Look at those stats!
            </p>

            <div
              style={{
                ...subCard,
                display: "flex",
                gap: 18,
                alignItems: "center",
                minHeight: 172,
              }}
            >
              <img
                src={playerOfWeek?.image_url || "/player-of-week-placeholder.png"}
                alt={playerOfWeek?.player_name || "Player of the Week"}
                style={{
                  width: 140,
                  height: 140,
                  objectFit: "cover",
                  borderRadius: 18,
                  flexShrink: 0,
                }}
              />

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  minHeight: 140,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 34,
                    fontWeight: 800,
                    lineHeight: 1.05,
                  }}
                >
                  {playerOfWeek?.player_name || "Player Name Here"}
                </p>

                <p
                  style={{
                    marginTop: 10,
                    marginBottom: 0,
                    color: "#67e8f9",
                    fontSize: 16,
                    fontWeight: 700,
                  }}
                >
                  {playerOfWeek
                    ? `${playerOfWeek.team_name || "Team Name"} • ${playerOfWeek.position || "Position"}`
                    : "Team Name • Position"}
                </p>

                <p
                  style={{
                    marginTop: 18,
                    marginBottom: 0,
                    fontSize: 16,
                    lineHeight: 1.5,
                    color: "#e5e7eb",
                  }}
                >
                  {playerOfWeek?.blurb ||
                    "Add a weekly featured player here with a short writeup about a big performance, great sportsmanship, or standout week."}
                </p>
              </div>
            </div>
          </div>

          <div style={card}>
            <h2 style={sectionTitle}>The Hockey Truck</h2>
            <p style={sectionText}>
              Providing ice hockey pro-shop services like skate sharpening, and the sale
              of accessories on the go!
            </p>

            <div
              style={{
                ...subCard,
                display: "flex",
                gap: 22,
                alignItems: "center",
                minHeight: 172,
              }}
            >
              <div
                style={{
                  width: 250,
                  height: 120,
                  flexShrink: 0,
                  borderRadius: 18,
                  overflow: "hidden",
                  background: "#000",
                  border: "1px solid rgba(34,211,238,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 10,
                }}
              >
                <img
                  src="/hockeytruck.png"
                  alt="The Hockey Truck"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              </div>

              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    marginBottom: 14,
                    lineHeight: 1.15,
                  }}
                >
                  The Hockey Truck LLC.
                </div>

                <p
                  style={{
                    color: "#e2e8f0",
                    lineHeight: 1.8,
                    margin: 0,
                    fontSize: 16,
                  }}
                >
                  <strong>Phone:</strong>{" "}
                  <a
                    href="tel:9736464273"
                    style={{ color: "#67e8f9", textDecoration: "none" }}
                  >
                    973-646-4273
                  </a>
                  <br />
                  <strong>Email:</strong>{" "}
                  <a
                    href="mailto:thehockeytruck@gmail.com"
                    style={{ color: "#67e8f9", textDecoration: "none" }}
                  >
                    thehockeytruck@gmail.com
                  </a>
                  <br />
                  <strong>Instagram:</strong>{" "}
                  <a
                    href="https://www.instagram.com/thehockeytruck"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#67e8f9", textDecoration: "none" }}
                  >
                    thehockeytruck
                  </a>
                  <br />
                  <strong>Website:</strong>{" "}
                  <a
                    href="https://www.thehockeytruck.com"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#67e8f9", textDecoration: "none" }}
                  >
                    www.thehockeytruck.com
                  </a>
                </p>
              </div>
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
      </div>
    </main>
  );
}
