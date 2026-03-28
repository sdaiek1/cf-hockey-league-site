export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";

const EVENT_DURATION_MINUTES = 90;

function parseGameDateTime(gameDate, gameTime) {
  if (!gameDate || !gameTime) return null;

  const dateParts = String(gameDate).split("-");
  if (dateParts.length !== 3) return null;

  const [year, month, day] = dateParts.map(Number);
  if (!year || !month || !day) return null;

  const rawTime = String(gameTime).trim().toUpperCase();

  let hours = 0;
  let minutes = 0;

  const twelveHourMatch = rawTime.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);
  const twentyFourHourMatch = rawTime.match(/^(\d{1,2}):(\d{2})$/);

  if (twelveHourMatch) {
    hours = Number(twelveHourMatch[1]);
    minutes = Number(twelveHourMatch[2] || 0);
    const meridiem = twelveHourMatch[3];

    if (meridiem === "AM" && hours === 12) hours = 0;
    if (meridiem === "PM" && hours !== 12) hours += 12;
  } else if (twentyFourHourMatch) {
    hours = Number(twentyFourHourMatch[1]);
    minutes = Number(twentyFourHourMatch[2]);
  } else {
    return null;
  }

  return new Date(year, month - 1, day, hours, minutes, 0);
}

function formatGoogleDate(date) {
  const pad = (n) => String(n).padStart(2, "0");

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "T",
    pad(date.getHours()),
    pad(date.getMinutes()),
    "00",
  ].join("");
}

