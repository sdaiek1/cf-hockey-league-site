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
    "H-Town Assassins": "/logo.png",
    "Replacements": "/logo.png",
    "Venom": "/Venom_Logo.JPG",
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
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 20,
    padding: 20,
    boxShadow: "0 18px 45px rgba(0,0,0,0.28)",
  };

  const subCard = {
    background: "#111827",
    border: "1px solid #1f2937",
    borderRadius: 16,
    padding: 16,
  };

  return (
    <main style={pageWrap}>
      <div style={shell}>
        <section style={card}>
          <h1 style={{ fontSize: 40, marginTop: 0, marginBottom: 10 }}>Results</h1>
          <p
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
              {games.map((game) => (
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
                    {formatDisplayDate(game.game_date)}
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
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        minWidth: 110,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 800,
                          color: "#94a3b8",
                          textAlign: "center",
                        }}
                      >
                        FINAL
                      </div>
                      <div
                        style={{
                          fontSize: 30,
                          fontWeight: 900,
                          color: "#ffffff",
                          textAlign: "center",
                          lineHeight: 1,
                        }}
                      >
                        {game.home_score} - {game.away_score}
                      </div>
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
                    {game.game_time || "TBD"} • {game.rink || "Codey Arena"} •{" "}
                    {formatResultType(game.result_type)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
