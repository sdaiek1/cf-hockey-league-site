export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";

function getTeamLogoSrc(teamName = "") {
  const TEAM_LOGOS = {
    "Team Rasta": "/Rasta_Logo.JPG",
    "Zero Pucks Given": "/ZPG_Logo.PNG",
    Mayhem: "/Mayhem_Logo.png",
    "Swiss Army": "/Swiss_Logo.PNG",
    WCFD: "/WCFD_Logo.PNG",
    "H-Town Assassins": "/H-Town_Logo.png",
    Replacements: "/Replacements_Logo.png",
    Venom: "/Venom_Logo.JPG",
  };

  return TEAM_LOGOS[teamName] || "/logo.png";
}

function formatDisplayDate(gameDate) {
  if (!gameDate) return "Date TBD";

  const date = new Date(`${gameDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return gameDate;

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default async function ResultsPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let games = [];
  let gamesError = null;

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);

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
      .eq("status", "Final")
      .order("game_date", { ascending: false });

    if (error) {
      gamesError = error.message;
    } else {
      games = data || [];
    }
  } else {
    gamesError = "Missing Supabase environment variables.";
  }

  function formatResultType(resultType) {
    if (!resultType) return "";
    if (resultType === "overtime") return "OT";
    if (resultType === "shootout") return "SO";
    if (resultType === "tie") return "Tie";
    return "Regulation";
  }

  const pageWrap = {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, rgba(2,6,23,0.96) 0%, rgba(3,7,18,0.98) 100%)",
    padding: 24,
    color: "#ffffff",
  };

  const shell = {
    maxWidth: 1220,
    margin: "0 auto",
  };

  const card = {
    background: "linear-gradient(180deg, #0f172a 0%, #0b1120 100%)",
    border: "1px solid rgba(34,211,238,0.12)",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 18px 45px rgba(0,0,0,0.28)",
  };

  const subCard = {
    background: "linear-gradient(180deg, #111827 0%, #0b1220 100%)",
    border: "1px solid rgba(34,211,238,0.10)",
    borderRadius: 18,
    padding: 18,
  };

  return (
    <main style={pageWrap} className="results-page">
      <style>{`
        .results-card {
          transition: transform 160ms ease, border-color 160ms ease;
        }

        .results-card:hover {
          transform: translateY(-1px);
          border-color: rgba(34,211,238,0.22);
        }

        .results-matchup-grid {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 14px;
          margin-top: 4px;
        }

        .results-team {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 10px;
          min-width: 0;
        }

        .results-team-logo {
          width: 68px;
          height: 68px;
          object-fit: contain;
        }

        .results-team-name {
          font-size: 18px;
          font-weight: 800;
          line-height: 1.2;
        }

        .results-score-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-width: 110px;
        }

        .results-final-label {
          font-size: 16px;
          font-weight: 800;
          color: #94a3b8;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .results-score {
          font-size: 30px;
          font-weight: 900;
          color: #ffffff;
          text-align: center;
          line-height: 1;
          white-space: nowrap;
        }

        .results-game-meta {
          color: #cbd5e1;
          margin-top: 16px;
          font-size: 20px;
          font-weight: 600;
          text-align: center;
          line-height: 1.35;
        }

        @media (max-width: 760px) {
          .results-page {
            padding: 14px !important;
          }

          .results-shell {
            max-width: 100% !important;
          }

          .results-main-card {
            padding: 18px !important;
            border-radius: 20px !important;
          }

          .results-title {
            font-size: 30px !important;
            line-height: 1.05 !important;
          }

          .results-intro {
            font-size: 15px !important;
            margin-bottom: 18px !important;
          }

          .results-card {
            padding: 16px !important;
            border-radius: 18px !important;
          }

          .results-date {
            font-size: 17px !important;
            line-height: 1.3 !important;
            margin-bottom: 12px !important;
          }

          .results-matchup-grid {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .results-score-box {
            order: -1;
            width: 100%;
            min-width: 0 !important;
            background: rgba(2,6,23,0.34);
            border: 1px solid rgba(34,211,238,0.10);
            border-radius: 14px;
            padding: 12px;
          }

          .results-final-label {
            font-size: 13px !important;
          }

          .results-score {
            font-size: 34px !important;
          }

          .results-team {
            display: grid !important;
            grid-template-columns: 56px 1fr auto !important;
            align-items: center !important;
            text-align: left !important;
            gap: 12px !important;
            width: 100% !important;
            background: rgba(2,6,23,0.24) !important;
            border: 1px solid rgba(34,211,238,0.08) !important;
            border-radius: 14px !important;
            padding: 10px !important;
          }

          .results-team-logo {
            width: 50px !important;
            height: 50px !important;
          }

          .results-team-name {
            font-size: 17px !important;
          }

          .results-mobile-score {
            display: block !important;
            color: #ffffff;
            font-size: 24px;
            font-weight: 900;
            line-height: 1;
          }

          .results-game-meta {
            margin-top: 14px !important;
            font-size: 16px !important;
          }
        }

        @media (min-width: 761px) {
          .results-mobile-score {
            display: none !important;
          }
        }

        @media (max-width: 420px) {
          .results-page {
            padding: 10px !important;
          }

          .results-main-card {
            padding: 14px !important;
          }

          .results-title {
            font-size: 26px !important;
          }

          .results-score {
            font-size: 30px !important;
          }

          .results-team-name {
            font-size: 16px !important;
          }
        }
      `}</style>

      <div style={shell} className="results-shell">
        <section style={card} className="results-main-card">
          <h1
            className="results-title"
            style={{
              fontSize: 40,
              marginTop: 0,
              marginBottom: 10,
              letterSpacing: "-0.03em",
            }}
          >
            Results
          </h1>

          <p
            className="results-intro"
            style={{
              color: "#94a3b8",
              marginTop: 0,
              marginBottom: 24,
              fontSize: 17,
              lineHeight: 1.6,
            }}
          >
            Final scores and completed game results.
          </p>

          {gamesError ? (
            <p style={{ color: "#fca5a5" }}>Could not load results: {gamesError}</p>
          ) : games.length === 0 ? (
            <p style={{ color: "#cbd5e1" }}>No final results yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {games.map((game) => {
                const homeScore = game.home_score ?? 0;
                const awayScore = game.away_score ?? 0;

                return (
                  <div key={game.id} style={subCard} className="results-card">
                    <div
                      className="results-date"
                      style={{
                        color: "#67e8f9",
                        fontSize: 20,
                        fontWeight: 800,
                        textAlign: "center",
                        marginBottom: 14,
                      }}
                    >
                      {formatDisplayDate(game.game_date)}
                    </div>

                    <div className="results-matchup-grid">
                      <div className="results-team">
                        <img
                          className="results-team-logo"
                          src={getTeamLogoSrc(game.home_team?.name)}
                          alt={`${game.home_team?.name || "Home team"} logo`}
                        />
                        <div className="results-team-name">
                          {game.home_team?.name}
                        </div>
                        <div className="results-mobile-score">{homeScore}</div>
                      </div>

                      <div className="results-score-box">
                        <div className="results-final-label">Final</div>
                        <div className="results-score">
                          {homeScore} - {awayScore}
                        </div>
                      </div>

                      <div className="results-team">
                        <img
                          className="results-team-logo"
                          src={getTeamLogoSrc(game.away_team?.name)}
                          alt={`${game.away_team?.name || "Away team"} logo`}
                        />
                        <div className="results-team-name">
                          {game.away_team?.name}
                        </div>
                        <div className="results-mobile-score">{awayScore}</div>
                      </div>
                    </div>

                    <div className="results-game-meta">
                      {game.game_time || "TBD"} • {game.rink || "Codey Arena"} •{" "}
                      {formatResultType(game.result_type)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