function buildGoogleCalendarUrl(game) {
  const start = parseGameDateTime(game.game_date, game.game_time);
  if (!start) return null;

  const end = new Date(start.getTime() + EVENT_DURATION_MINUTES * 60 * 1000);

  const homeTeam = game.home_team?.name || "Home Team";
  const awayTeam = game.away_team?.name || "Away Team";
  const rink = game.rink || "Codey Arena";

  const title = `${homeTeam} vs ${awayTeam} — Cold Fusion Hockey League`;
  const details = [
    "Cold Fusion Hockey League game",
    "",
    `${homeTeam} vs ${awayTeam}`,
    `Location: ${rink}`,
    `Status: ${game.status || "Scheduled"}`,
  ].join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${formatGoogleDate(start)}/${formatGoogleDate(end)}`,
    details,
    location: `${rink}, West Orange, NJ`,
    ctz: "America/New_York",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function formatDisplayDate(gameDate) {
  if (!gameDate) return "Date TBD";

  const date = new Date(`${gameDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return gameDate;

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default async function SchedulePage({ searchParams }) {
  const resolvedSearchParams = await searchParams;

  const selectedTeam =
    typeof resolvedSearchParams?.team === "string"
      ? resolvedSearchParams.team
      : "all";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let games = [];
  let teams = [];
  let gamesError = null;

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const [
      { data: gamesData, error: gamesFetchError },
      { data: teamsData, error: teamsFetchError },
    ] = await Promise.all([
      supabase
        .from("games")
        .select(`
          id,
          game_date,
          game_time,
          rink,
          status,
          home_team:home_team_id(name),
          away_team:away_team_id(name)
        `)
        .neq("status", "Final")
        .order("game_date", { ascending: true }),
      supabase
        .from("teams")
        .select("name")
        .order("name", { ascending: true }),
    ]);

    if (gamesFetchError) {
      gamesError = gamesFetchError.message;
    } else {
      games = gamesData || [];
    }

    if (!gamesError && teamsFetchError) {
      gamesError = teamsFetchError.message;
    } else {
      teams = (teamsData || []).map((team) => team.name).filter(Boolean);
    }
  } else {
    gamesError = "Missing Supabase environment variables.";
  }

  const filteredGames =
    selectedTeam === "all"
      ? games
      : games.filter(
          (game) =>
            game.home_team?.name === selectedTeam ||
            game.away_team?.name === selectedTeam
        );

  const filterLabel =
    selectedTeam === "all"
      ? "View schedule for:"
      : `Viewing: ${selectedTeam} Schedule`;

  const pageWrap = {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, rgba(2,6,23,0.96) 0%, rgba(3,7,18,0.98) 100%)",
    padding: 24,
    color: "#ffffff",
  };

  const shell = {
    maxWidth: 1000,
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

  const calendarButton = {
    display: "inline-block",
    marginTop: 14,
    color: "#082f49",
    background: "linear-gradient(180deg, #67e8f9 0%, #22d3ee 100%)",
    padding: "10px 14px",
    borderRadius: 12,
    fontWeight: 800,
    textDecoration: "none",
    fontSize: 14,
    boxShadow: "0 8px 20px rgba(34,211,238,0.18)",
  };

  const filterWrap = {
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 24,
  };

  const selectStyle = {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(34,211,238,0.12)",
    background: "#0b1220",
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 700,
    minWidth: 220,
  };

  const submitButton = {
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid rgba(34,211,238,0.18)",
    background: "linear-gradient(180deg, #67e8f9 0%, #22d3ee 100%)",
    color: "#082f49",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
  };

  return (
    <main style={pageWrap}>
      <div style={shell}>
        <section style={card}>
          <h1
            style={{
              fontSize: 38,
              marginTop: 0,
              marginBottom: 8,
              letterSpacing: "-0.03em",
            }}
          >
            Schedule
          </h1>

          <p
            style={{
              color: "#94a3b8",
              marginTop: 0,
              marginBottom: 24,
              fontSize: 17,
              lineHeight: 1.6,
            }}
          >
            Upcoming games and league schedule at Codey Arena.
          </p>

          {!gamesError && (
            <form method="GET" style={filterWrap}>
              <label
                htmlFor="team"
                style={{
                  color: "#cbd5e1",
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                {filterLabel}
              </label>

              <select
                id="team"
                name="team"
                defaultValue={selectedTeam}
                style={selectStyle}
              >
                <option value="all">All Teams</option>
                {teams.map((teamName) => (
                  <option key={teamName} value={teamName}>
                    {teamName}
                  </option>
                ))}
              </select>

              <button type="submit" style={submitButton}>
                Go
              </button>
            </form>
          )}

          {gamesError ? (
            <p style={{ color: "#fca5a5" }}>Could not load schedule: {gamesError}</p>
          ) : filteredGames.length === 0 ? (
            <p style={{ color: "#cbd5e1" }}>
              {selectedTeam === "all"
                ? "No upcoming games posted yet."
                : `No upcoming games posted yet for ${selectedTeam}.`}
            </p>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {filteredGames.map((game) => {
                const googleCalendarUrl = buildGoogleCalendarUrl(game);

                return (
                  <div key={game.id} style={subCard}>
                    <div
                      style={{
                        color: "#67e8f9",
                        fontSize: 13,
                        fontWeight: 800,
                        marginBottom: 8,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {formatDisplayDate(game.game_date)}
                    </div>

                    <div
                      style={{
                        fontSize: 28,
                        fontWeight: 800,
                        lineHeight: 1.15,
                        marginBottom: 10,
                      }}
                    >
                      {game.home_team?.name} vs {game.away_team?.name}
                    </div>

                    <div
                      style={{
                        color: "#cbd5e1",
                        fontSize: 16,
                        lineHeight: 1.6,
                      }}
                    >
                      {game.game_time || "TBD"} • {game.rink || "Codey Arena"} •{" "}
                      {game.status}
                    </div>

                    {googleCalendarUrl ? (
                      <a
                        href={googleCalendarUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={calendarButton}
                      >
                        Add to Google Calendar
                      </a>
                    ) : (
                      <div
                        style={{
                          marginTop: 14,
                          color: "#94a3b8",
                          fontSize: 13,
                          fontStyle: "italic",
                        }}
                      >
                        Add-to-calendar button will appear once a game time is set.
                      </div>
                    )}
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
